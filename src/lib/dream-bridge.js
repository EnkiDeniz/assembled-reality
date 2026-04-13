const BRIDGE_KEY = "assembled-reality:dream-bridge:v1";

function loadJson(key) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveJson(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function saveDreamBridgePayload(payload = null) {
  if (!payload?.documentId) return;

  saveJson(BRIDGE_KEY, {
    documentId: String(payload.documentId || "").trim(),
    anchor: String(payload.anchor || "").trim(),
    excerpt: String(payload.excerpt || "").trim(),
    action: String(payload.action || "witness").trim() || "witness",
    savedAt: new Date().toISOString(),
  });
}

export function loadDreamBridgePayload() {
  return loadJson(BRIDGE_KEY);
}

export function clearDreamBridgePayload() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(BRIDGE_KEY);
}
