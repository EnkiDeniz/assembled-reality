import { stripMarkdownSyntax } from "@/lib/document-blocks";
import { normalizeProjectArchitectureMeta } from "@/lib/assembly-architecture";

const FORMAL_SHAPES = Object.freeze({
  aim: { key: "aim", symbol: "△", label: "Aim" },
  reality: { key: "reality", symbol: "□", label: "Reality" },
  weld: { key: "weld", symbol: "œ", label: "Weld" },
  seal: { key: "seal", symbol: "𒐛", label: "Seal" },
});

const FORMAL_SIGNALS = Object.freeze({
  neutral: { key: "neutral", label: "Neutral", weight: 0 },
  amber: { key: "amber", label: "Amber", weight: 1 },
  green: { key: "green", label: "Green", weight: 2 },
  red: { key: "red", label: "Red", weight: 3 },
});

const FORMAL_TRUST_RANK = Object.freeze({
  L1: 1,
  L2: 2,
  L3: 3,
});

const CLOSED_WELD_TERMS = new Set([
  "to",
  "for",
  "with",
  "between",
  "against",
  "into",
  "from",
  "toward",
  "towards",
  "and",
  "but",
  "or",
  "yet",
  "because",
  "although",
  "while",
  "aligns",
  "converges",
  "meets",
  "matches",
  "connects",
  "bridges",
]);

