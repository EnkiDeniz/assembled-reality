export const EMPTY_READER_ANNOTATIONS = {
  bookmarks: [],
  highlights: [],
  notes: [],
};

export function normalizeIncomingStore(value) {
  return {
    bookmarks: Array.isArray(value?.bookmarks) ? value.bookmarks : [],
    highlights: Array.isArray(value?.highlights) ? value.highlights : [],
    notes: Array.isArray(value?.notes) ? value.notes : [],
  };
}
