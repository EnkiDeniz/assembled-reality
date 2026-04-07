import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureReaderProfileForUser } from "@/lib/reader-db";

export const DEV_GUARDIAN_COOKIE_NAME = "loegos-dev-guardian";
export const DEV_GUARDIAN_COOKIE_VALUE = "guardian";

const DEV_GUARDIAN_EMAIL = "guardian@loegos.local";
const DEV_GUARDIAN_NAME = "Guardian";
const DEV_GUARDIAN_SESSION_CACHE_KEY = "__loegosDevGuardianSessionPromise";
const DEV_SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function getGlobalGuardianStore() {
  return globalThis;
}

export function clearDevGuardianSessionCache() {
  delete getGlobalGuardianStore()[DEV_GUARDIAN_SESSION_CACHE_KEY];
}

async function buildDevGuardianSession() {
  let user = await prisma.user.findUnique({
    where: { email: DEV_GUARDIAN_EMAIL },
    include: { readerProfile: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: DEV_GUARDIAN_EMAIL,
        name: DEV_GUARDIAN_NAME,
      },
      include: { readerProfile: true },
    });
  }

  const profile = user.readerProfile || (await ensureReaderProfileForUser(user, DEV_GUARDIAN_NAME));

  return {
    user: {
      id: user.id,
      email: user.email || "",
      name: user.name || profile.displayName || DEV_GUARDIAN_NAME,
      readerSlug: profile.readerSlug || null,
      readerRole: profile.role || "READER",
      readerName: profile.displayName || user.name || DEV_GUARDIAN_NAME,
    },
    expires: new Date(Date.now() + DEV_SESSION_MAX_AGE_MS).toISOString(),
  };
}

async function getDevGuardianSession() {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const cookieStore = await cookies();
  if (cookieStore.get(DEV_GUARDIAN_COOKIE_NAME)?.value !== DEV_GUARDIAN_COOKIE_VALUE) {
    return null;
  }

  const globalStore = getGlobalGuardianStore();
  if (!globalStore[DEV_GUARDIAN_SESSION_CACHE_KEY]) {
    globalStore[DEV_GUARDIAN_SESSION_CACHE_KEY] = buildDevGuardianSession();
  }

  try {
    return await globalStore[DEV_GUARDIAN_SESSION_CACHE_KEY];
  } catch (error) {
    clearDevGuardianSessionCache();
    throw error;
  }
}

export async function getOptionalSession() {
  const devSession = await getDevGuardianSession();
  if (devSession?.user?.id) {
    return devSession;
  }

  return getServerSession(authOptions);
}

export async function getRequiredSession() {
  const session = await getOptionalSession();
  if (!session?.user?.id) {
    return null;
  }

  return session;
}
