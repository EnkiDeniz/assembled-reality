export const ROOM_METADATA_VERSION = 2;
export const ROOM_THREAD_PREFIX = "room:";
export const ROOM_PAYLOAD_KIND = "room_payload";
export const ROOM_LEGACY_SEED_MODE = "comments-only";
export const ROOM_TURN_MODES = new Set(["conversation", "proposal"]);

const ROOM_FIELD_TONES = new Set([
  "new",
  "open",
  "grounded",
  "awaiting",
  "sealed",
  "flagged",
  "rerouted",
]);

const RECEIPT_KIT_ARTIFACT_TYPES = new Set([
  "upload",
  "paste",
  "draft_message",
  "link",
  "checklist",
  "compare",
]);

const RECEIPT_DIRECTIONS = new Set([
  "confirms",
  "contradicts",
  "narrows",
  "surprises",
]);

const SEGMENT_DOMAINS = new Set([
  "aim",
  "witness",
  "evidence",
  "story",
  "move",
  "test",
  "return",
  "receipt",
  "field",
  "other",
]);

const SEGMENT_INTENTS = new Set([
  "declare",
  "ground",
  "interpret",
  "move",
  "test",
  "observe",
  "compare",
  "capture",
  "clarify",
]);

const MIRROR_REGIONS = new Set(["aim", "evidence", "story", "moves", "returns"]);

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeLongText(value = "") {
  return String(value || "").trim();
}

