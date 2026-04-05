import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { appEnv } from "@/lib/env";
import { ensureReaderProfileForUser } from "@/lib/reader-db";

const GUARDIAN_EMAIL = "guardian@loegos.local";
const GUARDIAN_NAME = "Guardian";

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
    const response = NextResponse.json({ ok: true, action: "cleared" });
    response.cookies.set(cookieName, "", { path: "/", maxAge: 0 });
    return response;
  }

  if (action === "reset") {
    const result = await resetGuardianWorkspace();
    const response = NextResponse.json({
      ok: true,
      action: "reset",
      deleted: result.deleted,
    });
    response.cookies.set(cookieName, "", { path: "/", maxAge: 0 });
    return response;
  }

  let user = await prisma.user.findUnique({
    where: { email: GUARDIAN_EMAIL },
    include: { readerProfile: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: GUARDIAN_EMAIL,
        name: GUARDIAN_NAME,
      },
      include: { readerProfile: true },
    });
  }

  const profile = user.readerProfile || (await ensureReaderProfileForUser(user, GUARDIAN_NAME));

  const token = await encode({
    token: {
      sub: user.id,
      email: user.email,
      name: user.name,
      readerSlug: profile?.readerSlug || null,
      readerRole: profile?.role || "READER",
      readerName: profile?.displayName || GUARDIAN_NAME,
    },
    secret: appEnv.authSecret,
    maxAge: 30 * 24 * 60 * 60,
  });

  const response = NextResponse.json({
    ok: true,
    userId: user.id,
    email: user.email,
    name: user.name,
  });

  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: Boolean(secureCookie),
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });

  return response;
}
