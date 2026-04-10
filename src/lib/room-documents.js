import "server-only";

import { prisma } from "@/lib/prisma";
import { normalizeProjectArchitectureMeta } from "@/lib/assembly-architecture";
import { listReaderDocumentsForUser } from "@/lib/reader-documents";
import { getProjectDocuments } from "@/lib/project-model";
import { attachDocumentToProjectForUser, getReaderProjectForUser, updateReaderProjectForUser } from "@/lib/reader-projects";
import { getWorkspaceDocumentForUser } from "@/lib/workspace-documents";
import {
  buildInitialRoomAssemblySource,
  buildLegacyRoomCarryoverComments,
  buildRoomDocumentRef,
  isRoomAssemblyDocument,
  normalizeRoomMeta,
} from "@/lib/room";

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function encodeWorkspaceMeta(meta) {
  return Buffer.from(JSON.stringify(meta), "utf8").toString("base64");
}

function countWords(text = "") {
  return String(text || "")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean).length;
}

function normalizeRoomRuntimeWindow(runtimeWindow = null) {
  const nextValue = runtimeWindow && typeof runtimeWindow === "object" ? runtimeWindow : null;
  if (!nextValue) return null;

  return {
    windowId: normalizeText(nextValue.windowId),
    filePath: normalizeText(nextValue.filePath),
    updatedAt: normalizeText(nextValue.updatedAt) || new Date().toISOString(),
    state: normalizeText(nextValue.state).toLowerCase() || "open",
    compile:
      nextValue.compile && typeof nextValue.compile === "object"
        ? {
            compilationId: normalizeText(nextValue.compile.compilationId),
            diagnostics: Array.isArray(nextValue.compile.diagnostics)
              ? nextValue.compile.diagnostics
              : [],
            summary:
              nextValue.compile.summary && typeof nextValue.compile.summary === "object"
                ? nextValue.compile.summary
                : { ok: true, hardErrorCount: 0, warningCount: 0 },
            closureVerb: normalizeText(nextValue.compile.closureVerb) || null,
          }
        : null,
    events: Array.isArray(nextValue.events) ? nextValue.events : [],
    receipts: Array.isArray(nextValue.receipts) ? nextValue.receipts : [],
  };
}

function buildRoomDocumentContent({ source = "", runtimeWindow = null } = {}) {
  const meta = {
    version: 2,
    documentType: "assembly",
    sourceFiles: [],
    sourceAssetIds: [],
    intakeKind: "room",
    intakeDiagnostics: [],
    hiddenFromProjectHome: true,
    seedMeta: {
      isSeed: false,
      roomDocument: true,
      roomRuntimeWindow: normalizeRoomRuntimeWindow(runtimeWindow),
    },
    blocks: [],
    logEntries: [],
    derivationKind: "room-assembly",
    derivationModel: "loegos-room",
    derivationStatus: "canonical",
  };

  const encodedMeta = encodeWorkspaceMeta(meta);
  return `<!-- assembler-meta:${encodedMeta} -->\n\n${String(source || "").trim()}\n`;
}

async function ensureUniqueRoomDocumentKey(baseKey = "room-assembly") {
  const existing = new Set(
    (
      await prisma.readerDocument.findMany({
        select: { documentKey: true },
      })
    ).map((entry) => entry.documentKey),
  );

  if (!existing.has(baseKey)) return baseKey;

  let index = 2;
  while (existing.has(`${baseKey}-${index}`)) {
    index += 1;
  }

  return `${baseKey}-${index}`;
}

function hasLegacyRoomSnapshot(roomValue = null) {
  const nextValue = roomValue && typeof roomValue === "object" ? roomValue : {};
  return Boolean(
    !normalizeText(nextValue.documentKey) &&
      (normalizeText(nextValue?.aim?.text || nextValue.aimText) ||
        normalizeText(nextValue?.legacySnapshot?.aimText) ||
        (Array.isArray(nextValue.evidenceItems) && nextValue.evidenceItems.length) ||
        (Array.isArray(nextValue?.legacySnapshot?.evidenceItems) &&
          nextValue.legacySnapshot.evidenceItems.length) ||
        (Array.isArray(nextValue.storyItems) && nextValue.storyItems.length) ||
        (Array.isArray(nextValue?.legacySnapshot?.storyItems) && nextValue.legacySnapshot.storyItems.length) ||
        (Array.isArray(nextValue.moveItems) && nextValue.moveItems.length) ||
        (Array.isArray(nextValue?.legacySnapshot?.moveItems) && nextValue.legacySnapshot.moveItems.length) ||
        (Array.isArray(nextValue.returnItems) && nextValue.returnItems.length) ||
        (Array.isArray(nextValue?.legacySnapshot?.returnItems) && nextValue.legacySnapshot.returnItems.length)),
  );
}

