import "server-only";

import { getParsedDocument, parseDocument, PRIMARY_DOCUMENT_KEY } from "@/lib/document";
import { prisma } from "@/lib/prisma";
import { buildExcerpt, slugify } from "@/lib/text";

function getReaderDocumentModel() {
  return prisma.readerDocument || null;
}

function buildDocumentHref(documentKey) {
  return documentKey === PRIMARY_DOCUMENT_KEY ? "/read" : `/read/${encodeURIComponent(documentKey)}`;
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

function getDocumentExcerpt(documentData) {
  return buildExcerpt(
    documentData.introMarkdown || documentData.sections[0]?.markdown || "",
    180,
  );
}

function serializeBuiltinDocument(progressPercent = 0) {
  const documentData = getParsedDocument();

  return {
    documentKey: documentData.documentKey,
    title: documentData.title,
    subtitle: documentData.subtitle,
    excerpt: getDocumentExcerpt(documentData),
    sourceType: "builtin",
    format: "markdown",
    formatLabel: formatDocumentFormat("markdown"),
    originalFilename: null,
    href: buildDocumentHref(documentData.documentKey),
    wordCount: 0,
    sectionCount: documentData.sections.length,
    progressPercent,
    createdAt: null,
    updatedAt: null,
  };
}

function serializeUploadedDocument(record, progressPercent = 0) {
  const documentData = parseDocument(record.contentMarkdown, {
    documentKey: record.documentKey,
  });

  return {
    documentKey: record.documentKey,
    title: record.title,
    subtitle: record.subtitle || "",
    excerpt: getDocumentExcerpt(documentData),
    sourceType: "upload",
    format: String(record.format || "markdown").toLowerCase(),
    formatLabel: formatDocumentFormat(record.format, record.originalFilename),
    originalFilename: record.originalFilename || null,
    href: buildDocumentHref(record.documentKey),
    wordCount: record.wordCount || 0,
    sectionCount: record.sectionCount || documentData.sections.length,
    progressPercent,
    createdAt: record.createdAt?.toISOString?.() || null,
    updatedAt: record.updatedAt?.toISOString?.() || null,
  };
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
          where: { userId },
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

  const baseKey = slugify(title) || slugify(originalFilename) || "uploaded-document";
  const documentKey = await ensureUniqueDocumentKey(baseKey);

  const record = await readerDocumentModel.create({
    data: {
      userId,
      documentKey,
      title,
      subtitle,
      format: String(format || "markdown").toUpperCase(),
      mimeType: mimeType || null,
      originalFilename: originalFilename || null,
      contentMarkdown,
      wordCount,
      sectionCount,
    },
  });

  return serializeUploadedDocument(record, 0);
}

export async function getReaderDocumentDataForUser(userId, documentKey = PRIMARY_DOCUMENT_KEY) {
  if (!documentKey || documentKey === PRIMARY_DOCUMENT_KEY) {
    return getParsedDocument();
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

  return {
    ...parseDocument(record.contentMarkdown, {
      documentKey: record.documentKey,
    }),
    sourceType: "upload",
    format: String(record.format || "MARKDOWN").toLowerCase(),
    originalFilename: record.originalFilename || null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
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
