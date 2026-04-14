import { PrismaAdapter } from "@next-auth/prisma-adapter";
import AppleProvider from "next-auth/providers/apple";
import EmailProvider from "next-auth/providers/email";
import jwt from "jsonwebtoken";
import {
  BETA_ADMISSION_REASON_CODES,
  recordDeniedBetaAdmissionAttempt,
} from "@/lib/beta-admission-audit";
import { prisma } from "@/lib/prisma";
import { extractCandidateEmail, isBetaEmailAllowed } from "@/lib/beta-access";
import { appEnv } from "@/lib/env";
import { PRODUCT_NAME } from "@/lib/product-language";
import { ensureReaderProfileForUser } from "@/lib/reader-db";
import { sendVerificationRequest } from "@/lib/email";

function getProfileSeedName(user) {
  if (user?.name?.trim()) return user.name.trim();
  if (user?.email?.trim()) return user.email.trim().split("@")[0];
  return "Reader";
}

async function ensureReaderProfile(user) {
  const dbUser =
    user?.id
      ? await prisma.user.findUnique({
          where: { id: user.id },
          include: { readerProfile: true },
        })
      : user?.email
        ? await prisma.user.findUnique({
            where: { email: user.email.trim().toLowerCase() },
            include: { readerProfile: true },
          })
        : null;

  if (!dbUser) return null;
  return ensureReaderProfileForUser(dbUser, getProfileSeedName(dbUser));
}

function generateAppleClientSecret() {
  if (!appEnv.apple.enabled) {
    return "";
  }

  return jwt.sign({}, appEnv.apple.privateKey, {
    algorithm: "ES256",
    expiresIn: "180d",
    issuer: appEnv.apple.teamId,
    subject: appEnv.apple.clientId,
    audience: "https://appleid.apple.com",
    keyid: appEnv.apple.keyId,
  });
}

function shouldUseSecureAuthCookies() {
  return appEnv.siteUrl.startsWith("https://") || process.env.NODE_ENV === "production";
}

function getSecureAuthCookiePrefix() {
  return shouldUseSecureAuthCookies() ? "__Secure-" : "";
}

function buildOAuthCookieOptions({ maxAge } = {}) {
  const secureAuthCookies = shouldUseSecureAuthCookies();

  return {
    httpOnly: true,
    sameSite: secureAuthCookies ? "none" : "lax",
    path: "/",
    secure: secureAuthCookies,
    ...(typeof maxAge === "number" ? { maxAge } : {}),
  };
}

function resolveSignInProvider({ account, email } = {}) {
  if (account?.provider) {
    return String(account.provider).trim().toLowerCase();
  }

  if (email) {
    return "email";
  }

  return "unknown";
}

async function resolveBetaAdmissionEmail({ user, profile, email, account } = {}) {
  const directCandidateEmail = extractCandidateEmail({ user, profile, email });
  if (isBetaEmailAllowed(directCandidateEmail)) {
    return directCandidateEmail;
  }

  if (user?.id) {
    const storedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true },
    });
    const storedUserEmail = extractCandidateEmail({ user: storedUser });
    if (isBetaEmailAllowed(storedUserEmail)) {
      return storedUserEmail;
    }
  }

  if (account?.provider && account?.providerAccountId) {
    const linkedAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: String(account.provider),
          providerAccountId: String(account.providerAccountId),
        },
      },
      select: {
        user: {
          select: { email: true },
        },
      },
    });
    const linkedUserEmail = extractCandidateEmail({ user: linkedAccount?.user });
    if (isBetaEmailAllowed(linkedUserEmail)) {
      return linkedUserEmail;
    }
  }

  return directCandidateEmail;
}

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    // Apple returns to the callback with a cross-site POST when using form_post.
    // These transient OAuth cookies must be SameSite=None in production or the browser drops them.
    pkceCodeVerifier: {
      name: `${getSecureAuthCookiePrefix()}next-auth.pkce.code_verifier`,
      options: buildOAuthCookieOptions({ maxAge: 60 * 15 }),
    },
    state: {
      name: `${getSecureAuthCookiePrefix()}next-auth.state`,
      options: buildOAuthCookieOptions({ maxAge: 60 * 15 }),
    },
    nonce: {
      name: `${getSecureAuthCookiePrefix()}next-auth.nonce`,
      options: buildOAuthCookieOptions(),
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  providers: [
    ...(appEnv.magicLinksEnabled
      ? [
          EmailProvider({
            from: appEnv.emailFrom,
            sendVerificationRequest,
            maxAge: 15 * 60,
            brandName: PRODUCT_NAME,
          }),
        ]
      : []),
    ...(appEnv.apple.enabled
      ? [
          AppleProvider({
            clientId: appEnv.apple.clientId,
            clientSecret: generateAppleClientSecret(),
            allowDangerousEmailAccountLinking: true,
            authorization: {
              params: {
                scope: "name email",
                response_mode: "form_post",
              },
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, profile, email, account }) {
      const candidateEmail = extractCandidateEmail({ user, profile, email });
      const resolvedCandidateEmail = await resolveBetaAdmissionEmail({
        user,
        profile,
        email,
        account,
      });

      if (!isBetaEmailAllowed(resolvedCandidateEmail)) {
        await recordDeniedBetaAdmissionAttempt({
          provider: resolveSignInProvider({ account, email }),
          candidateEmail,
          reasonCode: BETA_ADMISSION_REASON_CODES.emailNotAllowed,
        });
        return false;
      }

      if (resolvedCandidateEmail) {
        user.email = resolvedCandidateEmail;
      }

      const readerProfile = await ensureReaderProfile(user);
      if (readerProfile) {
        user.name = readerProfile.displayName;
        user.readerSlug = readerProfile.readerSlug;
        user.readerRole = readerProfile.role;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.readerSlug = user.readerSlug || token.readerSlug || null;
        token.readerRole = user.readerRole || token.readerRole || "READER";
        token.readerName = user.readerName || user.name || token.readerName || "";
      }

      const needsProfileHydration =
        Boolean(token.sub) &&
        (!token.readerSlug || !token.readerRole || !token.readerName);

      if (needsProfileHydration) {
        const resolved = await prisma.user.findUnique({
          where: { id: token.sub },
          include: { readerProfile: true },
        });

        if (resolved) {
          const profile =
            resolved.readerProfile ||
            (await ensureReaderProfileForUser(resolved, getProfileSeedName(resolved)));

          if (profile) {
            token.readerSlug = profile.readerSlug;
            token.readerRole = profile.role;
            token.readerName = profile.displayName;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.readerSlug = token.readerSlug || null;
        session.user.readerRole = token.readerRole || "READER";
        session.user.readerName = token.readerName || session.user.name || "";
      }

      return session;
    },
  },
  secret: appEnv.authSecret,
};
