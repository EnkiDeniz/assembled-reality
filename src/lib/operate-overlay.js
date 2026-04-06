import { createHash } from "node:crypto";
import { stripMarkdownSyntax } from "@/lib/document-blocks";

export const OPERATE_OVERLAY_SCHEMA_VERSION = 1;
export const OPERATE_OVERLAY_ENGINE_KIND = "hybrid_llm_rules";
export const OPERATE_OVERLAY_ENGINE_VERSION = "phase1_v1";
export const OPERATE_OVERLAY_PROMPT_VERSION = "overlay_v1";
export const OPERATE_OVERLAY_SIGNALS = Object.freeze(["green", "amber", "red"]);
export const OPERATE_OVERLAY_TRUST_LEVELS = Object.freeze(["L1", "L2", "L3"]);
export const MAX_OVERLAY_BLOCKS = 24;
export const MAX_EVIDENCE_PER_BLOCK = 4;
export const MAX_SPANS_PER_BLOCK = 4;

function normalizeText(value = "") {
  return stripMarkdownSyntax(String(value || ""))
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeToken(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function tokenize(text = "") {
  return normalizeText(text)
    .split(/[^a-zA-Z0-9]+/)
    .map((part) => normalizeToken(part))
    .filter((part) => part.length >= 3);
}

function uniqueList(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];
}

function normalizeBlockText(block = null) {
  return normalizeText(block?.plainText || block?.text || "");
}

function buildExcerpt(text = "", maxLength = 220) {
  const normalized = normalizeText(text);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function createEvidenceId(documentKey = "", blockId = "", index = 0) {
  return `${documentKey || "doc"}:${blockId || "block"}:${index + 1}`;
}

function compareNullableNumber(left = null, right = null) {
  const normalizedLeft = Number.isInteger(left) ? left : null;
  const normalizedRight = Number.isInteger(right) ? right : null;
  if (normalizedLeft === null && normalizedRight === null) return 0;
  if (normalizedLeft === null) return -1;
  if (normalizedRight === null) return 1;
  return normalizedLeft - normalizedRight;
}

export function buildOperateSourceFingerprint({
  workingDocument = null,
  sourceDocuments = [],
  overrides = [],
} = {}) {
  const payload = {
    workingDocument: {
      documentKey: String(workingDocument?.documentKey || "").trim(),
      updatedAt: String(workingDocument?.updatedAt || "").trim(),
      blocks: (Array.isArray(workingDocument?.blocks) ? workingDocument.blocks : []).map((block) => ({
        id: String(block?.id || "").trim(),
        text: normalizeBlockText(block),
      })),
    },
    sources: [...(Array.isArray(sourceDocuments) ? sourceDocuments : [])]
      .filter(Boolean)
      .map((document) => ({
        documentKey: String(document?.documentKey || "").trim(),
        updatedAt: String(document?.updatedAt || "").trim(),
      }))
      .sort((left, right) => left.documentKey.localeCompare(right.documentKey)),
    overrides: [...(Array.isArray(overrides) ? overrides : [])]
      .filter(Boolean)
      .map((override) => ({
        id: String(override?.id || "").trim(),
        updatedAt: String(override?.updatedAt || "").trim(),
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
  };

  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function buildOverlayCandidateBlocks(document = null) {
  const blocks = Array.isArray(document?.blocks) ? document.blocks : [];
  return blocks
    .filter((block) => normalizeBlockText(block))
    .slice(0, MAX_OVERLAY_BLOCKS)
    .map((block, index) => ({
      blockId: String(block?.id || `block-${index + 1}`),
      kind: String(block?.kind || "paragraph"),
      text: normalizeBlockText(block),
      sourcePosition: Number.isFinite(Number(block?.sourcePosition))
        ? Number(block.sourcePosition)
        : index,
    }));
}

export function extractSpanHints(text = "") {
  const sourceText = String(text || "");
  const hints = [];
  const seen = new Set();
  const patterns = [
    {
      kind: "date",
      regex:
        /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\d{4}-\d{2}-\d{2})\b/gi,
    },
    {
      kind: "number",
      regex: /\b(?:\$?\d[\d,]*(?:\.\d+)?%?)\b/g,
    },
    {
      kind: "quote",
      regex: /"([^"\n]{3,120})"/g,
    },
    {
      kind: "entity",
      regex: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\b/g,
    },
  ];

  patterns.forEach(({ kind, regex }) => {
    let match;
    while ((match = regex.exec(sourceText)) !== null) {
      const value = String(match[0] || "").trim();
      const start = Number(match.index);
      const end = start + value.length;
      const key = `${start}:${end}:${value}`;
      if (!value || seen.has(key)) continue;
      seen.add(key);
      hints.push({ kind, text: value, start, end });
      if (hints.length >= MAX_SPANS_PER_BLOCK) {
        return;
      }
    }
  });

  return hints.slice(0, MAX_SPANS_PER_BLOCK);
}

export function buildLocalSourceEvidenceForBlocks(
  candidateBlocks = [],
  sourceDocuments = [],
) {
  const evidenceMap = new Map();

  const indexedSources = (Array.isArray(sourceDocuments) ? sourceDocuments : [])
    .filter(Boolean)
    .flatMap((document) =>
      (Array.isArray(document?.blocks) ? document.blocks : [])
        .filter((block) => normalizeBlockText(block))
        .map((block, index) => ({
          id: createEvidenceId(document.documentKey, block?.id || "", index),
          documentKey: String(document?.documentKey || "").trim(),
          documentTitle: String(document?.title || "Untitled source"),
          blockId: String(block?.id || "").trim(),
          text: normalizeBlockText(block),
          excerpt: buildExcerpt(block?.plainText || block?.text || ""),
          tokens: uniqueList(tokenize(block?.plainText || block?.text || "")),
        })),
    );

  candidateBlocks.forEach((candidate) => {
    const candidateTokens = new Set(tokenize(candidate?.text || ""));
    const scored = indexedSources
      .map((source) => {
        const overlap = source.tokens.filter((token) => candidateTokens.has(token));
        return {
          ...source,
          score: overlap.length,
          overlap,
        };
      })
      .filter((entry) => entry.score > 0)
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        return left.documentKey.localeCompare(right.documentKey);
      })
      .slice(0, MAX_EVIDENCE_PER_BLOCK)
      .map((entry) => ({
        id: entry.id,
        documentKey: entry.documentKey,
        documentTitle: entry.documentTitle,
        blockId: entry.blockId,
        excerpt: entry.excerpt,
        score: entry.score,
      }));

    evidenceMap.set(candidate.blockId, scored);
  });

  return evidenceMap;
}

export function buildOperateOverlayPrompt({
  boxTitle = "",
  workingDocument = null,
  candidateBlocks = [],
  evidenceMap = new Map(),
} = {}) {
  const systemPrompt = [
    "You are the inline Operate engine for a source-grounded workspace.",
    "Evaluate only the working document blocks provided.",
    "Use only the local source evidence provided for each block.",
    "Do not invent evidence or cite absent sources.",
    "Return strict JSON only.",
    "Assign one signal per block: green, amber, or red.",
    "Assign one trust level per block: L1, L2, or L3.",
    "L1 means asserted or overridden without sufficient local evidence.",
    "L2 means grounded by local source evidence in the current box.",
    "L3 means strongly grounded by multiple local sources with clear traceability.",
    "Only suggest spans when the text and evidence clearly justify them.",
    "If uncertain, keep the block amber and explain uncertainty.",
  ].join(" ");

  const userPrompt = [
    `Box: ${boxTitle || "Untitled Box"}`,
    `Working document: ${workingDocument?.title || workingDocument?.documentKey || "Untitled document"}`,
    "",
    "For each block below, assign a signal, a trust level, a short rationale, a short uncertainty note, and evidence ids drawn only from the listed local evidence.",
    "",
    JSON.stringify(
      {
        blocks: candidateBlocks.map((block) => ({
          blockId: block.blockId,
          kind: block.kind,
          text: block.text,
          spanHints: extractSpanHints(block.text),
          evidence: evidenceMap.get(block.blockId) || [],
        })),
      },
      null,
      2,
    ),
  ].join("\n");

  return { systemPrompt, userPrompt };
}

function normalizeSignal(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  return OPERATE_OVERLAY_SIGNALS.includes(normalized) ? normalized : "amber";
}

function normalizeTrustLevel(value = "") {
  const normalized = String(value || "").trim().toUpperCase();
  return OPERATE_OVERLAY_TRUST_LEVELS.includes(normalized) ? normalized : "L1";
}

function normalizeFindingSpan(span = null, text = "") {
  if (!span || typeof span !== "object") return null;
  const sourceText = String(text || "");
  const start = Number(span.start);
  const end = Number(span.end);
  const spanText = String(span.text || sourceText.slice(start, end) || "").trim();

  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end <= start) {
    return null;
  }
  if (end > sourceText.length) {
    return null;
  }
  if (!spanText) return null;

  return {
    text: spanText,
    start,
    end,
    signal: normalizeSignal(span.signal),
    reason: String(span.reason || "").trim(),
  };
}

