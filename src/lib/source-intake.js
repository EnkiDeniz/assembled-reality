import "server-only";

import { randomUUID } from "node:crypto";
import {
  buildWorkspaceBlocksFromDocument,
} from "@/lib/document-blocks";
import {
  createImageDerivedDocumentForUser,
  createAudioDerivedDocumentForUser,
  createLinkDerivedDocumentForUser,
  createReaderDocumentForUser,
  getReaderDocumentDataForUser,
} from "@/lib/reader-documents";
import {
  buildAudioAssetDraft,
  deriveTranscriptFromAudio,
  uploadAudioAssetToBlob,
  validateAudioInput,
} from "@/lib/audio-intake";
import {
  buildImageAssetDraft,
  deriveMarkdownFromImage,
  normalizeImageDerivationMode,
  uploadImageAssetToBlob,
  validateImageInput,
} from "@/lib/image-intake";
import {
  getImportedDocumentFormat,
  ingestUploadedDocument,
  MAX_DOCUMENT_UPLOAD_BYTES,
} from "@/lib/document-import";
import { parseDocument } from "@/lib/document";

function buildAiBlocksFromMarkdown(markdown, documentKey, operation = "extracted") {
  const parsed = parseDocument(markdown, { documentKey });
  return buildWorkspaceBlocksFromDocument(
    {
      ...parsed,
      documentKey,
    },
    {
      documentKey,
      defaultSourceDocumentKey: documentKey,
      defaultIsEditable: true,
      defaultAuthor: "ai",
      defaultOperation: operation,
    },
  );
}

export function isImageUpload(fileLike = null) {
  if (!fileLike) return false;

  try {
    validateImageInput({
      buffer: Buffer.from("x"),
      mimeType: fileLike?.type || "",
      filename: fileLike?.name || "",
    });
    return true;
  } catch {
    return String(fileLike?.type || "")
      .trim()
      .toLowerCase()
      .startsWith("image/") || /\.(png|jpe?g|webp|gif|heic|heif|bmp)$/i.test(fileLike?.name || "");
  }
}

export function isAudioUpload(fileLike = null) {
  if (!fileLike) return false;

  try {
    validateAudioInput({
      buffer: Buffer.from("x"),
      mimeType: fileLike?.type || "",
      filename: fileLike?.name || "",
    });
    return true;
  } catch {
    return /\.(m4a|mp3|wav|webm|mp4)$/i.test(String(fileLike?.name || ""));
  }
}

export function supportsSourceUpload(fileLike = null) {
  if (!fileLike) return false;
  if (isImageUpload(fileLike)) return true;
  if (isAudioUpload(fileLike)) return true;

  return Boolean(
    getImportedDocumentFormat(fileLike?.name || "", fileLike?.type || ""),
  );
}

