import "server-only";

import { PRIMARY_DOCUMENT_KEY } from "@/lib/document";
import { buildWorkspaceBlocksFromDocument } from "@/lib/document-blocks";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/text";
import {
  buildStoredWorkspaceContent,
  getBuiltinWorkspaceDocument,
  getWorkspaceDocumentForUser,
  getWorkspaceDocumentFromRecord,
} from "@/lib/workspace-documents";
import { parseDocument } from "@/lib/document";

function getReaderDocumentModel() {
  return prisma.readerDocument || null;
}

function buildDocumentHref(documentKey) {
  return documentKey === PRIMARY_DOCUMENT_KEY
    ? "/workspace"
    : `/workspace?document=${encodeURIComponent(documentKey)}`;
}

function formatDocumentFormat(value, originalFilename = "") {
  const normalized = String(value || "markdown").toLowerCase();
  if (normalized === "docx") return "DOCX";
  if (normalized === "doc") return "DOC";
  if (normalized === "pdf") return "PDF";
  if (String(originalFilename || "").trim().toLowerCase().endsWith(".txt")) {
    return "TXT";
  }
  return "Markdown";
}

function serializeDocumentSummary(documentData, record = null, progressPercent = 0) {
  const isBuiltin = documentData?.documentType === "builtin";

  return {
    documentKey: documentData?.documentKey || record?.documentKey || PRIMARY_DOCUMENT_KEY,
    title: documentData?.title || record?.title || "Untitled document",
    subtitle: documentData?.subtitle || record?.subtitle || "",
    excerpt: documentData?.excerpt || "",
    sourceType: documentData?.sourceType || (isBuiltin ? "builtin" : "upload"),
    documentType: documentData?.documentType || (isBuiltin ? "builtin" : "source"),
    format: String(documentData?.format || record?.format || "markdown").toLowerCase(),
    formatLabel: formatDocumentFormat(record?.format || documentData?.format, record?.originalFilename),
    originalFilename: record?.originalFilename || documentData?.originalFilename || null,
    href: buildDocumentHref(documentData?.documentKey || record?.documentKey || PRIMARY_DOCUMENT_KEY),
    wordCount: record?.wordCount || 0,
    sectionCount: Array.isArray(documentData?.blocks)
      ? documentData.blocks.length
      : Array.isArray(documentData?.sections)
        ? documentData.sections.length
        : 0,
    progressPercent,
    createdAt: documentData?.createdAt || record?.createdAt?.toISOString?.() || null,
    updatedAt: documentData?.updatedAt || record?.updatedAt?.toISOString?.() || null,
    isAssembly: Boolean(documentData?.isAssembly),
    isEditable: Boolean(documentData?.isEditable),
    sourceFiles: Array.isArray(documentData?.sourceFiles) ? documentData.sourceFiles : [],
  };
}

function serializeBuiltinDocument(progressPercent = 0) {
  return serializeDocumentSummary(getBuiltinWorkspaceDocument(), null, progressPercent);
}

function serializeUploadedDocument(record, progressPercent = 0) {
  const documentData = getWorkspaceDocumentFromRecord(record, "upload");
  return serializeDocumentSummary(documentData, record, progressPercent);
}

async function buildProgressMapForUser(userId) {
  const profile = await prisma.readerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!profile?.id) {
    return new Map();
  }

  const progressEntries = await prisma.readingProgress.findMany({
    where: { readerProfileId: profile.id },
    orderBy: { updatedAt: "desc" },
  });

  return new Map(
    progressEntries.map((entry) => [entry.documentKey, entry.progressPercent || 0]),
  );
}

async function ensureUniqueDocumentKey(baseKey) {
  const readerDocumentModel = getReaderDocumentModel();
  const existing = new Set(
    readerDocumentModel
      ? (
          await readerDocumentModel.findMany({
            select: { documentKey: true },
          })
        ).map((entry) => entry.documentKey)
      : [],
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

export function getReaderDocumentHref(documentKey) {
  return buildDocumentHref(documentKey);
}

export async function listReaderDocumentsForUser(userId) {
  const readerDocumentModel = getReaderDocumentModel();
  const [progressMap, uploadedDocuments] = await Promise.all([
    buildProgressMapForUser(userId),
    readerDocumentModel
      ? readerDocumentModel.findMany({
          where: {
            userId,
            NOT: {
              documentKey: {
                startsWith: `${PRIMARY_DOCUMENT_KEY}--user-`,
              },
            },
          },
          orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        })
      : [],
  ]);

  return [
    serializeBuiltinDocument(progressMap.get(PRIMARY_DOCUMENT_KEY) || 0),
    ...uploadedDocuments.map((record) =>
      serializeUploadedDocument(record, progressMap.get(record.documentKey) || 0),
    ),
  ];
}

export async function createReaderDocumentForUser(
  userId,
  {
    title,
    subtitle = "",
    format = "markdown",
    originalFilename = "",
    mimeType = "",
    contentMarkdown,
    wordCount = 0,
    sectionCount = 0,
  },
) {
  const readerDocumentModel = getReaderDocumentModel();
  if (!readerDocumentModel) {
    throw new Error("Document uploads are temporarily unavailable.");
  }

  const normalizedTitle = String(title || "").trim() || "Untitled document";
  const normalizedSubtitle = String(subtitle || "").trim();
  const baseKey = slugify(normalizedTitle) || slugify(originalFilename) || "uploaded-document";
  const documentKey = await ensureUniqueDocumentKey(baseKey);
  const parsedDocument = parseDocument(contentMarkdown, { documentKey });
  const blocks = buildWorkspaceBlocksFromDocument(parsedDocument, {
    documentKey,
    defaultSourceDocumentKey: documentKey,
    defaultIsEditable: true,
  });
  const storedContentMarkdown = buildStoredWorkspaceContent({
    title: normalizedTitle,
    subtitle: normalizedSubtitle,
    documentType: "source",
    sourceFiles: originalFilename ? [originalFilename] : [],
    blocks,
    logEntries: [],
  });

  const record = await readerDocumentModel.create({
    data: {
      userId,
      documentKey,
      title: normalizedTitle,
      subtitle: normalizedSubtitle || null,
      format: String(format || "markdown").toUpperCase(),
      mimeType: mimeType || null,
      originalFilename: originalFilename || null,
      contentMarkdown: storedContentMarkdown,
      wordCount,
      sectionCount,
    },
  });

  return serializeUploadedDocument(record, 0);
}

export async function getReaderDocumentDataForUser(userId, documentKey = PRIMARY_DOCUMENT_KEY) {
  return getWorkspaceDocumentForUser(userId, documentKey);
}

export async function getReaderDocumentSummaryForUser(userId, documentKey = PRIMARY_DOCUMENT_KEY) {
  if (!documentKey || documentKey === PRIMARY_DOCUMENT_KEY) {
    return serializeBuiltinDocument();
  }

  const readerDocumentModel = getReaderDocumentModel();
  if (!readerDocumentModel) {
    return null;
  }

  const record = await readerDocumentModel.findFirst({
    where: {
      userId,
      documentKey,
    },
  });

  if (!record) {
    return null;
  }

  return serializeUploadedDocument(record);
}
