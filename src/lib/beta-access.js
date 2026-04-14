import "server-only";

import { cookies } from "next/headers";
import { appEnv } from "@/lib/env";
import {
  createBetaUnlockCookieValue,
  extractBetaCandidateEmail,
  isAllowedBetaEmail,
  isBetaPasswordMatch,
  normalizeBetaText,
  verifyBetaUnlockCookieValue,
} from "@/lib/beta-access-core";

export const BETA_ACCESS_COOKIE_NAME = "loegos-beta-access";

function hasCookieProtection() {
  return Boolean(appEnv.beta?.passwordRequired);
}

function hasAllowlistProtection() {
  return Boolean(appEnv.beta?.allowlistEnabled);
}

function getCookieConfig() {
  return {
    authSecret:
      normalizeBetaText(appEnv.authSecret) || normalizeBetaText(appEnv.integrationsStateSecret),
    password: normalizeBetaText(appEnv.beta?.password),
    version: normalizeBetaText(appEnv.beta?.version),
  };
}

function resolveCookieOptions() {
  const secure =
    appEnv.siteUrl.startsWith("https://") || process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: appEnv.beta.cookieMaxAgeSeconds,
  };
}

export function extractCandidateEmail({ user, profile, email } = {}) {
  return extractBetaCandidateEmail({ user, profile, email });
}

export function isBetaEmailAllowed(email = "") {
  if (!hasAllowlistProtection()) {
    return true;
  }

  return isAllowedBetaEmail(email, appEnv.beta.allowedEmails);
}

export function isBetaPasswordValid(code = "") {
  if (!hasCookieProtection()) {
    return true;
  }

  return isBetaPasswordMatch(code, appEnv.beta.password);
}

export async function hasUnlockedBetaAccess(cookieStore = null) {
  if (!hasCookieProtection()) {
    return true;
  }

  const store = cookieStore || (await cookies());
  const value = store.get(BETA_ACCESS_COOKIE_NAME)?.value;
  return verifyBetaUnlockCookieValue(value, getCookieConfig());
}

export async function isBetaSessionAllowed(session, cookieStore = null) {
  if (!appEnv.beta.enabled) {
    return true;
  }

  if (!session?.user?.id) {
    return false;
  }

  if (hasAllowlistProtection() && !isBetaEmailAllowed(session.user.email)) {
    return false;
  }

  if (hasCookieProtection()) {
    return hasUnlockedBetaAccess(cookieStore);
  }

  return true;
}

export async function getBetaGateState(cookieStore = null) {
  return {
    enabled: appEnv.beta.enabled,
    passwordRequired: hasCookieProtection(),
    allowlistEnabled: hasAllowlistProtection(),
    unlocked: await hasUnlockedBetaAccess(cookieStore),
  };
}

export function attachBetaAccessCookie(response) {
  if (!hasCookieProtection()) {
    return response;
  }

  const value = createBetaUnlockCookieValue(getCookieConfig());
  if (!value) {
    return response;
  }

  response.cookies.set(BETA_ACCESS_COOKIE_NAME, value, resolveCookieOptions());
  return response;
}

export function clearBetaAccessCookie(response) {
  response.cookies.set(BETA_ACCESS_COOKIE_NAME, "", {
    ...resolveCookieOptions(),
    maxAge: 0,
  });
  return response;
}