export function coerceOperateOverlayPayload(rawPayload, context = {}) {
  const rawBlocks = Array.isArray(rawPayload?.blocks) ? rawPayload.blocks : [];
  const candidateBlocks = Array.isArray(context?.candidateBlocks) ? context.candidateBlocks : [];
  const candidateMap = new Map(candidateBlocks.map((block) => [String(block.blockId || ""), block]));
  const evidenceMap = context?.evidenceMap instanceof Map ? context.evidenceMap : new Map();

  const blocks = rawBlocks
    .map((rawBlock, index) => {
      const blockId = String(rawBlock?.blockId || "").trim();
      const candidate = candidateMap.get(blockId);
      if (!blockId || !candidate) return null;

      const spans = uniqueList(
        (Array.isArray(rawBlock?.spans) ? rawBlock.spans : [])
          .map((span) => normalizeFindingSpan(span, candidate.text))
          .filter(Boolean)
          .map((span) => JSON.stringify(span)),
      ).map((entry) => JSON.parse(entry));

      return {
        blockId,
        signal: normalizeSignal(rawBlock?.signal),
        trustLevel: normalizeTrustLevel(rawBlock?.trustLevel),
        rationale: String(rawBlock?.rationale || "").trim(),
        uncertainty: String(rawBlock?.uncertainty || "").trim(),
        evidenceIds: uniqueList(rawBlock?.evidenceIds).filter((evidenceId) =>
          (evidenceMap.get(blockId) || []).some((evidence) => evidence.id === evidenceId),
        ),
        spans: spans.slice(0, MAX_SPANS_PER_BLOCK),
        index,
      };
    })
    .filter(Boolean);

  const findings = blocks.map((block) => {
    const evidence = (evidenceMap.get(block.blockId) || []).filter((entry) =>
      block.evidenceIds.includes(entry.id),
    );

    return {
      findingId: `finding:${block.blockId}`,
      blockId: block.blockId,
      signal: block.signal,
      trustLevel: block.trustLevel,
      rationale: block.rationale,
      uncertainty: block.uncertainty,
      evidence,
      overrideApplied: false,
      spans: block.spans,
      overrides: [],
    };
  });

  const summary = findings.reduce(
    (accumulator, finding) => {
      if (finding.signal === "green") accumulator.greenCount += 1;
      else if (finding.signal === "red") accumulator.redCount += 1;
      else accumulator.amberCount += 1;
      return accumulator;
    },
    { redCount: 0, amberCount: 0, greenCount: 0, overrideCount: 0 },
  );

  return {
    schemaVersion: OPERATE_OVERLAY_SCHEMA_VERSION,
    engineKind: OPERATE_OVERLAY_ENGINE_KIND,
    engineVersion: OPERATE_OVERLAY_ENGINE_VERSION,
    promptVersion: OPERATE_OVERLAY_PROMPT_VERSION,
    blocks: blocks.map((block) => ({
      blockId: block.blockId,
      signal: block.signal,
      trustLevel: block.trustLevel,
      findingId: `finding:${block.blockId}`,
      spans: block.spans,
      overrideApplied: false,
    })),
    findings,
    summary,
  };
}

