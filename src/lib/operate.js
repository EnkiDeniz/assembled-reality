import { PRIMARY_WORKSPACE_DOCUMENT_KEY } from "@/lib/project-model";
import { buildBoxSource, getBoxSourceBadge, getBoxSourceMetaLine } from "@/lib/source-model";
import { isRoomAssemblyDocument } from "@/lib/room";

export const OPERATE_TRUST_LEVELS = Object.freeze(["L1", "L2", "L3"]);
export const OPERATE_CONVERGENCE_STATES = Object.freeze([
  "convergent",
  "divergent",
  "hallucinating",
]);
export const OPERATE_GRADIENT_MIN = 1;
export const OPERATE_GRADIENT_MAX = 7;

/**
 * @typedef {Object} OperateSentence
 * @property {string} sentence
 * @property {"L1"|"L2"|"L3"} level
 * @property {string} rationale
 */

/**
 * @typedef {Object} OperateIncludedDocument
 * @property {string} documentKey
 * @property {string} title
 * @property {"assembly"|"source"|"guide"} role
 * @property {number} blockCount
 * @property {boolean} truncated
 */

/**
 * @typedef {Object} OperateResult
 * @property {string} boxKey
 * @property {string} boxTitle
 * @property {string} ranAt
 * @property {OperateSentence} aim
 * @property {OperateSentence} ground
 * @property {OperateSentence} bridge
 * @property {number} gradient
 * @property {"convergent"|"divergent"|"hallucinating"} convergence
 * @property {"L1"|"L2"|"L3"} trustFloor
 * @property {"L1"|"L2"|"L3"} trustCeiling
 * @property {string} nextMove
 * @property {OperateIncludedDocument[]} includedDocuments
 * @property {number} includedSourceCount
 * @property {boolean} includesAssembly
 */

function normalizeText(value, fallback = "") {
  const trimmed = String(value || "").trim();
  return trimmed || fallback;
}

function normalizeLevel(value) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();

  if (!OPERATE_TRUST_LEVELS.includes(normalized)) {
    throw new Error("Operate returned an invalid trust level.");
  }

  return normalized;
}

function normalizeConvergence(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (!OPERATE_CONVERGENCE_STATES.includes(normalized)) {
    throw new Error("Operate returned an invalid convergence state.");
  }

  return normalized;
}

function normalizeGradient(value) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < OPERATE_GRADIENT_MIN || numeric > OPERATE_GRADIENT_MAX) {
    throw new Error("Operate returned an invalid gradient.");
  }

  return numeric;
}

export function isBuiltInGuideDocument(document = null) {
  return (
    document?.documentKey === PRIMARY_WORKSPACE_DOCUMENT_KEY ||
    document?.documentType === "builtin" ||
    document?.sourceType === "builtin"
  );
}

export function isAssemblyDocument(document = null) {
  if (isRoomAssemblyDocument(document)) return false;
  return Boolean(document?.isAssembly) || document?.documentType === "assembly";
}

export function getOperateAssemblyDocument(
  project = null,
  documents = [],
  preferredDocumentKey = "",
) {
  const normalizedDocuments = Array.isArray(documents) ? documents.filter(Boolean) : [];
  const projectAssemblyKey = String(project?.currentAssemblyDocumentKey || "").trim();
  const preferredKey = String(preferredDocumentKey || "").trim();

  if (projectAssemblyKey) {
    const currentAssembly = normalizedDocuments.find(
      (document) => document.documentKey === projectAssemblyKey,
    );
    if (currentAssembly && isAssemblyDocument(currentAssembly)) {
      return currentAssembly;
    }
  }

  if (preferredKey) {
    const preferredAssembly = normalizedDocuments.find(
      (document) => document.documentKey === preferredKey,
    );
    if (preferredAssembly && isAssemblyDocument(preferredAssembly)) {
      return preferredAssembly;
    }
  }

  return normalizedDocuments.find((document) => isAssemblyDocument(document)) || null;
}

