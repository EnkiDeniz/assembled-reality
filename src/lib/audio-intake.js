import "server-only";

import { createHash } from "node:crypto";
import { put } from "@vercel/blob";
import { parseBuffer } from "music-metadata";
import { appEnv } from "@/lib/env";
import { ingestPlainTextSource } from "@/lib/document-import";
import { slugify } from "@/lib/text";

export const SUPPORTED_AUDIO_MIME_TYPES = new Set([
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/mp4a-latm",
  "video/mp4",
]);

const AUDIO_EXTENSION_BY_MIME = new Map([
  ["audio/mp4", "m4a"],
  ["audio/x-m4a", "m4a"],
  ["audio/m4a", "m4a"],
  ["audio/mpeg", "mp3"],
  ["audio/mp3", "mp3"],
  ["audio/wav", "wav"],
  ["audio/x-wav", "wav"],
  ["audio/webm", "webm"],
  ["audio/mp4a-latm", "m4a"],
  ["video/mp4", "mp4"],
]);

const AUDIO_TRANSCRIPTION_FALLBACK_MODELS = [
  "gpt-4o-transcribe",
  "gpt-4o-mini-transcribe",
  "whisper-1",
];

function createAudioIntakeError(code, message) {
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

function normalizeAudioMimeType(mimeType = "", filename = "") {
  const normalizedMime = String(mimeType || "").trim().toLowerCase();
  if (SUPPORTED_AUDIO_MIME_TYPES.has(normalizedMime)) {
    return normalizedMime;
  }

  const lowerFilename = String(filename || "").trim().toLowerCase();
  if (lowerFilename.endsWith(".m4a")) return "audio/mp4";
  if (lowerFilename.endsWith(".mp3")) return "audio/mpeg";
  if (lowerFilename.endsWith(".wav")) return "audio/wav";
  if (lowerFilename.endsWith(".webm")) return "audio/webm";
  if (lowerFilename.endsWith(".mp4")) return "video/mp4";
  return "";
}

function buildFilenameStem(filename = "", fallback = "voice-memo") {
  const withoutExtension = String(filename || "").replace(/\.[^.]+$/, "");
  return slugify(withoutExtension) || slugify(fallback) || "voice-memo";
}

function buildTitleHint(filename = "") {
  const cleaned = String(filename || "")
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "Voice Memo";
}

function getBlobExtension(mimeType, filename = "") {
  return (
    AUDIO_EXTENSION_BY_MIME.get(mimeType) ||
    String(filename || "").trim().split(".").pop()?.toLowerCase() ||
    "bin"
  );
}

function getTranscriptionModelCandidates(preferredModel = "") {
  const candidates = [
    String(preferredModel || "").trim(),
    ...AUDIO_TRANSCRIPTION_FALLBACK_MODELS,
  ].filter(Boolean);

  return [...new Set(candidates)];
}

function shouldRetryTranscriptionWithFallback(response, payload) {
  if (!response || response.ok) return false;

  const status = Number(response.status || 0);
  const param = String(payload?.error?.param || "").trim().toLowerCase();
  const code = String(payload?.error?.code || "").trim().toLowerCase();
  const message = String(payload?.error?.message || "").trim().toLowerCase();

  if (status === 404) return true;
  if (param === "model") return true;
  if (code === "model_not_found") return true;

  return (
    /model/.test(message) &&
    /(not found|does not exist|unsupported|unavailable|permission)/.test(message)
  );
}

async function requestTranscription({ buffer, mimeType, filename, model }) {
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([buffer], { type: mimeType }),
    filename || `voice-memo.${getBlobExtension(mimeType, filename)}`,
  );
  formData.append("model", model);

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${appEnv.openai.apiKey}`,
    },
    body: formData,
  });

  const payload = await response.json().catch(() => null);

  return {
    model,
    response,
    payload,
  };
}

export function validateAudioInput({ buffer, mimeType = "", filename = "" }) {
  const normalizedMimeType = normalizeAudioMimeType(mimeType, filename);
  if (!normalizedMimeType) {
    throw createAudioIntakeError(
      "audio_unsupported_type",
      "Unsupported audio type. Use M4A, MP3, WAV, WEBM, or MP4 audio.",
    );
  }

  if (!buffer || buffer.length === 0) {
    throw createAudioIntakeError("audio_empty", "The uploaded audio file was empty.");
  }

  return normalizedMimeType;
}

export async function buildAudioAssetDraft({
  buffer,
  mimeType,
  originalFilename = "",
  projectKey = "",
  userId = "",
  documentKey = "",
}) {
  const normalizedMimeType = validateAudioInput({ buffer, mimeType, filename: originalFilename });
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const extension = getBlobExtension(normalizedMimeType, originalFilename);
  const filenameStem = buildFilenameStem(originalFilename, "voice-memo");
  const pathname = [
    "sources",
    slugify(userId) || "user",
    slugify(projectKey) || "project",
    `${Date.now()}-${filenameStem}.${extension}`,
  ].join("/");

  let durationMs = null;
  try {
    const metadata = await parseBuffer(buffer, { mimeType: normalizedMimeType });
    const durationSeconds = Number(metadata?.format?.duration);
    if (Number.isFinite(durationSeconds) && durationSeconds > 0) {
      durationMs = Math.round(durationSeconds * 1000);
    }
  } catch {
    durationMs = null;
  }

  return {
    mimeType: normalizedMimeType,
    originalFilename: originalFilename || null,
    durationMs,
    byteSize: buffer.length,
    sha256,
    blobPath: pathname,
    documentKey,
    label: buildTitleHint(originalFilename),
  };
}

export async function uploadAudioAssetToBlob(assetDraft, buffer) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw createAudioIntakeError(
      "audio_storage_unavailable",
      "Audio storage is unavailable right now.",
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

export async function deriveTranscriptFromAudio({
  buffer,
  mimeType,
  filename = "",
}) {
  const normalizedMimeType = validateAudioInput({ buffer, mimeType, filename });
  const preferredModel = appEnv.openai.audioSourceModel;

  if (!appEnv.openai.enabled || !preferredModel) {
    throw createAudioIntakeError(
      "audio_ai_unavailable",
      "Voice memo transcription is unavailable right now.",
    );
  }

  const modelCandidates = getTranscriptionModelCandidates(preferredModel);
  let transcriptionResult = null;

  for (let index = 0; index < modelCandidates.length; index += 1) {
    const model = modelCandidates[index];
    const result = await requestTranscription({
      buffer,
      mimeType: normalizedMimeType,
      filename,
      model,
    });

    if (result.response.ok) {
      transcriptionResult = result;
      break;
    }

    const hasFallback = index < modelCandidates.length - 1;
    if (hasFallback && shouldRetryTranscriptionWithFallback(result.response, result.payload)) {
      continue;
    }

    transcriptionResult = result;
    break;
  }

  if (!transcriptionResult?.response?.ok) {
    throw createAudioIntakeError(
      "audio_transcription_failed",
      `Could not transcribe this voice memo right now (${transcriptionResult?.response?.status || 500}).`,
    );
  }

  const payload = transcriptionResult.payload;
  const transcriptText = String(payload?.text || "").trim();

  if (!transcriptText) {
    throw createAudioIntakeError(
      "audio_no_transcript",
      "This voice memo did not produce a readable transcript.",
    );
  }

  const imported = ingestPlainTextSource({
    text: transcriptText,
    titleHint: buildTitleHint(filename),
    fallbackTitle: "Voice Memo",
  });

  return {
    ...imported,
    diagnostics: [
      createIntakeDiagnostic(
        "audio_source",
        "info",
        "Created transcript source from voice memo.",
      ),
      ...(transcriptionResult.model !== preferredModel
        ? [
            createIntakeDiagnostic(
              "audio_model_fallback",
              "warning",
              `Voice memo transcription used ${transcriptionResult.model} after ${preferredModel} was unavailable.`,
            ),
          ]
        : []),
      ...(imported.diagnostics || []),
    ],
    derivationKind: "audio-transcript",
    derivationModel: transcriptionResult.model,
    derivationStatus: "succeeded",
  };
}
