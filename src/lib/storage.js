const UNLOCK_KEY = "assembled-reality:unlock";
const SESSION_UNLOCK_KEY = UNLOCK_KEY;
const PREFS_KEY = "assembled-reality:reader-preferences";

export const DEFAULT_READER_PREFERENCES = {
  theme: "dark",
  textSize: "medium",
  pageWidth: "standard",
};

function normalizeTheme(theme) {
  if (theme === "paper") return "dark";
  if (theme === "light" || theme === "dark") return theme;
  return DEFAULT_READER_PREFERENCES.theme;
}

export function normalizeReaderPreferences(value) {
  const next = {
    ...DEFAULT_READER_PREFERENCES,
    ...(value && typeof value === "object" ? value : {}),
  };

  return {
    ...next,
    theme: normalizeTheme(next.theme),
  };
}

export function loadUnlockState() {
  if (typeof window === "undefined") return null;

  try {
    const persisted = window.localStorage.getItem(UNLOCK_KEY);
    if (persisted) {
      return JSON.parse(persisted);
    }

    const raw = window.sessionStorage.getItem(SESSION_UNLOCK_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    window.localStorage.setItem(UNLOCK_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    return null;
  }
}

export function saveUnlockState(value) {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(value);
  window.localStorage.setItem(UNLOCK_KEY, serialized);
  window.sessionStorage.setItem(SESSION_UNLOCK_KEY, serialized);
}

export function clearUnlockState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(UNLOCK_KEY);
  window.sessionStorage.removeItem(SESSION_UNLOCK_KEY);
}

export function loadReaderPreferences() {
  if (typeof window === "undefined") return DEFAULT_READER_PREFERENCES;

  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_READER_PREFERENCES;

    const preferences = normalizeReaderPreferences(JSON.parse(raw));
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
    return preferences;
  } catch {
    return DEFAULT_READER_PREFERENCES;
  }
}

export function saveReaderPreferences(value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(normalizeReaderPreferences(value)));
}