function doesOverrideMatchCurrentText(override = null, block = null) {
  if (!override || !block) return false;
  const text = String(block?.plainText || block?.text || "");
  const excerptSnapshot = String(override?.excerptSnapshot || "").trim();
  if (!excerptSnapshot) return false;

  if (Number.isInteger(override?.spanStart) && Number.isInteger(override?.spanEnd)) {
    return text.slice(override.spanStart, override.spanEnd) === excerptSnapshot;
  }

  return text.includes(excerptSnapshot);
}

export function mergeOperateOverlayWithOverrides(
  payload = null,
  overrides = [],
  workingDocument = null,
) {
  const nextPayload =
    payload && typeof payload === "object"
      ? JSON.parse(JSON.stringify(payload))
      : {
          blocks: [],
          findings: [],
          summary: { redCount: 0, amberCount: 0, greenCount: 0, overrideCount: 0 },
        };

  const documentBlocks = new Map(
    (Array.isArray(workingDocument?.blocks) ? workingDocument.blocks : [])
      .filter(Boolean)
      .map((block) => [String(block?.id || "").trim(), block]),
  );
  const groupedOverrides = new Map();

  (Array.isArray(overrides) ? overrides : []).forEach((override) => {
    const blockId = String(override?.blockId || "").trim();
    if (!blockId) return;
    const block = documentBlocks.get(blockId);
    const status = block
      ? doesOverrideMatchCurrentText(override, block)
        ? "active"
        : "stale"
      : "orphaned";

    const normalized = {
      ...override,
      status,
    };

    if (!groupedOverrides.has(blockId)) {
      groupedOverrides.set(blockId, []);
    }
    groupedOverrides.get(blockId).push(normalized);
  });

  nextPayload.blocks = (Array.isArray(nextPayload.blocks) ? nextPayload.blocks : []).map((block) => {
    const overridesForBlock = groupedOverrides.get(String(block?.blockId || "").trim()) || [];
    const hasActiveOverride = overridesForBlock.some((override) => override.status === "active");

    return {
      ...block,
      trustLevel: hasActiveOverride ? "L1" : block.trustLevel || "L1",
      overrideApplied: hasActiveOverride,
      overrideCount: overridesForBlock.length,
    };
  });

  nextPayload.findings = (Array.isArray(nextPayload.findings) ? nextPayload.findings : []).map((finding) => {
    const overridesForBlock = groupedOverrides.get(String(finding?.blockId || "").trim()) || [];
    const hasActiveOverride = overridesForBlock.some((override) => override.status === "active");

    return {
      ...finding,
      trustLevel: hasActiveOverride ? "L1" : finding.trustLevel || "L1",
      overrideApplied: hasActiveOverride,
      overrides: overridesForBlock,
    };
  });

  const summary = {
    redCount: 0,
    amberCount: 0,
    greenCount: 0,
    overrideCount: 0,
    activeOverrideCount: 0,
    staleOverrideCount: 0,
    orphanedOverrideCount: 0,
  };

  nextPayload.findings.forEach((finding) => {
    if (finding.signal === "green") summary.greenCount += 1;
    else if (finding.signal === "red") summary.redCount += 1;
    else summary.amberCount += 1;

    const findingOverrides = Array.isArray(finding.overrides) ? finding.overrides : [];
    summary.overrideCount += findingOverrides.length;
    summary.activeOverrideCount += findingOverrides.filter((override) => override.status === "active").length;
    summary.staleOverrideCount += findingOverrides.filter((override) => override.status === "stale").length;
    summary.orphanedOverrideCount += findingOverrides.filter((override) => override.status === "orphaned").length;
  });

  nextPayload.summary = summary;
  return nextPayload;
}

