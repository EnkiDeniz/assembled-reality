import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  clearDevGuardianSessionCache,
  DEV_GUARDIAN_COOKIE_NAME,
  DEV_GUARDIAN_COOKIE_VALUE,
} from "@/lib/server-session";

const GUARDIAN_EMAIL = "guardian@loegos.local";
const DEV_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

function normalizeGuardianRunId(value = "") {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);

  if (normalized) return normalized;
  return `run-${Date.now().toString(36)}`;
}

function buildGuardianCookieResponse({ action = "login", cookieName, extra = null } = {}) {
  const response = NextResponse.json({
    ok: true,
    action,
    ...(extra && typeof extra === "object" ? extra : {}),
  });

  response.cookies.set(cookieName, "", { path: "/", maxAge: 0 });
  response.cookies.set(DEV_GUARDIAN_COOKIE_NAME, DEV_GUARDIAN_COOKIE_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: DEV_COOKIE_MAX_AGE,
  });

  return response;
}

function buildGuardianClearResponse({ action = "cleared", cookieName, extra = null } = {}) {
  const response = NextResponse.json({
    ok: true,
    action,
    ...(extra && typeof extra === "object" ? extra : {}),
  });

  response.cookies.set(cookieName, "", { path: "/", maxAge: 0 });
  response.cookies.set(DEV_GUARDIAN_COOKIE_NAME, "", { path: "/", maxAge: 0 });

  return response;
}

async function resetGuardianWorkspace() {
  const user = await prisma.user.findUnique({
    where: { email: GUARDIAN_EMAIL },
    select: { id: true },
  });

  if (!user?.id) {
    return { deleted: false };
  }

  await prisma.user.delete({
    where: { id: user.id },
  });

  return { deleted: true };
}

export async function GET(request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  const secureCookie = process.env.NEXTAUTH_URL?.startsWith("https");
  const cookieName = secureCookie
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  if (action === "clear") {
    clearDevGuardianSessionCache();
    return buildGuardianClearResponse({ action: "cleared", cookieName });
  }

  if (action === "reset") {
    clearDevGuardianSessionCache();
    const result = await resetGuardianWorkspace();
    return buildGuardianClearResponse({
      action: "reset",
      cookieName,
      extra: { deleted: result.deleted },
    });
  }

  if (action === "bootstrap") {
    clearDevGuardianSessionCache();
    return buildGuardianCookieResponse({
      action: "bootstrap",
      cookieName,
      extra: {
        runId: normalizeGuardianRunId(searchParams.get("runId")),
      },
    });
  }

  return buildGuardianCookieResponse({ action: "login", cookieName });
}
