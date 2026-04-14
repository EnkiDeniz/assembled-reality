import { createHmac, timingSafeEqual } from "node:crypto";

export function normalizeBetaText(value = "") {
  return String(value || "").trim();
}

export function normalizeBetaEmail(value = "") {
  return normalizeBetaText(value).toLowerCase();
}

export function normalizeBetaVersion(value = "") {
  return normalizeBetaText(value) || "1";
}

export function safeEqualBetaText(left = "", right = "") {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isBetaPasswordMatch(submittedCode = "", expectedPassword = "") {
  const submitted = normalizeBetaText(submittedCode);
  const expected = normalizeBetaText(expectedPassword);

  if (!submitted || !expected) {
    return false;
  }

  return safeEqualBetaText(submitted.toLowerCase(), expected.toLowerCase());
}

export function isAllowedBetaEmail(email = "", allowedEmails = []) {
  const normalized = normalizeBetaEmail(email);
  if (!normalized) {
    return false;
  }

  const allowed = Array.isArray(allowedEmails) ? allowedEmails : [];
  return allowed.includes(normalized);
}

export function extractBetaCandidateEmail({ user, profile, email } = {}) {
  return normalizeBetaEmail(user?.email || email?.email || profile?.email || "");
}

function createBetaCookieSigningKey({
  authSecret = "",
  password = "",
  version = "",
} = {}) {
  const normalizedPassword = normalizeBetaText(password);
  if (!normalizedPassword) {
    return "";
  }

  return [
    normalizeBetaText(authSecret),
    normalizedPassword,
    normalizeBetaVersion(version),
  ].join(":");
}

function signBetaCookiePayload(payload = "", config = {}) {
  const signingKey = createBetaCookieSigningKey(config);
  if (!signingKey || !payload) {
    return "";
  }

  return createHmac("sha256", signingKey).update(payload).digest("base64url");
}

function parseBetaCookiePayload(payload = "") {
  if (!payload) {
    return null;
  }

  try {
    const decoded = Buffer.from(String(payload), "base64url").toString("utf8");
    const parsed = JSON.parse(decoded);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function createBetaUnlockCookieValue(config = {}, issuedAt = Date.now()) {
  const payload = Buffer.from(
    JSON.stringify({
      v: 1,
      gateVersion: normalizeBetaVersion(config.version),
      iat: Number.isFinite(issuedAt) ? issuedAt : Date.now(),
    }),
  ).toString("base64url");
  const signature = signBetaCookiePayload(payload, config);

  if (!signature) {
    return "";
  }

  return `${payload}.${signature}`;
}

export function verifyBetaUnlockCookieValue(value = "", config = {}) {
  const [payload, signature] = String(value || "").split(".");
  if (!payload || !signature) {
    return false;
  }

  const parsedPayload = parseBetaCookiePayload(payload);
  if (!parsedPayload) {
    return false;
  }

  if (normalizeBetaVersion(parsedPayload.gateVersion) !== normalizeBetaVersion(config.version)) {
    return false;
  }

  const expectedSignature = signBetaCookiePayload(payload, config);
  if (!expectedSignature) {
    return false;
  }

  return safeEqualBetaText(signature, expectedSignature);
}
