import "server-only";

import { randomUUID } from "node:crypto";
import { PRIMARY_DOCUMENT_KEY } from "@/lib/document";
import {
  buildWorkspaceBlocksFromDocument,
  buildWorkspaceMarkdown,
  createWorkspaceLogEntry,
  normalizeWorkspaceBlocks,
  normalizeWorkspaceLogEntries,
} from "@/lib/document-blocks";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PROJECT_KEY } from "@/lib/project-model";
import { attachDocumentToProjectForUser } from "@/lib/reader-projects";
import { slugify } from "@/lib/text";
import {
  buildStoredWorkspaceContent,
  getBuiltinWorkspaceDocument,
  getWorkspaceDocumentForUser,
  getWorkspaceDocumentFromRecord,
} from "@/lib/workspace-documents";
import { parseDocument } from "@/lib/document";
import {
  createReaderSourceAssetForUser,
  listReaderSourceAssetsByDocumentKeysForUser,
} from "@/lib/source-assets";

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

function countWords(text) {
  return String(text || "")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean).length;
}

function serializeDocumentSummary(documentData, record = null, progressPercent = 0, sourceAssets = []) {
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
    intakeKind: documentData?.intakeKind || (isBuiltin ? "builtin" : "upload"),
    intakeDiagnostics: Array.isArray(documentData?.intakeDiagnostics)
      ? documentData.intakeDiagnostics
      : [],
    hiddenFromProjectHome: Boolean(documentData?.hiddenFromProjectHome),
    sourceFiles: Array.isArray(documentData?.sourceFiles) ? documentData.sourceFiles : [],
    sourceAssetIds: Array.isArray(documentData?.sourceAssetIds) ? documentData.sourceAssetIds : [],
    sourceAssets: Array.isArray(sourceAssets) ? sourceAssets : Array.isArray(documentData?.sourceAssets) ? documentData.sourceAssets : [],
    sourceProvenance:
      documentData?.sourceProvenance && typeof documentData.sourceProvenance === "object"
        ? documentData.sourceProvenance
        : null,
    sourceTrustProfile:
      documentData?.sourceTrustProfile && typeof documentData.sourceTrustProfile === "object"
        ? documentData.sourceTrustProfile
        : null,
    seedMeta:
      documentData?.seedMeta && typeof documentData.seedMeta === "object"
        ? documentData.seedMeta
        : null,
    derivationKind: documentData?.derivationKind || "",
    derivationModel: documentData?.derivationModel || "",
    derivationStatus: documentData?.derivationStatus || "",
  };
}

async function serializeBuiltinDocumentForUser(userId, progressPercent = 0) {
  const documentData = await getWorkspaceDocumentForUser(userId, PRIMARY_DOCUMENT_KEY);
  return serializeDocumentSummary(documentData || getBuiltinWorkspaceDocument(), null, progressPercent);
}

function serializeUploadedDocument(record, progressPercent = 0, sourceAssets = []) {
  const documentData = getWorkspaceDocumentFromRecord(record, "upload");
  return serializeDocumentSummary(documentData, record, progressPercent, sourceAssets);
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
  const builtinDocument = await serializeBuiltinDocumentForUser(
    userId,
    progressMap.get(PRIMARY_DOCUMENT_KEY) || 0,
  );
  const assetsByDocumentKey = await listReaderSourceAssetsByDocumentKeysForUser(
    userId,
    uploadedDocuments.map((record) => record.documentKey),
  );

  return [
    builtinDocument,
    ...uploadedDocuments.map((record) =>
      serializeUploadedDocument(
        record,
        progressMap.get(record.documentKey) || 0,
        assetsByDocumentKey.get(record.documentKey) || [],
      ),
    ),
  ];
}

