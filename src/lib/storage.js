const UNLOCK_KEY = "assembled-reality:unlock";
const SESSION_UNLOCK_KEY = UNLOCK_KEY;
const PREFS_KEY = "assembled-reality:reader-preferences";
const UNLOCK_EVENT = "assembled-reality:unlock-change";
const PREFS_EVENT = "assembled-reality:reader-preferences-change";

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

    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveUnlockState(value) {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(value);
  window.localStorage.setItem(UNLOCK_KEY, serialized);
  window.sessionStorage.setItem(SESSION_UNLOCK_KEY, serialized);
  window.dispatchEvent(new Event(UNLOCK_EVENT));
}

export function clearUnlockState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(UNLOCK_KEY);
  window.sessionStorage.removeItem(SESSION_UNLOCK_KEY);
  window.dispatchEvent(new Event(UNLOCK_EVENT));
}

export function loadReaderPreferences() {
  if (typeof window === "undefined") return DEFAULT_READER_PREFERENCES;

  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_READER_PREFERENCES;

    return normalizeReaderPreferences(JSON.parse(raw));
  } catch {
    return DEFAULT_READER_PREFERENCES;
  }
}

export function saveReaderPreferences(value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(normalizeReaderPreferences(value)));
  window.dispatchEvent(new Event(PREFS_EVENT));
}

export function subscribeUnlockState(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event) => {
    if (!event || event.key == null || event.key === UNLOCK_KEY) {
      callback();
    }
  };

  window.addEventListener(UNLOCK_EVENT, callback);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(UNLOCK_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}

export function subscribeReaderPreferences(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event) => {
    if (!event || event.key == null || event.key === PREFS_KEY) {
      callback();
    }
  };

  window.addEventListener(PREFS_EVENT, callback);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(PREFS_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}
