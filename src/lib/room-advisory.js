const ROOM_ADVISORY_KINDS = Object.freeze([
  "insufficient_witness",
  "starter_prior",
  "personal_field",
]);

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeKeyList(values = []) {
  const seen = new Set();
  return (Array.isArray(values) ? values : [])
    .map((value) => normalizeText(value))
    .filter(Boolean)
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

export function buildRoomAdvisoryContext({
  project = null,
  recentSources = [],
  recentReturns = [],
  focusedWitness = null,
  roomSourceSummary = null,
  fieldState = null,
} = {}) {
  const sourceDocumentKeys = normalizeKeyList([
    focusedWitness?.documentKey,
    ...(Array.isArray(recentSources) ? recentSources.map((source) => source?.documentKey) : []),
  ]);

  return Object.freeze({
    boxKey: normalizeText(project?.projectKey),
    boxTitle: normalizeText(project?.title) || "Untitled Box",
    sourceDocumentKeys: Object.freeze(sourceDocumentKeys),
    sourceCount: sourceDocumentKeys.length,
    hasFocusedWitness: Boolean(normalizeText(focusedWitness?.documentKey)),
    returnCount: Array.isArray(recentReturns) ? recentReturns.filter(Boolean).length : 0,
    clauseCount: Number(roomSourceSummary?.clauseCount) || 0,
    fieldStateKey: normalizeText(fieldState?.key).toLowerCase() || "open",
    contextVersion: "room_advisory_v1",
  });
}

export function hasRoomAdvisoryMinimumWitness(context = {}) {
  return Boolean(Number(context?.sourceCount) > 0 || context?.hasFocusedWitness);
}

function buildInsufficientWitnessOutcome() {
  return {
    kind: "insufficient_witness",
    nonCanonical: true,
    source: "placeholder",
    mainGap: "",
    nextMove: "",
    receiptCondition: "",
    disconfirmationLine: "",
    question: "What witness belongs in this box first?",
    contextVersion: "room_advisory_v1",
  };
}

export function normalizeRoomAdvisoryOutcome(outcome = null) {
  const kind = normalizeText(outcome?.kind);
  if (!ROOM_ADVISORY_KINDS.includes(kind)) {
    return buildInsufficientWitnessOutcome();
  }

  return {
    kind,
    nonCanonical: true,
    source: normalizeText(outcome?.source) || "adapter",
    mainGap: normalizeText(outcome?.mainGap),
    nextMove: normalizeText(outcome?.nextMove),
    receiptCondition: normalizeText(outcome?.receiptCondition),
    disconfirmationLine: normalizeText(outcome?.disconfirmationLine),
    question:
      kind === "insufficient_witness"
        ? normalizeText(outcome?.question) || "What witness belongs in this box first?"
        : "",
    contextVersion: "room_advisory_v1",
  };
}

export function createRoomAdvisoryAdapter({ evaluate } = {}) {
  if (typeof evaluate !== "function") {
    throw new Error("Room advisory adapters need an evaluate(context) function.");
  }

  return Object.freeze({
    evaluate(context = {}) {
      const safeContext = Object.freeze({
        ...context,
        sourceDocumentKeys: Array.isArray(context?.sourceDocumentKeys)
          ? [...context.sourceDocumentKeys]
          : [],
      });
      return normalizeRoomAdvisoryOutcome(evaluate(safeContext));
    },
  });
}

export function evaluateRoomAdvisory(contextInput = {}, { adapter = null } = {}) {
  const context = buildRoomAdvisoryContext(contextInput);
  if (!hasRoomAdvisoryMinimumWitness(context)) {
    return buildInsufficientWitnessOutcome();
  }
  if (!adapter || typeof adapter.evaluate !== "function") {
    return buildInsufficientWitnessOutcome();
  }
  return adapter.evaluate(context);
}

export { ROOM_ADVISORY_KINDS };
