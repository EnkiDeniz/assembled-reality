import "server-only";

import { createHash } from "node:crypto";
import { put } from "@vercel/blob";
import imageSize from "image-size";
import { buildWorkspaceBlocksFromDocument, buildWorkspaceExcerptFromBlocks } from "@/lib/document-blocks";
import { appEnv } from "@/lib/env";
import { parseDocument } from "@/lib/document";
import { PRODUCT_NAME } from "@/lib/product-language";
import { slugify } from "@/lib/text";

export const IMAGE_DERIVATION_MODES = Object.freeze({
  document: "document",
  notes: "notes",
});

export const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

const IMAGE_EXTENSIONS = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

const IMAGE_LOW_TEXT_WORD_THRESHOLD = 25;

function createImageIntakeError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function createIntakeDiagnostic(code, severity, message) {
  return {
    code: String(code || "info").trim() || "info",
    severity:
      severity === "warning" || severity === "error" ? severity : "info",
    message: String(message || "").trim(),
  };
}

function countWords(text) {
  return String(text || "")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean).length;
}

function extractOutputText(payload) {
  const output = Array.isArray(payload?.output) ? payload.output : [];
  const parts = [];

  output.forEach((item) => {
    const content = Array.isArray(item?.content) ? item.content : [];
    content.forEach((entry) => {
      if (
        (entry?.type === "output_text" || entry?.type === "text") &&
        typeof entry?.text === "string"
      ) {
        parts.push(entry.text);
      }
    });
  });

  return parts.join("\n\n").trim();
}

function stripMarkdownFences(text) {
  const normalized = String(text || "").trim();
  if (!normalized) return "";

  const fenced =
    normalized.match(/^```markdown\s*([\s\S]+?)```$/i) ||
    normalized.match(/^```md\s*([\s\S]+?)```$/i) ||
    normalized.match(/^```\s*([\s\S]+?)```$/i);

  return fenced?.[1]?.trim() || normalized;
}

function normalizeImageMimeType(mimeType = "", filename = "") {
  const normalizedMime = String(mimeType || "").trim().toLowerCase();
  if (SUPPORTED_IMAGE_MIME_TYPES.has(normalizedMime)) {
    return normalizedMime === "image/jpg" ? "image/jpeg" : normalizedMime;
  }

  const lowerFilename = String(filename || "").trim().toLowerCase();
  if (lowerFilename.endsWith(".png")) return "image/png";
  if (lowerFilename.endsWith(".jpg") || lowerFilename.endsWith(".jpeg")) return "image/jpeg";
  if (lowerFilename.endsWith(".webp")) return "image/webp";
  if (lowerFilename.endsWith(".gif")) return "image/gif";
  return "";
}

function buildFilenameStem(filename = "", fallback = "image-source") {
  const withoutExtension = String(filename || "").replace(/\.[^.]+$/, "");
  return slugify(withoutExtension) || slugify(fallback) || "image-source";
}

function buildTitleHint(filename = "", derivationMode = IMAGE_DERIVATION_MODES.document) {
  const cleaned = String(filename || "")
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned) return cleaned;
  return derivationMode === IMAGE_DERIVATION_MODES.notes ? "Image Notes" : "Image Document";
}

function getBlobExtension(mimeType, filename = "") {
  return (
    IMAGE_EXTENSIONS.get(mimeType) ||
    String(filename || "").trim().split(".").pop()?.toLowerCase() ||
    "bin"
  );
}

function buildOpenAiPrompt(derivationMode, titleHint) {
  if (derivationMode === IMAGE_DERIVATION_MODES.notes) {
    return [
      `You are turning an image into a source document for ${PRODUCT_NAME}.`,
      "Return markdown only.",
      `Use this fallback title if the image has no obvious title: ${titleHint}.`,
      "This is image-to-source-notes mode.",
      "Do not fake OCR. If text is visible, include it under a 'Text in image' section.",
      "Prefer grounded observation over speculation.",
      "Separate what is visibly present from what is inferred.",
      "Use this structure unless the image strongly suggests a better structure:",
      "# Title",
      "## Visible",
      "## Text in image",
      "## Observations",
      "## Questions / risks",
      "## Actionable details",
      "Do not include commentary outside the markdown document.",
    ].join(" ");
  }

  return [
    `You are turning an image into a markdown source document for ${PRODUCT_NAME}.`,
    "Return markdown only.",
    `Use this fallback title if the image has no obvious title: ${titleHint}.`,
    "This is image-to-document mode.",
    "Preserve visible structure where possible: headings, paragraphs, lists, quotes, labels, and captions.",
    "Do not invent text that is not visible.",
    "If some text is uncertain, keep it minimal and mark uncertainty inline with [unclear].",
    "Prefer a clean readable markdown document, beginning with a title heading.",
    "Do not include commentary outside the markdown document.",
  ].join(" ");
}

function buildDataUrl(buffer, mimeType) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

export function normalizeImageDerivationMode(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === IMAGE_DERIVATION_MODES.notes
    ? IMAGE_DERIVATION_MODES.notes
    : normalized === IMAGE_DERIVATION_MODES.document
      ? IMAGE_DERIVATION_MODES.document
      : "";
}

