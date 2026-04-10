import "server-only";

import { prisma } from "@/lib/prisma";
import { getReaderProfileByUserId } from "@/lib/reader-db";
import { makeRoomId } from "@/lib/room";

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function slugifySegment(value = "", fallback = "room") {
  return (
    normalizeText(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || fallback
  );
}

export function buildRoomSessionThreadDocumentKey(projectKey = "", sessionKey = "") {
  return `room-session:${slugifySegment(projectKey, "box")}:${normalizeText(sessionKey) || makeRoomId("session")}`;
}

function buildRoomSessionTitle(index = 1) {
  const normalizedIndex = Math.max(1, Number(index) || 1);
  return `Conversation ${normalizedIndex}`;
}

function serializeRoomSession(session = null, threadRecord = null) {
  if (!session) return null;

  return {
    id: session.id,
    sessionKey: session.sessionKey,
    threadDocumentKey: session.threadDocumentKey,
    title: normalizeText(session.title) || "Conversation",
    handoffSummary: String(session.handoffSummary || "").trim(),
    isActive: Boolean(session.isActive),
    isArchived: Boolean(session.isArchived),
    messageCount: Number(threadRecord?._count?.messages) || 0,
    updatedAt:
      threadRecord?.updatedAt?.toISOString?.() ||
      session.updatedAt?.toISOString?.() ||
      session.createdAt?.toISOString?.() ||
      null,
    createdAt: session.createdAt?.toISOString?.() || null,
  };
}

async function getReaderProfileOwner(userId) {
  const resolved = await getReaderProfileByUserId(userId);
  if (!resolved?.profile?.id) {
    return null;
  }

  return {
    profileId: resolved.profile.id,
    profile: resolved.profile,
  };
}

export async function ensureCompilerFirstWorkspaceResetForUser(userId) {
  const owner = await getReaderProfileOwner(userId);
  if (!owner?.profileId) {
    return { resetApplied: false, resetAt: null };
  }

  if (owner.profile.compilerFirstWorkspaceResetAt) {
    return {
      resetApplied: false,
      resetAt: owner.profile.compilerFirstWorkspaceResetAt.toISOString(),
    };
  }

  const resetAt = new Date();

  await prisma.$transaction([
    prisma.readerRoomSession.deleteMany({
      where: { userId },
    }),
    prisma.readingReceiptDraft.deleteMany({
      where: { userId },
    }),
    prisma.readerAttestedOverride.deleteMany({
      where: { userId },
    }),
    prisma.readerOperateRun.deleteMany({
      where: { userId },
    }),
    prisma.readerConversationThread.deleteMany({
      where: { readerProfileId: owner.profileId },
    }),
    prisma.readerEvidenceSet.deleteMany({
      where: { readerProfileId: owner.profileId },
    }),
    prisma.readerListeningSession.deleteMany({
      where: { readerProfileId: owner.profileId },
    }),
    prisma.readerProject.deleteMany({
      where: { userId },
    }),
    prisma.readerSourceAsset.deleteMany({
      where: { userId },
    }),
    prisma.readerDocument.deleteMany({
      where: { userId },
    }),
    prisma.readerProfile.update({
      where: { id: owner.profileId },
      data: {
        compilerFirstWorkspaceResetAt: resetAt,
      },
    }),
  ]);

  return {
    resetApplied: true,
    resetAt: resetAt.toISOString(),
  };
}

async function getThreadRecordsForSessionKeys(readerProfileId, threadDocumentKeys = []) {
  const normalizedKeys = [...new Set((Array.isArray(threadDocumentKeys) ? threadDocumentKeys : []).filter(Boolean))];
  if (!normalizedKeys.length) {
    return new Map();
  }

  const threads = await prisma.readerConversationThread.findMany({
    where: {
      readerProfileId,
      documentKey: {
        in: normalizedKeys,
      },
    },
    select: {
      documentKey: true,
      updatedAt: true,
      _count: {
        select: { messages: true },
      },
    },
  });

  return new Map(threads.map((thread) => [thread.documentKey, thread]));
}

export async function listRoomSessionsForProjectForUser(
  userId,
  { projectId = "", includeArchived = true } = {},
) {
  const owner = await getReaderProfileOwner(userId);
  const normalizedProjectId = normalizeText(projectId);
  if (!owner?.profileId || !normalizedProjectId) return [];

  const sessions = await prisma.readerRoomSession.findMany({
    where: {
      userId,
      projectId: normalizedProjectId,
      ...(includeArchived ? {} : { isArchived: false }),
    },
    orderBy: [{ isArchived: "asc" }, { isActive: "desc" }, { updatedAt: "desc" }, { createdAt: "desc" }],
  });

  const threadMap = await getThreadRecordsForSessionKeys(
    owner.profileId,
    sessions.map((session) => session.threadDocumentKey),
  );

  return sessions.map((session) => serializeRoomSession(session, threadMap.get(session.threadDocumentKey)));
}

export async function getRoomSessionForUser(userId, sessionId = "") {
  const normalizedSessionId = normalizeText(sessionId);
  if (!normalizedSessionId) return null;

  const owner = await getReaderProfileOwner(userId);
  if (!owner?.profileId) return null;

  const session = await prisma.readerRoomSession.findFirst({
    where: {
      id: normalizedSessionId,
      userId,
    },
  });
  if (!session) return null;

  const threadMap = await getThreadRecordsForSessionKeys(owner.profileId, [session.threadDocumentKey]);
  return serializeRoomSession(session, threadMap.get(session.threadDocumentKey));
}

export async function createRoomSessionForProject(
  userId,
  project,
  {
    title = "",
    handoffSummary = "",
    activate = true,
    archiveExisting = false,
  } = {},
) {
  if (!project?.id || !project?.projectKey) {
    throw new Error("Box not found.");
  }

  const existingCount = await prisma.readerRoomSession.count({
    where: {
      userId,
      projectId: project.id,
    },
  });

  const sessionKey = makeRoomId("session");
  const nextTitle = normalizeText(title) || buildRoomSessionTitle(existingCount + 1);
  const nextHandoffSummary = String(handoffSummary || "").trim();

  const created = await prisma.$transaction(async (tx) => {
    if (activate || archiveExisting) {
      await tx.readerRoomSession.updateMany({
        where: {
          userId,
          projectId: project.id,
          isActive: true,
        },
        data: {
          isActive: false,
          ...(archiveExisting ? { isArchived: true } : {}),
        },
      });
    }

    return tx.readerRoomSession.create({
      data: {
        userId,
        projectId: project.id,
        sessionKey,
        threadDocumentKey: buildRoomSessionThreadDocumentKey(project.projectKey, sessionKey),
        title: nextTitle,
        handoffSummary: nextHandoffSummary || null,
        isActive: Boolean(activate),
        isArchived: false,
      },
    });
  });

  return getRoomSessionForUser(userId, created.id);
}

export async function activateRoomSessionForProject(userId, project, sessionId = "") {
  if (!project?.id) {
    throw new Error("Box not found.");
  }

  const normalizedSessionId = normalizeText(sessionId);
  if (!normalizedSessionId) {
    throw new Error("Conversation is required.");
  }

  await prisma.$transaction(async (tx) => {
    const target = await tx.readerRoomSession.findFirst({
      where: {
        id: normalizedSessionId,
        userId,
        projectId: project.id,
      },
    });

    if (!target) {
      throw new Error("Conversation not found.");
    }

    await tx.readerRoomSession.updateMany({
      where: {
        userId,
        projectId: project.id,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    await tx.readerRoomSession.update({
      where: { id: target.id },
      data: {
        isActive: true,
        isArchived: false,
      },
    });
  });

  return getRoomSessionForUser(userId, normalizedSessionId);
}

export async function archiveRoomSessionForProject(userId, project, sessionId = "") {
  if (!project?.id) {
    throw new Error("Box not found.");
  }

  const normalizedSessionId = normalizeText(sessionId);
  if (!normalizedSessionId) {
    throw new Error("Conversation is required.");
  }

  const archived = await prisma.$transaction(async (tx) => {
    const target = await tx.readerRoomSession.findFirst({
      where: {
        id: normalizedSessionId,
        userId,
        projectId: project.id,
      },
    });

    if (!target) {
      throw new Error("Conversation not found.");
    }

    await tx.readerRoomSession.update({
      where: { id: target.id },
      data: {
        isActive: false,
        isArchived: true,
      },
    });

    const replacement =
      (await tx.readerRoomSession.findFirst({
        where: {
          userId,
          projectId: project.id,
          isArchived: false,
          NOT: { id: target.id },
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      })) ||
      (async () => {
        const replacementSessionKey = makeRoomId("session");
        const replacementIndex =
          (await tx.readerRoomSession.count({
            where: {
              userId,
              projectId: project.id,
            },
          })) + 1;

        return tx.readerRoomSession.create({
          data: {
            userId,
            projectId: project.id,
            sessionKey: replacementSessionKey,
            threadDocumentKey: buildRoomSessionThreadDocumentKey(
              project.projectKey,
              replacementSessionKey,
            ),
            title: buildRoomSessionTitle(replacementIndex),
            handoffSummary: "",
            isActive: true,
            isArchived: false,
          },
        });
      })();

    await tx.readerRoomSession.update({
      where: { id: replacement.id },
      data: {
        isActive: true,
        isArchived: false,
      },
    });

    return target.id;
  });

  return {
    archivedSessionId: archived,
  };
}

export async function ensureRoomSessionForProject(
  userId,
  project,
  { sessionId = "", handoffSummary = "" } = {},
) {
  if (!project?.id) return null;

  const requestedSessionId = normalizeText(sessionId);
  if (requestedSessionId) {
    const requestedSession = await prisma.readerRoomSession.findFirst({
      where: {
        id: requestedSessionId,
        userId,
        projectId: project.id,
      },
    });

    if (requestedSession) {
      return activateRoomSessionForProject(userId, project, requestedSessionId);
    }
  }

  const existingActive = await prisma.readerRoomSession.findFirst({
    where: {
      userId,
      projectId: project.id,
      isActive: true,
      isArchived: false,
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  if (existingActive) {
    return getRoomSessionForUser(userId, existingActive.id);
  }

  const latestOpen = await prisma.readerRoomSession.findFirst({
    where: {
      userId,
      projectId: project.id,
      isArchived: false,
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  if (latestOpen) {
    return activateRoomSessionForProject(userId, project, latestOpen.id);
  }

  return createRoomSessionForProject(userId, project, {
    activate: true,
    handoffSummary,
  });
}

export async function updateRoomSessionHandoffSummaryForUser(userId, sessionId = "", handoffSummary = "") {
  const normalizedSessionId = normalizeText(sessionId);
  if (!normalizedSessionId) return null;

  const summary = String(handoffSummary || "").trim();
  await prisma.readerRoomSession.updateMany({
    where: {
      id: normalizedSessionId,
      userId,
    },
    data: {
      handoffSummary: summary || null,
    },
  });

  return getRoomSessionForUser(userId, normalizedSessionId);
}
