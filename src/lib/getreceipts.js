import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { appEnv } from "@/lib/env";
import { encryptSecret } from "@/lib/crypto";

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

export function buildReadingReceiptPayload({
  profile,
  sections,
  marks,
  learned,
}) {
  const sectionTitles = sections.map((section) => section.title).join(", ");
  const excerpt = marks[0]?.excerpt || "";

  return {
    aim: `Read and internalize ${sectionTitles || "Assembled Reality"}`,
    tried: `Read ${sections.length} section(s) inside the Assembled Reality reader and annotated passages for later use.`,
    outcome: excerpt
      ? `Completed the reading pass and captured key passages including: "${excerpt}"`
      : "Completed the reading pass and captured key passages for later use.",
    learned: learned || "The reading changed the operator's understanding and produced notes or highlights worth preserving.",
    decision: "Turn the reading into a traceable receipt and return to the document with clearer next actions.",
    owner: profile.displayName,
    temporal: "retrospective",
    visibility: "private",
    tags: ["assembled-reality", "reader"],
    metadata: {
      source_app: "assembled_reality",
      source_flow: "assembled_reality_reader_v1",
      assembled_reality: {
        reader_slug: profile.readerSlug,
        section_slugs: sections.map((section) => section.slug),
        mark_ids: marks.map((mark) => mark.id),
      },
    },
  };
}
