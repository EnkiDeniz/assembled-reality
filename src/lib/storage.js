const UNLOCK_KEY = "assembled-reality:unlock";
const PREFS_KEY = "assembled-reality:reader-preferences";

export const DEFAULT_READER_PREFERENCES = {
  theme: "paper",
  textSize: "medium",
  pageWidth: "standard",
};

export function loadUnlockState() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(UNLOCK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUnlockState(value) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(UNLOCK_KEY, JSON.stringify(value));
}

export function clearUnlockState() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(UNLOCK_KEY);
}

export function loadReaderPreferences() {
  if (typeof window === "undefined") return DEFAULT_READER_PREFERENCES;

  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_READER_PREFERENCES;
    return { ...DEFAULT_READER_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_READER_PREFERENCES;
  }
}

export function saveReaderPreferences(value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(value));
}
