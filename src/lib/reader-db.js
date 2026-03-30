import { ReaderCohort } from "@prisma/client";
import {
  EMPTY_READER_ANNOTATIONS,
  normalizeIncomingStore,
} from "@/lib/reader-store";
import { buildExcerpt, slugify } from "@/lib/text";
import { isFoundingReaderName } from "@/lib/founding-readers";
import { prisma } from "@/lib/prisma";

function toAnnotationStore({ bookmarks, highlights, notes }) {
  return {
    bookmarks: bookmarks.map((bookmark) => ({
      id: bookmark.id,
      type: "bookmark",
      sectionSlug: bookmark.sectionSlug,
      label: bookmark.label,
      excerpt: bookmark.excerpt,
      createdAt: bookmark.createdAt.toISOString(),
      updatedAt: bookmark.updatedAt.toISOString(),
      ownerName: bookmark.readerProfile?.displayName || null,
    })),
    highlights: highlights.map((highlight) => ({
      id: highlight.id,
      type: "highlight",
      sectionSlug: highlight.sectionSlug,
      sectionTitle: highlight.sectionTitle,
      blockId: highlight.blockId,
      startOffset: highlight.startOffset,
      endOffset: highlight.endOffset,
      quote: highlight.quote,
      excerpt: highlight.excerpt,
      color: highlight.color,
      createdAt: highlight.createdAt.toISOString(),
      updatedAt: highlight.updatedAt.toISOString(),
      ownerName: highlight.readerProfile?.displayName || null,
    })),
    notes: notes.map((note) => ({
      id: note.id,
      type: "note",
      sectionSlug: note.sectionSlug,
      sectionTitle: note.sectionTitle,
      blockId: note.blockId,
      startOffset: note.startOffset,
      endOffset: note.endOffset,
      quote: note.quote,
      excerpt: note.excerpt,
      noteText: note.noteText,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
      ownerName: note.readerProfile?.displayName || null,
    })),
  };
}

function buildUniqueSlug(base, existing) {
  if (!existing.has(base)) return base;

  let index = 2;
  while (existing.has(`${base}-${index}`)) {
    index += 1;
  }

  return `${base}-${index}`;
}

export async function ensureReaderProfileForUser(user, preferredName) {
  const existing = await prisma.readerProfile.findUnique({
    where: { userId: user.id },
  });

  if (existing) {
    return existing;
  }

  const baseName = preferredName?.trim() || user.name?.trim() || user.email?.split("@")[0] || "Reader";
  const baseSlug = slugify(baseName) || `reader-${user.id.slice(0, 8)}`;
  const siblingSlugs = new Set(
    (
      await prisma.readerProfile.findMany({
        select: { readerSlug: true },
      })
    ).map((entry) => entry.readerSlug),
  );
  const readerSlug = buildUniqueSlug(baseSlug, siblingSlugs);

  return prisma.readerProfile.create({
    data: {
      userId: user.id,
      displayName: baseName,
      readerSlug,
      cohort: isFoundingReaderName(baseName) ? ReaderCohort.FOUNDING : ReaderCohort.MEMBER,
      canViewSeven: true,
    },
  });
}

export async function getReaderProfileByUserId(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { readerProfile: true, getReceiptsConnection: true },
  });

  if (!user) return null;
  const profile = user.readerProfile || (await ensureReaderProfileForUser(user));
  return {
    user,
    profile,
    getReceiptsConnection: user.getReceiptsConnection,
  };
}

export async function loadReaderPageData(userId) {
  const resolved = await getReaderProfileByUserId(userId);
  if (!resolved) return null;

  const { profile, getReceiptsConnection } = resolved;

  const [bookmarks, highlights, notes, progress] = await Promise.all([
    prisma.bookmark.findMany({
      where: { readerProfileId: profile.id },
      orderBy: { createdAt: "desc" },
      include: { readerProfile: true },
    }),
    prisma.highlight.findMany({
      where: { readerProfileId: profile.id },
      orderBy: { createdAt: "desc" },
      include: { readerProfile: true },
    }),
    prisma.note.findMany({
      where: { readerProfileId: profile.id },
      orderBy: { updatedAt: "desc" },
      include: { readerProfile: true },
    }),
    prisma.readingProgress.findUnique({
      where: { readerProfileId: profile.id },
    }),
  ]);

  return {
    profile,
    getReceiptsConnection,
    annotations: toAnnotationStore({ bookmarks, highlights, notes }),
    progress: progress
      ? {
          sectionSlug: progress.sectionSlug,
          progressPercent: progress.progressPercent,
          updatedAt: progress.updatedAt.toISOString(),
        }
      : null,
  };
}

