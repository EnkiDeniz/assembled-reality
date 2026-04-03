import "server-only";

import { prisma } from "@/lib/prisma";
import { DEFAULT_PROJECT_KEY } from "@/lib/project-model";
import { attachDocumentToProjectForUser } from "@/lib/reader-projects";
import { getParsedDocument, parseDocument, PRIMARY_DOCUMENT_KEY } from "@/lib/document";
import { slugify } from "@/lib/text";
import {
  buildWorkspaceBlocksFromDocument,
  buildWorkspaceExcerptFromBlocks,
  buildWorkspaceMarkdown,
  createWorkspaceLogEntry,
  normalizeWorkspaceBlocks,
  normalizeWorkspaceLogEntries,
} from "@/lib/document-blocks";

const META_RE = /^\s*<!--\s*assembler-meta:([A-Za-z0-9+/=_-]+)\s*-->\s*/;
const BUILTIN_OVERRIDE_PREFIX = `${PRIMARY_DOCUMENT_KEY}--user-`;

function getBuiltinWorkspaceOverrideKey(userId) {
  return `${BUILTIN_OVERRIDE_PREFIX}${String(userId || "").trim()}`;
}

function encodeWorkspaceMeta(meta) {
  return Buffer.from(JSON.stringify(meta), "utf8").toString("base64");
}

function decodeWorkspaceMeta(encoded) {
  try {
    return JSON.parse(Buffer.from(String(encoded || ""), "base64").toString("utf8"));
  } catch {
    return {};
  }
}

function extractWorkspaceMeta(contentMarkdown) {
  const source = String(contentMarkdown || "");
  const match = source.match(META_RE);
  if (!match) {
    return {
      meta: {},
      cleanMarkdown: source.trim(),
    };
  }

  return {
    meta: decodeWorkspaceMeta(match[1]),
    cleanMarkdown: source.replace(META_RE, "").trim(),
  };
}

function countWords(text) {
  return String(text || "")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean).length;
}

function normalizeTimestampValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

function matchesDocumentRevision(baseUpdatedAt, currentUpdatedAt) {
  return normalizeTimestampValue(baseUpdatedAt) === normalizeTimestampValue(currentUpdatedAt);
}

function createWorkspaceDocumentConflictError(document) {
  const error = new Error("A newer version of this document was saved somewhere else.");
  error.code = "stale_document";
  error.currentDocument = document;
  return error;
}

function getDocumentType(meta = {}, fallbackSourceType = "upload") {
  const explicit = String(meta?.documentType || "").trim().toLowerCase();
  if (explicit === "assembly") return "assembly";
  if (explicit === "builtin") return "builtin";
  if (fallbackSourceType === "builtin") return "builtin";
  return "source";
}

function buildSourceFiles(meta = {}, originalFilename = "") {
  if (Array.isArray(meta?.sourceFiles) && meta.sourceFiles.length > 0) {
    return meta.sourceFiles.filter(Boolean);
  }

  const filename = String(originalFilename || "").trim();
  return filename ? [filename] : [];
}

function normalizeIntakeDiagnostics(diagnostics = []) {
  return (Array.isArray(diagnostics) ? diagnostics : [])
    .filter(Boolean)
    .map((diagnostic) => ({
      code: String(diagnostic?.code || "info").trim() || "info",
      severity:
        diagnostic?.severity === "warning" || diagnostic?.severity === "error"
          ? diagnostic.severity
          : "info",
      message: String(diagnostic?.message || "").trim(),
    }))
    .filter((diagnostic) => diagnostic.message);
}

function buildStoredWorkspaceMeta({
  documentType = "source",
  sourceFiles = [],
  blocks = [],
  logEntries = [],
  intakeKind = "upload",
  intakeDiagnostics = [],
  hiddenFromProjectHome = false,
}) {
  return {
    version: 2,
    documentType,
    sourceFiles: Array.isArray(sourceFiles) ? sourceFiles.filter(Boolean) : [],
    intakeKind: String(intakeKind || "upload").trim() || "upload",
    intakeDiagnostics: normalizeIntakeDiagnostics(intakeDiagnostics),
    hiddenFromProjectHome: Boolean(hiddenFromProjectHome),
    blocks: normalizeWorkspaceBlocks(blocks).map((block) => ({
      id: block.id,
      documentKey: block.documentKey,
      sourceDocumentKey: block.sourceDocumentKey,
      sourcePosition: block.sourcePosition,
      kind: block.kind,
      text: block.text,
      plainText: block.plainText,
      author: block.author,
      operation: block.operation,
      createdAt: block.createdAt,
      updatedAt: block.updatedAt,
      isAssemblyBlock: block.isAssemblyBlock,
      isEditable: block.isEditable,
      isPlayable: block.isPlayable,
      sectionSlug: block.sectionSlug,
      sectionLabel: block.sectionLabel,
      sectionTitle: block.sectionTitle,
      sourceTitle: block.sourceTitle,
    })),
    logEntries: normalizeWorkspaceLogEntries(logEntries),
  };
}