const CLOSED_SEAL_TERMS = new Set([
  "by",
  "before",
  "after",
  "until",
  "deadline",
  "never",
  "always",
  "done",
  "sealed",
  "verified",
  "confirmed",
  "complete",
  "final",
  "approved",
  "settled",
  "proven",
  "received",
  "today",
  "tomorrow",
  "yesterday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

const AIM_TERMS = new Set([
  "ship",
  "build",
  "promise",
  "declare",
  "launch",
  "create",
  "open",
  "draft",
  "commit",
  "plan",
  "intend",
  "will",
  "aim",
  "start",
  "design",
  "goal",
  "mission",
  "target",
  "vision",
  "seed",
  "promise",
  "send",
  "share",
  "make",
  "move",
  "fix",
  "address",
  "answer",
]);

const REALITY_TERMS = new Set([
  "saw",
  "found",
  "received",
  "noticed",
  "measured",
  "captured",
  "heard",
  "exists",
  "confirmed",
  "shows",
  "contains",
  "arrived",
  "is",
  "was",
  "data",
  "photo",
  "document",
  "feedback",
  "measurement",
  "report",
  "email",
  "message",
  "link",
  "prototype",
  "box",
  "source",
  "receipt",
  "evidence",
  "proof",
  "question",
  "price",
  "pricing",
  "model",
]);

const NEGATIVE_SIGNAL_TERMS = new Set([
  "blocked",
  "blocker",
  "failed",
  "failure",
  "gap",
  "drift",
  "issue",
  "risk",
  "concern",
  "missing",
  "contradiction",
  "open",
  "unresolved",
]);

const SENTENCE_SPLIT_RE = /(?<=[.!?])\s+|\n+/;
const TOKEN_RE = /[\p{L}\p{N}œ]+/gu;

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeComparableText(value = "") {
  return stripMarkdownSyntax(String(value || ""))
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getTimestamp(value = null) {
  const parsed = Date.parse(String(value || ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeSignal(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "green" || normalized === "amber" || normalized === "red") {
    return normalized;
  }
  return "neutral";
}

function composeSignal(signals = []) {
  const normalized = (Array.isArray(signals) ? signals : [])
    .map((value) => normalizeSignal(value))
    .filter(Boolean);
  if (!normalized.length) return "neutral";

  const redCount = normalized.filter((value) => value === "red").length;
  const greenCount = normalized.filter((value) => value === "green").length;
  const amberCount = normalized.filter((value) => value === "amber").length;

  if (redCount > normalized.length / 2) return "red";
  if (greenCount > normalized.length / 2) return "green";
  if (redCount > 0 || amberCount > 0) return "amber";
  return "neutral";
}

function normalizeTrust(value = "", fallback = "L1") {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "L1" || normalized === "L2" || normalized === "L3") {
    return normalized;
  }
  return fallback;
}

function trustRank(value = "L1") {
  return FORMAL_TRUST_RANK[normalizeTrust(value)] || 1;
}

function trustLabelFromRank(rank = 1) {
  if (rank >= 3) return "L3";
  if (rank >= 2) return "L2";
  return "L1";
}

function scoreFromTrust(trust = "L1") {
  const rank = trustRank(trust);
  return rank <= 1 ? 0.34 : rank === 2 ? 0.67 : 1;
}

function normalizeShapeKey(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "△" || normalized === "aim") return "aim";
  if (normalized === "□" || normalized === "reality") return "reality";
  if (normalized === "œ" || normalized === "weld") return "weld";
  if (normalized === "𒐛" || normalized === "seal") return "seal";
  return "";
}

function getShapeData(shapeKey = "aim") {
  return FORMAL_SHAPES[normalizeShapeKey(shapeKey) || "aim"];
}

function createDiagnostic({
  level = "info",
  code = "",
  message = "",
  scope = "box",
  targetId = "",
  detail = "",
} = {}) {
  return {
    id: `${scope}-${code}-${targetId || "global"}`,
    level,
    code,
    message,
    scope,
    targetId,
    detail,
  };
}

function splitIntoSentences(text = "") {
  const normalized = normalizeText(stripMarkdownSyntax(text));
  if (!normalized) return [];
  return normalized
    .split(SENTENCE_SPLIT_RE)
    .map((part) => normalizeText(part))
    .filter(Boolean);
}

function tokenizeSentence(text = "") {
  return Array.from(String(text || "").matchAll(TOKEN_RE))
    .map((match) => String(match[0] || "").trim())
    .filter(Boolean);
}

function isLikelyProperName(rawToken = "", index = 0) {
  if (!rawToken) return false;
  if (index === 0) return false;
  const firstChar = rawToken.charAt(0);
  return firstChar.toLowerCase() !== firstChar.toUpperCase() && firstChar === firstChar.toUpperCase();
}

function isNumericToken(token = "") {
  return /^\d+$/.test(token) || /^\d[\d,.:/-]*$/.test(token);
}

function inferLexicalShape(rawToken = "", normalizedToken = "", index = 0) {
  if (!normalizedToken) return "";
  if (CLOSED_WELD_TERMS.has(normalizedToken)) return "weld";
  if (CLOSED_SEAL_TERMS.has(normalizedToken)) return "seal";
  if (AIM_TERMS.has(normalizedToken)) return "aim";
  if (REALITY_TERMS.has(normalizedToken)) return "reality";
  if (isNumericToken(normalizedToken)) return "reality";
  if (isLikelyProperName(rawToken, index)) return "reality";
  return "";
}

function normalizeTokenTerm(token = "") {
  return normalizeComparableText(token);
}

function buildBiasCounts(texts = []) {
  return (Array.isArray(texts) ? texts : []).reduce(
    (accumulator, text) => {
      tokenizeSentence(text).forEach((rawToken, index) => {
        const normalizedToken = normalizeTokenTerm(rawToken);
        const shape = inferLexicalShape(rawToken, normalizedToken, index);
        if (shape === "aim") accumulator.aim += 1;
        if (shape === "reality") accumulator.reality += 1;
      });
      return accumulator;
    },
    { aim: 0, reality: 0 },
  );
}

function chooseFallbackShape(biasCounts = { aim: 0, reality: 0 }) {
  return Number(biasCounts.aim || 0) <= Number(biasCounts.reality || 0) ? "aim" : "reality";
}

function buildWord(rawToken, index, context = {}) {
  const normalizedToken = normalizeTokenTerm(rawToken);
  const overrideShape = normalizeShapeKey(context.shapeOverride);
  const inferredShape = inferLexicalShape(rawToken, normalizedToken, index);
  const shapeKey = overrideShape || inferredShape || chooseFallbackShape(context.biasCounts);
  const shape = getShapeData(shapeKey);

  return {
    id: `${context.sentenceId || "sentence"}-word-${index + 1}`,
    lexeme: rawToken,
    normalized: normalizedToken,
    position: Math.min(index + 1, 7),
    shapeKey: shape.key,
    shapeSymbol: shape.symbol,
    signal: normalizeSignal(context.signalHint),
    shapeSource: overrideShape
      ? "override"
      : inferredShape
        ? CLOSED_WELD_TERMS.has(normalizedToken) || CLOSED_SEAL_TERMS.has(normalizedToken)
          ? "deterministic"
          : "lexical"
        : "box-bias",
    isConnector: shape.key === "weld",
    isContent: shape.key !== "weld",
  };
}

function deriveSentenceShape(words = []) {
  const contentWords = (Array.isArray(words) ? words : []).filter((word) => word?.isContent);
  if (!contentWords.length) return "weld";

  const counts = contentWords.reduce((accumulator, word) => {
    accumulator[word.shapeKey] = (accumulator[word.shapeKey] || 0) + 1;
    return accumulator;
  }, {});

  const ranked = ["aim", "reality", "seal", "weld"]
    .map((shapeKey) => ({
      shapeKey,
      count: counts[shapeKey] || 0,
    }))
    .sort((left, right) => right.count - left.count);

  if (ranked[0].count === ranked[1].count) {
    return contentWords[0]?.shapeKey || "aim";
  }

  return ranked[0].shapeKey || "aim";
}

function buildSentenceDiagnostics(words = [], sentenceId = "") {
  const diagnostics = [];
  const contentWords = (Array.isArray(words) ? words : []).filter((word) => word?.isContent);
  const aimCount = contentWords.filter((word) => word.shapeKey === "aim").length;
  const groundedCount = contentWords.filter(
    (word) => word.shapeKey === "reality" || word.shapeKey === "seal",
  ).length;

  if (contentWords.length < 5 || contentWords.length > 9) {
    diagnostics.push(
      createDiagnostic({
        level: "warn",
        code: "sentence-length",
        message: "Operator sentence length is outside the preferred 5–9 word range.",
        scope: "sentence",
        targetId: sentenceId,
        detail: `${contentWords.length} content words`,
      }),
    );
  }

  if (contentWords.length > 7) {
    diagnostics.push(
      createDiagnostic({
        level: "warn",
        code: "position-overflow",
        message: "Word positions exceed the formal 1–7 positional frame.",
        scope: "sentence",
        targetId: sentenceId,
        detail: "Extra words are annotated but share the terminal position.",
      }),
    );
  }

  if (aimCount === 0) {
    diagnostics.push(
      createDiagnostic({
        level: "warn",
        code: "directionless",
        message: "Sentence is directionless because it contains no △ aim word.",
        scope: "sentence",
        targetId: sentenceId,
      }),
    );
  }

  if (groundedCount === 0) {
    diagnostics.push(
      createDiagnostic({
        level: "warn",
        code: "ungrounded",
        message: "Sentence is semantically ungrounded because it contains no □ or 𒐛 word.",
        scope: "sentence",
        targetId: sentenceId,
      }),
    );
  }

  return diagnostics;
}

function buildFormalSentence(text = "", context = {}) {
  const sentenceText = normalizeText(text);
  const words = tokenizeSentence(sentenceText).map((rawToken, index) =>
    buildWord(rawToken, index, context),
  );
  const diagnostics = buildSentenceDiagnostics(words, context.sentenceId);
  const contentWords = words.filter((word) => word.isContent);

  return {
    id: context.sentenceId || `sentence-${Math.random()}`,
    text: sentenceText,
    words,
    shapeKey: deriveSentenceShape(words),
    signal: normalizeSignal(context.signalHint),
    diagnostics,
    wordCount: contentWords.length,
    contentTerms: [
      ...new Set(
        contentWords
          .map((word) => word.normalized)
          .filter(Boolean),
      ),
    ],
  };
}

function resolveArtifactSignalHint(artifact = null) {
  if (!artifact) return "neutral";
  if (normalizeSignal(artifact.signalHint) !== "neutral") {
    return normalizeSignal(artifact.signalHint);
  }

  const confirmationStatus = String(artifact.confirmationStatus || "").trim().toLowerCase();
  if (confirmationStatus === "discarded") return "red";
  if (artifact.artifactKind === "receipt") {
    return artifact.sealed ? "green" : "amber";
  }
  if (confirmationStatus === "confirmed") {
    return trustRank(artifact.trustHint) >= 2 ? "green" : "amber";
  }
  if (artifact.artifactKind === "seed") return "amber";
  return "neutral";
}

function resolveArtifactTrustHint(artifact = null) {
  if (!artifact) return "L1";
  const hint = normalizeTrust(artifact.trustHint);
  if (hint !== "L1" || String(artifact.trustHint || "").trim()) return hint;
  if (artifact.artifactKind === "receipt") {
    if (artifact.verifyUrl || artifact.sealed) return artifact.sealed ? "L3" : "L2";
    return "L2";
  }
  return "L1";
}

function buildInitialBlockFromArtifact(artifact = null, index = 0, biasCounts = { aim: 0, reality: 0 }) {
  if (!artifact || !normalizeText(artifact.text)) return null;

  const sentences = splitIntoSentences(artifact.text)
    .slice(0, 3)
    .map((sentenceText, sentenceIndex) =>
      buildFormalSentence(sentenceText, {
        sentenceId: `${artifact.artifactId}-sentence-${sentenceIndex + 1}`,
        biasCounts,
        signalHint: resolveArtifactSignalHint(artifact),
        shapeOverride: artifact?.formalMeta?.shapeOverride || "",
      }),
    );

  if (!sentences.length) return null;

  const primarySentence = sentences[0];
  const explicitShape = normalizeShapeKey(artifact?.formalMeta?.shapeOverride);
  const shapeKey =
    explicitShape ||
    (artifact.artifactKind === "receipt" && artifact.sealed ? "seal" : primarySentence.shapeKey);
  const signal = composeSignal(sentences.map((sentence) => sentence.signal));
  const contentTerms = [
    ...new Set(sentences.flatMap((sentence) => sentence.contentTerms || [])),
  ];

  return {
    id: artifact.artifactId || `formal-block-${index + 1}`,
    artifactId: artifact.artifactId || `formal-block-${index + 1}`,
    artifactKind: artifact.artifactKind || "source",
    documentKey: String(artifact.documentKey || "").trim(),
    sourceDocumentKey: String(artifact.sourceDocumentKey || artifact.documentKey || "").trim(),
    receiptId: String(artifact.receiptId || "").trim(),
    title: artifact.title || "Block",
    sectionTitle: artifact.sectionTitle || "",
    occurredAt: artifact.occurredAt || "",
    orderKind: artifact.orderKind === "explicit" ? "explicit" : "inferred",
    signalHint: resolveArtifactSignalHint(artifact),
    signal,
    trust: resolveArtifactTrustHint(artifact),
    shapeKey,
    shapeSymbol: getShapeData(shapeKey).symbol,
    sentences,
    primarySentence,
    contentTerms,
    confirmationStatus: String(artifact.confirmationStatus || "").trim().toLowerCase(),
    primaryTag: String(artifact.primaryTag || "").trim().toLowerCase(),
    formalMeta: artifact.formalMeta && typeof artifact.formalMeta === "object" ? artifact.formalMeta : {},
    sourceTrustProfile:
      artifact.sourceTrustProfile && typeof artifact.sourceTrustProfile === "object"
        ? artifact.sourceTrustProfile
        : null,
    verifyUrl: String(artifact.verifyUrl || "").trim(),
    sealed: Boolean(artifact.sealed),
    diagnostics: [...primarySentence.diagnostics],
    depth: 1,
  };
}

function buildSupportMap(blocks = []) {
  const support = new Map();

  (Array.isArray(blocks) ? blocks : []).forEach((block) => {
    if (!block || block.artifactKind === "seed" || block.artifactKind === "root") return;

    block.contentTerms.forEach((term) => {
      const current =
        support.get(term) ||
        {
          term,
          redCount: 0,
          amberCount: 0,
          greenCount: 0,
          sealedCount: 0,
        };

      if (block.signal === "red") current.redCount += 1;
      if (block.signal === "amber") current.amberCount += 1;
      if (block.signal === "green") current.greenCount += 1;
      if (block.sealed) current.sealedCount += 1;

      support.set(term, current);
    });
  });

  return support;
}

function withContextSignals(sentence = null, block = null, supportMap = new Map()) {
  if (!sentence || !block) return sentence;

  const words = (Array.isArray(sentence.words) ? sentence.words : []).map((word) => {
    let nextSignal = normalizeSignal(block.signalHint);

    if (NEGATIVE_SIGNAL_TERMS.has(word.normalized)) {
      nextSignal = "red";
    }

    if (block.artifactKind === "seed" || block.artifactKind === "root") {
      const support = supportMap.get(word.normalized);
      if (support?.redCount) {
        nextSignal = "red";
      } else if (support?.greenCount || support?.sealedCount) {
        nextSignal = "green";
      } else if (support?.amberCount) {
        nextSignal = "amber";
      } else {
        nextSignal = "neutral";
      }
    }

    return {
      ...word,
      signal: nextSignal,
    };
  });

  return {
    ...sentence,
    words,
    signal: composeSignal(words.filter((word) => word.isContent).map((word) => word.signal)),
  };
}

function deriveBlockDepth(block = null, relatedOperateCount = 0) {
  if (!block) return 1;
  if (block.sealed) return 4;

  let depth = 1;
  if (
    block.artifactKind === "seed" ||
    block.artifactKind === "receipt" ||
    block.confirmationStatus === "confirmed" ||
    relatedOperateCount > 0
  ) {
    depth = 2;
  }

  if (depth >= 2 && (trustRank(block.trust) >= 2 || relatedOperateCount > 0 || block.signal === "green")) {
    depth = 3;
  }

  return depth;
}

function mapPrimaryTagToShapeKey(primaryTag = "") {
  const normalized = String(primaryTag || "").trim().toLowerCase();
  if (normalized === "aim") return "aim";
  if (normalized === "evidence") return "reality";
  if (normalized === "story") return "weld";
  return "";
}

function finalizeBlocks(initialBlocks = [], relatedOperateByDocumentKey = new Map()) {
  const supportMap = buildSupportMap(initialBlocks);

  return (Array.isArray(initialBlocks) ? initialBlocks : []).map((block) => {
    const sentences = block.sentences.map((sentence) =>
      withContextSignals(sentence, block, supportMap),
    );
    const primarySentence = sentences[0] || block.primarySentence;
    const signal = composeSignal(sentences.map((sentence) => sentence.signal));
    const depth = deriveBlockDepth(
      { ...block, signal },
      block.documentKey ? relatedOperateByDocumentKey.get(block.documentKey) || 0 : 0,
    );
    const diagnostics = [...(block.diagnostics || [])];
    const tagShape = mapPrimaryTagToShapeKey(block.primaryTag);

    if (tagShape && tagShape !== block.shapeKey) {
      diagnostics.push(
        createDiagnostic({
          level: "info",
          code: "shadow-type",
          message: `Block reads more like ${getShapeData(block.shapeKey).symbol} than ${getShapeData(tagShape).symbol}.`,
          scope: "block",
          targetId: block.id,
        }),
      );
    }

    if (Array.isArray(block.formalMeta?.recastHistory) && block.formalMeta.recastHistory.length > 0) {
      diagnostics.push(
        createDiagnostic({
          level: "info",
          code: "recast-history",
          message: "Block carries recast history in formal metadata.",
          scope: "block",
          targetId: block.id,
          detail: `${block.formalMeta.recastHistory.length} cast${block.formalMeta.recastHistory.length === 1 ? "" : "s"}`,
        }),
      );
    }

    return {
      ...block,
      sentences,
      primarySentence,
      signal,
      depth,
      diagnostics,
    };
  });
}

function termsOverlap(leftTerms = [], rightTerms = []) {
  const rightSet = new Set(rightTerms);
  return [...new Set(leftTerms.filter((term) => rightSet.has(term)))];
}

function addressesRealityBlock(realityBlock = null, aimBlock = null) {
  if (!realityBlock || !aimBlock) return false;
  if (realityBlock.signal === "neutral" || realityBlock.signal === "red") return false;

  const overlap = termsOverlap(realityBlock.contentTerms, aimBlock.contentTerms);
  if (overlap.length >= 2) return true;
  if (overlap.length >= 1 && (aimBlock.contentTerms.length <= 3 || realityBlock.artifactKind === "receipt")) {
    return true;
  }
  return false;
}

function buildAlignmentPairs(aimBlocks = [], realityBlocks = []) {
  const alignedPairs = [];

  (Array.isArray(aimBlocks) ? aimBlocks : []).forEach((aimBlock) => {
    (Array.isArray(realityBlocks) ? realityBlocks : []).forEach((realityBlock) => {
      if (addressesRealityBlock(realityBlock, aimBlock)) {
        alignedPairs.push({
          aimBlockId: aimBlock.id,
          realityBlockId: realityBlock.id,
          overlap: termsOverlap(realityBlock.contentTerms, aimBlock.contentTerms),
        });
      }
    });
  });

  return alignedPairs;
}

function average(values = []) {
  const filtered = (Array.isArray(values) ? values : []).filter((value) => Number.isFinite(Number(value)));
  if (!filtered.length) return 0;
  return filtered.reduce((sum, value) => sum + Number(value), 0) / filtered.length;
}

function buildHexEdges({
  aimBlocks = [],
  realityBlocks = [],
  explicitWeldBlocks = [],
  sealBlocks = [],
  alignedPairs = [],
  convergence = 0,
  blocks = [],
} = {}) {
  const addressedAimCount = new Set(alignedPairs.map((pair) => pair.aimBlockId)).size;
  const derivedWeldAvailable = explicitWeldBlocks.length > 0 || alignedPairs.length > 0;
  const validWeldCount = explicitWeldBlocks.filter(() => aimBlocks.length > 0 && realityBlocks.length > 0).length;
  const greenSealCount = sealBlocks.filter((block) => block.signal === "green").length;
  const depthScore = average((Array.isArray(blocks) ? blocks : []).map((block) => (Number(block.depth || 1) - 1) / 3));

  const edges = [
    {
      id: "aim-completeness",
      label: "Aim completeness",
      score: aimBlocks.length > 0 ? addressedAimCount / aimBlocks.length : 0,
    },
    {
      id: "evidence-quality",
      label: "Evidence quality",
      score: realityBlocks.length > 0 ? average(realityBlocks.map((block) => scoreFromTrust(block.trust))) : 0,
    },
    {
      id: "convergence-strength",
      label: "Convergence strength",
      score: convergence,
    },
    {
      id: "weld-validity",
      label: "Weld validity",
      score:
        explicitWeldBlocks.length > 0
          ? validWeldCount / explicitWeldBlocks.length
          : derivedWeldAvailable
            ? Math.max(0.5, convergence)
            : 0,
    },
    {
      id: "depth-distribution",
      label: "Depth distribution",
      score: depthScore,
    },
    {
      id: "seal-integrity",
      label: "Seal integrity",
      score:
        sealBlocks.length > 0
          ? greenSealCount / sealBlocks.length
          : 0,
    },
  ].map((edge) => ({
    ...edge,
    signal:
      edge.score >= 0.9
        ? "green"
        : edge.score >= 0.5
          ? "amber"
          : edge.score > 0
            ? "red"
            : "neutral",
    percent: Math.round(edge.score * 100),
  }));

  const greenEdgeCount = edges.filter((edge) => edge.signal === "green").length;
  const settlementStage =
    greenEdgeCount === 6 && edges[5].score >= 0.9 ? 7 : greenEdgeCount;

  return {
    edges,
    greenEdgeCount,
    settlementStage,
  };
}

function buildPrimaryCard(blocks = []) {
  const aimBlocks = blocks.filter((block) => block.shapeKey === "aim");
  const realityBlocks = blocks.filter((block) => block.shapeKey === "reality");
  const explicitWeldBlocks = blocks.filter((block) => block.shapeKey === "weld");
  const sealBlocks = blocks.filter((block) => block.shapeKey === "seal");
  const alignedPairs = buildAlignmentPairs(aimBlocks, realityBlocks);
  const convergence =
    aimBlocks.length > 0 || realityBlocks.length > 0
      ? alignedPairs.length / Math.max(aimBlocks.length || 1, realityBlocks.length || 1)
      : 0;
  const derivedWeldAvailable = explicitWeldBlocks.length > 0 || alignedPairs.length > 0;
  const signal = composeSignal(blocks.map((block) => block.signal));
  const trustFloor = blocks.length
    ? trustLabelFromRank(Math.min(...blocks.map((block) => trustRank(block.trust))))
    : "L1";
  const trustCeiling = blocks.length
    ? trustLabelFromRank(Math.max(...blocks.map((block) => trustRank(block.trust))))
    : "L1";

  const shapeCounts = {
    aim: aimBlocks.length,
    reality: realityBlocks.length,
    weld: explicitWeldBlocks.length,
    seal: sealBlocks.length,
  };

  const dominantShape = ["aim", "reality", "weld", "seal"].sort(
    (left, right) => (shapeCounts[right] || 0) - (shapeCounts[left] || 0),
  )[0] || "aim";

  const hex = buildHexEdges({
    aimBlocks,
    realityBlocks,
    explicitWeldBlocks,
    sealBlocks,
    alignedPairs,
    convergence,
    blocks,
  });

  return {
    id: "primary-card",
    label: "Primary card",
    blockCount: blocks.length,
    aimBlockCount: aimBlocks.length,
    realityBlockCount: realityBlocks.length,
    weldBlockCount: explicitWeldBlocks.length,
    sealBlockCount: sealBlocks.length,
    alignmentPairCount: alignedPairs.length,
    convergenceScore: convergence,
    convergencePercent: Math.round(convergence * 100),
    signal,
    trustFloor,
    trustCeiling,
    dominantShapeKey: dominantShape,
    dominantShapeSymbol: getShapeData(dominantShape).symbol,
    derivedWeldAvailable,
    alignedPairs,
    hex,
  };
}

function buildNextOperations(card = null) {
  const operations = [];
  const canWeld = Boolean(card?.aimBlockCount > 0 && card?.realityBlockCount > 0);
  const hasWeld = Boolean(card?.derivedWeldAvailable);
  const canSeal =
    Boolean(hasWeld) &&
    Number(card?.convergenceScore || 0) >= 0.7 &&
    trustRank(card?.trustFloor || "L1") >= 2;

  operations.push({
    key: "can-weld",
    label: "Can weld",
    status: canWeld ? "ready" : "blocked",
  });
  operations.push({
    key: "can-seal",
    label: "Can seal",
    status: canSeal ? "ready" : "blocked",
  });
  operations.push({
    key: "needs-evidence",
    label: "Needs evidence",
    status:
      card?.aimBlockCount > 0 && (card?.realityBlockCount === 0 || Number(card?.convergenceScore || 0) < 0.5)
        ? "needed"
        : "clear",
  });
  operations.push({
    key: "needs-aim",
    label: "Needs aim",
    status: card?.aimBlockCount ? "clear" : "needed",
  });
  operations.push({
    key: "needs-weld",
    label: "Needs weld",
    status: hasWeld ? "clear" : canWeld ? "needed" : "blocked",
  });

  return operations;
}

function buildBoxDiagnostics({ blocks = [], primaryCard = null }) {
  const diagnostics = [];
  const aimCount = primaryCard?.aimBlockCount || 0;
  const realityCount = primaryCard?.realityBlockCount || 0;
  const weldCount = primaryCard?.weldBlockCount || 0;
  const convergence = Number(primaryCard?.convergenceScore || 0);

  if (weldCount > 0 && (aimCount === 0 || realityCount === 0)) {
    diagnostics.push(
      createDiagnostic({
        level: "error",
        code: "weld-missing-shape",
        message: "Weld requires both aim and reality in scope.",
        scope: "box",
      }),
    );
  }

  if (primaryCard?.sealBlockCount > 0 && (!primaryCard?.derivedWeldAvailable || convergence < 0.7)) {
    diagnostics.push(
      createDiagnostic({
        level: "error",
        code: "seal-without-weld",
        message: `Seal requires a weld with convergence >= 70%. Current: ${Math.round(convergence * 100)}%.`,
        scope: "box",
      }),
    );
  }

  if (primaryCard?.sealBlockCount > 0 && convergence < 0.9 && convergence >= 0.7) {
    diagnostics.push(
      createDiagnostic({
        level: "warn",
        code: "seal-low-convergence",
        message: "Seal is valid but convergence is below 90%. Consider adding evidence.",
        scope: "box",
      }),
    );
  }

  blocks.forEach((block) => {
    (Array.isArray(block.diagnostics) ? block.diagnostics : []).forEach((diagnostic) => {
      diagnostics.push(diagnostic);
    });
  });

  return diagnostics;
}

function summarizeDiagnostics(diagnostics = []) {
  const errors = diagnostics.filter((diagnostic) => diagnostic.level === "error");
  const warnings = diagnostics.filter((diagnostic) => diagnostic.level === "warn");
  const infos = diagnostics.filter((diagnostic) => diagnostic.level !== "error" && diagnostic.level !== "warn");

  return {
    errors,
    warnings,
    infos,
    shadowTypes: diagnostics.filter((diagnostic) => diagnostic.code === "shadow-type"),
    recasts: diagnostics.filter((diagnostic) => diagnostic.code === "recast-history"),
  };
}

function buildCurrentPhaseShape(blocks = []) {
  const sorted = [...(Array.isArray(blocks) ? blocks : [])].sort((left, right) => {
    const rightTimestamp = getTimestamp(right?.occurredAt);
    const leftTimestamp = getTimestamp(left?.occurredAt);
    if (rightTimestamp !== leftTimestamp) return rightTimestamp - leftTimestamp;
    return String(right?.id || "").localeCompare(String(left?.id || ""));
  });

  return sorted[0]?.shapeKey || "aim";
}

function normalizeArtifact(rawArtifact = null, index = 0) {
  if (!rawArtifact) return null;
  const text = String(rawArtifact.text || "").trim();
  if (!text) return null;
  return {
    artifactId: String(rawArtifact.artifactId || `formal-artifact-${index + 1}`),
    artifactKind: String(rawArtifact.artifactKind || "source").trim().toLowerCase(),
    documentKey: String(rawArtifact.documentKey || "").trim(),
    sourceDocumentKey: String(rawArtifact.sourceDocumentKey || rawArtifact.documentKey || "").trim(),
    receiptId: String(rawArtifact.receiptId || "").trim(),
    title: String(rawArtifact.title || "").trim() || "Artifact",
    sectionTitle: String(rawArtifact.sectionTitle || "").trim(),
    occurredAt: String(rawArtifact.occurredAt || "").trim(),
    orderKind: String(rawArtifact.orderKind || "").trim().toLowerCase() === "explicit" ? "explicit" : "inferred",
    text,
    trustHint: String(rawArtifact.trustHint || "").trim(),
    signalHint: normalizeSignal(rawArtifact.signalHint),
    confirmationStatus: String(rawArtifact.confirmationStatus || "").trim().toLowerCase(),
    primaryTag: String(rawArtifact.primaryTag || "").trim().toLowerCase(),
    formalMeta: rawArtifact.formalMeta && typeof rawArtifact.formalMeta === "object" ? rawArtifact.formalMeta : {},
    sourceTrustProfile:
      rawArtifact.sourceTrustProfile && typeof rawArtifact.sourceTrustProfile === "object"
        ? rawArtifact.sourceTrustProfile
        : null,
    verifyUrl: String(rawArtifact.verifyUrl || "").trim(),
    sealed: Boolean(rawArtifact.sealed),
  };
}

function compileFormalBoxStateFromArtifacts({
  boxTitle = "",
  artifacts = [],
  currentSeedDocumentKey = "",
} = {}) {
  const normalizedArtifacts = (Array.isArray(artifacts) ? artifacts : [])
    .map((artifact, index) => normalizeArtifact(artifact, index))
    .filter(Boolean)
    .sort((left, right) => {
      const leftTimestamp = getTimestamp(left.occurredAt);
      const rightTimestamp = getTimestamp(right.occurredAt);
      if (leftTimestamp && rightTimestamp && leftTimestamp !== rightTimestamp) {
        return leftTimestamp - rightTimestamp;
      }
      if (leftTimestamp !== rightTimestamp) {
        return leftTimestamp ? -1 : 1;
      }
      return left.artifactId.localeCompare(right.artifactId);
    });

  const biasCounts = buildBiasCounts(normalizedArtifacts.map((artifact) => artifact.text));
  const relatedOperateByDocumentKey = normalizedArtifacts.reduce((accumulator, artifact) => {
    const documentKey = String(artifact.documentKey || "").trim();
    if (!documentKey) return accumulator;
    if (artifact.formalMeta?.operateTouched) {
      accumulator.set(documentKey, (accumulator.get(documentKey) || 0) + 1);
    }
    return accumulator;
  }, new Map());

  const initialBlocks = normalizedArtifacts
    .map((artifact, index) => buildInitialBlockFromArtifact(artifact, index, biasCounts))
    .filter(Boolean);
  const blocks = finalizeBlocks(initialBlocks, relatedOperateByDocumentKey);
  const primaryCard = buildPrimaryCard(blocks);
  const diagnostics = buildBoxDiagnostics({ blocks, primaryCard });
  const diagnosticSummary = summarizeDiagnostics(diagnostics);
  const currentPhaseShapeKey = buildCurrentPhaseShape(blocks);
  const typedSeedSentence =
    blocks.find(
      (block) =>
        block.artifactKind === "seed" &&
        (!block.sectionTitle || normalizeComparableText(block.sectionTitle) === "aim"),
    )?.primarySentence ||
    blocks.find((block) => block.artifactKind === "seed")?.primarySentence ||
    null;
  const nextOperations = buildNextOperations(primaryCard);

  const hardErrorCount = diagnosticSummary.errors.length;
  const warningCount = diagnosticSummary.warnings.length;

  return {
    boxTitle: boxTitle || "Untitled Box",
    currentSeedDocumentKey: String(currentSeedDocumentKey || "").trim(),
    blocks,
    blockCount: blocks.length,
    sentenceCount: blocks.reduce((sum, block) => sum + (Array.isArray(block.sentences) ? block.sentences.length : 0), 0),
    wordCount: blocks.reduce(
      (sum, block) => sum + (Array.isArray(block.primarySentence?.words) ? block.primarySentence.words.length : 0),
      0,
    ),
    typedSeedSentence,
    primaryCard,
    currentPhaseShapeKey,
    currentPhaseShapeSymbol: getShapeData(currentPhaseShapeKey).symbol,
    diagnostics: diagnosticSummary,
    diagnosticCount: hardErrorCount + warningCount + diagnosticSummary.infos.length,
    hardErrorCount,
    warningCount,
    nextOperations,
    summaryLine:
      hardErrorCount > 0
        ? `${hardErrorCount} formal error${hardErrorCount === 1 ? "" : "s"}`
        : `${primaryCard.convergencePercent}% convergence · ${primaryCard.trustFloor}-${primaryCard.trustCeiling}`,
  };
}

function buildEventsFromProject(project = null, providedEvents = []) {
  if (Array.isArray(providedEvents) && providedEvents.length) return providedEvents;
  return normalizeProjectArchitectureMeta(project?.metadataJson || project?.architectureMeta || null)
    .assemblyIndexMeta.events;
}

function buildOperateTouchedMap(events = []) {
  const operateByDocumentKey = new Map();
  (Array.isArray(events) ? events : []).forEach((event) => {
    if (String(event?.type || "").trim().toLowerCase() !== "operate_ran") return;
    const context = event?.detail?.context && typeof event.detail.context === "object"
      ? event.detail.context
      : {};
    const keys = [
      context.documentKey,
      context.primaryDocumentKey,
      ...(Array.isArray(context.relatedSourceDocumentKeys) ? context.relatedSourceDocumentKeys : []),
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean);

    [...new Set(keys)].forEach((key) => {
      operateByDocumentKey.set(key, (operateByDocumentKey.get(key) || 0) + 1);
    });
  });
  return operateByDocumentKey;
}

function buildRootArtifact(project = null) {
  const meta = normalizeProjectArchitectureMeta(project?.metadataJson || project?.architectureMeta || null);
  const rootText = String(meta?.root?.text || "").trim();
  const rootGloss = String(meta?.root?.gloss || "").trim();
  const text = [rootText, rootGloss].filter(Boolean).join(". ").trim();
  if (!text) return null;

  return {
    artifactId: "formal-root",
    artifactKind: "root",
    title: "Root",
    sectionTitle: "Root",
    occurredAt: meta?.root?.createdAt || project?.createdAt || "",
    orderKind: meta?.root?.createdAt ? "explicit" : "inferred",
    text,
    trustHint: "L1",
    signalHint: "neutral",
    formalMeta: meta?.formalMeta && typeof meta.formalMeta === "object" ? meta.formalMeta : {},
  };
}

function buildSourceArtifacts(documents = [], operateTouchedByDocumentKey = new Map()) {
  return (Array.isArray(documents) ? documents : [])
    .filter(
      (document) =>
        document &&
        !document.isAssembly &&
        document.documentType !== "assembly" &&
        document.documentType !== "builtin" &&
        document.sourceType !== "builtin",
    )
    .flatMap((document) =>
      (Array.isArray(document?.blocks) ? document.blocks : [])
        .filter((block) => String(block?.plainText || block?.text || "").trim())
        .map((block, index) => ({
          artifactId: `formal-source-${document.documentKey}-${block.id || index + 1}`,
          artifactKind: "source",
          documentKey: document.documentKey,
          sourceDocumentKey: block?.sourceDocumentKey || document.documentKey,
          title: document.title || "Source",
          sectionTitle: block?.sectionTitle || "",
          occurredAt: block?.updatedAt || block?.createdAt || document?.updatedAt || document?.createdAt || "",
          orderKind:
            getTimestamp(block?.updatedAt || block?.createdAt || document?.updatedAt || document?.createdAt)
              ? "explicit"
              : "inferred",
          text: block?.plainText || block?.text || "",
          trustHint:
            document?.sourceTrustProfile?.trustLevelHint ||
            document?.sourceTrustProfile?.trustLevel ||
            "L1",
          confirmationStatus: String(block?.confirmationStatus || "").trim().toLowerCase(),
          primaryTag: String(block?.primaryTag || "").trim().toLowerCase(),
          formalMeta: {
            ...(block?.formalMeta && typeof block.formalMeta === "object" ? block.formalMeta : {}),
            operateTouched: Boolean(operateTouchedByDocumentKey.get(document.documentKey)),
          },
          sourceTrustProfile:
            document?.sourceTrustProfile && typeof document.sourceTrustProfile === "object"
              ? document.sourceTrustProfile
              : null,
        })),
    );
}

function buildSeedArtifacts(seedDocument = null, operateTouchedByDocumentKey = new Map()) {
  if (!seedDocument) return [];
  return (Array.isArray(seedDocument?.blocks) ? seedDocument.blocks : [])
    .filter((block) => String(block?.plainText || block?.text || "").trim())
    .map((block, index) => ({
      artifactId: `formal-seed-${seedDocument.documentKey}-${block.id || index + 1}`,
      artifactKind: "seed",
      documentKey: seedDocument.documentKey,
      sourceDocumentKey: block?.sourceDocumentKey || seedDocument.documentKey,
      title: seedDocument.title || "Seed",
      sectionTitle: block?.sectionTitle || "",
      occurredAt: block?.updatedAt || block?.createdAt || seedDocument?.updatedAt || seedDocument?.createdAt || "",
      orderKind:
        getTimestamp(block?.updatedAt || block?.createdAt || seedDocument?.updatedAt || seedDocument?.createdAt)
          ? "explicit"
          : "inferred",
      text: block?.plainText || block?.text || "",
      trustHint: "L1",
      signalHint: "amber",
      formalMeta: {
        ...(block?.formalMeta && typeof block.formalMeta === "object" ? block.formalMeta : {}),
        operateTouched: Boolean(operateTouchedByDocumentKey.get(seedDocument.documentKey)),
      },
    }));
}

function buildReceiptArtifacts(drafts = [], operateTouchedByDocumentKey = new Map()) {
  return (Array.isArray(drafts) ? drafts : [])
    .map((draft) => {
      const text = [
        draft?.title,
        draft?.payload?.deltaStatement,
        draft?.payload?.sealedStatement,
        draft?.interpretation,
        draft?.implications,
        draft?.stance,
      ]
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .join(". ")
        .trim();
      if (!text) return null;

      const sourceCount = Array.isArray(draft?.payload?.evidenceSnapshot?.sourceDocumentKeys)
        ? draft.payload.evidenceSnapshot.sourceDocumentKeys.length
        : 0;
      const verifyUrl = String(draft?.verifyUrl || draft?.payload?.remoteSeal?.verifyUrl || "").trim();
      const sealed = String(draft?.status || "").trim().toUpperCase() === "SEALED";
      const trustHint = verifyUrl || sourceCount >= 2 ? "L3" : sealed ? "L2" : "L1";

      return {
        artifactId: `formal-receipt-${draft?.id || draft?.documentKey || "draft"}`,
        artifactKind: "receipt",
        documentKey: String(draft?.documentKey || "").trim(),
        sourceDocumentKey: String(draft?.documentKey || "").trim(),
        receiptId: String(draft?.id || "").trim(),
        title: draft?.title || "Receipt",
        sectionTitle: sealed ? "Sealed" : "Draft",
        occurredAt: draft?.updatedAt || draft?.createdAt || "",
        orderKind: getTimestamp(draft?.updatedAt || draft?.createdAt) ? "explicit" : "inferred",
        text,
        trustHint,
        signalHint: sealed ? "green" : "amber",
        verifyUrl,
        sealed,
        formalMeta: {
          operateTouched: Boolean(operateTouchedByDocumentKey.get(String(draft?.documentKey || "").trim())),
        },
      };
    })
    .filter(Boolean);
}

export function buildFormalSentenceAnnotations(text = "", context = {}) {
  const biasCounts = context?.biasCounts && typeof context.biasCounts === "object"
    ? context.biasCounts
    : buildBiasCounts([text]);
  const signalHint = normalizeSignal(context?.signalHint);
  const sentences = splitIntoSentences(text).map((sentenceText, index) =>
    buildFormalSentence(sentenceText, {
      sentenceId: `${String(context?.sentenceIdPrefix || "formal")}-${index + 1}`,
      biasCounts,
      signalHint,
      shapeOverride: context?.shapeOverride || "",
    }),
  );

  return {
    sentences,
    diagnostics: sentences.flatMap((sentence) => sentence.diagnostics || []),
  };
}

export function buildFormalBoxState(project = null, documents = [], drafts = [], events = []) {
  const resolvedDocuments = Array.isArray(documents) ? documents.filter(Boolean) : [];
  const currentAssemblyDocument =
    resolvedDocuments.find((document) => document?.documentKey === project?.currentAssemblyDocumentKey) ||
    resolvedDocuments.find((document) => document?.isAssembly || document?.documentType === "assembly") ||
    null;
  const operateTouchedByDocumentKey = buildOperateTouchedMap(buildEventsFromProject(project, events));

  const artifacts = [
    buildRootArtifact(project),
    ...buildSourceArtifacts(resolvedDocuments, operateTouchedByDocumentKey),
    ...buildSeedArtifacts(currentAssemblyDocument, operateTouchedByDocumentKey),
    ...buildReceiptArtifacts(drafts, operateTouchedByDocumentKey),
  ].filter(Boolean);

  return compileFormalBoxStateFromArtifacts({
    boxTitle: project?.boxTitle || project?.title || "Untitled Box",
    currentSeedDocumentKey: String(currentAssemblyDocument?.documentKey || "").trim(),
    artifacts,
  });
}

export function buildFormalBoxStateFromArtifacts({
  boxTitle = "",
  artifacts = [],
  currentSeedDocumentKey = "",
} = {}) {
  return compileFormalBoxStateFromArtifacts({
    boxTitle,
    artifacts,
    currentSeedDocumentKey,
  });
}

function buildSealSummary(errors = [], warnings = [], canSeal = false) {
  if (errors.length > 0) {
    return errors[0]?.message || "Seal is blocked.";
  }
  if (warnings.length > 0) {
    return warnings[0]?.message || "Seal can proceed with a warning.";
  }
  return canSeal ? "Formal core says this box can seal now." : "Formal core says this box needs a reroute.";
}

export function buildFormalSealCheck(formalBoxState = null, targetReceiptDraft = null) {
  const card = formalBoxState?.primaryCard || null;
  const deltaStatement = String(targetReceiptDraft?.deltaStatement || "").trim();
  const errors = [];
  const warnings = [];

  if (!card?.aimBlockCount) {
    errors.push(
      createDiagnostic({
        level: "error",
        code: "seal-needs-aim",
        message: "Seal requires at least one △ aim block.",
        scope: "seal",
      }),
    );
  }

  if (!card?.realityBlockCount) {
    errors.push(
      createDiagnostic({
        level: "error",
        code: "seal-needs-reality",
        message: "Seal requires at least one □ reality block.",
        scope: "seal",
      }),
    );
  }

  if (!card?.derivedWeldAvailable) {
    errors.push(
      createDiagnostic({
        level: "error",
        code: "seal-needs-weld",
        message: "Seal requires a weld with both aim and reality in scope.",
        scope: "seal",
      }),
    );
  }

  if (Number(card?.convergenceScore || 0) < 0.7) {
    errors.push(
      createDiagnostic({
        level: "error",
        code: "seal-low-convergence",
        message: `Seal requires convergence >= 70%. Current: ${Math.round((Number(card?.convergenceScore || 0)) * 100)}%.`,
        scope: "seal",
      }),
    );
  }

  if (trustRank(card?.trustFloor || "L1") < 2) {
    errors.push(
      createDiagnostic({
        level: "error",
        code: "seal-low-trust",
        message: "Seal requires a trust floor of L2 or higher.",
        scope: "seal",
      }),
    );
  }

  if (!deltaStatement) {
    warnings.push(
      createDiagnostic({
        level: "warn",
        code: "seal-missing-delta",
        message: "Seal should carry one operator sentence describing what changed.",
        scope: "seal",
      }),
    );
  }

  if (Number(card?.convergenceScore || 0) >= 0.7 && Number(card?.convergenceScore || 0) < 0.9) {
    warnings.push(
      createDiagnostic({
        level: "warn",
        code: "seal-below-90",
        message: "Seal is valid but convergence is below 90%. Consider adding evidence.",
        scope: "seal",
      }),
    );
  }

  const canSeal = errors.length === 0;
  const canOverride = canSeal && warnings.length > 0;
  const closeMoveMode = canSeal ? "seal" : "reroute";

  return {
    canSeal,
    canOverride,
    closeMoveMode,
    summary: buildSealSummary(errors, warnings, canSeal),
    errors,
    warnings,
    cardConvergence: Number(card?.convergenceScore || 0),
    cardConvergencePercent: Math.round((Number(card?.convergenceScore || 0)) * 100),
    trustFloor: card?.trustFloor || "L1",
    derivedWeldAvailable: Boolean(card?.derivedWeldAvailable),
  };
}

export function buildFormalPromptSummary(formalBoxState = null) {
  if (!formalBoxState?.primaryCard) return "";

  const seedSentence = formalBoxState?.typedSeedSentence;
  const diagnostics = [
    ...(formalBoxState?.diagnostics?.errors || []),
    ...(formalBoxState?.diagnostics?.warnings || []),
  ]
    .slice(0, 4)
    .map((diagnostic) => `- ${diagnostic.message}`);

  return [
    "Formal core snapshot",
    seedSentence
      ? `Seed sentence: ${seedSentence.words.map((word) => `${word.shapeSymbol}${word.lexeme}`).join(" ")}`
      : "Seed sentence: unavailable",
    `Primary card: ${formalBoxState.primaryCard.aimBlockCount} aim · ${formalBoxState.primaryCard.realityBlockCount} reality · ${formalBoxState.primaryCard.weldBlockCount} weld · ${formalBoxState.primaryCard.sealBlockCount} seal`,
    `Convergence: ${formalBoxState.primaryCard.convergencePercent}%`,
    `Trust: ${formalBoxState.primaryCard.trustFloor}-${formalBoxState.primaryCard.trustCeiling}`,
    `Settlement: ${formalBoxState.primaryCard.hex.greenEdgeCount}/6 green edges`,
    diagnostics.length ? diagnostics.join("\n") : "- No hard formal warnings",
  ].join("\n");
}
