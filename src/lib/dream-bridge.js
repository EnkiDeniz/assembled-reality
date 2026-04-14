const BRIDGE_KEY = "assembled-reality:dream-bridge:v1";
const BRIDGE_KINDS = new Set(["passage", "note", "witness"]);
const BRIDGE_STATES = new Set(["pending", "armed", "dismissed", "sent"]);

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeLongText(value = "") {
  return String(value || "").trim();
}

function normalizeSavedAt(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return new Date().toISOString();
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString();
}

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

export function normalizeDreamBridgePayload(payload = null) {
  const nextPayload = payload && typeof payload === "object" ? payload : null;
  if (!nextPayload) return null;

  const documentId = normalizeText(nextPayload.documentId);
  const excerpt = normalizeLongText(nextPayload.excerpt);
  if (!documentId || !excerpt) return null;

  const kind = normalizeText(nextPayload.kind).toLowerCase();
  const state = normalizeText(nextPayload.state).toLowerCase();
  const sourceLabel =
    normalizeText(nextPayload.sourceLabel) ||
    normalizeText(nextPayload.documentTitle) ||
    "Library document";
  const provenanceLabel = normalizeText(nextPayload.provenanceLabel) || "From Library";

  return {
    kind: BRIDGE_KINDS.has(kind) ? kind : "passage",
    state: BRIDGE_STATES.has(state) ? state : "pending",
    documentId,
    documentTitle: normalizeText(nextPayload.documentTitle) || sourceLabel,
    sourceLabel,
    provenanceLabel,
    anchor: normalizeText(nextPayload.anchor) || null,
    excerpt,
    savedAt: normalizeSavedAt(nextPayload.savedAt),
  };
}

export function saveDreamBridgePayload(payload = null) {
  const normalizedPayload = normalizeDreamBridgePayload(payload);
  if (!normalizedPayload) return;
  saveJson(BRIDGE_KEY, normalizedPayload);
}

export function loadDreamBridgePayload() {
  return normalizeDreamBridgePayload(loadJson(BRIDGE_KEY));
}

export function clearDreamBridgePayload() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(BRIDGE_KEY);
}