export function buildStoredWorkspaceContent({
  title,
  subtitle = "",
  documentType = "source",
  sourceFiles = [],
  blocks = [],
  logEntries = [],
  intakeKind = "upload",
  intakeDiagnostics = [],
  hiddenFromProjectHome = false,
}) {
  const markdown = buildWorkspaceMarkdown({
    title,
    subtitle,
    blocks,
    sectionTitle: documentType === "assembly" ? "Assembly" : "Document",
  });
  const meta = buildStoredWorkspaceMeta({
    documentType,
    sourceFiles,
    blocks,
    logEntries,
    intakeKind,
    intakeDiagnostics,
    hiddenFromProjectHome,
  });

  return `<!-- assembler-meta:${encodeWorkspaceMeta(meta)} -->\n\n${markdown}`.trim();
}

export function parseStoredWorkspaceDocument({
  documentKey,
  contentMarkdown,
  fallbackSourceType = "upload",
  originalFilename = "",
  createdAt = null,
  updatedAt = null,
  format = "markdown",
}) {
  const { meta, cleanMarkdown } = extractWorkspaceMeta(contentMarkdown);
  const parsedDocument = parseDocument(cleanMarkdown, { documentKey });
  const documentType = getDocumentType(meta, fallbackSourceType);
  const blocks =
    Array.isArray(meta?.blocks) && meta.blocks.length > 0
      ? normalizeWorkspaceBlocks(meta.blocks, {
          documentKey,
          defaultSourceDocumentKey: documentKey,
          defaultIsEditable: documentType !== "builtin",
          defaultIsAssemblyBlock: documentType === "assembly",
        })
      : buildWorkspaceBlocksFromDocument(parsedDocument, {
          documentKey,
          defaultSourceDocumentKey: documentKey,
          defaultIsEditable: documentType !== "builtin",
          defaultIsAssemblyBlock: documentType === "assembly",
        });
  const logEntries = normalizeWorkspaceLogEntries(meta?.logEntries, documentKey);
  const sourceType =
    fallbackSourceType === "builtin" ? "builtin" : documentType === "assembly" ? "assembly" : "upload";

  return {
    ...parsedDocument,
    rawMarkdown: cleanMarkdown,
    blocks,
    logEntries,
    documentType,
    sourceType,
    intakeKind: String(meta?.intakeKind || fallbackSourceType || "upload").trim().toLowerCase(),
    intakeDiagnostics: normalizeIntakeDiagnostics(meta?.intakeDiagnostics),
    hiddenFromProjectHome: Boolean(meta?.hiddenFromProjectHome),
    sourceFiles: buildSourceFiles(meta, originalFilename),
    originalFilename: originalFilename || null,
    format: String(format || "MARKDOWN").toLowerCase(),
    excerpt: buildWorkspaceExcerptFromBlocks(blocks),
    isAssembly: documentType === "assembly",
    isEditable: documentType !== "builtin",
    createdAt: createdAt?.toISOString?.() || null,
    updatedAt: updatedAt?.toISOString?.() || null,
  };
}

export function getWorkspaceDocumentFromRecord(record, fallbackSourceType = "upload") {
  if (!record) return null;

  return parseStoredWorkspaceDocument({
    documentKey: record.documentKey,
    contentMarkdown: record.contentMarkdown,
    fallbackSourceType,
    originalFilename: record.originalFilename,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    format: record.format,
  });
}

export function getBuiltinWorkspaceDocument() {
  const parsedDocument = getParsedDocument();
  const blocks = buildWorkspaceBlocksFromDocument(parsedDocument, {
    documentKey: parsedDocument.documentKey,
    defaultSourceDocumentKey: parsedDocument.documentKey,
    defaultIsEditable: true,
    defaultIsAssemblyBlock: false,
  });

  return {
    ...parsedDocument,
    rawMarkdown: buildWorkspaceMarkdown({
      title: parsedDocument.title,
      subtitle: parsedDocument.subtitle,
      blocks,
      sectionTitle: "Document",
    }),
    blocks,
    logEntries: [],
    documentType: "builtin",
    sourceType: "builtin",
    sourceFiles: ["Assembled Reality"],
    originalFilename: null,
    format: "markdown",
    excerpt: buildWorkspaceExcerptFromBlocks(blocks),
    isAssembly: false,
    isEditable: true,
    createdAt: null,
    updatedAt: null,
  };
}

