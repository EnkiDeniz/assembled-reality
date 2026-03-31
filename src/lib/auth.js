import { PrismaAdapter } from "@next-auth/prisma-adapter";
import AppleProvider from "next-auth/providers/apple";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { appEnv } from "@/lib/env";
import { ensureReaderProfileForUser } from "@/lib/reader-db";
import { sendVerificationRequest } from "@/lib/email";

function isInvitedEmail(email) {
  if (!appEnv.invitedEmails.length) return true;
  return appEnv.invitedEmails.includes((email || "").trim().toLowerCase());
}

async function findOrCreateUser({ email, name }) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();

  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: normalizedName,
        emailVerified: new Date(),
      },
    });
  } else if (!user.name && normalizedName) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { name: normalizedName },
    });
  }

  await ensureReaderProfileForUser(user, normalizedName);
  return user;
}

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
            brandName: "Assembled Reality",
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
    CredentialsProvider({
      name: "Reader Access",
      credentials: {
        name: { label: "Name", type: "text" },
        email: { label: "Email", type: "email" },
        accessCode: { label: "Access code", type: "password" },
      },
      async authorize(credentials) {
        const name = credentials?.name?.trim() || "";
        const email = credentials?.email?.trim() || "";
        const accessCode = credentials?.accessCode?.trim().toLowerCase() || "";

        if (!name || !email || !accessCode) {
          return null;
        }

        if (!appEnv.bootstrapCode || accessCode !== appEnv.bootstrapCode.toLowerCase()) {
          return null;
        }

        if (!isInvitedEmail(email)) {
          return null;
        }

        const user = await findOrCreateUser({ email, name });
        const profile = await ensureReaderProfileForUser(user, name);

        return {
          id: user.id,
          email: user.email,
          name: profile.displayName,
          image: user.image,
          readerSlug: profile.readerSlug,
          readerRole: profile.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (user?.email && !isInvitedEmail(user.email)) {
        return false;
      }

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