function buildSeededRoomSource(projectKey = "", legacyRoom = null) {
  const baseSource = buildInitialRoomAssemblySource(projectKey);
  const carryover = buildLegacyRoomCarryoverComments(legacyRoom?.legacySnapshot || legacyRoom);
  return carryover ? `${baseSource}\n\n${carryover}` : baseSource;
}

function getRoomDocumentTitle(project = null) {
  const boxTitle = normalizeText(project?.title) || normalizeText(project?.boxTitle) || "Box";
  return `${boxTitle} Room`;
}

export function getRoomAssemblySource(document = null) {
  return String(document?.rawMarkdown || "").trim();
}

export function getStoredRoomRuntimeWindow(document = null) {
  return normalizeRoomRuntimeWindow(document?.seedMeta?.roomRuntimeWindow);
}

export async function saveRoomAssemblySourceForUser(
  userId,
  documentKey,
  { source = "", runtimeWindow = null, title = "", subtitle = "" } = {},
) {
  const current = await getWorkspaceDocumentForUser(userId, documentKey);
  if (!current || !isRoomAssemblyDocument(current)) {
    throw new Error("Room document not found.");
  }

  const nextTitle = normalizeText(title) || current.title || "Room";
  const nextSubtitle = normalizeText(subtitle) || current.subtitle || "";
  const contentMarkdown = buildRoomDocumentContent({
    source,
    runtimeWindow: runtimeWindow || getStoredRoomRuntimeWindow(current),
  });

  await prisma.readerDocument.update({
    where: { documentKey: current.documentKey },
    data: {
      title: nextTitle,
      subtitle: nextSubtitle || null,
      format: "MARKDOWN",
      mimeType: "text/markdown",
      contentMarkdown,
      wordCount: countWords(contentMarkdown),
      sectionCount: 1,
    },
  });

  return getWorkspaceDocumentForUser(userId, current.documentKey);
}

export async function ensureRoomAssemblyDocumentForProject(userId, projectKey = "") {
  const project = await getReaderProjectForUser(userId, projectKey);
  if (!project) {
    throw new Error("Box not found.");
  }

  const rawMeta =
    project?.metadataJson && typeof project.metadataJson === "object"
      ? project.metadataJson
      : project?.architectureMeta && typeof project.architectureMeta === "object"
        ? project.architectureMeta
        : {};
  const rawRoom = rawMeta?.room;
  const normalizedProjectMeta = normalizeProjectArchitectureMeta(rawMeta);
  const roomMeta = normalizeRoomMeta(normalizedProjectMeta.room);
  const documents = await listReaderDocumentsForUser(userId);
  const projectDocuments = getProjectDocuments(documents, project);
  const roomDocument =
    (roomMeta.documentKey
      ? projectDocuments.find((document) => document.documentKey === roomMeta.documentKey) ||
        documents.find((document) => document.documentKey === roomMeta.documentKey)
      : null) ||
    projectDocuments.find((document) => isRoomAssemblyDocument(document)) ||
    null;

  if (roomDocument) {
    const nextPatch = {};
    if (roomMeta.documentKey !== roomDocument.documentKey) {
      nextPatch.documentKey = roomDocument.documentKey;
    }
    if (Object.keys(nextPatch).length > 0) {
      await updateReaderProjectForUser(userId, project.projectKey, {
        roomState: nextPatch,
        touchSystemExample: false,
        skipExampleTouch: true,
      });
    }
    return roomDocument;
  }

  const seededFromLegacy = hasLegacyRoomSnapshot(rawRoom);
  const source = buildSeededRoomSource(project.projectKey, seededFromLegacy ? rawRoom : null);
  const documentKey = await ensureUniqueRoomDocumentKey(
    normalizeText(buildRoomDocumentRef(project.projectKey)).replace(/_/g, "-"),
  );
  const title = getRoomDocumentTitle(project);
  const contentMarkdown = buildRoomDocumentContent({ source });

  await prisma.readerDocument.create({
    data: {
      userId,
      documentKey,
      title,
      subtitle: "Hidden Room assembly",
      format: "MARKDOWN",
      mimeType: "text/markdown",
      originalFilename: null,
      contentMarkdown,
      wordCount: countWords(contentMarkdown),
      sectionCount: 1,
    },
  });

  await attachDocumentToProjectForUser(userId, {
    projectKey: project.projectKey,
    documentKey,
    role: "ASSEMBLY",
    setAsCurrentAssembly: false,
    touchSystemExample: false,
  });

  await updateReaderProjectForUser(userId, project.projectKey, {
    roomState: {
      documentKey,
      seededFromLegacyAt: seededFromLegacy ? new Date().toISOString() : roomMeta.seededFromLegacyAt,
      legacySeedMode: seededFromLegacy ? "comments-only" : roomMeta.legacySeedMode,
    },
    touchSystemExample: false,
    skipExampleTouch: true,
  });

  return getWorkspaceDocumentForUser(userId, documentKey);
}