export async function getWorkspaceDocumentForUser(userId, documentKey = PRIMARY_DOCUMENT_KEY) {
  if (!documentKey || documentKey === PRIMARY_DOCUMENT_KEY) {
    const override = await prisma.readerDocument.findFirst({
      where: {
        userId,
        documentKey: getBuiltinWorkspaceOverrideKey(userId),
      },
    });

    if (!override) {
      return getBuiltinWorkspaceDocument();
    }

    const document = getWorkspaceDocumentFromRecord(override, "builtin");
    const blocks = normalizeWorkspaceBlocks(document.blocks, {
      documentKey: PRIMARY_DOCUMENT_KEY,
      defaultSourceDocumentKey: PRIMARY_DOCUMENT_KEY,
      defaultIsEditable: true,
      defaultIsAssemblyBlock: false,
    });

    return {
      ...document,
      documentKey: PRIMARY_DOCUMENT_KEY,
      rawMarkdown: buildWorkspaceMarkdown({
        title: document.title,
        subtitle: document.subtitle || "",
        blocks,
        sectionTitle: "Document",
      }),
      blocks,
      logEntries: normalizeWorkspaceLogEntries(document.logEntries, PRIMARY_DOCUMENT_KEY),
      documentType: "builtin",
      sourceType: "builtin",
      sourceFiles: ["Assembled Reality"],
      excerpt: buildWorkspaceExcerptFromBlocks(blocks),
      isAssembly: false,
      isEditable: true,
    };
  }

  if (documentKey.startsWith(BUILTIN_OVERRIDE_PREFIX)) {
    return null;
  }

  const record = await prisma.readerDocument.findFirst({
    where: {
      userId,
      documentKey,
    },
  });

  if (!record) {
    return null;
  }

  return getWorkspaceDocumentFromRecord(record, "upload");
}

async function ensureUniqueDocumentKey(baseKey) {
  const existing = new Set(
    (
      await prisma.readerDocument.findMany({
        select: { documentKey: true },
      })
    ).map((entry) => entry.documentKey),
  );
  existing.add(PRIMARY_DOCUMENT_KEY);

  if (!existing.has(baseKey)) {
    return baseKey;
  }

  let index = 2;
  while (existing.has(`${baseKey}-${index}`)) {
    index += 1;
  }

  return `${baseKey}-${index}`;
}

export async function saveWorkspaceDocumentForUser(
  userId,
  {
    documentKey,
    title,
    subtitle = "",
    blocks = [],
    logEntries = [],
    baseUpdatedAt = null,
  },
) {
  if (!documentKey) {
    throw new Error("Document key is required.");
  }

  if (documentKey === PRIMARY_DOCUMENT_KEY) {
    const current = await getWorkspaceDocumentForUser(userId, PRIMARY_DOCUMENT_KEY);
    const storageDocumentKey = getBuiltinWorkspaceOverrideKey(userId);
    const normalizedBlocks = normalizeWorkspaceBlocks(blocks, {
      documentKey: PRIMARY_DOCUMENT_KEY,
      defaultSourceDocumentKey: PRIMARY_DOCUMENT_KEY,
      defaultIsEditable: true,
      defaultIsAssemblyBlock: false,
    });
    const nextTitle = String(title || current?.title || "Assembled Reality").trim();
    const nextSubtitle = String(subtitle || current?.subtitle || "").trim();
    const contentMarkdown = buildStoredWorkspaceContent({
      title: nextTitle,
      subtitle: nextSubtitle,
      documentType: "builtin",
      sourceFiles: ["Assembled Reality"],
      blocks: normalizedBlocks,
      logEntries,
      intakeKind: current?.intakeKind || "builtin",
      intakeDiagnostics: current?.intakeDiagnostics || [],
      hiddenFromProjectHome: current?.hiddenFromProjectHome || false,
    });
    const existing = await prisma.readerDocument.findFirst({
      where: {
        userId,
        documentKey: storageDocumentKey,
      },
    });

    if (!matchesDocumentRevision(baseUpdatedAt, existing?.updatedAt || current?.updatedAt || null)) {
      throw createWorkspaceDocumentConflictError(
        current ||
          (await getWorkspaceDocumentForUser(userId, PRIMARY_DOCUMENT_KEY)),
      );
    }

    if (existing) {
      await prisma.readerDocument.update({
        where: {
          documentKey: storageDocumentKey,
        },
        data: {
          title: nextTitle,
          subtitle: nextSubtitle || null,
          format: "MARKDOWN",
          contentMarkdown,
          wordCount: countWords(contentMarkdown),
          sectionCount: 1,
          mimeType: "text/markdown",
          originalFilename: null,
        },
      });
    } else {
      await prisma.readerDocument.create({
        data: {
          userId,
          documentKey: storageDocumentKey,
          title: nextTitle,
          subtitle: nextSubtitle || null,
          format: "MARKDOWN",
          mimeType: "text/markdown",
          originalFilename: null,
          contentMarkdown,
          wordCount: countWords(contentMarkdown),
          sectionCount: 1,
        },
      });
    }

    return getWorkspaceDocumentForUser(userId, PRIMARY_DOCUMENT_KEY);
  }

  const existing = await prisma.readerDocument.findFirst({
    where: {
      userId,
      documentKey,
    },
  });

  if (!existing) {
    throw new Error("Document not found.");
  }

  if (!matchesDocumentRevision(baseUpdatedAt, existing.updatedAt)) {
    throw createWorkspaceDocumentConflictError(
      await getWorkspaceDocumentForUser(userId, existing.documentKey),
    );
  }

  const current = getWorkspaceDocumentFromRecord(existing, "upload");

  const normalizedBlocks = normalizeWorkspaceBlocks(blocks, {
    documentKey: existing.documentKey,
    defaultSourceDocumentKey: existing.documentKey,
    defaultIsEditable: true,
    defaultIsAssemblyBlock: current.documentType === "assembly",
  });

  const contentMarkdown = buildStoredWorkspaceContent({
    title: String(title || current.title || existing.title || "Untitled document").trim(),
    subtitle: String(subtitle || current.subtitle || "").trim(),
    documentType: current.documentType === "assembly" ? "assembly" : "source",
    sourceFiles: current.sourceFiles,
    blocks: normalizedBlocks,
    logEntries,
    intakeKind: current.intakeKind,
    intakeDiagnostics: current.intakeDiagnostics,
    hiddenFromProjectHome: current.hiddenFromProjectHome,
  });

  const updated = await prisma.readerDocument.update({
    where: {
      documentKey: existing.documentKey,
    },
    data: {
      title: String(title || current.title || existing.title || "Untitled document").trim(),
      subtitle: String(subtitle || current.subtitle || "").trim() || null,
      format: "MARKDOWN",
      contentMarkdown,
      wordCount: countWords(contentMarkdown),
      sectionCount: 1,
      mimeType: "text/markdown",
    },
  });

  return getWorkspaceDocumentForUser(userId, updated.documentKey);
}

