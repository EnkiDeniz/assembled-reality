const ANNOTATIONS_KEY = "assembled-reality:reader-marks";

export const EMPTY_READER_ANNOTATIONS = {
  bookmarks: [],
  highlights: [],
  notes: [],
};

function createId(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeStore(value) {
  return {
    bookmarks: Array.isArray(value?.bookmarks) ? value.bookmarks : [],
    highlights: Array.isArray(value?.highlights) ? value.highlights : [],
    notes: Array.isArray(value?.notes) ? value.notes : [],
  };
}

function buildExcerpt(text, limit = 140) {
  const normalized = (text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized.length <= limit ? normalized : `${normalized.slice(0, limit - 1).trimEnd()}…`;
}

export function loadReaderAnnotations() {
  if (typeof window === "undefined") return EMPTY_READER_ANNOTATIONS;

  try {
    const raw = window.localStorage.getItem(ANNOTATIONS_KEY);
    if (!raw) return EMPTY_READER_ANNOTATIONS;
    return normalizeStore(JSON.parse(raw));
  } catch {
    return EMPTY_READER_ANNOTATIONS;
  }
}

export function saveReaderAnnotations(value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ANNOTATIONS_KEY, JSON.stringify(normalizeStore(value)));
}

export function hasSectionBookmark(store, sectionSlug) {
  return store.bookmarks.some((bookmark) => bookmark.sectionSlug === sectionSlug);
}

export function toggleSectionBookmark(store, bookmarkInput) {
  const exists = store.bookmarks.find(
    (bookmark) => bookmark.sectionSlug === bookmarkInput.sectionSlug,
  );

  if (exists) {
    return {
      ...store,
      bookmarks: store.bookmarks.filter((bookmark) => bookmark.sectionSlug !== bookmarkInput.sectionSlug),
    };
  }

  const bookmark = {
    id: createId("bookmark"),
    type: "bookmark",
    sectionSlug: bookmarkInput.sectionSlug,
    label: bookmarkInput.label,
    excerpt: buildExcerpt(bookmarkInput.excerpt || bookmarkInput.label),
    createdAt: new Date().toISOString(),
  };

  return {
    ...store,
    bookmarks: [bookmark, ...store.bookmarks],
  };
}

function hasMatchingRange(collection, anchor) {
  return collection.some(
    (item) =>
      item.blockId === anchor.blockId &&
      item.startOffset === anchor.startOffset &&
      item.endOffset === anchor.endOffset &&
      item.quote === anchor.quote,
  );
}

export function addHighlight(store, anchor) {
  if (hasMatchingRange(store.highlights, anchor)) return store;

  const highlight = {
    id: createId("highlight"),
    type: "highlight",
    sectionSlug: anchor.sectionSlug,
    sectionTitle: anchor.sectionTitle,
    blockId: anchor.blockId,
    startOffset: anchor.startOffset,
    endOffset: anchor.endOffset,
    quote: anchor.quote,
    excerpt: buildExcerpt(anchor.quote),
    createdAt: new Date().toISOString(),
    color: "paper-gold",
  };

  return {
    ...store,
    highlights: [highlight, ...store.highlights],
  };
}

export function addNote(store, anchor, noteText) {
  const normalizedNote = noteText.trim();
  if (!normalizedNote) return store;

  const note = {
    id: createId("note"),
    type: "note",
    sectionSlug: anchor.sectionSlug,
    sectionTitle: anchor.sectionTitle,
    blockId: anchor.blockId,
    startOffset: anchor.startOffset,
    endOffset: anchor.endOffset,
    quote: anchor.quote,
    excerpt: buildExcerpt(anchor.quote),
    noteText: normalizedNote,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    ...store,
    notes: [note, ...store.notes],
  };
}

export function deleteBookmark(store, bookmarkId) {
  return {
    ...store,
    bookmarks: store.bookmarks.filter((bookmark) => bookmark.id !== bookmarkId),
  };
}

export function deleteHighlight(store, highlightId) {
  return {
    ...store,
    highlights: store.highlights.filter((highlight) => highlight.id !== highlightId),
  };
}

export function deleteNote(store, noteId) {
  return {
    ...store,
    notes: store.notes.filter((note) => note.id !== noteId),
  };
}

export function updateNote(store, noteId, nextText) {
  const normalizedNote = nextText.trim();
  if (!normalizedNote) return store;

  return {
    ...store,
    notes: store.notes.map((note) =>
      note.id === noteId
        ? {
            ...note,
            noteText: normalizedNote,
            updatedAt: new Date().toISOString(),
          }
        : note,
    ),
  };
}

export function getRenderableMarksByBlock(store) {
  const grouped = new Map();

  const register = (mark, kind) => {
    if (!mark.blockId) return;

    const list = grouped.get(mark.blockId) || [];
    list.push({
      id: mark.id,
      type: kind,
      startOffset: mark.startOffset,
      endOffset: mark.endOffset,
      noteText: kind === "note" ? mark.noteText : "",
      quote: mark.quote,
    });
    grouped.set(mark.blockId, list);
  };

  store.highlights.forEach((highlight) => register(highlight, "highlight"));
  store.notes.forEach((note) => register(note, "note"));

  return Object.fromEntries(
    [...grouped.entries()].map(([blockId, marks]) => [
      blockId,
      marks.toSorted((left, right) => {
        if (left.startOffset === right.startOffset) {
          return left.endOffset - right.endOffset;
        }

        return left.startOffset - right.startOffset;
      }),
    ]),
  );
}