export function buildOperateOverrideSummary(overrides = [], workingDocument = null) {
  const merged = mergeOperateOverlayWithOverrides(
    { blocks: [], findings: [], summary: {} },
    overrides,
    workingDocument,
  );

  return merged.summary || {
    redCount: 0,
    amberCount: 0,
    greenCount: 0,
    overrideCount: 0,
    activeOverrideCount: 0,
    staleOverrideCount: 0,
    orphanedOverrideCount: 0,
  };
}

export function getOverrideExcerptSnapshot(block = null, spanStart = null, spanEnd = null) {
  const text = String(block?.plainText || block?.text || "");
  if (
    Number.isInteger(spanStart) &&
    Number.isInteger(spanEnd) &&
    spanStart >= 0 &&
    spanEnd > spanStart &&
    spanEnd <= text.length
  ) {
    return text.slice(spanStart, spanEnd);
  }

  return buildExcerpt(text, 240);
}

export function getOverlaySignalTone(signal = "") {
  const normalized = normalizeSignal(signal);
  if (normalized === "green") return "clear";
  if (normalized === "red") return "alert";
  return "active";
}

export function sortOverridesForDisplay(overrides = []) {
  return [...(Array.isArray(overrides) ? overrides : [])].sort((left, right) => {
    const statusRank = {
      active: 0,
      stale: 1,
      orphaned: 2,
    };
    const leftRank = statusRank[String(left?.status || "").trim().toLowerCase()] ?? 9;
    const rightRank = statusRank[String(right?.status || "").trim().toLowerCase()] ?? 9;
    if (leftRank !== rightRank) return leftRank - rightRank;

    const updatedCompare = Date.parse(String(right?.updatedAt || "")) - Date.parse(String(left?.updatedAt || ""));
    if (!Number.isNaN(updatedCompare) && updatedCompare !== 0) return updatedCompare;

    return compareNullableNumber(left?.spanStart, right?.spanStart);
  });
}
