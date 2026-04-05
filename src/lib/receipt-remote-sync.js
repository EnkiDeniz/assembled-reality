import "server-only";

import {
  buildGetReceiptsVerifyUrl,
  createRemoteReadingReceiptDraft,
  sealRemoteReceipt,
  uploadRemoteReceiptEvidence,
} from "@/lib/getreceipts";
import { listReaderSourceAssetsByDocumentKeysForUser } from "@/lib/source-assets";

const SUPPORTED_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
]);
const SUPPORTED_DOCUMENT_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".md",
  ".markdown",
]);

function normalizeRemoteSealStatus(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (
    normalized === "pending_create" ||
    normalized === "pending_seal" ||
    normalized === "sealed" ||
    normalized === "failed"
  ) {
    return normalized;
  }
  return "";
}

function normalizeLevel(value = "") {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return normalized.toLowerCase().startsWith("l") ? normalized.toUpperCase() : `L${normalized}`;
}

function getAssetExtension(asset = null) {
  const filename = String(asset?.originalFilename || "").trim().toLowerCase();
  const match = filename.match(/\.[a-z0-9]+$/);
  return match ? match[0] : "";
}

function isSupportedRemoteEvidenceAsset(asset = null) {
  const kind = String(asset?.kind || "").trim().toLowerCase();
  const mimeType = String(asset?.mimeType || "").trim().toLowerCase();
  if (kind === "image") return true;
  if (SUPPORTED_DOCUMENT_MIME_TYPES.has(mimeType)) return true;
  return SUPPORTED_DOCUMENT_EXTENSIONS.has(getAssetExtension(asset));
}

function buildRemoteSealErrorMessage(error) {
  return error instanceof Error ? error.message : "Courthouse sync failed.";
}

function getFailureStatus(error, missingRemoteReceipt = false) {
  const retryable = Boolean(error?.retryable);
  if (retryable) {
    return missingRemoteReceipt ? "pending_create" : "pending_seal";
  }
  return "failed";
}

function normalizeSealTimestamp(value = "") {
  const normalized = String(value || "").trim();
  return normalized || new Date().toISOString();
}

export function buildRemoteSealState({
  previous = null,
  status = "",
  receiptId = "",
  sealResult = null,
  error = null,
  uploadedEvidence = [],
} = {}) {
  const normalizedStatus = normalizeRemoteSealStatus(status);
  const verifiedStatus = normalizedStatus || normalizeRemoteSealStatus(previous?.status) || "pending_create";
  const sealHash = String(sealResult?.seal_hash || sealResult?.sealHash || previous?.sealHash || "").trim();
  const verifyUrl =
    String(sealResult?.verify_url || sealResult?.verifyUrl || "").trim() ||
    buildGetReceiptsVerifyUrl(sealHash) ||
    String(previous?.verifyUrl || "").trim();
  const level = normalizeLevel(sealResult?.level || previous?.level || "");
  const previousEvidence = Array.isArray(previous?.uploadedEvidence) ? previous.uploadedEvidence : [];

  return {
    status: verifiedStatus,
    receiptId:
      String(receiptId || sealResult?.receipt_id || sealResult?.receiptId || previous?.receiptId || "").trim() ||
      null,
    sealHash: sealHash || null,
    verifyUrl: verifyUrl || null,
    level: level || null,
    sealedAt:
      verifiedStatus === "sealed"
        ? normalizeSealTimestamp(sealResult?.sealed_at || sealResult?.sealedAt || previous?.sealedAt)
        : previous?.sealedAt || null,
    lastError: error ? buildRemoteSealErrorMessage(error) : null,
    lastAttemptAt: new Date().toISOString(),
    uploadedEvidence:
      Array.isArray(uploadedEvidence) && uploadedEvidence.length
        ? uploadedEvidence
        : previousEvidence,
  };
}

export async function listRemoteEvidenceAssetsForReceipt(userId, evidenceSnapshot = null) {
  const sourceDocumentKeys = Array.isArray(evidenceSnapshot?.sourceDocumentKeys)
    ? evidenceSnapshot.sourceDocumentKeys.filter(Boolean)
    : [];

  if (!userId || !sourceDocumentKeys.length) {
    return [];
  }

  const assetsByDocumentKey = await listReaderSourceAssetsByDocumentKeysForUser(
    userId,
    sourceDocumentKeys,
  );

  return sourceDocumentKeys.flatMap((documentKey) =>
    (assetsByDocumentKey.get(documentKey) || [])
      .filter((asset) => isSupportedRemoteEvidenceAsset(asset))
      .map((asset) => ({
        ...asset,
        documentKey,
      })),
  );
}