export async function createReaderDocumentForUser(
  userId,
  {
    title,
    subtitle = "",
    projectKey = DEFAULT_PROJECT_KEY,
    format = "markdown",
    originalFilename = "",
    mimeType = "",
    contentMarkdown,
    wordCount = 0,
    sectionCount = 0,
    blocks = null,
    logEntries = [],
    sourceFiles = [],
    sourceAssetIds = [],
    sourceProvenance = null,
    sourceTrustProfile = null,
    intakeKind = "upload",
    intakeDiagnostics = [],
    hiddenFromProjectHome = false,
    derivationKind = "",
    derivationModel = "",
    derivationStatus = "",
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
  const extractionPassId = `extract-${randomUUID()}`;
  const parsedDocument =
    Array.isArray(blocks) && blocks.length > 0
      ? null
      : parseDocument(contentMarkdown, { documentKey });
  const persistedBlocks =
    Array.isArray(blocks) && blocks.length > 0
      ? normalizeWorkspaceBlocks(
          blocks.map((block, index) => ({
            ...block,
            id: `${documentKey}:block:${extractionPassId}:${String(
              Number.isFinite(Number(block.sourcePosition)) ? Number(block.sourcePosition) : index,
            ).padStart(4, "0")}`,
            documentKey,
            sourceDocumentKey: block.sourceDocumentKey || documentKey,
            sourcePosition:
              Number.isFinite(Number(block.sourcePosition)) ? Number(block.sourcePosition) : index,
            isEditable: true,
          })),
          {
            documentKey,
            defaultSourceDocumentKey: documentKey,
            defaultIsEditable: true,
            defaultConfirmationStatus: "unconfirmed",
            defaultExtractionPassId: extractionPassId,
            defaultSourceType: "source",
          },
        )
      : buildWorkspaceBlocksFromDocument(parsedDocument, {
          documentKey,
          defaultSourceDocumentKey: documentKey,
          defaultIsEditable: true,
          defaultConfirmationStatus: "unconfirmed",
          defaultExtractionPassId: extractionPassId,
          defaultSourceType: "source",
        });
  const persistedLogEntries = normalizeWorkspaceLogEntries(logEntries, documentKey);
  const storedContentMarkdown = buildStoredWorkspaceContent({
    title: normalizedTitle,
    subtitle: normalizedSubtitle,
    documentType: "source",
    sourceFiles: sourceFiles.length ? sourceFiles : originalFilename ? [originalFilename] : [],
    sourceAssetIds,
    sourceProvenance,
    sourceTrustProfile,
    blocks: persistedBlocks,
    logEntries: persistedLogEntries,
    intakeKind,
    intakeDiagnostics,
    hiddenFromProjectHome,
    derivationKind,
    derivationModel,
    derivationStatus,
  });
  const resolvedWordCount =
    Number(wordCount) > 0
      ? Number(wordCount)
      : countWords(persistedBlocks.map((block) => block.plainText || block.text).join(" "));
  const resolvedSectionCount =
    Number(sectionCount) > 0 ? Number(sectionCount) : persistedBlocks.length;

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
      wordCount: resolvedWordCount,
      sectionCount: resolvedSectionCount,
    },
  });

  await attachDocumentToProjectForUser(userId, {
    projectKey,
    documentKey,
    role: "SOURCE",
  });

  return serializeUploadedDocument(record, 0);
}

