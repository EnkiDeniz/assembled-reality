import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { appEnv } from "@/lib/env";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { PRODUCT_NAME } from "@/lib/product-language";

const DEFAULT_SCOPES = [
  "receipts:read",
  "receipts:create",
  "receipts:update",
  "evidence:upload",
];
const RETRYABLE_STATUS_CODES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

function normalizeReturnTo(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "workspace-receipts") return "workspace-receipts";
  if (normalized === "workspace") return "workspace";
  return "";
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function signValue(value) {
  return crypto
    .createHmac("sha256", appEnv.integrationsStateSecret)
    .update(value)
    .digest("base64url");
}

function buildGetReceiptsError(message, status = 0, retryable = false, payload = null) {
  const error = new Error(message);
  error.name = "GetReceiptsApiError";
  error.status = Number(status) || 0;
  error.retryable = Boolean(retryable);
  error.payload = payload;
  return error;
}

function isRetryableStatus(status) {
  return RETRYABLE_STATUS_CODES.has(Number(status) || 0);
}

function getConnectionAccessToken(connection) {
  const accessToken = decryptSecret(connection?.accessTokenEncrypted || "");
  if (!accessToken) {
    throw buildGetReceiptsError(
      "Connected GetReceipts access token is unavailable.",
      401,
      false,
    );
  }
  return accessToken;
}