export async function ingestUploadedSourceForUser(
  userId,
  {
    buffer,
    filename = "",
    mimeType = "",
    projectKey = "",
    derivationMode = "",
  },
) {
  const looksLikeImage =
    String(mimeType || "").trim().toLowerCase().startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|heic|heif|bmp|tiff?)$/i.test(filename || "");
  const looksLikeAudio =
    String(mimeType || "").trim().toLowerCase().startsWith("audio/") ||
    /\.(m4a|mp3|wav|webm|mp4)$/i.test(filename || "");

  if (!buffer || buffer.length === 0) {
    throw new Error("The uploaded file was empty.");
  }

  if (buffer.length > MAX_DOCUMENT_UPLOAD_BYTES) {
    throw new Error("This file is too large. Keep uploads under 15 MB for now.");
  }

  let normalizedImageMimeType = "";
  try {
    normalizedImageMimeType = validateImageInput({
      buffer,
      mimeType,
      filename,
    });
  } catch {
    normalizedImageMimeType = "";
  }

  if (looksLikeImage && !normalizedImageMimeType) {
    const error = new Error("Unsupported image type. Use PNG, JPG, WEBP, or GIF.");
    error.code = "image_unsupported_type";
    throw error;
  }

  if (normalizedImageMimeType) {
    const normalizedMode = normalizeImageDerivationMode(derivationMode);
    if (!normalizedMode) {
      const error = new Error(
        "Choose whether to convert this image into a document or source notes.",
      );
      error.code = "image_derivation_required";
      throw error;
    }

    const derived = await deriveMarkdownFromImage({
      buffer,
      mimeType: normalizedImageMimeType,
      filename,
      derivationMode: normalizedMode,
    });
    const assetDraft = buildImageAssetDraft({
      buffer,
      mimeType: normalizedImageMimeType,
      originalFilename: filename,
      projectKey,
      userId,
    });
    const sourceAsset = await uploadImageAssetToBlob(assetDraft, buffer);
    const created = await createImageDerivedDocumentForUser(userId, {
      title: derived.title,
      subtitle: derived.subtitle,
      projectKey,
      originalFilename: filename,
      mimeType: normalizedImageMimeType,
      blocks: derived.blocks,
      wordCount: derived.wordCount,
      sectionCount: derived.sectionCount,
      intakeKind: `upload-image-${normalizedMode}`,
      intakeDiagnostics: derived.diagnostics || [],
      derivationKind: derived.derivationKind,
      derivationModel: derived.derivationModel,
      derivationStatus: derived.derivationStatus,
      sourceAsset,
    });

    return {
      ok: true,
      document: created.document,
      sourceAsset: created.sourceAsset,
      intake: {
        format: "markdown",
        diagnostics: derived.diagnostics || [],
      },
      derivation: {
        kind: derived.derivationKind,
        mode: normalizedMode,
        model: derived.derivationModel,
      },
    };
  }

  let normalizedAudioMimeType = "";
  try {
    normalizedAudioMimeType = validateAudioInput({
      buffer,
      mimeType,
      filename,
    });
  } catch {
    normalizedAudioMimeType = "";
  }

  if (looksLikeAudio && !normalizedAudioMimeType) {
    const error = new Error("Unsupported audio type. Use M4A, MP3, WAV, WEBM, or MP4 audio.");
    error.code = "audio_unsupported_type";
    throw error;
  }

  if (normalizedAudioMimeType) {
    const derived = await deriveTranscriptFromAudio({
      buffer,
      mimeType: normalizedAudioMimeType,
      filename,
    });
    const assetDraft = await buildAudioAssetDraft({
      buffer,
      mimeType: normalizedAudioMimeType,
      originalFilename: filename,
      projectKey,
      userId,
    });
    const sourceAsset = await uploadAudioAssetToBlob(assetDraft, buffer);
    const blocks = buildAiBlocksFromMarkdown(
      derived.contentMarkdown,
      "audio-derived-source",
      "extracted",
    );
    const created = await createAudioDerivedDocumentForUser(userId, {
      title: derived.title,
      subtitle: derived.subtitle,
      projectKey,
      originalFilename: filename,
      mimeType: normalizedAudioMimeType,
      blocks,
      wordCount: derived.wordCount,
      sectionCount: derived.sectionCount,
      intakeKind: "upload-audio-transcript",
      intakeDiagnostics: derived.diagnostics || [],
      derivationKind: derived.derivationKind,
      derivationModel: derived.derivationModel,
      derivationStatus: derived.derivationStatus,
      sourceAsset,
    });

    return {
      ok: true,
      document: created.document,
      sourceAsset: created.sourceAsset,
      intake: {
        format: "markdown",
        diagnostics: derived.diagnostics || [],
      },
      derivation: {
        kind: derived.derivationKind,
        mode: "transcript",
        model: derived.derivationModel,
      },
    };
  }

  const imported = await ingestUploadedDocument({
    filename,
    mimeType,
    buffer,
  });

  const documentSummary = await createReaderDocumentForUser(userId, {
    title: imported.title,
    subtitle: imported.subtitle,
    projectKey,
    format: imported.format,
    originalFilename: filename,
    mimeType,
    contentMarkdown: imported.contentMarkdown,
    wordCount: imported.wordCount,
    sectionCount: imported.sectionCount,
    intakeKind: "upload",
    intakeDiagnostics: imported.diagnostics || [],
  });
  const document = await getReaderDocumentDataForUser(userId, documentSummary.documentKey);

  return {
    ok: true,
    document,
    intake: {
      format: imported.format,
      diagnostics: imported.diagnostics || [],
    },
  };
}

export async function ingestLinkSourceForUser(
  userId,
  {
    projectKey = "",
    url,
  },
) {
  const { deriveSourceFromLink } = await import("@/lib/link-intake");
  const derived = await deriveSourceFromLink(url);
  const blocks = buildAiBlocksFromMarkdown(
    derived.contentMarkdown,
    "link-derived-source",
    "extracted",
  );
  const sourceAsset = {
    id: randomUUID(),
    projectKey,
    kind: "LINK",
    sourceUrl: derived.sourceUrl,
    canonicalUrl: derived.canonicalUrl,
    label: derived.title,
    metadataJson: {
      ...(derived.sourceAsset?.metadataJson || {}),
      displayDomain: derived.displayDomain,
    },
  };
  const created = await createLinkDerivedDocumentForUser(userId, {
    title: derived.title,
    subtitle: derived.subtitle,
    projectKey,
    blocks,
    wordCount: derived.wordCount,
    sectionCount: derived.sectionCount,
    intakeKind: "link-source",
    intakeDiagnostics: derived.diagnostics || [],
    derivationKind: derived.derivationKind,
    derivationModel: derived.derivationModel,
    derivationStatus: derived.derivationStatus,
    sourceAsset,
  });

  return {
    ok: true,
    document: created.document,
    sourceAsset: created.sourceAsset,
    intake: {
      format: derived.format || "markdown",
      diagnostics: derived.diagnostics || [],
    },
    derivation: {
      kind: derived.derivationKind,
      model: derived.derivationModel,
    },
  };
}
