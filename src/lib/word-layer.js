import { stripMarkdownSyntax } from "@/lib/document-blocks";
import { buildExcerpt } from "@/lib/text";
import { normalizeProjectArchitectureMeta } from "@/lib/assembly-architecture";
import {
  getWordTaxonomyBucket,
  getWordTaxonomyLabel,
  isAllowedShortWordToken,
  isWordStopWord,
  normalizeWordToken,
  WORD_TAXONOMY_LABELS,
} from "@/lib/word-taxonomy";

const TEMPORAL_SLICE_COUNT = 5;
const TEMPORAL_MIN_EXPLICIT_ARTIFACTS = 5;
const MIN_TOKEN_LENGTH = 3;
const LAKIN_MIN_TERM_COUNT = 2;
const LAKIN_MAX_TIME_DISTANCE_MS = 1000 * 60 * 60 * 72;

function getTimestamp(value = null) {
  const parsed = Date.parse(String(value || ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeOrderKind(value = "") {
  return String(value || "").trim().toLowerCase() === "explicit" ? "explicit" : "inferred";
}

function normalizeArtifactAuthorship(value = "", fallback = "user") {
  const normalized = String(value || "").trim().toLowerCase();
  if (
    normalized === "user" ||
    normalized === "imported_source" ||
    normalized === "ai" ||
    normalized === "system_example"
  ) {
    return normalized;
  }
  return fallback;
}

function normalizeArtifactKind(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "root" || normalized === "source" || normalized === "seed" || normalized === "receipt") {
    return normalized;
  }
  return "source";
}

function buildArtifactLabel(artifact = null) {
  if (!artifact) return "Artifact";
  if (artifact.title) return artifact.title;
  if (artifact.sectionTitle) return artifact.sectionTitle;
  if (artifact.artifactKind === "root") return "Root";
  if (artifact.artifactKind === "seed") return "Seed";
  if (artifact.artifactKind === "receipt") return "Receipt";
  return "Source";
}

function normalizeTextForTokens(text = "") {
  return stripMarkdownSyntax(String(text || ""))
    .replace(/[_*~`>#|[\](){}]/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function tokenizeWordLayerText(text = "") {
  return normalizeTextForTokens(text)
    .split(/[^\p{L}\p{N}œ]+/u)
    .map((part) => normalizeWordToken(part))
    .filter((part) => {
      if (!part) return false;
      if (isWordStopWord(part)) return false;
      if (part.length >= MIN_TOKEN_LENGTH) return true;
      return isAllowedShortWordToken(part);
    });
}

function normalizeWordArtifact(rawArtifact = null, index = 0) {
  if (!rawArtifact) return null;

  const text = String(rawArtifact.text || "").trim();
  if (!text) return null;

  const tokens = tokenizeWordLayerText(text);
  if (!tokens.length) return null;

  const occurredAt = String(rawArtifact.occurredAt || "").trim();
  const orderKind =
    normalizeOrderKind(rawArtifact.orderKind) === "explicit" || getTimestamp(occurredAt)
      ? "explicit"
      : "inferred";

  return {
    artifactId: String(rawArtifact.artifactId || `word-artifact-${index + 1}`),
    artifactKind: normalizeArtifactKind(rawArtifact.artifactKind),
    documentKey: String(rawArtifact.documentKey || "").trim(),
    receiptId: String(rawArtifact.receiptId || "").trim(),
    occurredAt,
    orderKind,
    authorship: normalizeArtifactAuthorship(rawArtifact.authorship),
    text,
    title: String(rawArtifact.title || "").trim(),
    sectionTitle: String(rawArtifact.sectionTitle || "").trim(),
    sealed: Boolean(rawArtifact.sealed),
    sourceClassificationLabel: String(rawArtifact.sourceClassificationLabel || "").trim(),
    excerpt: buildExcerpt(stripMarkdownSyntax(text), 180),
    tokens,
    tokenCounts: tokens.reduce((accumulator, token) => {
      accumulator[token] = (accumulator[token] || 0) + 1;
      return accumulator;
    }, {}),
  };
}

function sortArtifacts(rawArtifacts = []) {
  const artifacts = rawArtifacts
    .map((artifact, index) => normalizeWordArtifact(artifact, index))
    .filter(Boolean)
    .map((artifact, index) => ({
      ...artifact,
      inputIndex: index,
      timestamp: getTimestamp(artifact.occurredAt),
      hasExplicitTime: artifact.orderKind === "explicit" && Boolean(getTimestamp(artifact.occurredAt)),
    }));

  const explicitCount = artifacts.filter((artifact) => artifact.hasExplicitTime).length;
  const chronologyKind =
    explicitCount >= TEMPORAL_MIN_EXPLICIT_ARTIFACTS ? "explicit" : "inferred";

  const ordered = [...artifacts].sort((left, right) => {
    if (chronologyKind === "explicit" && left.hasExplicitTime && right.hasExplicitTime) {
      if (left.timestamp !== right.timestamp) {
        return left.timestamp - right.timestamp;
      }
      return left.inputIndex - right.inputIndex;
    }

    if (chronologyKind === "explicit" && left.hasExplicitTime !== right.hasExplicitTime) {
      return left.hasExplicitTime ? -1 : 1;
    }

    if (left.timestamp && right.timestamp && left.timestamp !== right.timestamp) {
      return left.timestamp - right.timestamp;
    }

    return left.inputIndex - right.inputIndex;
  });

  return {
    artifacts: ordered.map((artifact, index) => ({
      ...artifact,
      orderIndex: index,
    })),
    chronologyKind,
    explicitCount,
    hasEnoughChronology: chronologyKind === "explicit" && ordered.length >= TEMPORAL_SLICE_COUNT,
  };
}

function buildSliceMap(artifacts = [], hasEnoughChronology = false) {
  if (!artifacts.length || !hasEnoughChronology) {
    return new Map();
  }

  const sliceMap = new Map();
  artifacts.forEach((artifact, index) => {
    const ratio = artifacts.length <= 1 ? 0 : index / (artifacts.length - 1);
    const sliceId = Math.min(
      TEMPORAL_SLICE_COUNT - 1,
      Math.floor(ratio * TEMPORAL_SLICE_COUNT),
    );
    sliceMap.set(artifact.artifactId, sliceId);
  });
  return sliceMap;
}

function buildTermSummaryMap(artifacts = [], sliceMap = new Map()) {
  const summaries = new Map();

  artifacts.forEach((artifact) => {
    const uniqueTokens = new Set(artifact.tokens);

    uniqueTokens.forEach((token) => {
      const summary =
        summaries.get(token) ||
        {
          term: token,
          classKey: getWordTaxonomyBucket(token),
          classLabel: getWordTaxonomyLabel(getWordTaxonomyBucket(token)),
          count: 0,
          artifactCount: 0,
          firstSeenIndex: Number.POSITIVE_INFINITY,
          lastSeenIndex: Number.NEGATIVE_INFINITY,
          firstSeenAt: "",
          lastSeenAt: "",
          firstArtifactId: "",
          lastArtifactId: "",
          sourceArtifactCount: 0,
          seedArtifactCount: 0,
          receiptArtifactCount: 0,
          sealedReceiptArtifactCount: 0,
          rootArtifactCount: 0,
          authorshipCounts: {},
          sliceIds: new Set(),
          earlyArtifactCount: 0,
          lateArtifactCount: 0,
          evidenceMoments: [],
        };

      summary.count += artifact.tokenCounts[token] || 0;
      summary.artifactCount += 1;
      summary.authorshipCounts[artifact.authorship] =
        (summary.authorshipCounts[artifact.authorship] || 0) + 1;

      if (artifact.artifactKind === "source") summary.sourceArtifactCount += 1;
      if (artifact.artifactKind === "seed") summary.seedArtifactCount += 1;
      if (artifact.artifactKind === "receipt") {
        summary.receiptArtifactCount += 1;
        if (artifact.sealed) summary.sealedReceiptArtifactCount += 1;
      }
      if (artifact.artifactKind === "root") summary.rootArtifactCount += 1;

      if (artifact.orderIndex < summary.firstSeenIndex) {
        summary.firstSeenIndex = artifact.orderIndex;
        summary.firstSeenAt = artifact.occurredAt;
        summary.firstArtifactId = artifact.artifactId;
      }
      if (artifact.orderIndex > summary.lastSeenIndex) {
        summary.lastSeenIndex = artifact.orderIndex;
        summary.lastSeenAt = artifact.occurredAt;
        summary.lastArtifactId = artifact.artifactId;
      }

      const sliceId = sliceMap.get(artifact.artifactId);
      if (Number.isInteger(sliceId)) {
        summary.sliceIds.add(sliceId);
      }

      const positionRatio = artifacts.length <= 1 ? 0 : artifact.orderIndex / (artifacts.length - 1);
      if (positionRatio <= 0.4) summary.earlyArtifactCount += 1;
      if (positionRatio >= 0.7) summary.lateArtifactCount += 1;

      summary.evidenceMoments.push({
        artifactId: artifact.artifactId,
        artifactKind: artifact.artifactKind,
        authorship: artifact.authorship,
        documentKey: artifact.documentKey,
        receiptId: artifact.receiptId,
        label: buildArtifactLabel(artifact),
        occurredAt: artifact.occurredAt,
        orderKind: artifact.orderKind,
        excerpt: artifact.excerpt,
        sectionTitle: artifact.sectionTitle,
      });

      summaries.set(token, summary);
    });
  });

  return summaries;
}

function finalizeTermSummary(summary = null, artifacts = [], hasEnoughChronology = false) {
  if (!summary) return null;
  const timelineLength = Math.max(artifacts.length - 1, 1);
  const firstRatio = summary.firstSeenIndex / timelineLength;
  const lastRatio = summary.lastSeenIndex / timelineLength;
  const sliceCoverage = hasEnoughChronology
    ? summary.sliceIds.size / TEMPORAL_SLICE_COUNT
    : 0;
  const laterArtifactCount = Math.max(summary.artifactCount - 1, 0);
  const carried = summary.sourceArtifactCount > 0 && (summary.seedArtifactCount > 0 || summary.sealedReceiptArtifactCount > 0);
  const dropped =
    summary.count >= 2 &&
    (summary.sourceArtifactCount > 0 || summary.seedArtifactCount > 0) &&
    summary.seedArtifactCount === 0 &&
    summary.sealedReceiptArtifactCount === 0;

  return {
    ...summary,
    sliceCoverage,
    firstRatio,
    lastRatio,
    invariant:
      hasEnoughChronology &&
      summary.count >= 3 &&
      sliceCoverage >= 0.6 &&
      firstRatio <= 0.4 &&
      lastRatio >= 0.6,
    emergent:
      hasEnoughChronology &&
      summary.count >= 2 &&
      firstRatio > 0.3 &&
      laterArtifactCount >= 2,
    receding:
      hasEnoughChronology &&
      summary.earlyArtifactCount >= 2 &&
      summary.lateArtifactCount === 0,
    carried,
    dropped,
    orderKind: hasEnoughChronology ? "explicit" : "inferred",
    evidenceMoments: summary.evidenceMoments.slice(0, 6),
  };
}

function sortTerms(terms = []) {
  return [...terms].sort((left, right) => {
    if (right.count !== left.count) return right.count - left.count;
    if (right.artifactCount !== left.artifactCount) return right.artifactCount - left.artifactCount;
    return left.term.localeCompare(right.term);
  });
}

function buildClassSummary(terms = []) {
  const counts = Object.keys(WORD_TAXONOMY_LABELS).reduce((accumulator, key) => {
    accumulator[key] = 0;
    return accumulator;
  }, {});

  terms.forEach((term) => {
    counts[term.classKey] = (counts[term.classKey] || 0) + 1;
  });

  return Object.entries(WORD_TAXONOMY_LABELS).map(([id, label]) => ({
    id,
    label,
    count: counts[id] || 0,
  }));
}

function buildDominantClasses(classSummary = []) {
  return [...classSummary]
    .filter((entry) => entry.count > 0)
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return left.label.localeCompare(right.label);
    })
    .slice(0, 3);
}

function buildTopCooccurrences(artifacts = [], termCounts = new Map()) {
  const pairCounts = new Map();

  artifacts.forEach((artifact) => {
    const uniqueTokens = [...new Set(artifact.tokens)]
      .filter((token) => (termCounts.get(token) || 0) >= 2)
      .sort();

    for (let index = 0; index < uniqueTokens.length; index += 1) {
      for (let inner = index + 1; inner < uniqueTokens.length; inner += 1) {
        const key = `${uniqueTokens[index]}::${uniqueTokens[inner]}`;
        pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
      }
    }
  });

  return [...pairCounts.entries()]
    .map(([key, count]) => {
      const [left, right] = key.split("::");
      return {
        id: key,
        terms: [left, right],
        count,
      };
    })
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return left.id.localeCompare(right.id);
    })
    .slice(0, 8);
}

function buildEvidenceMoments(terms = [], artifacts = []) {
  const prioritizedTerms = [
    ...terms.filter((term) => term.carried).slice(0, 4),
    ...terms.filter((term) => term.emergent).slice(0, 3),
    ...terms.filter((term) => term.receding).slice(0, 3),
    ...terms.filter((term) => term.classKey === "canonical").slice(0, 3),
  ];
  const seenArtifactIds = new Set();
  const evidenceMoments = [];

  prioritizedTerms.forEach((term) => {
    term.evidenceMoments.forEach((moment) => {
      if (seenArtifactIds.has(moment.artifactId)) return;
      seenArtifactIds.add(moment.artifactId);
      evidenceMoments.push({
        ...moment,
        term: term.term,
        classKey: term.classKey,
      });
    });
  });

  if (evidenceMoments.length) {
    return evidenceMoments.slice(0, 8);
  }

  return artifacts.slice(0, 5).map((artifact) => ({
    artifactId: artifact.artifactId,
    artifactKind: artifact.artifactKind,
    authorship: artifact.authorship,
    documentKey: artifact.documentKey,
    receiptId: artifact.receiptId,
    label: buildArtifactLabel(artifact),
    occurredAt: artifact.occurredAt,
    orderKind: artifact.orderKind,
    excerpt: artifact.excerpt,
    sectionTitle: artifact.sectionTitle,
    term: "",
    classKey: "",
  }));
}

function buildDivergenceMoments(carriedTerms = [], droppedTerms = []) {
  const moments = [];

  droppedTerms.slice(0, 6).forEach((dropped) => {
    const partner =
      carriedTerms.find(
        (carried) =>
          carried.term !== dropped.term &&
          carried.lastSeenIndex > dropped.lastSeenIndex &&
          (carried.classKey === dropped.classKey ||
            (carried.classKey !== "uncategorized" && dropped.classKey !== "uncategorized")),
      ) || carriedTerms[0];

    if (!partner) return;

    moments.push({
      id: `selection-${dropped.term}-${partner.term}`,
      label: `${partner.term} persists after ${dropped.term} recedes`,
      summary: `${partner.term} stays carried while ${dropped.term} falls out of the current live language.`,
      pivotPair: `${dropped.term} -> ${partner.term}`,
      fromTerm: dropped.term,
      toTerm: partner.term,
      fromClassKey: dropped.classKey,
      toClassKey: partner.classKey,
      fromCount: dropped.count,
      toCount: partner.count,
      occurredAt: dropped.lastSeenAt || partner.lastSeenAt || "",
      orderKind:
        dropped.orderKind === "explicit" && partner.orderKind === "explicit"
          ? "explicit"
          : "inferred",
      evidenceTerms: [partner.term, dropped.term],
      classKey: partner.classKey !== "uncategorized" ? partner.classKey : dropped.classKey,
      linkedMoveEntryId: "",
      supportsLakinMoment: false,
      certaintyKind: "inferred",
      source: "derived",
    });
  });

  return moments.slice(0, 4);
}

function buildHypothesisReadyEvidence({
  classSummary = [],
  invariantTerms = [],
  emergentTerms = [],
  recedingTerms = [],
  carriedTerms = [],
  droppedTerms = [],
  divergenceMoments = [],
  lakinMoments = [],
  topCanonicalTerms = [],
  topStructuralTerms = [],
  topCooccurrences = [],
  evidenceMoments = [],
} = {}) {
  const payload = {
    available:
      classSummary.some((entry) => entry.count > 0) &&
      (carriedTerms.length > 0 ||
        emergentTerms.length > 0 ||
        recedingTerms.length > 0 ||
        topCanonicalTerms.length > 0),
    classSummary: classSummary.filter((entry) => entry.count > 0),
    invariantTerms: invariantTerms.slice(0, 6).map((term) => ({
      term: term.term,
      classKey: term.classKey,
      count: term.count,
    })),
    emergentTerms: emergentTerms.slice(0, 6).map((term) => ({
      term: term.term,
      classKey: term.classKey,
      count: term.count,
    })),
    recedingTerms: recedingTerms.slice(0, 6).map((term) => ({
      term: term.term,
      classKey: term.classKey,
      count: term.count,
    })),
    carriedTerms: carriedTerms.slice(0, 6).map((term) => ({
      term: term.term,
      classKey: term.classKey,
      count: term.count,
    })),
    droppedTerms: droppedTerms.slice(0, 6).map((term) => ({
      term: term.term,
      classKey: term.classKey,
      count: term.count,
    })),
    divergenceMoments: divergenceMoments.slice(0, 4),
    lakinMoments: lakinMoments.slice(0, 4).map((moment) => ({
      label: moment.label,
      summary: moment.summary,
      pivotPair: moment.pivotPair,
      evidenceTerms: Array.isArray(moment.evidenceTerms) ? moment.evidenceTerms.slice(0, 4) : [],
      source: moment.source,
      confidence: moment.certaintyKind === "event_backed" ? "medium" : "low",
    })),
    topCanonicalTerms: topCanonicalTerms.slice(0, 5).map((term) => ({
      term: term.term,
      count: term.count,
    })),
    topStructuralTerms: topStructuralTerms.slice(0, 5).map((term) => ({
      term: term.term,
      count: term.count,
    })),
    topCooccurrences: topCooccurrences.slice(0, 6),
    evidenceMoments: evidenceMoments.slice(0, 6),
  };

  return payload;
}

function buildWordLayerFromArtifacts({
  boxTitle = "",
  artifacts = [],
  currentSeedDocumentKey = "",
} = {}) {
  const sorted = sortArtifacts(artifacts);
  const orderedArtifacts = sorted.artifacts;

  if (!orderedArtifacts.length) {
    return {
      boxTitle,
      artifactCount: 0,
      termCount: 0,
      classSummary: [],
      dominantClasses: [],
      invariantTerms: [],
      emergentTerms: [],
      recedingTerms: [],
      carriedTerms: [],
      droppedTerms: [],
      divergenceMoments: [],
      lakinMoments: [],
      topCanonicalTerms: [],
      topStructuralTerms: [],
      hasEnoughChronology: false,
      chronologyKind: "inferred",
      topCooccurrences: [],
      hypothesisReadyEvidence: {
        available: false,
        classSummary: [],
        invariantTerms: [],
        emergentTerms: [],
        recedingTerms: [],
        carriedTerms: [],
        droppedTerms: [],
        divergenceMoments: [],
        lakinMoments: [],
        topCanonicalTerms: [],
        topStructuralTerms: [],
        topCooccurrences: [],
        evidenceMoments: [],
      },
      disclaimer: "Interpretations are hypotheses, not facts.",
      empty: true,
      lowHistoryNote: "Add more language to the box before reading for lexical patterns.",
      artifacts: [],
      currentSeedDocumentKey,
    };
  }

  const sliceMap = buildSliceMap(orderedArtifacts, sorted.hasEnoughChronology);
  const termSummaryMap = buildTermSummaryMap(orderedArtifacts, sliceMap);
  const termCounts = new Map(
    [...termSummaryMap.entries()].map(([term, summary]) => [term, summary.count]),
  );
  const allTerms = sortTerms(
    [...termSummaryMap.values()]
      .map((summary) =>
        finalizeTermSummary(summary, orderedArtifacts, sorted.hasEnoughChronology),
      )
      .filter(Boolean),
  );

  const classSummary = buildClassSummary(allTerms);
  const dominantClasses = buildDominantClasses(classSummary);
  const invariantTerms = allTerms.filter((term) => term.invariant).slice(0, 8);
  const emergentTerms = allTerms.filter((term) => term.emergent).slice(0, 8);
  const recedingTerms = allTerms.filter((term) => term.receding).slice(0, 8);
  const carriedTerms = allTerms.filter((term) => term.carried).slice(0, 8);
  const droppedTerms = allTerms.filter((term) => term.dropped).slice(0, 8);
  const divergenceMoments = buildDivergenceMoments(carriedTerms, droppedTerms);
  const lakinMoments = [];
  const topCanonicalTerms = allTerms.filter((term) => term.classKey === "canonical").slice(0, 8);
  const topStructuralTerms = allTerms.filter((term) => term.classKey === "structural").slice(0, 8);
  const topCooccurrences = buildTopCooccurrences(orderedArtifacts, termCounts);
  const evidenceMoments = buildEvidenceMoments(allTerms, orderedArtifacts);

  return {
    boxTitle,
    artifactCount: orderedArtifacts.length,
    termCount: allTerms.length,
    classSummary,
    dominantClasses,
    invariantTerms,
    emergentTerms,
    recedingTerms,
    carriedTerms,
    droppedTerms,
    divergenceMoments,
    lakinMoments,
    topCanonicalTerms,
    topStructuralTerms,
    hasEnoughChronology: sorted.hasEnoughChronology,
    chronologyKind: sorted.chronologyKind,
    topCooccurrences,
    hypothesisReadyEvidence: buildHypothesisReadyEvidence({
      classSummary,
      invariantTerms,
      emergentTerms,
      recedingTerms,
      carriedTerms,
      droppedTerms,
      divergenceMoments,
      lakinMoments,
      topCanonicalTerms,
      topStructuralTerms,
      topCooccurrences,
      evidenceMoments,
    }),
    disclaimer: "Interpretations are hypotheses, not facts.",
    empty: false,
    lowHistoryNote: sorted.hasEnoughChronology
      ? ""
      : "More authored chronology is needed before the box can speak honestly about what emerged or receded.",
    artifacts: orderedArtifacts,
    currentSeedDocumentKey,
  };
}

function buildMoveTokenSet(entry = null) {
  return new Set(
    tokenizeWordLayerText(
      [entry?.title, entry?.detail, entry?.pivotPair, entry?.lakinSummary]
        .filter(Boolean)
        .join(" "),
    ),
  );
}

function parsePivotPair(pivotPair = "") {
  const normalized = String(pivotPair || "").trim();
  if (!normalized.includes("->")) {
    return {
      fromTerm: "",
      toTerm: "",
      pivotPair: normalized,
    };
  }

  const [rawFrom, rawTo] = normalized.split("->");
  return {
    fromTerm: normalizeWordToken(rawFrom),
    toTerm: normalizeWordToken(rawTo),
    pivotPair: `${normalizeWordToken(rawFrom)} -> ${normalizeWordToken(rawTo)}`,
  };
}

function isEligibleDerivedLakinMoment(moment = null, hasEnoughChronology = false) {
  if (!moment || !hasEnoughChronology) return false;
  if ((Number(moment.fromCount) || 0) < LAKIN_MIN_TERM_COUNT) return false;
  if ((Number(moment.toCount) || 0) < LAKIN_MIN_TERM_COUNT) return false;
  if (
    String(moment.fromClassKey || "").trim() === "uncategorized" &&
    String(moment.toClassKey || "").trim() === "uncategorized"
  ) {
    return false;
  }
  return Boolean(moment.fromTerm && moment.toTerm);
}

function findLinkedMoveEntry(moment = null, moveEntries = []) {
  if (!moment || !Array.isArray(moveEntries) || moveEntries.length === 0) return null;

  const momentTimestamp = getTimestamp(moment.occurredAt);
  const fromTerm = normalizeWordToken(moment.fromTerm);
  const toTerm = normalizeWordToken(moment.toTerm);
  const candidates = moveEntries
    .map((entry) => {
      const tokenSet = buildMoveTokenSet(entry);
      const lexicalScore = [fromTerm, toTerm].filter((term) => term && tokenSet.has(term)).length;
      const entryTimestamp = getTimestamp(entry?.occurredAt);
      const timeDistance =
        momentTimestamp && entryTimestamp ? Math.abs(entryTimestamp - momentTimestamp) : Number.POSITIVE_INFINITY;
      const withinTimeWindow = Number.isFinite(timeDistance) && timeDistance <= LAKIN_MAX_TIME_DISTANCE_MS;
      const curatedBoost = entry?.isLakinMoment ? 1 : 0;

      return {
        entry,
        lexicalScore,
        timeDistance,
        withinTimeWindow,
        curatedBoost,
      };
    })
    .filter((candidate) => candidate.lexicalScore > 0 || candidate.withinTimeWindow || candidate.curatedBoost > 0)
    .sort((left, right) => {
      if (right.curatedBoost !== left.curatedBoost) return right.curatedBoost - left.curatedBoost;
      if (right.lexicalScore !== left.lexicalScore) return right.lexicalScore - left.lexicalScore;
      if (left.timeDistance !== right.timeDistance) return left.timeDistance - right.timeDistance;
      return String(left.entry?.title || "").localeCompare(String(right.entry?.title || ""));
    });

  return candidates[0]?.entry || null;
}

function buildLakinMomentFromMoveEntry(entry = null) {
  if (!entry?.isLakinMoment) return null;

  const parsedPivot = parsePivotPair(entry.pivotPair);
  const evidenceTerms = [
    parsedPivot.fromTerm || String(entry.fromTerm || "").trim(),
    parsedPivot.toTerm || String(entry.toTerm || "").trim(),
  ].filter(Boolean);

  return {
    id: `lakin-${entry.id}`,
    label: entry.title || "Lakin moment",
    summary:
      entry.lakinSummary ||
      entry.detail ||
      "A direction fell away and a more durable one was carried forward.",
    pivotPair: parsedPivot.pivotPair || entry.pivotPair || "",
    fromTerm: parsedPivot.fromTerm || String(entry.fromTerm || "").trim(),
    toTerm: parsedPivot.toTerm || String(entry.toTerm || "").trim(),
    evidenceTerms,
    linkedMoveEntryId: entry.id,
    orderKind: entry.orderKind || "inferred",
    certaintyKind: entry.certaintyKind === "event_backed" ? "event_backed" : "inferred",
    source: entry.lakinSource || "curated",
  };
}

export function annotateWordLayerWithLakinMoments({
  wordLayer = null,
  laneEntries = [],
} = {}) {
  if (!wordLayer) {
    return {
      wordLayer,
      laneEntries,
    };
  }

  const moveEntries = (Array.isArray(laneEntries) ? laneEntries : []).filter(
    (entry) => entry?.kind === "move",
  );
  const derivedMoments = (Array.isArray(wordLayer.divergenceMoments) ? wordLayer.divergenceMoments : []).map(
    (moment) => {
      if (!isEligibleDerivedLakinMoment(moment, wordLayer.hasEnoughChronology)) {
        return {
          ...moment,
          linkedMoveEntryId: "",
          supportsLakinMoment: false,
          certaintyKind: "inferred",
          source: "derived",
        };
      }

      const linkedMoveEntry = findLinkedMoveEntry(moment, moveEntries);
      if (!linkedMoveEntry?.id) {
        return {
          ...moment,
          linkedMoveEntryId: "",
          supportsLakinMoment: false,
          certaintyKind: "inferred",
          source: "derived",
        };
      }

      return {
        ...moment,
        linkedMoveEntryId: linkedMoveEntry.id,
        supportsLakinMoment: true,
        certaintyKind:
          linkedMoveEntry.certaintyKind === "event_backed" ? "event_backed" : "inferred",
        source: "derived",
      };
    },
  );

  const derivedLakinMoments = derivedMoments
    .filter((moment) => moment.supportsLakinMoment && moment.linkedMoveEntryId)
    .map((moment) => ({
      id: `lakin-${moment.id}`,
      label: moment.pivotPair || moment.label || "Lakin moment",
      summary:
        moment.summary ||
        `${moment.toTerm} carries forward while ${moment.fromTerm} falls away.`,
      pivotPair: moment.pivotPair || "",
      fromTerm: moment.fromTerm || "",
      toTerm: moment.toTerm || "",
      evidenceTerms: Array.isArray(moment.evidenceTerms) ? moment.evidenceTerms : [],
      linkedMoveEntryId: moment.linkedMoveEntryId,
      orderKind: moment.orderKind || "inferred",
      certaintyKind: moment.certaintyKind || "inferred",
      source: "derived",
    }));

  const curatedLakinMoments = moveEntries
    .map((entry) => buildLakinMomentFromMoveEntry(entry))
    .filter(Boolean);

  const lakinByMoveEntryId = new Map();
  [...derivedLakinMoments, ...curatedLakinMoments].forEach((moment) => {
    const linkedMoveEntryId = String(moment?.linkedMoveEntryId || "").trim();
    if (!linkedMoveEntryId) return;

    const existing = lakinByMoveEntryId.get(linkedMoveEntryId);
    if (!existing || moment.source === "curated") {
      lakinByMoveEntryId.set(linkedMoveEntryId, {
        ...existing,
        ...moment,
        evidenceTerms: [
          ...new Set([...(existing?.evidenceTerms || []), ...(moment?.evidenceTerms || [])].filter(Boolean)),
        ],
      });
      return;
    }

    lakinByMoveEntryId.set(linkedMoveEntryId, {
      ...existing,
      evidenceTerms: [
        ...new Set([...(existing?.evidenceTerms || []), ...(moment?.evidenceTerms || [])].filter(Boolean)),
      ],
    });
  });

  const enhancedLaneEntries = (Array.isArray(laneEntries) ? laneEntries : []).map((entry) => {
    if (entry?.kind !== "move") return entry;
    const lakinMoment = lakinByMoveEntryId.get(entry.id);
    if (!lakinMoment) return entry;

    return {
      ...entry,
      isLakinMoment: true,
      pivotPair: entry.pivotPair || lakinMoment.pivotPair || "",
      fromTerm: entry.fromTerm || lakinMoment.fromTerm || "",
      toTerm: entry.toTerm || lakinMoment.toTerm || "",
      lakinSummary: entry.lakinSummary || lakinMoment.summary || "",
      lakinSource: entry.lakinSource || lakinMoment.source || "",
    };
  });

  const enhancedDivergenceMoments = derivedMoments.map((moment) => {
    const linkedLakinMoment = lakinByMoveEntryId.get(String(moment?.linkedMoveEntryId || "").trim());
    if (!linkedLakinMoment) return moment;

    return {
      ...moment,
      pivotPair: linkedLakinMoment.pivotPair || moment.pivotPair || "",
      supportsLakinMoment: true,
      linkedMoveEntryId: linkedLakinMoment.linkedMoveEntryId,
      certaintyKind: linkedLakinMoment.certaintyKind || moment.certaintyKind || "inferred",
    };
  });

  const lakinMoments = [...lakinByMoveEntryId.values()].slice(0, 4);

  return {
    wordLayer: {
      ...wordLayer,
      divergenceMoments: enhancedDivergenceMoments,
      lakinMoments,
      hypothesisReadyEvidence: {
        ...(wordLayer.hypothesisReadyEvidence && typeof wordLayer.hypothesisReadyEvidence === "object"
          ? wordLayer.hypothesisReadyEvidence
          : {}),
        divergenceMoments: enhancedDivergenceMoments.slice(0, 4),
        lakinMoments: lakinMoments.slice(0, 4).map((moment) => ({
          label: moment.label,
          summary: moment.summary,
          pivotPair: moment.pivotPair,
          evidenceTerms: Array.isArray(moment.evidenceTerms) ? moment.evidenceTerms.slice(0, 4) : [],
          source: moment.source,
          confidence: moment.certaintyKind === "event_backed" ? "medium" : "low",
        })),
      },
    },
    laneEntries: enhancedLaneEntries,
  };
}

function isAssemblyDocument(document = null) {
  return Boolean(document?.isAssembly || document?.documentType === "assembly");
}

function isGuideDocument(document = null) {
  return Boolean(document?.documentType === "builtin" || document?.sourceType === "builtin");
}

function getProjectRootArtifact(activeProject = null, authorship = "user") {
  const meta = normalizeProjectArchitectureMeta(
    activeProject?.metadataJson || activeProject?.architectureMeta || null,
  );
  const rootText = String(meta?.root?.text || "").trim();
  const rootGloss = String(meta?.root?.gloss || "").trim();
  const text = [rootText, rootGloss].filter(Boolean).join("\n\n").trim();
  if (!text) return null;

  return {
    artifactId: "word-root",
    artifactKind: "root",
    documentKey: "",
    occurredAt: meta?.root?.createdAt || activeProject?.createdAt || "",
    orderKind: meta?.root?.createdAt ? "explicit" : "inferred",
    authorship,
    text,
    title: "Root",
  };
}

function buildSourceArtifacts(documents = [], authorship = "imported_source") {
  return (Array.isArray(documents) ? documents : [])
    .filter(
      (document) =>
        document &&
        !document.hiddenFromProjectHome &&
        !isAssemblyDocument(document) &&
        !isGuideDocument(document),
    )
    .flatMap((document) =>
      (Array.isArray(document?.blocks) ? document.blocks : [])
        .filter((block) => String(block?.plainText || block?.text || "").trim())
        .map((block) => ({
          artifactId: `word-source-${document.documentKey}-${block.id || block.sourcePosition || Math.random()}`,
          artifactKind: "source",
          documentKey: document.documentKey,
          occurredAt: block?.createdAt || block?.updatedAt || document?.createdAt || document?.updatedAt || "",
          orderKind:
            getTimestamp(block?.createdAt || block?.updatedAt || document?.createdAt || document?.updatedAt)
              ? "explicit"
              : "inferred",
          authorship,
          text: block?.plainText || block?.text || "",
          title: document?.title || "Source",
          sectionTitle: block?.sectionTitle || "",
          sourceClassificationLabel: String(document?.sourceClassificationLabel || "").trim(),
        })),
    );
}

function buildSeedArtifacts(seedDocument = null, authorshipFallback = "user") {
  if (!seedDocument) return [];

  return (Array.isArray(seedDocument?.blocks) ? seedDocument.blocks : [])
    .filter((block) => String(block?.plainText || block?.text || "").trim())
    .map((block, index) => ({
      artifactId: `word-seed-${seedDocument.documentKey}-${block.id || index + 1}`,
      artifactKind: "seed",
      documentKey: seedDocument.documentKey,
      occurredAt: block?.updatedAt || block?.createdAt || seedDocument?.updatedAt || seedDocument?.createdAt || "",
      orderKind:
        getTimestamp(block?.updatedAt || block?.createdAt || seedDocument?.updatedAt || seedDocument?.createdAt)
          ? "explicit"
          : "inferred",
      authorship:
        authorshipFallback === "system_example"
          ? "system_example"
          : String(block?.author || "").trim().toLowerCase() === "ai"
            ? "ai"
            : authorshipFallback,
      text: block?.plainText || block?.text || "",
      title: seedDocument?.title || "Seed",
      sectionTitle: block?.sectionTitle || "",
    }));
}

function buildReceiptArtifacts(drafts = [], authorship = "user") {
  return (Array.isArray(drafts) ? drafts : [])
    .map((draft) => {
      const fields = [
        draft?.title,
        draft?.payload?.deltaStatement,
        draft?.interpretation,
        draft?.implications,
        draft?.stance,
      ]
        .map((value) => String(value || "").trim())
        .filter(Boolean);

      if (!fields.length) return null;

      return {
        artifactId: `word-receipt-${draft?.id || draft?.documentKey || draft?.title || "draft"}`,
        artifactKind: "receipt",
        documentKey: String(draft?.documentKey || "").trim(),
        receiptId: String(draft?.id || "").trim(),
        occurredAt: draft?.updatedAt || draft?.createdAt || "",
        orderKind: getTimestamp(draft?.updatedAt || draft?.createdAt) ? "explicit" : "inferred",
        authorship,
        text: fields.join("\n\n"),
        title: draft?.title || "Receipt",
        sealed: String(draft?.status || "").trim().toUpperCase() === "SEALED",
      };
    })
    .filter(Boolean);
}

export function buildBoxWordLayerViewModel({
  activeProject = null,
  projectDocuments = [],
  currentAssemblyDocument = null,
  projectDrafts = [],
} = {}) {
  const authorship = activeProject?.isSystemExample ? "system_example" : "user";
  const rootArtifact = getProjectRootArtifact(activeProject, authorship);
  const sourceArtifacts = buildSourceArtifacts(
    projectDocuments,
    activeProject?.isSystemExample ? "system_example" : "imported_source",
  );
  const seedArtifacts = buildSeedArtifacts(currentAssemblyDocument, authorship);
  const receiptArtifacts = buildReceiptArtifacts(projectDrafts, authorship);

  return buildWordLayerFromArtifacts({
    boxTitle: activeProject?.boxTitle || activeProject?.title || "Untitled Box",
    artifacts: [rootArtifact, ...sourceArtifacts, ...seedArtifacts, ...receiptArtifacts].filter(Boolean),
    currentSeedDocumentKey: String(currentAssemblyDocument?.documentKey || "").trim(),
  });
}

export function buildWordLayerViewModel({
  boxTitle = "",
  artifacts = [],
  currentSeedDocumentKey = "",
} = {}) {
  return buildWordLayerFromArtifacts({
    boxTitle,
    artifacts,
    currentSeedDocumentKey,
  });
}
