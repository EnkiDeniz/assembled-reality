import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { appEnv } from "@/lib/env";
import { ensureReaderProfileForUser } from "@/lib/reader-db";

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
      if (!user?.email) return false;
      return isInvitedEmail(user.email);
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }

      if (token.sub) {
        const resolved = await prisma.user.findUnique({
          where: { id: token.sub },
          include: { readerProfile: true },
        });

        if (resolved?.readerProfile) {
          token.readerSlug = resolved.readerProfile.readerSlug;
          token.readerRole = resolved.readerProfile.role;
          token.readerName = resolved.readerProfile.displayName;
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