export async function createAssemblyDocumentForUser(
  userId,
  {
    title,
    subtitle = "",
    projectKey = DEFAULT_PROJECT_KEY,
    blocks = [],
  },
) {
  const normalizedTitle = String(title || "").trim() || "Assembly";
  const normalizedBlocks = normalizeWorkspaceBlocks(blocks, {
    documentKey: "",
    defaultSourceDocumentKey: "assembly",
    defaultIsEditable: true,
    defaultIsAssemblyBlock: true,
    defaultOperation: "assembled",
  });
  const sourceFiles = [
    ...new Set(
      normalizedBlocks
        .map((block) => block.sourceTitle || block.sourceDocumentKey)
        .filter(Boolean),
    ),
  ];
  const documentKey = await ensureUniqueDocumentKey(slugify(normalizedTitle) || "assembly");

  const persistedBlocks = normalizeWorkspaceBlocks(
    normalizedBlocks.map((block) => ({
      ...block,
      documentKey,
      isAssemblyBlock: true,
      isEditable: true,
    })),
    {
      documentKey,
      defaultSourceDocumentKey: documentKey,
      defaultIsEditable: true,
      defaultIsAssemblyBlock: true,
    },
  );
  const assemblyLogEntries = normalizeWorkspaceLogEntries(
    [
      createWorkspaceLogEntry({
        action: "ASSEMBLED",
        detail: `Created "${normalizedTitle}" from ${persistedBlocks.length} block${
          persistedBlocks.length === 1 ? "" : "s"
        }.`,
        documentKey,
        blockIds: persistedBlocks.map((block) => block.id),
      }),
    ],
    documentKey,
  );

  const contentMarkdown = buildStoredWorkspaceContent({
    title: normalizedTitle,
    subtitle: String(subtitle || "").trim(),
    documentType: "assembly",
    sourceFiles,
    blocks: persistedBlocks,
    logEntries: assemblyLogEntries,
  });

  await prisma.readerDocument.create({
    data: {
      userId,
      documentKey,
      title: normalizedTitle,
      subtitle: String(subtitle || "").trim() || null,
      format: "MARKDOWN",
      mimeType: "text/markdown",
      originalFilename: null,
      contentMarkdown,
      wordCount: countWords(contentMarkdown),
      sectionCount: 1,
    },
  });

  await attachDocumentToProjectForUser(userId, {
    projectKey,
    documentKey,
    role: "ASSEMBLY",
    setAsCurrentAssembly: true,
  });

  return getWorkspaceDocumentForUser(userId, documentKey);
}