async function parseGetReceiptsResponse(response) {
  const text = await response.text().catch(() => "");
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function requestGetReceipts(
  connection,
  path,
  {
    method = "GET",
    body,
    headers = {},
    rawBody = false,
  } = {},
) {
  const accessToken = getConnectionAccessToken(connection);
  const requestHeaders = {
    Authorization: `Bearer ${accessToken}`,
    ...headers,
  };

  let requestBody = body;
  const isFormData =
    typeof FormData !== "undefined" && requestBody instanceof FormData;

  if (!rawBody && requestBody !== undefined && requestBody !== null && !isFormData) {
    requestHeaders["Content-Type"] = "application/json";
    requestBody = JSON.stringify(requestBody);
  }

  let response;
  try {
    response = await fetch(`${appEnv.getReceipts.baseUrl}${path}`, {
      method,
      headers: requestHeaders,
      body: requestBody,
      cache: "no-store",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : `GetReceipts request failed for ${path}.`;
    throw buildGetReceiptsError(message, 0, true);
  }

  const payload = await parseGetReceiptsResponse(response);
  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      (typeof payload === "string" && payload) ||
      `GetReceipts request failed (${response.status})`;
    throw buildGetReceiptsError(
      message,
      response.status,
      isRetryableStatus(response.status),
      payload,
    );
  }

  return payload;
}

export function createSignedIntegrationState(userId, context = {}) {
  if (!appEnv.integrationsStateSecret) {
    throw new Error("INTEGRATIONS_STATE_SECRET or NEXTAUTH_SECRET is required.");
  }

  const payload = JSON.stringify({
    userId,
    returnTo: normalizeReturnTo(context?.returnTo) || null,
    projectKey: String(context?.projectKey || "").trim() || null,
    issuedAt: Date.now(),
  });
  const encoded = base64url(payload);
  return `${encoded}.${signValue(encoded)}`;
}

export function readSignedIntegrationState(state) {
  if (!state || !appEnv.integrationsStateSecret) return null;
  const [encoded, signature] = state.split(".");
  if (!encoded || !signature) return null;
  if (signValue(encoded) !== signature) return null;

  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  if (!payload?.userId) return null;
  return payload;
}

export function buildGetReceiptsConnectUrl(userId, context = {}) {
  const state = createSignedIntegrationState(userId, context);
  const url = new URL(`/connect/${appEnv.getReceipts.appSlug}`, appEnv.getReceipts.baseUrl);
  url.searchParams.set("redirect_uri", appEnv.getReceipts.redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", DEFAULT_SCOPES.join(" "));
  return url.toString();
}

export async function exchangeGetReceiptsCode(code) {
  if (!appEnv.getReceipts.clientSecret) {
    throw new Error("GETRECEIPTS_CLIENT_SECRET is not configured.");
  }

  const response = await fetch(
    `${appEnv.getReceipts.baseUrl}/api/integrations/apps/${appEnv.getReceipts.appSlug}/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: appEnv.getReceipts.appSlug,
        client_secret: appEnv.getReceipts.clientSecret,
        code,
        redirect_uri: appEnv.getReceipts.redirectUri,
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GetReceipts token exchange failed (${response.status}): ${body}`);
  }

  return response.json();
}

export async function storeGetReceiptsConnection(userId, payload) {
  return prisma.getReceiptsConnection.upsert({
    where: { userId },
    update: {
      getReceiptsUserId: payload.user?.id || null,
      accessTokenEncrypted: encryptSecret(payload.access_token),
      tokenType: payload.token_type || "Bearer",
      scopes: payload.scope ? payload.scope.split(" ") : [],
      expiresAt: payload.expires_in
        ? new Date(Date.now() + Number(payload.expires_in) * 1000)
        : null,
      status: "CONNECTED",
      lastError: null,
    },
    create: {
      userId,
      getReceiptsUserId: payload.user?.id || null,
      accessTokenEncrypted: encryptSecret(payload.access_token),
      tokenType: payload.token_type || "Bearer",
      scopes: payload.scope ? payload.scope.split(" ") : [],
      expiresAt: payload.expires_in
        ? new Date(Date.now() + Number(payload.expires_in) * 1000)
        : null,
      status: "CONNECTED",
    },
  });
}

export async function getGetReceiptsConnectionForUser(userId) {
  return prisma.getReceiptsConnection.findUnique({
    where: { userId },
  });
}

export async function createRemoteReadingReceiptDraft(connection, payload) {
  return requestGetReceipts(connection, "/api/v1/receipts", {
    method: "POST",
    body: {
      ...payload,
      status: "draft",
    },
  });
}

export async function sealRemoteReceipt(connection, receiptId, payload = undefined) {
  const normalizedReceiptId = String(receiptId || "").trim();
  if (!normalizedReceiptId) {
    throw buildGetReceiptsError("Remote receipt id is required before sealing.", 400, false);
  }

  return requestGetReceipts(connection, `/api/v1/receipts/${normalizedReceiptId}/seal`, {
    method: "POST",
    body: payload,
  });
}

export function buildGetReceiptsVerifyUrl(sealHash = "") {
  const normalized = String(sealHash || "").trim();
  if (!normalized) return "";
  return `${appEnv.getReceipts.baseUrl}/api/v1/verify/${normalized}`;
}

export async function uploadRemoteReceiptEvidence(connection, assets = []) {
  const uploads = [];

  for (const [index, asset] of (Array.isArray(assets) ? assets : []).entries()) {
    const assetUrl = asset?.url || asset?.blobUrl || asset?.sourceUrl || asset?.canonicalUrl;
    if (!assetUrl) continue;

    let fileResponse;
    try {
      fileResponse = await fetch(assetUrl, { cache: "no-store" });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Could not read evidence asset ${asset?.originalFilename || asset?.label || index + 1}.`;
      throw buildGetReceiptsError(message, 0, true);
    }

    if (!fileResponse.ok) {
      throw buildGetReceiptsError(
        `Could not fetch evidence asset (${fileResponse.status}).`,
        fileResponse.status,
        isRetryableStatus(fileResponse.status),
      );
    }

    const mimeType =
      asset?.mimeType ||
      fileResponse.headers.get("content-type") ||
      "application/octet-stream";
    const filename =
      asset?.originalFilename ||
      asset?.label ||
      `${asset?.documentKey || "evidence"}-${index + 1}`;
    const arrayBuffer = await fileResponse.arrayBuffer();
    const formData = new FormData();
    formData.set("file", new Blob([arrayBuffer], { type: mimeType }), filename);
    if (asset?.documentKey) formData.set("document_key", asset.documentKey);
    if (asset?.kind) formData.set("kind", asset.kind);

    const payload = await requestGetReceipts(connection, "/api/v1/evidence/upload", {
      method: "POST",
      body: formData,
    });

    uploads.push({
      url: payload?.url || payload?.data?.url || null,
      contentHash: payload?.content_hash || payload?.data?.content_hash || null,
      mimeType: payload?.mime_type || payload?.data?.mime_type || mimeType,
      size:
        Number(payload?.size || payload?.data?.size) ||
        Number(asset?.byteSize) ||
        arrayBuffer.byteLength,
      originalName: payload?.original_name || payload?.data?.original_name || filename,
      kind: asset?.kind || null,
      documentKey: asset?.documentKey || null,
    });
  }

  return uploads;
}

export function buildReadingReceiptPayload({
  profile,
  documentKey,
  title,
  evidenceItems,
  interpretation,
  implications,
  stance,
  linkedMessageIds,
}) {
  const items = Array.isArray(evidenceItems) ? evidenceItems : [];
  const sectionTitles = [...new Set(items.map((item) => item.sectionTitle).filter(Boolean))].join(", ");
  const excerpt = items[0]?.excerpt || "";
  const markIds = items.map((item) => item.sourceMarkId).filter(Boolean);
  const evidenceIds = items.map((item) => item.id);

  return {
    aim: title || `Read and internalize ${sectionTitles || "the current document"}`,
    tried: `Reviewed evidence inside ${PRODUCT_NAME} and assembled a human interpretation receipt.`,
    outcome: excerpt
      ? `Reviewed source passages including: "${excerpt}"`
      : `Reviewed source passages inside ${PRODUCT_NAME}.`,
    learned:
      interpretation ||
      "The reading produced a grounded human interpretation tied to reviewed evidence.",
    decision:
      implications ||
      "Capture the interpretation as a receipt and return to the document with clearer next actions.",
    owner: profile.displayName,
    temporal: "retrospective",
    visibility: "private",
    tags: ["assembled-reality", "reader"],
    metadata: {
      source_app: "assembled_reality",
      source_flow: "assembled_reality_reader_v4",
      assembled_reality: {
        document_key: documentKey,
        reader_slug: profile.readerSlug,
        section_slugs: [...new Set(items.map((item) => item.sectionSlug).filter(Boolean))],
        mark_ids: markIds,
        evidence_item_ids: evidenceIds,
        linked_message_ids: Array.isArray(linkedMessageIds) ? linkedMessageIds : [],
        stance: stance || "tentative",
        interpretation: interpretation || "",
        implications: implications || "",
      },
    },
  };
}