export async function createImageDerivedDocumentForUser(
  userId,
  {
    title,
    subtitle = "",
    projectKey = DEFAULT_PROJECT_KEY,
    originalFilename = "",
    mimeType = "",
    blocks = [],
    wordCount = 0,
    sectionCount = 0,
    intakeKind = "upload-image-document",
    intakeDiagnostics = [],
    derivationKind = "ocr-document",
    derivationModel = "",
    derivationStatus = "succeeded",
    sourceAsset,
    sourceProvenance = null,
    sourceTrustProfile = null,
  },
) {
  return createAssetDerivedDocumentForUser(userId, {
    title,
    subtitle,
    projectKey,
    originalFilename,
    mimeType,
    blocks,
    wordCount,
    sectionCount,
    intakeKind,
    intakeDiagnostics,
    derivationKind,
    derivationModel,
    derivationStatus,
    sourceAsset,
    sourceProvenance,
    sourceTrustProfile,
    assetKind: "IMAGE",
    defaultOperation:
      derivationKind === "image-notes" ? "summarized" : "extracted",
    sourceAction: String(intakeKind || "").startsWith("paste-image-")
      ? "PASTED_IMAGE"
      : "UPLOADED_IMAGE",
    sourceDetail:
      String(intakeKind || "").startsWith("paste-image-") || !sourceAsset?.originalFilename
        ? "Added image source from the clipboard."
        : `Added image source "${sourceAsset.originalFilename}".`,
    derivedAction: "DERIVED_IMAGE_SOURCE",
    derivedDetail: `Created ${
      derivationKind === "image-notes" ? "source notes" : "source document"
    } via ${derivationModel || "OpenAI"}.`,
  });
}

export async function createLinkDerivedDocumentForUser(
  userId,
  {
    title,
    subtitle = "",
    projectKey = DEFAULT_PROJECT_KEY,
    blocks = [],
    wordCount = 0,
    sectionCount = 0,
    intakeKind = "link-source",
    intakeDiagnostics = [],
    derivationKind = "link-document",
    derivationModel = "",
    derivationStatus = "succeeded",
    sourceAsset,
    sourceProvenance = null,
    sourceTrustProfile = null,
  },
) {
  return createAssetDerivedDocumentForUser(userId, {
    title,
    subtitle,
    projectKey,
    mimeType: "text/markdown",
    blocks,
    wordCount,
    sectionCount,
    intakeKind,
    intakeDiagnostics,
    derivationKind,
    derivationModel,
    derivationStatus,
    sourceAsset,
    sourceProvenance,
    sourceTrustProfile,
    assetKind: "LINK",
    defaultOperation: "extracted",
    sourceAction: "LINK_ADDED",
    sourceDetail: sourceAsset?.canonicalUrl
      ? `Added link source ${sourceAsset.canonicalUrl}.`
      : "Added link source.",
    derivedAction: "DERIVED_LINK_SOURCE",
    derivedDetail: `Created source document from ${sourceAsset?.label || "link"}.`,
  });
}

export async function createAudioDerivedDocumentForUser(
  userId,
  {
    title,
    subtitle = "",
    projectKey = DEFAULT_PROJECT_KEY,
    originalFilename = "",
    mimeType = "",
    blocks = [],
    wordCount = 0,
    sectionCount = 0,
    intakeKind = "upload-audio-transcript",
    intakeDiagnostics = [],
    derivationKind = "audio-transcript",
    derivationModel = "",
    derivationStatus = "succeeded",
    sourceAsset,
    sourceProvenance = null,
    sourceTrustProfile = null,
  },
) {
  return createAssetDerivedDocumentForUser(userId, {
    title,
    subtitle,
    projectKey,
    originalFilename,
    mimeType,
    blocks,
    wordCount,
    sectionCount,
    intakeKind,
    intakeDiagnostics,
    derivationKind,
    derivationModel,
    derivationStatus,
    sourceAsset,
    sourceProvenance,
    sourceTrustProfile,
    assetKind: "AUDIO",
    defaultOperation: "extracted",
    sourceAction: "UPLOADED_AUDIO",
    sourceDetail: sourceAsset?.originalFilename
      ? `Added voice memo "${sourceAsset.originalFilename}".`
      : "Added voice memo.",
    derivedAction: "DERIVED_AUDIO_SOURCE",
    derivedDetail: `Created transcript source via ${derivationModel || "OpenAI"}.`,
  });
}

