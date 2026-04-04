import { PrismaAdapter } from "@next-auth/prisma-adapter";
import AppleProvider from "next-auth/providers/apple";
import EmailProvider from "next-auth/providers/email";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
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

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/",
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
                scope: "openid",
                response_mode: "query",
              },
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user }) {
      const profile = await ensureReaderProfile(user);
      if (profile) {
        user.name = profile.displayName;
        user.readerSlug = profile.readerSlug;
        user.readerRole = profile.role;
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