export function parseImageDataUrl(dataUrl, filename = "") {
  const match = String(dataUrl || "")
    .trim()
    .match(/^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/);

  if (!match) {
    throw createImageIntakeError("image_invalid_payload", "Clipboard image data was invalid.");
  }

  const mimeType = normalizeImageMimeType(match[1], filename);
  if (!mimeType) {
    throw createImageIntakeError(
      "image_unsupported_type",
      "Unsupported image type. Use PNG, JPG, WEBP, or GIF.",
    );
  }

  return {
    mimeType,
    buffer: Buffer.from(match[2], "base64"),
  };
}

export function validateImageInput({ buffer, mimeType = "", filename = "" }) {
  const normalizedMimeType = normalizeImageMimeType(mimeType, filename);
  if (!normalizedMimeType) {
    throw createImageIntakeError(
      "image_unsupported_type",
      "Unsupported image type. Use PNG, JPG, WEBP, or GIF.",
    );
  }

  if (!buffer || buffer.length === 0) {
    throw createImageIntakeError("image_empty", "The uploaded image was empty.");
  }

  return normalizedMimeType;
}

export function buildImageAssetDraft({
  buffer,
  mimeType,
  originalFilename = "",
  projectKey = "",
  userId = "",
  documentKey = "",
}) {
  const normalizedMimeType = validateImageInput({ buffer, mimeType, filename: originalFilename });
  const dimensions = imageSize(buffer);
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const extension = getBlobExtension(normalizedMimeType, originalFilename);
  const filenameStem = buildFilenameStem(originalFilename, "image-source");
  const pathname = [
    "sources",
    slugify(userId) || "user",
    slugify(projectKey) || "project",
    `${Date.now()}-${filenameStem}.${extension}`,
  ].join("/");

  return {
    mimeType: normalizedMimeType,
    originalFilename: originalFilename || null,
    width: Number.isFinite(dimensions?.width) ? dimensions.width : null,
    height: Number.isFinite(dimensions?.height) ? dimensions.height : null,
    byteSize: buffer.length,
    sha256,
    blobPath: pathname,
    documentKey,
    metadataJson: {
      modality: "image",
      origin: originalFilename ? "uploaded" : "pasted",
      capturedAt: new Date().toISOString(),
      width: Number.isFinite(dimensions?.width) ? dimensions.width : null,
      height: Number.isFinite(dimensions?.height) ? dimensions.height : null,
    },
  };
}

export async function uploadImageAssetToBlob(assetDraft, buffer) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw createImageIntakeError(
      "image_storage_unavailable",
      "Image storage is unavailable right now.",
    );
  }

  const uploaded = await put(assetDraft.blobPath, buffer, {
    access: "public",
    contentType: assetDraft.mimeType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return {
    ...assetDraft,
    blobUrl: uploaded.url,
    blobPath: uploaded.pathname || assetDraft.blobPath,
  };
}

export async function deriveMarkdownFromImage({
  buffer,
  mimeType,
  filename = "",
  derivationMode = IMAGE_DERIVATION_MODES.document,
}) {
  if (!appEnv.openai.enabled) {
    throw createImageIntakeError(
      "image_ai_unavailable",
      "Image understanding is unavailable right now.",
    );
  }

  const titleHint = buildTitleHint(filename, derivationMode);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${appEnv.openai.apiKey}`,
    },
    body: JSON.stringify({
      model: appEnv.openai.imageSourceModel,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildOpenAiPrompt(derivationMode, titleHint),
            },
            {
              type: "input_image",
              image_url: buildDataUrl(buffer, mimeType),
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw createImageIntakeError(
      "image_derivation_failed",
      `Could not interpret this image right now (${response.status}).`,
    );
  }

  const payload = await response.json().catch(() => null);
  const markdown = stripMarkdownFences(extractOutputText(payload));

  if (!markdown) {
    throw createImageIntakeError(
      "image_no_content",
      "The image did not produce a readable source document.",
    );
  }

  const parsed = parseDocument(markdown, { documentKey: "image-derived-source" });
  const title = String(parsed?.title || titleHint).trim() || titleHint;
  const subtitle = String(parsed?.subtitle || "").trim();
  const operation =
    derivationMode === IMAGE_DERIVATION_MODES.notes ? "summarized" : "extracted";
  const blocks = buildWorkspaceBlocksFromDocument(
    {
      ...parsed,
      title,
      subtitle,
    },
    {
      documentKey: "image-derived-source",
      defaultSourceDocumentKey: "image-derived-source",
      defaultIsEditable: true,
      defaultAuthor: "ai",
      defaultOperation: operation,
    },
  );
  const plainText = blocks.map((block) => block.plainText || block.text).join(" ");
  const diagnostics = [
    createIntakeDiagnostic(
      "image_source",
      "info",
      `Created from image in ${derivationMode === IMAGE_DERIVATION_MODES.notes ? "notes" : "document"} mode.`,
    ),
  ];

  if (countWords(plainText) < IMAGE_LOW_TEXT_WORD_THRESHOLD) {
    diagnostics.push(
      createIntakeDiagnostic(
        "image_low_text",
        "warning",
        "Image extraction was sparse. Review the generated source before using it.",
      ),
    );
  }

  return {
    title,
    subtitle,
    contentMarkdown: markdown,
    blocks,
    wordCount: countWords(plainText),
    sectionCount: blocks.length,
    preview: buildWorkspaceExcerptFromBlocks(blocks),
    diagnostics,
    derivationKind:
      derivationMode === IMAGE_DERIVATION_MODES.notes ? "image-notes" : "ocr-document",
    derivationModel: appEnv.openai.imageSourceModel,
    derivationStatus: "succeeded",
  };
}