function buildRemoteSealRequestPayload(remotePayload = {}, uploadedEvidence = []) {
  const sanitizedPayload = sanitizeRemoteReceiptPayload(remotePayload);
  if (!uploadedEvidence.length) return undefined;

  const metadata = sanitizedPayload?.metadata && typeof sanitizedPayload.metadata === "object"
    ? sanitizedPayload.metadata
    : {};

  return {
    evidence: uploadedEvidence,
    metadata: {
      ...metadata,
      loegos_courthouse: {
        uploaded_evidence: uploadedEvidence,
      },
    },
  };
}

export function sanitizeRemoteReceiptPayload(remotePayload = {}) {
  return {
    aim: remotePayload?.aim || "",
    tried: remotePayload?.tried || "",
    outcome: remotePayload?.outcome || "",
    learned: remotePayload?.learned || "",
    decision: remotePayload?.decision || "",
    owner: remotePayload?.owner || "",
    temporal: remotePayload?.temporal || "retrospective",
    visibility: remotePayload?.visibility || "private",
    tags: Array.isArray(remotePayload?.tags) ? remotePayload.tags : [],
    metadata:
      remotePayload?.metadata && typeof remotePayload.metadata === "object"
        ? remotePayload.metadata
        : {},
  };
}

export async function syncReceiptDraftToCourthouse({
  userId,
  connection,
  draft,
  remotePayload,
  evidenceSnapshot,
} = {}) {
  const previousRemoteSeal =
    draft?.payload?.remoteSeal && typeof draft.payload.remoteSeal === "object"
      ? draft.payload.remoteSeal
      : null;
  const existingRemoteReceiptId =
    draft?.getReceiptsReceiptId ||
    draft?.payload?.remoteReceipt?.id ||
    previousRemoteSeal?.receiptId ||
    "";
  const uploadedEvidenceAssets = await listRemoteEvidenceAssetsForReceipt(userId, evidenceSnapshot);

  let uploadedEvidence = [];
  try {
    uploadedEvidence = await uploadRemoteReceiptEvidence(connection, uploadedEvidenceAssets);
  } catch (error) {
    return {
      ok: false,
      remoteReceiptId: existingRemoteReceiptId || null,
      remoteReceipt: draft?.payload?.remoteReceipt || null,
      remoteSeal: buildRemoteSealState({
        previous: previousRemoteSeal,
        status: getFailureStatus(error, !existingRemoteReceiptId),
        receiptId: existingRemoteReceiptId,
        error,
      }),
      error,
      uploadedEvidence,
    };
  }

  let remoteReceipt = draft?.payload?.remoteReceipt || null;
  let remoteReceiptId = String(existingRemoteReceiptId || "").trim();

  if (!remoteReceiptId) {
    try {
      remoteReceipt = await createRemoteReadingReceiptDraft(connection, {
        ...sanitizeRemoteReceiptPayload(remotePayload),
        ...(uploadedEvidence.length ? { evidence: uploadedEvidence } : {}),
      });
      remoteReceiptId = String(remoteReceipt?.id || "").trim();
      if (!remoteReceiptId) {
        throw new Error("GetReceipts did not return a remote receipt id.");
      }
    } catch (error) {
      return {
        ok: false,
        remoteReceiptId: null,
        remoteReceipt: null,
        remoteSeal: buildRemoteSealState({
          previous: previousRemoteSeal,
          status: getFailureStatus(error, true),
          error,
          uploadedEvidence,
        }),
        error,
        uploadedEvidence,
      };
    }
  }

  try {
    const sealResult = await sealRemoteReceipt(
      connection,
      remoteReceiptId,
      buildRemoteSealRequestPayload(remotePayload, uploadedEvidence),
    );

    return {
      ok: true,
      remoteReceiptId,
      remoteReceipt,
      sealResult,
      uploadedEvidence,
      remoteSeal: buildRemoteSealState({
        previous: previousRemoteSeal,
        status: "sealed",
        receiptId: remoteReceiptId,
        sealResult,
        uploadedEvidence,
      }),
    };
  } catch (error) {
    return {
      ok: false,
      remoteReceiptId,
      remoteReceipt,
      uploadedEvidence,
      remoteSeal: buildRemoteSealState({
        previous: previousRemoteSeal,
        status: getFailureStatus(error, false),
        receiptId: remoteReceiptId,
        error,
        uploadedEvidence,
      }),
      error,
    };
  }
}