export async function loadSevenAggregate() {
  const [bookmarks, highlights, notes] = await Promise.all([
    prisma.bookmark.findMany({
      where: { readerProfile: { cohort: ReaderCohort.FOUNDING } },
      orderBy: { createdAt: "desc" },
      include: { readerProfile: true },
    }),
    prisma.highlight.findMany({
      where: { readerProfile: { cohort: ReaderCohort.FOUNDING } },
      orderBy: { createdAt: "desc" },
      include: { readerProfile: true },
    }),
    prisma.note.findMany({
      where: { readerProfile: { cohort: ReaderCohort.FOUNDING } },
      orderBy: { updatedAt: "desc" },
      include: { readerProfile: true },
    }),
  ]);

  return toAnnotationStore({ bookmarks, highlights, notes });
}

export async function saveReaderAnnotationsForUser(userId, nextStore) {
  const resolved = await getReaderProfileByUserId(userId);
  if (!resolved) return null;

  const { profile } = resolved;
  const store = normalizeIncomingStore(nextStore);

  await prisma.$transaction([
    prisma.bookmark.deleteMany({ where: { readerProfileId: profile.id } }),
    prisma.highlight.deleteMany({ where: { readerProfileId: profile.id } }),
    prisma.note.deleteMany({ where: { readerProfileId: profile.id } }),
    ...(store.bookmarks.length
      ? [
          prisma.bookmark.createMany({
            data: store.bookmarks.map((bookmark) => ({
              id: bookmark.id,
              readerProfileId: profile.id,
              sectionSlug: bookmark.sectionSlug,
              label: bookmark.label,
              excerpt: buildExcerpt(bookmark.excerpt || bookmark.label),
              createdAt: bookmark.createdAt ? new Date(bookmark.createdAt) : new Date(),
            })),
          }),
        ]
      : []),
    ...(store.highlights.length
      ? [
          prisma.highlight.createMany({
            data: store.highlights.map((highlight) => ({
              id: highlight.id,
              readerProfileId: profile.id,
              sectionSlug: highlight.sectionSlug,
              sectionTitle: highlight.sectionTitle,
              blockId: highlight.blockId,
              startOffset: highlight.startOffset,
              endOffset: highlight.endOffset,
              quote: highlight.quote,
              excerpt: buildExcerpt(highlight.excerpt || highlight.quote),
              color: highlight.color || "paper-gold",
              createdAt: highlight.createdAt ? new Date(highlight.createdAt) : new Date(),
            })),
          }),
        ]
      : []),
    ...(store.notes.length
      ? [
          prisma.note.createMany({
            data: store.notes.map((note) => ({
              id: note.id,
              readerProfileId: profile.id,
              sectionSlug: note.sectionSlug,
              sectionTitle: note.sectionTitle,
              blockId: note.blockId,
              startOffset: note.startOffset,
              endOffset: note.endOffset,
              quote: note.quote,
              excerpt: buildExcerpt(note.excerpt || note.quote),
              noteText: note.noteText,
              createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
              updatedAt: note.updatedAt ? new Date(note.updatedAt) : new Date(),
            })),
          }),
        ]
      : []),
  ]);

  return loadReaderPageData(userId);
}

export async function saveReadingProgressForUser(userId, nextProgress) {
  const resolved = await getReaderProfileByUserId(userId);
  if (!resolved || !nextProgress?.sectionSlug) return null;

  const { profile } = resolved;

  return prisma.readingProgress.upsert({
    where: { readerProfileId: profile.id },
    update: {
      sectionSlug: nextProgress.sectionSlug,
      progressPercent: Math.max(0, Math.min(100, Number(nextProgress.progressPercent) || 0)),
      updatedAt: new Date(),
    },
    create: {
      readerProfileId: profile.id,
      sectionSlug: nextProgress.sectionSlug,
      progressPercent: Math.max(0, Math.min(100, Number(nextProgress.progressPercent) || 0)),
    },
  });
}

export async function createReadingReceiptDraftForUser(userId, draftInput) {
  const resolved = await getReaderProfileByUserId(userId);
  if (!resolved) return null;

  const { profile } = resolved;

  return prisma.readingReceiptDraft.create({
    data: {
      userId,
      readerProfileId: profile.id,
      getReceiptsReceiptId: draftInput.getReceiptsReceiptId || null,
      status: draftInput.status || "LOCAL_DRAFT",
      title: draftInput.title || null,
      sourceSections: Array.isArray(draftInput.sourceSections) ? draftInput.sourceSections : [],
      sourceMarkIds: Array.isArray(draftInput.sourceMarkIds) ? draftInput.sourceMarkIds : [],
      payload: draftInput.payload || null,
    },
  });
}

export async function listReadingReceiptDraftsForUser(userId) {
  const resolved = await getReaderProfileByUserId(userId);
  if (!resolved) return [];

  return prisma.readingReceiptDraft.findMany({
    where: {
      userId,
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
}

export async function updateReaderProfileForUser(userId, input) {
  const resolved = await getReaderProfileByUserId(userId);
  if (!resolved) return null;

  const displayName = String(input?.displayName || "").trim();
  if (!displayName) {
    throw new Error("Display name is required.");
  }

  const updated = await prisma.readerProfile.update({
    where: { id: resolved.profile.id },
    data: {
      displayName,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { name: displayName },
  });

  return updated;
}
