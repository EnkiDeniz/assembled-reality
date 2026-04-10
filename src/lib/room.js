export const ROOM_METADATA_VERSION = 1;
export const ROOM_THREAD_PREFIX = "room:";
export const ROOM_PAYLOAD_KIND = "room_payload";

const FIELD_STATES = new Set([
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

const MOVE_STATUSES = new Set([
  "suggested",
  "awaiting",
  "completed",
  "flagged",
  "rerouted",
]);

const RETURN_RESULTS = new Set(["matched", "surprised", "contradicted"]);

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeLongText(value = "") {
  return String(value || "").trim();
}

export function makeRoomId(prefix = "room") {
  const base = normalizeText(prefix).toLowerCase().replace(/[^a-z0-9]+/g, "-") || "room";
  return `${base}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildRoomThreadKey(projectKey = "") {
  const normalizedProjectKey = normalizeText(projectKey) || "default-project";
  return `${ROOM_THREAD_PREFIX}${normalizedProjectKey}`;
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

function normalizeMirrorItem(item = null, fallbackPrefix = "item") {
  const nextItem = item && typeof item === "object" ? item : {};
  const text = normalizeText(nextItem.text);
  if (!text) return null;

  return {
    id: normalizeText(nextItem.id) || makeRoomId(fallbackPrefix),
    text,
    why: normalizeText(nextItem.why),
    source: normalizeText(nextItem.source).toLowerCase() || "room",
    createdAt: normalizeText(nextItem.createdAt) || new Date().toISOString(),
  };
}

function normalizeMoveItem(item = null) {
  const nextItem = normalizeMirrorItem(item, "move");
  if (!nextItem) return null;
  const status = normalizeText(item?.status).toLowerCase();

  return {
    ...nextItem,
    status: MOVE_STATUSES.has(status) ? status : "suggested",
    expected: normalizeText(item?.expected),
    receiptKitId: normalizeText(item?.receiptKitId) || "",
    via: normalizeText(item?.via),
  };
}

function normalizeReturnItem(item = null) {
  const nextItem = item && typeof item === "object" ? item : {};
  const actual = normalizeLongText(nextItem.actual);
  if (!actual) return null;
  const result = normalizeText(nextItem.result).toLowerCase();

  return {
    id: normalizeText(nextItem.id) || makeRoomId("return"),
    receiptKitId: normalizeText(nextItem.receiptKitId) || "",
    moveId: normalizeText(nextItem.moveId) || "",
    label: normalizeText(nextItem.label),
    predicted: normalizeText(nextItem.predicted),
    actual,
    result: RETURN_RESULTS.has(result) ? result : "matched",
    via: normalizeText(nextItem.via),
    draftId: normalizeText(nextItem.draftId) || "",
    createdAt: normalizeText(nextItem.createdAt) || new Date().toISOString(),
  };
}

export function normalizeRoomMirrorDraft(value = null) {
  const nextValue = value && typeof value === "object" ? value : {};

  return {
    aimText: normalizeText(nextValue.aimText),
    aimGloss: normalizeText(nextValue.aimGloss),
    evidenceItems: (Array.isArray(nextValue.evidenceItems) ? nextValue.evidenceItems : [])
      .map((item) => normalizeMirrorItem(item, "evidence"))
      .filter(Boolean)
      .slice(0, 4),
    storyItems: (Array.isArray(nextValue.storyItems) ? nextValue.storyItems : [])
      .map((item) => normalizeMirrorItem(item, "story"))
      .filter(Boolean)
      .slice(0, 4),
    moveItems: (Array.isArray(nextValue.moveItems) ? nextValue.moveItems : [])
      .map(normalizeMoveItem)
      .filter(Boolean)
      .slice(0, 2),
  };
}

export function normalizeRoomTurnResult(value = null) {
  const nextValue = value && typeof value === "object" ? value : {};
  const mirrorDraft = normalizeRoomMirrorDraft(nextValue.mirrorDraft);
  const receiptKit = normalizeReceiptKit(nextValue.receiptKit);

  return {
    reply:
      normalizeLongText(nextValue.reply) ||
      "I can help tighten that. Apply the draft if it feels true, then test the smallest part reality can answer.",
    mirrorDraft,
    receiptKit,
  };
}

export function normalizeRoomState(value = null) {
  const nextValue = value && typeof value === "object" ? value : {};

  return {
    version: ROOM_METADATA_VERSION,
    aim: {
      text: normalizeText(nextValue?.aim?.text),
      gloss: normalizeText(nextValue?.aim?.gloss),
      source: normalizeText(nextValue?.aim?.source).toLowerCase() || "",
      updatedAt: normalizeText(nextValue?.aim?.updatedAt) || null,
    },
    evidenceItems: (Array.isArray(nextValue.evidenceItems) ? nextValue.evidenceItems : [])
      .map((item) => normalizeMirrorItem(item, "evidence"))
      .filter(Boolean)
      .slice(-24),
    storyItems: (Array.isArray(nextValue.storyItems) ? nextValue.storyItems : [])
      .map((item) => normalizeMirrorItem(item, "story"))
      .filter(Boolean)
      .slice(-24),
    moveItems: (Array.isArray(nextValue.moveItems) ? nextValue.moveItems : [])
      .map(normalizeMoveItem)
      .filter(Boolean)
      .slice(-24),
    returnItems: (Array.isArray(nextValue.returnItems) ? nextValue.returnItems : [])
      .map(normalizeReturnItem)
      .filter(Boolean)
      .slice(-24),
    lastAppliedMessageId: normalizeText(nextValue.lastAppliedMessageId) || "",
    lastTurnAt: normalizeText(nextValue.lastTurnAt) || null,
  };
}

export function mergeRoomState(currentState = null, patch = {}) {
  const current = normalizeRoomState(currentState);
  const nextPatch = patch && typeof patch === "object" ? patch : {};

  return normalizeRoomState({
    ...current,
    ...nextPatch,
    aim:
      nextPatch.aim === undefined
        ? current.aim
        : {
            ...current.aim,
            ...(nextPatch.aim || {}),
          },
    evidenceItems:
      nextPatch.evidenceItems === undefined ? current.evidenceItems : nextPatch.evidenceItems,
    storyItems:
      nextPatch.storyItems === undefined ? current.storyItems : nextPatch.storyItems,
    moveItems: nextPatch.moveItems === undefined ? current.moveItems : nextPatch.moveItems,
    returnItems:
      nextPatch.returnItems === undefined ? current.returnItems : nextPatch.returnItems,
  });
}

export function buildRoomPayloadCitations(payload = null) {
  const normalized = normalizeRoomTurnResult(payload);
  return [
    {
      kind: ROOM_PAYLOAD_KIND,
      payload: normalized,
    },
  ];
}

export function extractRoomPayloadFromCitations(citations = []) {
  const normalizedCitations = Array.isArray(citations) ? citations : [];
  const payloadEntry = normalizedCitations.find(
    (entry) => normalizeText(entry?.kind).toLowerCase() === ROOM_PAYLOAD_KIND,
  );

  if (!payloadEntry?.payload) {
    return null;
  }

  return normalizeRoomTurnResult(payloadEntry.payload);
}

function normalizeUniqueTextItems(currentItems = [], nextItems = [], kind = "item") {
  const seen = new Set();

  return [...(Array.isArray(currentItems) ? currentItems : []), ...(Array.isArray(nextItems) ? nextItems : [])]
    .map((item) => {
      if (kind === "move") return normalizeMoveItem(item);
      if (kind === "return") return normalizeReturnItem(item);
      return normalizeMirrorItem(item, kind);
    })
    .filter(Boolean)
    .filter((item) => {
      const key = normalizeText(item.text || item.actual).toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function applyMirrorDraftToRoomState(currentState = null, mirrorDraft = null, options = {}) {
  const current = normalizeRoomState(currentState);
  const draft = normalizeRoomMirrorDraft(mirrorDraft);
  const nextAimText = draft.aimText || current.aim.text;
  const nextAimGloss = draft.aimGloss || current.aim.gloss;

  return normalizeRoomState({
    ...current,
    aim: {
      text: nextAimText,
      gloss: nextAimGloss,
      source: nextAimText ? "room" : current.aim.source,
      updatedAt: nextAimText || nextAimGloss ? new Date().toISOString() : current.aim.updatedAt,
    },
    evidenceItems: normalizeUniqueTextItems(current.evidenceItems, draft.evidenceItems, "evidence"),
    storyItems: normalizeUniqueTextItems(current.storyItems, draft.storyItems, "story"),
    moveItems: normalizeUniqueTextItems(current.moveItems, draft.moveItems, "move"),
    lastAppliedMessageId: normalizeText(options.assistantMessageId) || current.lastAppliedMessageId,
  });
}

export function commitReceiptKitToRoomState(
  currentState = null,
  {
    receiptKit = null,
    mode = "return",
    result = "matched",
    actual = "",
    moveText = "",
    uploadedDocument = null,
    draftId = "",
  } = {},
) {
  const current = normalizeRoomState(currentState);
  const normalizedKit = normalizeReceiptKit(receiptKit);
  if (!normalizedKit) {
    return current;
  }

  const now = new Date().toISOString();
  const receiptKitId = normalizedKit.id;
  const existingMoveIndex = current.moveItems.findIndex(
    (item) => item.receiptKitId === receiptKitId,
  );
  const baseMoveText =
    normalizeText(moveText) ||
    normalizeText(normalizedKit.fastestPath) ||
    normalizeText(normalizedKit.need);
  const nextMove =
    baseMoveText
      ? normalizeMoveItem({
          ...(existingMoveIndex >= 0 ? current.moveItems[existingMoveIndex] : {}),
          text: baseMoveText,
          why: normalizeText(normalizedKit.why),
          expected: normalizeText(normalizedKit.prediction.expected),
          receiptKitId,
          via: normalizedKit.artifact.type,
          status:
            mode === "move"
              ? "awaiting"
              : result === "contradicted"
                ? "flagged"
                : result === "surprised"
                  ? "rerouted"
                  : "completed",
          createdAt:
            existingMoveIndex >= 0
              ? current.moveItems[existingMoveIndex].createdAt
              : now,
        })
      : null;

  const nextMoves = [...current.moveItems];
  if (nextMove) {
    if (existingMoveIndex >= 0) {
      nextMoves[existingMoveIndex] = nextMove;
    } else {
      nextMoves.unshift(nextMove);
    }
  }

  if (mode === "move") {
    return normalizeRoomState({
      ...current,
      moveItems: nextMoves,
    });
  }

  const nextReturn = normalizeReturnItem({
    receiptKitId,
    moveId: nextMove?.id || "",
    label: normalizeText(normalizedKit.need),
    predicted: normalizeText(normalizedKit.prediction.expected),
    actual:
      normalizeLongText(actual) ||
      normalizeText(uploadedDocument?.title) ||
      normalizeText(uploadedDocument?.documentKey),
    result,
    via: normalizedKit.artifact.type,
    draftId,
    createdAt: now,
  });

  return normalizeRoomState({
    ...current,
    moveItems: nextMoves,
    returnItems: normalizeUniqueTextItems(current.returnItems, [nextReturn], "return"),
  });
}

export function deriveRoomFieldState({
  roomState = null,
  realSourceCount = 0,
  receiptCount = 0,
  sealedReceiptCount = 0,
} = {}) {
  const normalized = normalizeRoomState(roomState);
  const hasAim = Boolean(normalized.aim.text);
  const hasEvidence = normalized.evidenceItems.length > 0 || Number(realSourceCount) > 0;
  const hasStory = normalized.storyItems.length > 0;
  const activeAwaiting = normalized.moveItems.some((item) => item.status === "awaiting");
  const hasContradiction = normalized.returnItems.some((item) => item.result === "contradicted");
  const hasSurprise = normalized.returnItems.some((item) => item.result === "surprised");
  const hasReturn = normalized.returnItems.length > 0 || Number(receiptCount) > 0;

  if (!hasAim && !hasEvidence && !hasStory && !hasReturn && !activeAwaiting) {
    return "new";
  }
  if (activeAwaiting) {
    return "awaiting";
  }
  if (hasContradiction) {
    return "flagged";
  }
  if (hasSurprise) {
    return "rerouted";
  }
  if (hasReturn && (Number(sealedReceiptCount) > 0 || normalized.returnItems.length > 0)) {
    return "sealed";
  }
  if (hasEvidence || hasStory) {
    return "grounded";
  }
  return "open";
}

export function getRoomFieldStateTone(state = "new") {
  const normalizedState = normalizeText(state).toLowerCase();
  if (!FIELD_STATES.has(normalizedState)) return "new";
  return normalizedState;
}
