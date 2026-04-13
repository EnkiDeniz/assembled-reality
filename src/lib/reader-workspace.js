import { prisma } from "@/lib/prisma";
import { getReaderProfileByUserId } from "@/lib/reader-db";
import { PRIMARY_DOCUMENT_KEY } from "@/lib/document";
import { getWorkspaceDocumentForUser } from "@/lib/workspace-documents";
import {
  clampListeningRate,
  fromPrismaListeningStatus,
  fromPrismaPlaybackScope,
  fromPrismaVoiceProvider,
  normalizeListeningStatus,
  normalizeVoiceProvider,
  toPrismaListeningStatus,
  toPrismaPlaybackScope,
  toPrismaVoiceProvider,
  trimOptionalValue,
} from "@/lib/listening";
import { buildExcerpt } from "@/lib/text";

function serializeConversationMessage(message) {
  return {
    id: message.id,
    role: String(message.role || "").toLowerCase(),
    content: message.content,
    citations: Array.isArray(message.citations) ? message.citations : [],
    createdAt: message.createdAt.toISOString(),
  };
}

function serializeThread(thread) {
  return {
    id: thread.id,
    documentKey: thread.documentKey,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
    messages: (thread.messages || []).map(serializeConversationMessage),
  };
}

function serializeEvidenceItem(item) {
  return {
    id: item.id,
    origin: String(item.origin || "").toLowerCase(),
    sourceType: String(item.sourceType || "").toLowerCase(),
    sectionSlug: item.sectionSlug,
    sectionTitle: item.sectionTitle,
    blockId: item.blockId || null,
    startOffset: typeof item.startOffset === "number" ? item.startOffset : null,
    endOffset: typeof item.endOffset === "number" ? item.endOffset : null,
    quote: item.quote,
    excerpt: item.excerpt,
    noteText: item.noteText || "",
    sourceMarkId: item.sourceMarkId || null,
    sourceMessageId: item.sourceMessageId || null,
    sourceCitationId: item.sourceCitationId || null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function serializeEvidenceSet(evidenceSet) {
  return {
    id: evidenceSet.id,
    documentKey: evidenceSet.documentKey,
    createdAt: evidenceSet.createdAt.toISOString(),
    updatedAt: evidenceSet.updatedAt.toISOString(),
    items: (evidenceSet.items || []).map(serializeEvidenceItem),
  };
}

function serializeListeningSession(session) {
  if (!session) return null;

  return {
    id: session.id,
    documentKey: session.documentKey,
    mode: fromPrismaPlaybackScope(session.mode),
    scopeStartNodeId: session.scopeStartNodeId || null,
    scopeEndNodeId: session.scopeEndNodeId || null,
    activeNodeId: session.activeNodeId || null,
    activeSectionSlug: session.activeSectionSlug || null,
    nodeOffsetMs: typeof session.nodeOffsetMs === "number" ? session.nodeOffsetMs : 0,
    rate: typeof session.rate === "number" ? session.rate : 1,
    provider: fromPrismaVoiceProvider(session.provider),
    voiceId: session.voiceId || null,
    status: fromPrismaListeningStatus(session.status),
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

function serializeVoicePreferences(profile) {
  if (!profile) return null;

  return {
    preferredVoiceProvider: fromPrismaVoiceProvider(profile.preferredVoiceProvider),
    preferredVoiceId: profile.preferredVoiceId || null,
    preferredListeningRate:
      typeof profile.preferredListeningRate === "number" ? profile.preferredListeningRate : 1,
  };
}

function buildWorkspaceOwner(userId, resolved = null) {
  if (!resolved?.profile?.id) {
    return null;
  }

  return {
    userId,
    profileId: resolved.profile.id,
    profile: resolved.profile,
  };
}

async function resolveWorkspaceOwner(userId, resolved = null) {
  const preloadedOwner = buildWorkspaceOwner(userId, resolved);
  if (preloadedOwner) {
    return preloadedOwner;
  }

  const nextResolved = await getReaderProfileByUserId(userId);
  return buildWorkspaceOwner(userId, nextResolved);
}

async function ensureThreadRecord(owner, documentKey) {
  const existing = await prisma.readerConversationThread.findUnique({
    where: {
      readerProfileId_documentKey: {
        readerProfileId: owner.profileId,
        documentKey,
      },
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.readerConversationThread.create({
    data: {
      userId: owner.userId,
      readerProfileId: owner.profileId,
      documentKey,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}

async function ensureEvidenceSetRecord(owner, documentKey) {
  const existing = await prisma.readerEvidenceSet.findUnique({
    where: {
      readerProfileId_documentKey: {
        readerProfileId: owner.profileId,
        documentKey,
      },
    },
    include: {
      items: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.readerEvidenceSet.create({
    data: {
      userId: owner.userId,
      readerProfileId: owner.profileId,
      documentKey,
    },
    include: {
      items: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}

export async function loadReaderWorkspaceForUser(
  userId,
  documentKey = PRIMARY_DOCUMENT_KEY,
) {
  const owner = await resolveWorkspaceOwner(userId);
  if (!owner) return null;

  const [thread, evidenceSet, listeningSession] = await Promise.all([
    ensureThreadRecord(owner, documentKey),
    ensureEvidenceSetRecord(owner, documentKey),
    prisma.readerListeningSession.findUnique({
      where: {
        readerProfileId_documentKey: {
          readerProfileId: owner.profileId,
          documentKey,
        },
      },
    }),
  ]);

  return {
    thread: serializeThread(thread),
    evidenceSet: serializeEvidenceSet(evidenceSet),
    listeningSession: serializeListeningSession(listeningSession),
    voicePreferences: serializeVoicePreferences(owner.profile),
  };
}

export async function loadListeningSessionForUser(
  userId,
  documentKey = PRIMARY_DOCUMENT_KEY,
) {
  const owner = await resolveWorkspaceOwner(userId);
  if (!owner) return null;

  const session = await prisma.readerListeningSession.findUnique({
    where: {
      readerProfileId_documentKey: {
        readerProfileId: owner.profileId,
        documentKey,
      },
    },
  });

  return {
    listeningSession: serializeListeningSession(session),
    voicePreferences: serializeVoicePreferences(owner.profile),
  };
}

export async function buildResumeSessionSummaryForUser(
  userId,
  documentKeys = [],
  ownerOverride = null,
) {
  const owner =
    ownerOverride?.profileId
      ? ownerOverride
      : await resolveWorkspaceOwner(userId, ownerOverride);
  if (!owner) return null;

  const normalizedDocumentKeys = Array.isArray(documentKeys)
    ? [...new Set(documentKeys.filter(Boolean))]
    : [];
  const activeStatuses = [
    toPrismaListeningStatus("active"),
    toPrismaListeningStatus("paused"),
  ];
  const session = await prisma.readerListeningSession.findFirst({
    where: {
      readerProfileId: owner.profileId,
      status: {
        in: activeStatuses,
      },
      ...(normalizedDocumentKeys.length
        ? {
            documentKey: {
              in: normalizedDocumentKeys,
            },
          }
        : {}),
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (!session) return null;

  const document = await getWorkspaceDocumentForUser(userId, session.documentKey);
  const blocks = Array.isArray(document?.blocks) ? document.blocks : [];
  const matchedBlockIndex = blocks.findIndex((block) => block.id === session.activeNodeId);
  const resolvedIndex = matchedBlockIndex >= 0 ? matchedBlockIndex : 0;
  const activeBlock = blocks[resolvedIndex] || null;

  return {
    documentKey: session.documentKey,
    title: document?.title || "Untitled document",
    subtitle: document?.subtitle || "",
    status: fromPrismaListeningStatus(session.status),
    blockId: activeBlock?.id || session.activeNodeId || null,
    blockPosition:
      typeof activeBlock?.sourcePosition === "number"
        ? activeBlock.sourcePosition + 1
        : resolvedIndex + 1,
    totalBlocks: blocks.length,
    updatedAt: session.updatedAt.toISOString(),
  };
}

export async function saveListeningSessionForUser(
  userId,
  {
    documentKey = PRIMARY_DOCUMENT_KEY,
    mode = "flow",
    scopeStartNodeId = null,
    scopeEndNodeId = null,
    activeNodeId = null,
    activeSectionSlug = null,
    nodeOffsetMs = 0,
    rate = 1,
    provider = null,
    voiceId = null,
    status = "idle",
    preferredVoiceProvider = undefined,
    preferredVoiceId = undefined,
    preferredListeningRate = undefined,
  } = {},
) {
  const owner = await resolveWorkspaceOwner(userId);
  if (!owner) return null;

  const resolvedDocumentKey = String(documentKey || PRIMARY_DOCUMENT_KEY).trim() || PRIMARY_DOCUMENT_KEY;
  const normalizedProvider = normalizeVoiceProvider(provider);
  const normalizedPreferredProvider =
    preferredVoiceProvider === undefined
      ? normalizedProvider
      : normalizeVoiceProvider(preferredVoiceProvider);
  const normalizedRate = clampListeningRate(
    preferredListeningRate === undefined ? rate : preferredListeningRate,
    1,
  );

  const profileData = {};
  if (preferredVoiceProvider !== undefined || provider) {
    profileData.preferredVoiceProvider = toPrismaVoiceProvider(normalizedPreferredProvider);
  }
  if (preferredVoiceId !== undefined || voiceId !== null) {
    profileData.preferredVoiceId = trimOptionalValue(
      preferredVoiceId === undefined ? voiceId : preferredVoiceId,
    );
  }
  if (preferredListeningRate !== undefined || rate !== undefined) {
    profileData.preferredListeningRate = normalizedRate;
  }

  const [profile, session] = await prisma.$transaction([
    Object.keys(profileData).length > 0
      ? prisma.readerProfile.update({
          where: { id: owner.profileId },
          data: profileData,
        })
      : prisma.readerProfile.findUniqueOrThrow({
          where: { id: owner.profileId },
        }),
    prisma.readerListeningSession.upsert({
      where: {
        readerProfileId_documentKey: {
          readerProfileId: owner.profileId,
          documentKey: resolvedDocumentKey,
        },
      },
      update: {
        mode: toPrismaPlaybackScope(mode),
        scopeStartNodeId: trimOptionalValue(scopeStartNodeId),
        scopeEndNodeId: trimOptionalValue(scopeEndNodeId),
        activeNodeId: trimOptionalValue(activeNodeId),
        activeSectionSlug: trimOptionalValue(activeSectionSlug),
        nodeOffsetMs: Math.max(0, Math.round(Number(nodeOffsetMs) || 0)),
        rate: clampListeningRate(rate, normalizedRate),
        provider: toPrismaVoiceProvider(normalizedProvider),
        voiceId: trimOptionalValue(voiceId),
        status: toPrismaListeningStatus(normalizeListeningStatus(status)),
        updatedAt: new Date(),
      },
      create: {
        userId: owner.userId,
        readerProfileId: owner.profileId,
        documentKey: resolvedDocumentKey,
        mode: toPrismaPlaybackScope(mode),
        scopeStartNodeId: trimOptionalValue(scopeStartNodeId),
        scopeEndNodeId: trimOptionalValue(scopeEndNodeId),
        activeNodeId: trimOptionalValue(activeNodeId),
        activeSectionSlug: trimOptionalValue(activeSectionSlug),
        nodeOffsetMs: Math.max(0, Math.round(Number(nodeOffsetMs) || 0)),
        rate: clampListeningRate(rate, normalizedRate),
        provider: toPrismaVoiceProvider(normalizedProvider),
        voiceId: trimOptionalValue(voiceId),
        status: toPrismaListeningStatus(normalizeListeningStatus(status)),
      },
    }),
  ]);

  return {
    listeningSession: serializeListeningSession(session),
    voicePreferences: serializeVoicePreferences(profile),
  };
}

export async function loadConversationThreadForUser(
  userId,
  documentKey = PRIMARY_DOCUMENT_KEY,
) {
  const owner = await resolveWorkspaceOwner(userId);
  if (!owner) return null;

  const thread = await ensureThreadRecord(owner, documentKey);
  return serializeThread(thread);
}

export async function loadEvidenceSetForUser(
  userId,
  documentKey = PRIMARY_DOCUMENT_KEY,
) {
  const owner = await resolveWorkspaceOwner(userId);
  if (!owner) return null;

  const evidenceSet = await ensureEvidenceSetRecord(owner, documentKey);
  return serializeEvidenceSet(evidenceSet);
}

export async function appendConversationExchangeForUser(
  userId,
  {
    documentKey = PRIMARY_DOCUMENT_KEY,
    userLine,
    answer,
    citations = [],
    userCitations = [],
    assistantCitations = citations,
  } = {},
) {
  const owner = await resolveWorkspaceOwner(userId);
  if (!owner) {
    return null;
  }

  const thread = await ensureThreadRecord(owner, documentKey);

  const [userMessage, assistantMessage] = await prisma.$transaction([
    prisma.readerConversationMessage.create({
      data: {
        threadId: thread.id,
        role: "USER",
        content: userLine,
        citations: Array.isArray(userCitations) ? userCitations : [],
      },
    }),
    prisma.readerConversationMessage.create({
      data: {
        threadId: thread.id,
        role: "ASSISTANT",
        content: answer,
        citations: Array.isArray(assistantCitations) ? assistantCitations : [],
      },
    }),
    prisma.readerConversationThread.update({
      where: {
        id: thread.id,
      },
      data: {
        updatedAt: new Date(),
      },
    }),
  ]);

  return {
    threadId: thread.id,
    userMessage: serializeConversationMessage(userMessage),
    assistantMessage: serializeConversationMessage(assistantMessage),
  };
}

function normalizeOrigin(value) {
  return String(value || "reader").trim().toUpperCase();
}

function normalizeSourceType(value) {
  return String(value || "passage").trim().toUpperCase();
}

async function findExistingEvidenceItem(evidenceSetId, input) {
  if (input.sourceMarkId) {
    return prisma.readerEvidenceItem.findFirst({
      where: {
        evidenceSetId,
        sourceMarkId: input.sourceMarkId,
      },
    });
  }

  if (input.sourceMessageId && input.sourceCitationId) {
    return prisma.readerEvidenceItem.findFirst({
      where: {
        evidenceSetId,
        sourceMessageId: input.sourceMessageId,
        sourceCitationId: input.sourceCitationId,
      },
    });
  }

  if (input.blockId && input.quote) {
    return prisma.readerEvidenceItem.findFirst({
      where: {
        evidenceSetId,
        origin: normalizeOrigin(input.origin),
        sourceType: normalizeSourceType(input.sourceType),
        sectionSlug: input.sectionSlug,
        blockId: input.blockId,
        quote: input.quote,
      },
    });
  }

  if (input.sectionSlug && input.excerpt) {
    return prisma.readerEvidenceItem.findFirst({
      where: {
        evidenceSetId,
        origin: normalizeOrigin(input.origin),
        sourceType: normalizeSourceType(input.sourceType),
        sectionSlug: input.sectionSlug,
        excerpt: input.excerpt,
      },
    });
  }

  return null;
}

export async function addEvidenceItemForUser(
  userId,
  {
    documentKey = PRIMARY_DOCUMENT_KEY,
    origin = "reader",
    sourceType = "passage",
    sectionSlug,
    sectionTitle,
    blockId = null,
    startOffset = null,
    endOffset = null,
    quote,
    excerpt,
    noteText = "",
    sourceMarkId = null,
    sourceMessageId = null,
    sourceCitationId = null,
  } = {},
) {
  const owner = await resolveWorkspaceOwner(userId);
  if (!owner) {
    return null;
  }

  const evidenceSet = await ensureEvidenceSetRecord(owner, documentKey);
  const normalizedQuote = String(quote || excerpt || "").trim();
  const normalizedExcerpt = buildExcerpt(excerpt || normalizedQuote, 220);

  if (!sectionSlug || !sectionTitle || !normalizedQuote || !normalizedExcerpt) {
    throw new Error("Evidence items need section context and excerpted text.");
  }

  const existing = await findExistingEvidenceItem(evidenceSet.id, {
    origin,
    sourceType,
    sectionSlug,
    blockId,
    quote: normalizedQuote,
    excerpt: normalizedExcerpt,
    sourceMarkId,
    sourceMessageId,
    sourceCitationId,
  });

  if (existing) {
    const updated = await prisma.readerEvidenceItem.update({
      where: {
        id: existing.id,
      },
      data: {
        sectionSlug,
        sectionTitle,
        blockId,
        startOffset:
          typeof startOffset === "number" && Number.isFinite(startOffset) ? startOffset : null,
        endOffset: typeof endOffset === "number" && Number.isFinite(endOffset) ? endOffset : null,
        quote: normalizedQuote,
        excerpt: normalizedExcerpt,
        noteText: String(noteText || "").trim() || null,
      },
    });

    return serializeEvidenceItem(updated);
  }

  const item = await prisma.readerEvidenceItem.create({
    data: {
      evidenceSetId: evidenceSet.id,
      origin: normalizeOrigin(origin),
      sourceType: normalizeSourceType(sourceType),
      sectionSlug,
      sectionTitle,
      blockId,
      startOffset:
        typeof startOffset === "number" && Number.isFinite(startOffset) ? startOffset : null,
      endOffset: typeof endOffset === "number" && Number.isFinite(endOffset) ? endOffset : null,
      quote: normalizedQuote,
      excerpt: normalizedExcerpt,
      noteText: String(noteText || "").trim() || null,
      sourceMarkId: sourceMarkId || null,
      sourceMessageId: sourceMessageId || null,
      sourceCitationId: sourceCitationId || null,
    },
  });

  return serializeEvidenceItem(item);
}

export async function removeEvidenceItemForUser(userId, itemId) {
  const owner = await resolveWorkspaceOwner(userId);
  if (!owner) return false;

  const item = await prisma.readerEvidenceItem.findFirst({
    where: {
      id: itemId,
      evidenceSet: {
        readerProfileId: owner.profileId,
      },
    },
  });

  if (!item) {
    return false;
  }

  await prisma.readerEvidenceItem.delete({
    where: {
      id: itemId,
    },
  });

  return true;
}

export async function getEvidenceItemsForUser(
  userId,
  {
    documentKey = PRIMARY_DOCUMENT_KEY,
    evidenceItemIds = [],
  } = {},
) {
  const owner = await resolveWorkspaceOwner(userId);
  if (!owner) return [];

  if (!Array.isArray(evidenceItemIds) || evidenceItemIds.length === 0) {
    return [];
  }

  const items = await prisma.readerEvidenceItem.findMany({
    where: {
      id: {
        in: evidenceItemIds,
      },
      evidenceSet: {
        readerProfileId: owner.profileId,
        documentKey,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return items.map(serializeEvidenceItem);
}