async function createAssetDerivedDocumentForUser(
  userId,
  {
    title,
    subtitle = "",
    projectKey = DEFAULT_PROJECT_KEY,
    originalFilename = "",
    mimeType = "",
    blocks = [],
    wordCount = 0,
    sectionCount = 0,
    intakeKind = "upload",
    intakeDiagnostics = [],
    derivationKind = "",
    derivationModel = "",
    derivationStatus = "succeeded",
    sourceAsset,
    sourceProvenance = null,
    sourceTrustProfile = null,
    assetKind = "IMAGE",
    defaultOperation = "extracted",
    sourceAction = "UPLOADED",
    sourceDetail = "Added source asset.",
    derivedAction = "AI_RESULT",
    derivedDetail = "Created derived source.",
  },
) {
  const assetId = sourceAsset?.id || randomUUID();
  const persistedLogEntries = normalizeWorkspaceLogEntries(
    [
      createWorkspaceLogEntry({
        action: sourceAction,
        detail: sourceDetail,
      }),
      createWorkspaceLogEntry({
        action: derivedAction,
        detail: derivedDetail,
      }),
    ],
    "",
  );
  const sourceFiles = originalFilename ? [originalFilename] : [];

  let summary = null;

  try {
    summary = await createReaderDocumentForUser(userId, {
      title,
      subtitle,
      projectKey,
      format: "markdown",
      originalFilename,
      mimeType: mimeType || "text/markdown",
      contentMarkdown: buildWorkspaceMarkdown({
        title,
        subtitle,
        blocks,
        sectionTitle: "Document",
      }),
      wordCount,
      sectionCount,
      blocks: normalizeWorkspaceBlocks(
        blocks.map((block) => ({
          ...block,
          documentKey: "",
          sourceDocumentKey: "",
        })),
        {
          documentKey: "",
          defaultSourceDocumentKey: "",
          defaultIsEditable: true,
          defaultAuthor: "ai",
          defaultOperation,
        },
      ),
      logEntries: persistedLogEntries,
      sourceFiles,
      sourceAssetIds: [assetId],
      sourceProvenance,
      sourceTrustProfile,
      intakeKind,
      intakeDiagnostics,
      derivationKind,
      derivationModel,
      derivationStatus,
    });

    const assetRecord = await createReaderSourceAssetForUser(userId, {
      id: assetId,
      documentKey: summary.documentKey,
      projectKey,
      kind: assetKind,
      blobUrl: sourceAsset.blobUrl,
      blobPath: sourceAsset.blobPath,
      sourceUrl: sourceAsset.sourceUrl,
      canonicalUrl: sourceAsset.canonicalUrl,
      label: sourceAsset.label,
      mimeType: sourceAsset.mimeType,
      originalFilename: sourceAsset.originalFilename,
      width: sourceAsset.width,
      height: sourceAsset.height,
      durationMs: sourceAsset.durationMs,
      byteSize: sourceAsset.byteSize,
      sha256: sourceAsset.sha256,
      metadataJson: sourceAsset.metadataJson,
    });

    const document = await getReaderDocumentDataForUser(userId, summary.documentKey);

    return {
      summary: serializeDocumentSummary(document, null, 0, [assetRecord]),
      document,
      sourceAsset: assetRecord,
    };
  } catch (error) {
    if (summary?.documentKey) {
      await prisma.readerProjectDocument.deleteMany({
        where: {
          documentKey: summary.documentKey,
        },
      });
      await prisma.readerDocument.deleteMany({
        where: {
          userId,
          documentKey: summary.documentKey,
        },
      });
    }

    throw error;
  }
}

export async function getReaderDocumentDataForUser(userId, documentKey = PRIMARY_DOCUMENT_KEY) {
  return getWorkspaceDocumentForUser(userId, documentKey);
}

export async function getReaderDocumentSummaryForUser(userId, documentKey = PRIMARY_DOCUMENT_KEY) {
  if (!documentKey || documentKey === PRIMARY_DOCUMENT_KEY) {
    return serializeBuiltinDocumentForUser(userId);
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

  const sourceAssetsByDocumentKey = await listReaderSourceAssetsByDocumentKeysForUser(
    userId,
    [documentKey],
  );

  return serializeUploadedDocument(record, 0, sourceAssetsByDocumentKey.get(documentKey) || []);
}