export function listOperateIncludedDocuments(
  project = null,
  documents = [],
  {
    preferredDocumentKey = "",
    includeAssembly = true,
    includeGuide = false,
  } = {},
) {
  const normalizedDocuments = Array.isArray(documents) ? documents.filter(Boolean) : [];
  const currentAssemblyDocument = includeAssembly
    ? getOperateAssemblyDocument(project, normalizedDocuments, preferredDocumentKey)
    : null;
  const includedDocuments = [];

  if (currentAssemblyDocument) {
    const source = buildBoxSource(currentAssemblyDocument);
    includedDocuments.push({
      ...currentAssemblyDocument,
      operateRole: "assembly",
      sourceBadge: getBoxSourceBadge(source),
      sourceSummary: getBoxSourceMetaLine(source),
    });
  }

  normalizedDocuments.forEach((document) => {
    if (!document?.documentKey) return;
    if (currentAssemblyDocument?.documentKey === document.documentKey) return;
    if (isAssemblyDocument(document)) return;
    if (isBuiltInGuideDocument(document) && !includeGuide) return;

    const source = buildBoxSource(document);
    includedDocuments.push({
      ...document,
      operateRole: isBuiltInGuideDocument(document) ? "guide" : "source",
      sourceBadge: getBoxSourceBadge(source),
      sourceSummary: getBoxSourceMetaLine(source),
    });
  });

  const includedSourceCount = includedDocuments.filter(
    (document) => document.operateRole === "source",
  ).length;

  return {
    currentAssemblyDocument,
    includedDocuments,
    includedSourceCount,
    includesAssembly: Boolean(currentAssemblyDocument),
    canOperate: includedDocuments.length > 0,
  };
}

export function buildOperateAuditPrompt(result = null) {
  if (!result) {
    return "Audit the current box and tell me the weakest evidence point plus the next upgrade move.";
  }

  return [
    "Audit this Operate read for the current box.",
    "",
    `Aim (${result.aim.level}): ${result.aim.sentence}`,
    `Ground (${result.ground.level}): ${result.ground.sentence}`,
    `Bridge (${result.bridge.level}): ${result.bridge.sentence}`,
    `Gradient: ${result.gradient}`,
    `Convergence: ${result.convergence}`,
    `Trust floor: ${result.trustFloor}`,
    `Trust ceiling: ${result.trustCeiling}`,
    `Next move: ${result.nextMove}`,
    "",
    "Explain whether the read fits the current document or assembly, challenge the weakest point, and name the smallest evidence upgrade that would move it one level higher.",
  ].join("\n");
}

export function coerceOperateResult(rawResult, context = {}) {
  if (!rawResult || typeof rawResult !== "object" || Array.isArray(rawResult)) {
    throw new Error("Operate returned an invalid result.");
  }

  const levels =
    rawResult.levels && typeof rawResult.levels === "object" && !Array.isArray(rawResult.levels)
      ? rawResult.levels
      : {};
  const rationales =
    rawResult.level_rationales &&
    typeof rawResult.level_rationales === "object" &&
    !Array.isArray(rawResult.level_rationales)
      ? rawResult.level_rationales
      : {};

  const result = {
    boxKey: normalizeText(context.boxKey),
    boxTitle: normalizeText(context.boxTitle, "Untitled Box"),
    ranAt: normalizeText(context.ranAt, new Date().toISOString()),
    aim: {
      sentence: normalizeText(rawResult.aim),
      level: normalizeLevel(levels.aim),
      rationale: normalizeText(rationales.aim),
    },
    ground: {
      sentence: normalizeText(rawResult.ground),
      level: normalizeLevel(levels.ground),
      rationale: normalizeText(rationales.ground),
    },
    bridge: {
      sentence: normalizeText(rawResult.bridge),
      level: normalizeLevel(levels.bridge),
      rationale: normalizeText(rationales.bridge),
    },
    gradient: normalizeGradient(rawResult.gradient),
    convergence: normalizeConvergence(rawResult.convergence),
    trustFloor: normalizeLevel(rawResult.trust_floor),
    trustCeiling: normalizeLevel(rawResult.trust_ceiling),
    nextMove: normalizeText(rawResult.next_move),
    includedDocuments: Array.isArray(context.includedDocuments) ? context.includedDocuments : [],
    includedSourceCount: Number(context.includedSourceCount) || 0,
    includesAssembly: Boolean(context.includesAssembly),
  };

  return result;
}
