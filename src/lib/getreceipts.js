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

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function signValue(value) {
  return crypto
    .createHmac("sha256", appEnv.integrationsStateSecret)
    .update(value)
    .digest("base64url");
}

export function createSignedIntegrationState(userId) {
  if (!appEnv.integrationsStateSecret) {
    throw new Error("INTEGRATIONS_STATE_SECRET or NEXTAUTH_SECRET is required.");
  }

  const payload = JSON.stringify({
    userId,
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

export function buildGetReceiptsConnectUrl(userId) {
  const state = createSignedIntegrationState(userId);
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
  const accessToken = decryptSecret(connection?.accessTokenEncrypted || "");
  if (!accessToken) {
    throw new Error("Connected GetReceipts access token is unavailable.");
  }

  const response = await fetch(`${appEnv.getReceipts.baseUrl}/api/v1/receipts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...payload,
      status: "draft",
    }),
    cache: "no-store",
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      json?.error?.message ||
      json?.message ||
      `GetReceipts receipt creation failed (${response.status})`;
    throw new Error(message);
  }

  return json;
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
    aim: title || `Read and internalize ${sectionTitles || "Assembled Reality"}`,
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
