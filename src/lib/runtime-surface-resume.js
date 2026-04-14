const RUNTIME_SURFACE_RESUME_KEY = "assembled-reality:runtime-surface-resume:v1";

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function readJson(key) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore local persistence failures and keep the runtime usable.
  }
}

function normalizeRoomState(room = null) {
  const nextRoom = room && typeof room === "object" ? room : null;
  if (!nextRoom) return null;

  const projectKey = normalizeText(nextRoom.projectKey);
  const sessionId = normalizeText(nextRoom.sessionId);
  if (!projectKey || !sessionId) return null;

  return {
    projectKey,
    sessionId,
    title: normalizeText(nextRoom.title) || "Room",
    updatedAt: normalizeText(nextRoom.updatedAt) || new Date().toISOString(),
  };
}

function normalizeLibraryState(library = null) {
  const nextLibrary = library && typeof library === "object" ? library : null;
  if (!nextLibrary) return null;

  const documentId = normalizeText(nextLibrary.documentId);
  if (!documentId) return null;

  return {
    documentId,
    title: normalizeText(nextLibrary.title) || "Library",
    anchor: normalizeText(nextLibrary.anchor) || "",
    updatedAt: normalizeText(nextLibrary.updatedAt) || new Date().toISOString(),
  };
}

export function loadRuntimeSurfaceResumeState() {
  const state = readJson(RUNTIME_SURFACE_RESUME_KEY);
  if (!state || typeof state !== "object") return null;

  return {
    lastSurface: normalizeText(state.lastSurface).toLowerCase(),
    lastSeenAt: normalizeText(state.lastSeenAt) || "",
    room: normalizeRoomState(state.room),
    library: normalizeLibraryState(state.library),
  };
}

export function saveRuntimeSurfaceResumeState({ surface = "", room = null, library = null } = {}) {
  const current = loadRuntimeSurfaceResumeState() || {};
  const nextSurface = normalizeText(surface).toLowerCase();

  writeJson(RUNTIME_SURFACE_RESUME_KEY, {
    lastSurface: nextSurface || current.lastSurface || "",
    lastSeenAt: new Date().toISOString(),
    room: normalizeRoomState(room) || current.room || null,
    library: normalizeLibraryState(library) || current.library || null,
  });
}

export function clearRuntimeSurfaceResumeLibrary() {
  const current = loadRuntimeSurfaceResumeState() || {};

  writeJson(RUNTIME_SURFACE_RESUME_KEY, {
    lastSurface: current.lastSurface || "",
    lastSeenAt: new Date().toISOString(),
    room: normalizeRoomState(current.room),
    library: null,
  });
}
