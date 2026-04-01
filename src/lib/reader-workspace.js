import { prisma } from "@/lib/prisma";
import { getReaderProfileByUserId } from "@/lib/reader-db";
import { PRIMARY_DOCUMENT_KEY } from "@/lib/document";
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

async function resolveWorkspaceOwner(userId) {
  const resolved = await getReaderProfileByUserId(userId);
  if (!resolved?.profile) {
    return null;
  }

  return {
    userId,
    profileId: resolved.profile.id,
    profile: resolved.profile,
  };
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

  const [thread, evidenceSet] = await Promise.all([
    ensureThreadRecord(owner, documentKey),
    ensureEvidenceSetRecord(owner, documentKey),
  ]);

  return {
    thread: serializeThread(thread),
    evidenceSet: serializeEvidenceSet(evidenceSet),
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
      },
    }),
    prisma.readerConversationMessage.create({
      data: {
        threadId: thread.id,
        role: "ASSISTANT",
        content: answer,
        citations,
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
