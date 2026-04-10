const FORBIDDEN_PHRASES = [
  "trust me",
  "you already know",
  "you got this",
  "just",
  "obviously",
];

const TONE_CLASS = {
  PATHOLOGY: "pathology",
  GATE: "gate",
  TOPOLOGY: "topology",
  BEHAVIORAL: "behavioral",
};

function normalizeText(value = "") {
  return String(value || "").trim();
}

function clampText(value = "", max = 220, fallback = "") {
  const normalized = normalizeText(value) || fallback;
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(0, max - 1)).trimEnd()}.`;
}

function containsForbiddenPhrase(text = "") {
  const normalized = normalizeText(text).toLowerCase();
  return FORBIDDEN_PHRASES.some((phrase) => normalized.includes(phrase));
}

function inferToneClass({ status, resultType, assemblyClass, gatePassed }) {
  const key = normalizeText(status || resultType).toLowerCase();
  if (key === "rejection" || gatePassed === false) return TONE_CLASS.GATE;
  if (assemblyClass === "developmental_embodied") return TONE_CLASS.BEHAVIORAL;
  if (assemblyClass === "path_dependent") return TONE_CLASS.TOPOLOGY;
  return TONE_CLASS.PATHOLOGY;
}

function inferSourceLayer({ status, resultType }) {
  const key = normalizeText(status || resultType).toLowerCase();
  if (key === "not_sealable_yet" || key.startsWith("candidate_")) return "base_library";
  return "live_echo";
}

function inferClosureLanguageAllowed({ sourceLayer, status, maturationGatePassed }) {
  if (sourceLayer === "base_library") return false;
  if (status === "not_sealable_yet") return false;
  if (maturationGatePassed === false) return false;
  return true;
}

function inferReceiptLine(receiptCondition = null, requiredReceipts = []) {
  const receiptType = normalizeText(receiptCondition?.receiptType) || normalizeText(requiredReceipts[0]) || "runtime_observation";
  const validWhen = normalizeText(receiptCondition?.validWhen);
  if (validWhen) {
    return `A ${receiptType} showing ${validWhen}.`;
  }
  return `A ${receiptType} that clearly confirms or contradicts the current read.`;
}

function singularizeMove(move = "") {
  const normalized = normalizeText(move);
  if (!normalized) return "Run one bounded test and observe one concrete return.";
  // Keep BAT singular by trimming chained planning markers.
  const split = normalized.split(/;|\bthen\b|\band then\b|\bafter that\b/i)[0];
  return normalizeText(split) || normalized;
}

function defaultWallLine({ status, resultType, gatePassed }) {
  const key = normalizeText(status || resultType).toLowerCase();
  if (key === "not_sealable_yet") {
    return "This structure is visible, but stage evidence is not yet strong enough to name it.";
  }
  if (key.startsWith("candidate_")) {
    return "This is a plausible structure, but still a hypothesis pending stronger return.";
  }
  if (key.endsWith("_match")) {
    return "This read matches a known pattern under the current gate checks.";
  }
  if (key === "rejection" || gatePassed === false) {
    return "This input fails current structural gates and cannot be sealed as-is.";
  }
  return "This is the current structural read from available evidence.";
}

function defaultDisconfirmation({ possibleDisconfirmation, falsifier }) {
  return (
    normalizeText(possibleDisconfirmation) ||
    normalizeText(falsifier) ||
    "If the next bounded test does not shift the expected signal, this read is likely wrong."
  );
}

export function buildOperatorRead({
  status = "",
  resultType = "",
  assemblyClass = "combinable",
  gatePassed = true,
  maturationGatePassed = true,
  requiredReceipts = [],
  mainGap = "",
  nextLawfulMove = "",
  receiptCondition = null,
  possibleDisconfirmation = "",
  falsifier = "",
} = {}) {
  const sourceLayer = inferSourceLayer({ status, resultType });
  const closureLanguageAllowed = inferClosureLanguageAllowed({
    sourceLayer,
    status,
    maturationGatePassed,
  });
  const wallLine = mainGap || defaultWallLine({ status, resultType, gatePassed });
  const move = singularizeMove(nextLawfulMove);
  const returnLine = inferReceiptLine(receiptCondition, requiredReceipts);
  const disconfirmation = defaultDisconfirmation({ possibleDisconfirmation, falsifier });
  const toneClass = inferToneClass({
    status,
    resultType,
    assemblyClass,
    gatePassed,
  });

  const value = {
    wallLine: clampText(wallLine, 220, "A likely structural wall is present."),
    whatToPingNow: clampText(move, 220, "Run one bounded test and observe one concrete return."),
    whatWouldCountAsRealReturn: clampText(
      returnLine,
      240,
      "One provenanced return that can confirm or disconfirm this read.",
    ),
    howThisReadCouldBeWrong: clampText(
      disconfirmation,
      240,
      "If the bounded test does not shift the expected signal, this read is likely wrong.",
    ),
    toneClass,
    closureLanguageAllowed,
  };
  return sanitizeOperatorRead(value);
}

export function sanitizeOperatorRead(operatorRead = {}) {
  const copy = { ...operatorRead };
  for (const phrase of FORBIDDEN_PHRASES) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "gi");
    copy.wallLine = String(copy.wallLine || "").replace(re, "").trim();
    copy.whatToPingNow = String(copy.whatToPingNow || "").replace(re, "").trim();
    copy.whatWouldCountAsRealReturn = String(copy.whatWouldCountAsRealReturn || "")
      .replace(re, "")
      .trim();
    copy.howThisReadCouldBeWrong = String(copy.howThisReadCouldBeWrong || "")
      .replace(re, "")
      .trim();
  }
  return copy;
}

export function validateOperatorRead(operatorRead = {}) {
  const errors = [];
  const required = [
    "wallLine",
    "whatToPingNow",
    "whatWouldCountAsRealReturn",
    "howThisReadCouldBeWrong",
    "toneClass",
    "closureLanguageAllowed",
  ];
  for (const key of required) {
    if (!(key in operatorRead)) errors.push(`missing:${key}`);
  }
  const stringKeys = [
    "wallLine",
    "whatToPingNow",
    "whatWouldCountAsRealReturn",
    "howThisReadCouldBeWrong",
  ];
  for (const key of stringKeys) {
    const value = normalizeText(operatorRead[key]);
    if (!value) errors.push(`empty:${key}`);
    if (containsForbiddenPhrase(value)) errors.push(`forbidden_phrase:${key}`);
  }
  const toneClass = normalizeText(operatorRead.toneClass);
  if (!Object.values(TONE_CLASS).includes(toneClass)) {
    errors.push("invalid:toneClass");
  }
  if (typeof operatorRead.closureLanguageAllowed !== "boolean") {
    errors.push("invalid:closureLanguageAllowed");
  }
  if (/\b(and then|then|after that)\b/i.test(String(operatorRead.whatToPingNow || ""))) {
    errors.push("invalid:whatToPingNow_not_singular");
  }
  return { ok: errors.length === 0, errors };
}