function normalizeDateString(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

function toRoomSlug(value = "") {
  return (
    normalizeText(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "box"
  );
}

export function escapeLoeString(value = "") {
  return String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').trim();
}

export function deriveMirrorRegionFromDomain(domain = "") {
  const normalizedDomain = normalizeText(domain).toLowerCase();
  if (normalizedDomain === "aim") return "aim";
  if (normalizedDomain === "witness" || normalizedDomain === "evidence") return "evidence";
  if (normalizedDomain === "story") return "story";
  if (normalizedDomain === "move" || normalizedDomain === "test") return "moves";
  if (normalizedDomain === "return" || normalizedDomain === "receipt") return "returns";
  return "";
}

export function makeRoomId(prefix = "room") {
  const base = normalizeText(prefix).toLowerCase().replace(/[^a-z0-9]+/g, "-") || "room";
  return `${base}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildRoomThreadKey(projectKey = "") {
  const normalizedProjectKey = normalizeText(projectKey) || "default-project";
  return `${ROOM_THREAD_PREFIX}${normalizedProjectKey}`;
}

export function buildRoomDocumentRef(projectKey = "") {
  return `room_${toRoomSlug(projectKey)}`;
}

export function buildInitialRoomAssemblySource(projectKey = "") {
  return `GND box @${buildRoomDocumentRef(projectKey)}`;
}

function normalizeReceiptKitArtifact(artifact = null) {
  const nextArtifact = artifact && typeof artifact === "object" ? artifact : {};
  const type = normalizeText(nextArtifact.type).toLowerCase();
  if (!RECEIPT_KIT_ARTIFACT_TYPES.has(type)) return null;

  return {
    type,
    config: nextArtifact.config && typeof nextArtifact.config === "object" ? nextArtifact.config : {},
  };
}

export function normalizeReceiptKit(value = null) {
  const nextValue = value && typeof value === "object" ? value : null;
  if (!nextValue) return null;

  const artifact = normalizeReceiptKitArtifact(nextValue.artifact);
  if (!artifact) return null;

  const direction = normalizeText(nextValue?.prediction?.direction).toLowerCase();

  return {
    id: normalizeText(nextValue.id) || makeRoomId("kit"),
    need: normalizeText(nextValue.need),
    why: normalizeText(nextValue.why),
    fastestPath: normalizeText(nextValue.fastestPath),
    artifact,
    enough: normalizeText(nextValue.enough),
    prediction: {
      expected: normalizeText(nextValue?.prediction?.expected),
      direction: RECEIPT_DIRECTIONS.has(direction) ? direction : "narrows",
      timebound: normalizeText(nextValue?.prediction?.timebound),
      surprise: normalizeText(nextValue?.prediction?.surprise),
    },
  };
}

export function normalizeRoomProposalSegment(value = null, index = 0) {
  const nextValue = value && typeof value === "object" ? value : {};
  const suggestedClause =
    normalizeLongText(nextValue.suggestedClause) || normalizeLongText(nextValue.loe);
  const text = normalizeLongText(nextValue.text);
  if (!text && !suggestedClause) return null;

  const domain = normalizeText(nextValue.domain).toLowerCase();
  const intent = normalizeText(nextValue.intent).toLowerCase();
  const mirrorRegion = normalizeText(nextValue.mirrorRegion).toLowerCase();

  return {
    id: normalizeText(nextValue.id) || makeRoomId(`segment-${index + 1}`),
    text: text || suggestedClause,
    domain: SEGMENT_DOMAINS.has(domain) ? domain : "other",
    mirrorRegion: MIRROR_REGIONS.has(mirrorRegion)
      ? mirrorRegion
      : deriveMirrorRegionFromDomain(domain),
    suggestedClause,
    intent: SEGMENT_INTENTS.has(intent) ? intent : "clarify",
  };
}

export function summarizeGateDiagnostics(diagnostics = []) {
  return (Array.isArray(diagnostics) ? diagnostics : [])
    .filter(Boolean)
    .map((diagnostic) => ({
      code: normalizeText(diagnostic?.code) || "diag",
      severity: normalizeText(diagnostic?.severity).toLowerCase() || "info",
      message: normalizeText(diagnostic?.message),
      line: Number.isFinite(Number(diagnostic?.span?.line)) ? Number(diagnostic.span.line) : null,
    }))
    .filter((diagnostic) => diagnostic.message)
    .slice(0, 8);
}

export function normalizeRoomGatePreview(value = null) {
  const nextValue = value && typeof value === "object" ? value : null;
  if (!nextValue) return null;
  const artifactSummary =
    nextValue.artifactSummary && typeof nextValue.artifactSummary === "object"
      ? {
          compileState: normalizeText(nextValue.artifactSummary.compileState).toLowerCase() || "unknown",
          runtimeState: normalizeText(nextValue.artifactSummary.runtimeState).toLowerCase() || "open",
          mergedWindowState:
            normalizeText(nextValue.artifactSummary.mergedWindowState).toLowerCase() || "open",
          clauseCount: Math.max(0, Number(nextValue.artifactSummary.clauseCount) || 0),
          fieldState: normalizeText(nextValue.artifactSummary.fieldState).toLowerCase() || "fog",
          waiting: Boolean(nextValue.artifactSummary.waiting),
          pingSent: Boolean(nextValue.artifactSummary.pingSent),
        }
      : {
          compileState: "unknown",
          runtimeState: "open",
          mergedWindowState: "open",
          clauseCount: 0,
          fieldState: "fog",
          waiting: false,
          pingSent: false,
        };

  return {
    accepted: Boolean(nextValue.accepted),
    reason: normalizeText(nextValue.reason).toLowerCase(),
    diagnostics: summarizeGateDiagnostics(nextValue.diagnostics),
    artifactSummary,
    nextBestAction: normalizeText(nextValue.nextBestAction),
  };
}

export function normalizeRoomTurnResult(value = null) {
  const nextValue = value && typeof value === "object" ? value : {};
  const segments = (Array.isArray(nextValue.segments) ? nextValue.segments : [])
    .map((segment, index) => normalizeRoomProposalSegment(segment, index))
    .filter(Boolean)
    .slice(0, 12);
  const receiptKit = normalizeReceiptKit(nextValue.receiptKit);
  const normalizedTurnMode = normalizeText(nextValue.turnMode).toLowerCase();
  const turnMode = ROOM_TURN_MODES.has(normalizedTurnMode)
    ? normalizedTurnMode
    : segments.length || receiptKit
      ? "proposal"
      : "conversation";

  return {
    assistantText:
      normalizeLongText(nextValue.assistantText) ||
      normalizeLongText(nextValue.reply) ||
      "I have a lawful next move for the room. Inspect it before you apply anything.",
    proposalId: normalizeText(nextValue.proposalId) || makeRoomId("proposal"),
    turnMode,
    segments,
    receiptKit,
    gatePreview: normalizeRoomGatePreview(nextValue.gatePreview),
  };
}

export function normalizeRoomMeta(value = null) {
  const nextValue = value && typeof value === "object" ? value : {};
  const ui = nextValue.ui && typeof nextValue.ui === "object" ? nextValue.ui : {};
  const legacySnapshot =
    nextValue.legacySnapshot && typeof nextValue.legacySnapshot === "object"
      ? normalizeRoomLegacySnapshot(nextValue.legacySnapshot)
      : normalizeRoomLegacySnapshot(nextValue);
  const hasLegacySnapshot = Boolean(
    legacySnapshot.aimText ||
      legacySnapshot.evidenceItems.length ||
      legacySnapshot.storyItems.length ||
      legacySnapshot.moveItems.length ||
      legacySnapshot.returnItems.length,
  );

  return {
    version: ROOM_METADATA_VERSION,
    documentKey: normalizeText(nextValue.documentKey),
    ui: {
      collapsed: Boolean(ui.collapsed),
    },
    seededFromLegacyAt: normalizeDateString(nextValue.seededFromLegacyAt),
    legacySeedMode:
      normalizeText(nextValue.legacySeedMode).toLowerCase() || ROOM_LEGACY_SEED_MODE,
    legacySnapshot: hasLegacySnapshot ? legacySnapshot : null,
  };
}

// Compatibility for older workspace/phase1 imports that still treat project room data
// as a "state" object. The canonical Room now stores lightweight metadata instead.
export function normalizeRoomState(value = null) {
  return normalizeRoomMeta(value);
}

export function mergeRoomMeta(currentMeta = null, patch = {}) {
  const current = normalizeRoomMeta(currentMeta);
  const nextPatch = patch && typeof patch === "object" ? patch : {};
  const nextUi =
    nextPatch.ui === undefined
      ? current.ui
      : {
          ...current.ui,
          ...(nextPatch.ui && typeof nextPatch.ui === "object" ? nextPatch.ui : {}),
        };

  return normalizeRoomMeta({
    ...current,
    ...nextPatch,
    ui: nextUi,
  });
}

export function mergeRoomState(currentState = null, patch = {}) {
  return mergeRoomMeta(currentState, patch);
}

export function normalizeRoomLegacySnapshot(value = null) {
  const nextValue = value && typeof value === "object" ? value : {};

  function normalizeLegacyItem(item, prefix) {
    const nextItem = item && typeof item === "object" ? item : {};
    const text = normalizeText(nextItem.text || nextItem.actual || nextItem.label);
    if (!text) return null;
    return {
      id: normalizeText(nextItem.id) || makeRoomId(prefix),
      text,
      detail:
        normalizeText(nextItem.why) ||
        normalizeText(nextItem.expected) ||
        normalizeText(nextItem.result) ||
        normalizeText(nextItem.via),
    };
  }

  return {
    aimText: normalizeText(nextValue?.aim?.text || nextValue.aimText),
    evidenceItems: (Array.isArray(nextValue.evidenceItems) ? nextValue.evidenceItems : [])
      .map((item) => normalizeLegacyItem(item, "legacy-evidence"))
      .filter(Boolean)
      .slice(0, 24),
    storyItems: (Array.isArray(nextValue.storyItems) ? nextValue.storyItems : [])
      .map((item) => normalizeLegacyItem(item, "legacy-story"))
      .filter(Boolean)
      .slice(0, 24),
    moveItems: (Array.isArray(nextValue.moveItems) ? nextValue.moveItems : [])
      .map((item) => normalizeLegacyItem(item, "legacy-move"))
      .filter(Boolean)
      .slice(0, 24),
    returnItems: (Array.isArray(nextValue.returnItems) ? nextValue.returnItems : [])
      .map((item) => normalizeLegacyItem(item, "legacy-return"))
      .filter(Boolean)
      .slice(0, 24),
  };
}

export function buildLegacyRoomCarryoverComments(legacyRoom = null) {
  const snapshot = normalizeRoomLegacySnapshot(legacyRoom);
  const lines = [];

  if (snapshot.aimText) {
    lines.push(`DIR aim "${escapeLoeString(snapshot.aimText)}"`);
  }

  const noteSections = [
    ["evidence", snapshot.evidenceItems],
    ["story", snapshot.storyItems],
    ["moves", snapshot.moveItems],
    ["returns", snapshot.returnItems],
  ];

  if (noteSections.some(([, items]) => items.length > 0)) {
    lines.push("");
    lines.push("# Imported legacy room notes");
    lines.push("# These are carryover comments only. They are not canonical clauses.");
    noteSections.forEach(([label, items]) => {
      if (!items.length) return;
      lines.push(`# ${label}`);
      items.forEach((item) => {
        const detail = item.detail ? ` (${item.detail})` : "";
        lines.push(`# - ${item.text}${detail}`);
      });
    });
  }

  return lines.join("\n").trim();
}

export function buildRoomPayloadCitations(payload = null) {
  return [
    {
      kind: ROOM_PAYLOAD_KIND,
      payload: normalizeRoomTurnResult(payload),
    },
  ];
}

export function extractRoomPayloadFromCitations(citations = []) {
  const normalizedCitations = Array.isArray(citations) ? citations : [];
  const payloadEntry = normalizedCitations.find(
    (entry) => normalizeText(entry?.kind).toLowerCase() === ROOM_PAYLOAD_KIND,
  );

  if (!payloadEntry?.payload) return null;
  return normalizeRoomTurnResult(payloadEntry.payload);
}

export function isRoomAssemblyDocument(document = null) {
  if (!document) return false;
  if (!document.isAssembly && document.documentType !== "assembly") return false;
  return Boolean(document?.seedMeta?.roomDocument);
}

export function getRoomFieldStateTone(state = "open") {
  const normalizedState = normalizeText(state).toLowerCase();
  if (normalizedState === "actionable") return "grounded";
  if (normalizedState === "stopped") return "flagged";
  return ROOM_FIELD_TONES.has(normalizedState) ? normalizedState : "open";
}
