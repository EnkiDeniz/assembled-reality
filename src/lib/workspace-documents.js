import "server-only";

import { prisma } from "@/lib/prisma";
import { getParsedDocument, parseDocument, PRIMARY_DOCUMENT_KEY } from "@/lib/document";
import { slugify } from "@/lib/text";
import {
  buildWorkspaceBlocksFromDocument,
  buildWorkspaceExcerptFromBlocks,
  buildWorkspaceMarkdown,
  normalizeWorkspaceBlocks,
  normalizeWorkspaceLogEntries,
} from "@/lib/document-blocks";

const META_RE = /^\s*<!--\s*assembler-meta:([A-Za-z0-9+/=_-]+)\s*-->\s*/;

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

function buildStoredWorkspaceMeta({
  documentType = "source",
  sourceFiles = [],
  blocks = [],
  logEntries = [],
}) {
  return {
    version: 1,
    documentType,
    sourceFiles: Array.isArray(sourceFiles) ? sourceFiles.filter(Boolean) : [],
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
    defaultIsEditable: false,
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
    isEditable: false,
    createdAt: null,
    updatedAt: null,
  };
}

export async function getWorkspaceDocumentForUser(userId, documentKey = PRIMARY_DOCUMENT_KEY) {
  if (!documentKey || documentKey === PRIMARY_DOCUMENT_KEY) {
    return getBuiltinWorkspaceDocument();
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
  },
) {
  if (!documentKey || documentKey === PRIMARY_DOCUMENT_KEY) {
    throw new Error("The built-in document cannot be edited directly.");
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
    blocks = [],
    logEntries = [],
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

  const contentMarkdown = buildStoredWorkspaceContent({
    title: normalizedTitle,
    subtitle: String(subtitle || "").trim(),
    documentType: "assembly",
    sourceFiles,
    blocks: persistedBlocks,
    logEntries,
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

  return getWorkspaceDocumentForUser(userId, documentKey);
}
