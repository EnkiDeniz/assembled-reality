import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import { prisma } from "./prisma.js";

const CWD = process.cwd();
const OUTPUT_ROOT = path.join(CWD, "output", "compiler-read-benchmarks");

const PRESENT_DAY_PACKET_FILES = {
  jsonPath: path.join(
    OUTPUT_ROOT,
    "compiler-read-corpus-sample-first-reviewed-round-hand-frozen-2026-04-13.json",
  ),
  markdownPath: path.join(
    OUTPUT_ROOT,
    "compiler-read-corpus-sample-first-reviewed-round-hand-frozen-2026-04-13.md",
  ),
  reviewPath: path.join(
    OUTPUT_ROOT,
    "compiler-read-corpus-review-packet-first-reviewed-round-hand-frozen-2026-04-13.md",
  ),
  manifestPath: path.join(
    OUTPUT_ROOT,
    "compiler-read-corpus-sample-first-reviewed-round-hand-frozen-2026-04-13.manifest.json",
  ),
};

const HISTORICAL_PACKET_FILES = {
  jsonPath: path.join(OUTPUT_ROOT, "compiler-read-historical-replay-pilot-2026-04-13.json"),
  markdownPath: path.join(OUTPUT_ROOT, "compiler-read-historical-replay-pilot-2026-04-13.md"),
  reviewPath: path.join(OUTPUT_ROOT, "compiler-read-historical-replay-review-packet-2026-04-13.md"),
  manifestPath: path.join(OUTPUT_ROOT, "compiler-read-historical-replay-pilot-2026-04-13.manifest.json"),
};

const SCORE_FIELDS = new Set([
  "honestyScore",
  "understandabilityScore",
  "specificityScore",
  "actionabilityScore",
  "convergenceValueScore",
  "wouldUseAgainScore",
]);

const LATER_HISTORY_JUDGMENTS = new Set(["supported", "weakened", "mixed", "unclear"]);
const OVERALL_DECISIONS = new Set([
  "widen_replay_lane",
  "hold_replay_lane_fix_diagnostics_first",
  "hold_replay_lane_fix_grounding_first",
  "pilot_not_useful_yet",
]);

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeLongText(value = "") {
  return String(value || "").trim();
}

function normalizeNullableText(value = null) {
  const normalized = normalizeLongText(value || "");
  return normalized || null;
}

function relativeWorkspacePath(filePath = "") {
  return path.relative(CWD, filePath).split(path.sep).join("/");
}

function hashContent(value = "") {
  return crypto.createHash("sha256").update(String(value || ""), "utf8").digest("hex");
}

function readRequiredJsonFile(filePath, label) {
  if (!existsSync(filePath)) {
    throw new Error(`${label} not found at ${relativeWorkspacePath(filePath)}.`);
  }

  return JSON.parse(readFileSync(filePath, "utf8"));
}

function describeMissingArtifact(filePath, label) {
  return {
    label,
    path: relativeWorkspacePath(filePath),
  };
}

function listMissingReplayReviewArtifacts() {
  const missing = [];

  if (!existsSync(PRESENT_DAY_PACKET_FILES.jsonPath)) {
    missing.push(
      describeMissingArtifact(
        PRESENT_DAY_PACKET_FILES.jsonPath,
        "present-day packet JSON",
      ),
    );
  }

  if (!existsSync(HISTORICAL_PACKET_FILES.jsonPath)) {
    missing.push(
      describeMissingArtifact(
        HISTORICAL_PACKET_FILES.jsonPath,
        "historical replay packet JSON",
      ),
    );
  }

  return missing;
}

function buildReplayReviewUnavailableState(missingArtifacts = []) {
  const missingLabel = missingArtifacts.map((entry) => `${entry.label} (${entry.path})`).join(", ");
  const reason = missingArtifacts.length
    ? `Replay Review is not published on this deployment yet. Missing ${missingLabel}.`
    : "Replay Review is not published on this deployment yet.";

  return {
    available: false,
    reason,
    missingArtifacts,
    packetA: null,
    packetB: null,
    reviewKey: null,
  };
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildArtifactId(kind, report, sourceArtifactPath) {
  const explicit = normalizeText(report?.artifactId);
  if (explicit) return explicit;

  const metaSeed =
    normalizeText(report?.meta?.seed) ||
    normalizeText(report?.meta?.replayName) ||
    normalizeText(report?.meta?.manifestSourcePath);
  const generatedAt = normalizeText(report?.meta?.generatedAt);
  const digest = hashContent(`${kind}:${sourceArtifactPath}:${metaSeed}:${generatedAt}`).slice(0, 16);
  return `${kind}:${digest}`;
}

function buildRepeatDrift(documentRecord = null) {
  const stability = documentRecord?.stability || {};
  const isDrifting = !Boolean(stability.repeatStable);
  const runs = ensureArray(documentRecord?.runs);
  const changedFields = [];
  if (ensureArray(stability.instabilityReasons).includes("outcome_changed")) {
    changedFields.push("outcomeClass");
  }
  if (ensureArray(stability.instabilityReasons).includes("disposition_changed")) {
    changedFields.push("readDisposition");
  }
  if (ensureArray(stability.instabilityReasons).includes("mixed_success_and_error")) {
    changedFields.push("runStatus");
  }
  if (ensureArray(stability.instabilityReasons).includes("error_kind_changed")) {
    changedFields.push("errorKind");
  }

  return {
    isDrifting,
    changedFields,
    runA: runs[0] || null,
    runB: runs[1] || null,
  };
}

function buildDetailArtifactRefs(files, documentRecord = null) {
  return {
    packetJsonPath: relativeWorkspacePath(files.jsonPath),
    packetMarkdownPath: relativeWorkspacePath(files.markdownPath),
    reviewPacketPath: relativeWorkspacePath(files.reviewPath),
    manifestPath: relativeWorkspacePath(files.manifestPath),
    sourcePath: documentRecord?.currentPath || documentRecord?.documentPath || null,
  };
}

function buildPacketTrustCaveats(packetKind, report) {
  const caveats = [];

  if (packetKind === "present_day_packet") {
    caveats.push("Meaningful next-move rate is still a heuristic pre-review signal, not proof of usefulness.");
  }

  if (packetKind === "historical_replay_packet") {
    if (Number(report?.aggregateMetrics?.currentSnapshotExceptionCount || 0) > 0) {
      caveats.push("This replay packet still includes an explicit current-snapshot exception.");
    }
    if (Number(report?.aggregateMetrics?.groundingPassRate || 0) < 1) {
      caveats.push("Grounding remains partial across the replay packet and should not be overstated.");
    }
  }

  return caveats;
}

function summarizePrimaryRun(documentRecord = null) {
  const runs = ensureArray(documentRecord?.runs);
  return runs.find((run) => run?.ok) || runs[0] || null;
}

function derivePresentDayFallbackEntries(report) {
  const merged = new Map();
  const documentsByPath = new Map(ensureArray(report?.documents).map((document) => [document.documentPath, document]));

  const upsert = (entry = {}, sourceTag = "") => {
    const documentPath = normalizeText(entry.documentPath);
    if (!documentPath) return;

    const existing = merged.get(documentPath) || {
      entryId: documentPath,
      documentPath,
      documentCategory: normalizeText(entry.documentCategory || "unknown"),
      sourceTags: [],
      promotionReasons: [],
      nextMoves: [],
      instabilityReasons: [],
      repeatStable: true,
      usefulnessSignalScore: null,
      primaryFinding: null,
      outcomeClass: null,
      readDisposition: null,
    };

    if (sourceTag) {
      existing.sourceTags = [...new Set([...existing.sourceTags, sourceTag])];
    }
    if (entry.reason) {
      existing.promotionReasons = [...new Set([...existing.promotionReasons, entry.reason])];
    }
    if (Array.isArray(entry.nextMoves)) {
      existing.nextMoves = [...new Set([...existing.nextMoves, ...entry.nextMoves])];
    }
    if (Array.isArray(entry.instabilityReasons)) {
      existing.instabilityReasons = [...new Set([...existing.instabilityReasons, ...entry.instabilityReasons])];
    }
    if (typeof entry.repeatStable === "boolean") {
      existing.repeatStable = entry.repeatStable;
    }
    if (typeof entry.usefulnessSignalScore === "number") {
      existing.usefulnessSignalScore = Math.max(existing.usefulnessSignalScore ?? 0, entry.usefulnessSignalScore);
    }
    if (entry.primaryFinding && !existing.primaryFinding) {
      existing.primaryFinding = entry.primaryFinding;
    }
    if (entry.outcomeClass && !existing.outcomeClass) {
      existing.outcomeClass = entry.outcomeClass;
    }
    if (entry.readDisposition && !existing.readDisposition) {
      existing.readDisposition = entry.readDisposition;
    }
    if (entry.documentCategory && existing.documentCategory === "unknown") {
      existing.documentCategory = entry.documentCategory;
    }

    const documentRecord = documentsByPath.get(documentPath);
    if (documentRecord) {
      const primary = summarizePrimaryRun(documentRecord);
      existing.documentCategory =
        existing.documentCategory === "unknown"
          ? normalizeText(entry.documentCategory || "unknown")
          : existing.documentCategory;
      if (primary?.ok) {
        existing.primaryFinding = existing.primaryFinding || primary.compilerRead?.verdict?.primaryFinding || null;
        existing.outcomeClass = existing.outcomeClass || primary.compilerRead?.outcomeClass || null;
        existing.readDisposition =
          existing.readDisposition || primary.compilerRead?.verdict?.readDisposition || null;
      }
    }

    merged.set(documentPath, existing);
  };

  ensureArray(report?.topUsefulCases).forEach((entry) => upsert(entry, "top useful case"));
  ensureArray(report?.fixturePromotionCandidates).forEach((entry) =>
    upsert(entry, "fixture promotion candidate"),
  );

  if (!merged.size) {
    ensureArray(report?.documents)
      .slice(0, 4)
      .forEach((document) => {
        const primary = summarizePrimaryRun(document);
        upsert(
          {
            documentPath: document.documentPath,
            documentCategory: "unknown",
            nextMoves: ensureArray(primary?.compilerRead?.nextMoves),
            repeatStable: Boolean(document?.stability?.repeatStable),
            instabilityReasons: ensureArray(document?.stability?.instabilityReasons),
            usefulnessSignalScore: Number(primary?.compilerRead?.usefulnessSignalScore || 0),
            primaryFinding: primary?.compilerRead?.verdict?.primaryFinding || null,
            outcomeClass: primary?.compilerRead?.outcomeClass || null,
            readDisposition: primary?.compilerRead?.verdict?.readDisposition || null,
          },
          "fallback packet entry",
        );
      });
  }

  return [...merged.values()]
    .sort((left, right) => {
      const leftScore = left.usefulnessSignalScore ?? -1;
      const rightScore = right.usefulnessSignalScore ?? -1;
      if (rightScore !== leftScore) return rightScore - leftScore;
      return left.documentPath.localeCompare(right.documentPath);
    })
    .slice(0, Number(report?.meta?.reviewCount || 4));
}

function deriveHistoricalFallbackEntries(report) {
  return ensureArray(report?.documents)
    .map((document) => {
      const primary = summarizePrimaryRun(document);
      if (!primary?.ok) return null;
      const category =
        normalizeText(primary?.compilerRead?.verdict?.readDisposition) === "informative_only"
          ? "honest_limit"
          : document?.stability?.repeatStable
            ? "clean"
            : "edge";

      return {
        replayId: document.replayId,
        currentPath: document.currentPath,
        category,
        outcomeClass: primary.compilerRead?.outcomeClass || null,
        readDisposition: primary.compilerRead?.verdict?.readDisposition || null,
        primaryFinding: primary.compilerRead?.verdict?.primaryFinding || null,
        nextMoves: ensureArray(primary.compilerRead?.nextMoves),
        usefulnessSignalScore: Number(primary.compilerRead?.usefulnessSignalScore || 0),
        groundingRejectedClaimCount: Number(primary.compilerRead?.groundingRejectedClaimCount || 0),
        repeatStable: Boolean(document?.stability?.repeatStable),
        repeatStabilitySummary: document?.stability?.repeatStable
          ? "stable across repeats"
          : `unstable across repeats (${ensureArray(document?.stability?.instabilityReasons).join(", ") || "details in dossier"})`,
        instabilityReasons: ensureArray(document?.stability?.instabilityReasons),
        trustCaveats: ensureArray(primary.compilerRead?.trustCaveats),
        lookAheadSummary: document.lookAheadSummary || null,
        eraLabel: document.eraLabel,
        documentFamily: document.documentFamily,
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (left.category !== right.category) {
        const order = { clean: 0, edge: 1, honest_limit: 2 };
        return (order[left.category] ?? 99) - (order[right.category] ?? 99);
      }
      const leftScore = left.usefulnessSignalScore ?? -1;
      const rightScore = right.usefulnessSignalScore ?? -1;
      if (rightScore !== leftScore) return rightScore - leftScore;
      return left.currentPath.localeCompare(right.currentPath);
    })
    .slice(0, 4);
}

function normalizePresentDayEntry(entry = {}, report, files) {
  const documentsByPath = new Map(ensureArray(report?.documents).map((document) => [document.documentPath, document]));
  const documentRecord = documentsByPath.get(entry.documentPath) || null;
  const primaryRun =
    ensureArray(documentRecord?.runs).find((run) => run?.ok) ||
    ensureArray(documentRecord?.runs)[0] ||
    null;

  return {
    entryId: normalizeText(entry.documentPath),
    packetKind: "present_day_packet",
    label: path.basename(entry.documentPath || "review-entry"),
    sourcePath: normalizeText(entry.documentPath),
    category: normalizeText(entry.documentCategory || "unknown"),
    outcomeClass: normalizeText(entry.outcomeClass) || null,
    readDisposition: normalizeText(entry.readDisposition) || null,
    primaryFinding: normalizeNullableText(entry.primaryFinding),
    nextMoves: ensureArray(entry.nextMoves).map((item) => normalizeLongText(item)).filter(Boolean),
    repeatStability: {
      repeatStable: Boolean(entry.repeatStable),
      summary: entry.repeatStable
        ? "stable across repeats"
        : `unstable across repeats (${ensureArray(entry.instabilityReasons).join(", ") || "details in packet"})`,
      instabilityReasons: ensureArray(entry.instabilityReasons),
    },
    repeatDrift: buildRepeatDrift(documentRecord),
    groundingRejectedClaimCount: Number(primaryRun?.compilerRead?.groundingRejectedClaimCount || 0),
    lookAheadSummary: null,
    currentSnapshotException: null,
    detailArtifactRefs: buildDetailArtifactRefs(files, documentRecord),
    promotionReasons: ensureArray(entry.promotionReasons),
    sourceTags: ensureArray(entry.sourceTags),
    preReviewUsefulnessSignal: Number.isFinite(entry.usefulnessSignalScore) ? entry.usefulnessSignalScore : null,
  };
}

function normalizeHistoricalEntry(entry = {}, report, files) {
  const documentsById = new Map(ensureArray(report?.documents).map((document) => [document.replayId, document]));
  const documentRecord = documentsById.get(entry.replayId) || null;

  return {
    entryId: normalizeText(entry.replayId),
    packetKind: "historical_replay_packet",
    label: normalizeText(entry.replayId),
    sourcePath: normalizeText(entry.currentPath),
    category: normalizeText(entry.category || "unknown"),
    outcomeClass: normalizeText(entry.outcomeClass) || null,
    readDisposition: normalizeText(entry.readDisposition) || null,
    primaryFinding: normalizeNullableText(entry.primaryFinding),
    nextMoves: ensureArray(entry.nextMoves).map((item) => normalizeLongText(item)).filter(Boolean),
    repeatStability: {
      repeatStable: Boolean(entry.repeatStable),
      summary: normalizeNullableText(entry.repeatStabilitySummary),
      instabilityReasons: ensureArray(entry.instabilityReasons),
    },
    repeatDrift: buildRepeatDrift(documentRecord),
    groundingRejectedClaimCount: Number(entry.groundingRejectedClaimCount || 0),
    lookAheadSummary: entry.lookAheadSummary || null,
    currentSnapshotException: documentRecord?.pinExceptionReason
      ? {
          reason: documentRecord.pinExceptionReason,
          mode: documentRecord.sourceMode,
        }
      : null,
    detailArtifactRefs: buildDetailArtifactRefs(files, documentRecord),
    trustCaveats: ensureArray(entry.trustCaveats),
    eraLabel: normalizeText(entry.eraLabel),
    documentFamily: normalizeText(entry.documentFamily),
  };
}

function normalizePresentDayPacket(report, files) {
  const sourceArtifactPath = relativeWorkspacePath(files.jsonPath);
  const reviewEntriesSource = ensureArray(report?.reviewPacketEntries).length
    ? ensureArray(report?.reviewPacketEntries)
    : derivePresentDayFallbackEntries(report);
  const reviewEntries = reviewEntriesSource.map((entry) =>
    normalizePresentDayEntry(entry, report, files),
  );

  return {
    packetId: buildArtifactId("present_day_packet", report, sourceArtifactPath),
    packetKind: "present_day_packet",
    title: "Packet A: Frozen present-day benchmark",
    generatedAt: normalizeText(report?.meta?.generatedAt),
    sourceArtifactPath,
    manifestSourcePath: normalizeNullableText(report?.meta?.manifestSourcePath),
    summaryMetrics: report?.aggregateMetrics || {},
    recommendation:
      normalizeNullableText(report?.recommendation) ||
      normalizeNullableText(report?.recommendedNextTighteningStep),
    trustCaveats: buildPacketTrustCaveats("present_day_packet", report),
    entries: reviewEntries,
    artifactRefs: {
      jsonPath: relativeWorkspacePath(files.jsonPath),
      markdownPath: relativeWorkspacePath(files.markdownPath),
      reviewPath: relativeWorkspacePath(files.reviewPath),
      manifestPath: relativeWorkspacePath(files.manifestPath),
    },
  };
}

function normalizeHistoricalPacket(report, files) {
  const sourceArtifactPath = relativeWorkspacePath(files.jsonPath);
  const reviewEntriesSource = ensureArray(report?.reviewPacketEntries).length
    ? ensureArray(report?.reviewPacketEntries)
    : deriveHistoricalFallbackEntries(report);
  const reviewEntries = reviewEntriesSource.map((entry) =>
    normalizeHistoricalEntry(entry, report, files),
  );
  const currentSnapshotExceptions = ensureArray(report?.documents)
    .filter((entry) => normalizeText(entry?.sourceMode) === "current_snapshot")
    .map((entry) => ({
      replayId: entry.replayId,
      sourcePath: entry.currentPath,
      reason: entry.pinExceptionReason,
    }));

  return {
    packetId: buildArtifactId("historical_replay_packet", report, sourceArtifactPath),
    packetKind: "historical_replay_packet",
    title: "Packet B: Replay Pilot 0",
    generatedAt: normalizeText(report?.meta?.generatedAt),
    sourceArtifactPath,
    manifestSourcePath: normalizeNullableText(report?.meta?.manifestSourcePath),
    summaryMetrics: report?.aggregateMetrics || {},
    recommendation:
      normalizeNullableText(report?.recommendation) ||
      normalizeNullableText(report?.finalRecommendation),
    trustCaveats: [
      ...buildPacketTrustCaveats("historical_replay_packet", report),
      ...currentSnapshotExceptions.map(
        (entry) => `${entry.replayId} is a current-snapshot exception: ${entry.reason}`,
      ),
    ],
    entries: reviewEntries,
    artifactRefs: {
      jsonPath: relativeWorkspacePath(files.jsonPath),
      markdownPath: relativeWorkspacePath(files.markdownPath),
      reviewPath: relativeWorkspacePath(files.reviewPath),
      manifestPath: relativeWorkspacePath(files.manifestPath),
    },
    currentSnapshotExceptions,
  };
}

export function loadReplayReviewArtifacts({ allowUnavailable = false } = {}) {
  const missingArtifacts = listMissingReplayReviewArtifacts();
  if (missingArtifacts.length) {
    if (allowUnavailable) {
      return buildReplayReviewUnavailableState(missingArtifacts);
    }
    throw new Error(buildReplayReviewUnavailableState(missingArtifacts).reason);
  }

  const presentDayReport = readRequiredJsonFile(
    PRESENT_DAY_PACKET_FILES.jsonPath,
    "Replay review present-day packet",
  );
  const historicalReport = readRequiredJsonFile(
    HISTORICAL_PACKET_FILES.jsonPath,
    "Replay review historical packet",
  );

  const packetA = normalizePresentDayPacket(presentDayReport, PRESENT_DAY_PACKET_FILES);
  const packetB = normalizeHistoricalPacket(historicalReport, HISTORICAL_PACKET_FILES);

  return {
    available: true,
    packetA,
    packetB,
    reviewKey: `${packetA.packetId}__${packetB.packetId}`,
  };
}

function mapDbPacketKind(value = "") {
  if (value === "PRESENT_DAY_PACKET") return "present_day_packet";
  if (value === "HISTORICAL_REPLAY_PACKET") return "historical_replay_packet";
  return normalizeText(value).toLowerCase();
}

function mapDbLaterHistoryJudgment(value = null) {
  const normalized = normalizeText(value).toLowerCase();
  return normalized || null;
}

function mapDbOverallDecision(value = null) {
  const normalized = normalizeText(value).toLowerCase();
  return normalized || null;
}

function toDbPacketKind(value = "") {
  if (value === "historical_replay_packet") return "HISTORICAL_REPLAY_PACKET";
  return "PRESENT_DAY_PACKET";
}

function toDbLaterHistoryJudgment(value = null) {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) return null;
  if (!LATER_HISTORY_JUDGMENTS.has(normalized)) {
    throw new Error(`Unsupported laterHistoryJudgment: ${value}`);
  }
  return normalized.toUpperCase();
}

function toDbOverallDecision(value = null) {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) return null;
  if (!OVERALL_DECISIONS.has(normalized)) {
    throw new Error(`Unsupported overallDecision: ${value}`);
  }
  return normalized.toUpperCase();
}

function clampScore(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 3) {
    throw new Error(`Replay review scores must be between 0 and 3. Received: ${value}`);
  }
  return parsed;
}

function serializeReviewEntry(entry) {
  return {
    id: entry.id,
    sessionId: entry.sessionId,
    packetKind: mapDbPacketKind(entry.packetKind),
    entryId: entry.entryId,
    honestyScore: entry.honestyScore,
    understandabilityScore: entry.understandabilityScore,
    specificityScore: entry.specificityScore,
    actionabilityScore: entry.actionabilityScore,
    convergenceValueScore: entry.convergenceValueScore,
    wouldUseAgainScore: entry.wouldUseAgainScore,
    laterHistoryJudgment: mapDbLaterHistoryJudgment(entry.laterHistoryJudgment),
    moveWouldTakeNow: entry.moveWouldTakeNow,
    driftAssessment: entry.driftAssessment,
    notes: entry.notes,
    updatedAt: entry.updatedAt?.toISOString?.() || null,
  };
}

function serializeReviewSession(session) {
  return {
    id: session.id,
    reviewKey: session.reviewKey,
    status: normalizeText(session.status).toLowerCase(),
    packetAArtifactId: session.packetAArtifactId,
    packetBArtifactId: session.packetBArtifactId,
    overallDecision: mapDbOverallDecision(session.overallDecision),
    overallSummary: session.overallSummary,
    completedAt: session.completedAt?.toISOString?.() || null,
    createdAt: session.createdAt?.toISOString?.() || null,
    updatedAt: session.updatedAt?.toISOString?.() || null,
    entries: ensureArray(session.entries).map((entry) => serializeReviewEntry(entry)),
  };
}

async function findReplayReviewSession(userId, reviewKey, prismaClient = prisma) {
  return prismaClient.replayReviewSession.findUnique({
    where: {
      userId_reviewKey: {
        userId,
        reviewKey,
      },
    },
    include: {
      entries: {
        orderBy: {
          updatedAt: "asc",
        },
      },
    },
  });
}

export async function loadReplayReviewCurrent(userId, prismaClient = prisma) {
  const artifacts = loadReplayReviewArtifacts({ allowUnavailable: true });
  if (!artifacts.available) {
    return {
      ...artifacts,
      session: null,
    };
  }

  const session = await findReplayReviewSession(userId, artifacts.reviewKey, prismaClient);

  return {
    ...artifacts,
    session: session ? serializeReviewSession(session) : null,
  };
}

export async function createOrResumeReplayReviewSession(userId, prismaClient = prisma) {
  const artifacts = loadReplayReviewArtifacts();
  const session = await prismaClient.replayReviewSession.upsert({
    where: {
      userId_reviewKey: {
        userId,
        reviewKey: artifacts.reviewKey,
      },
    },
    create: {
      userId,
      reviewKey: artifacts.reviewKey,
      status: "IN_PROGRESS",
      packetAArtifactId: artifacts.packetA.packetId,
      packetBArtifactId: artifacts.packetB.packetId,
    },
    update: {
      packetAArtifactId: artifacts.packetA.packetId,
      packetBArtifactId: artifacts.packetB.packetId,
    },
    include: {
      entries: {
        orderBy: {
          updatedAt: "asc",
        },
      },
    },
  });

  return {
    ...artifacts,
    session: serializeReviewSession(session),
  };
}

function validateEntryPayload(payload = {}, artifacts) {
  const entryId = normalizeText(payload.entryId);
  const packetKind = normalizeText(payload.packetKind).toLowerCase();

  if (!entryId) {
    throw new Error("entryId is required.");
  }
  if (!["present_day_packet", "historical_replay_packet"].includes(packetKind)) {
    throw new Error("packetKind must be present_day_packet or historical_replay_packet.");
  }

  const packet = packetKind === "historical_replay_packet" ? artifacts.packetB : artifacts.packetA;
  const entryExists = ensureArray(packet.entries).some((entry) => entry.entryId === entryId);
  if (!entryExists) {
    throw new Error(`Unknown replay review entry: ${entryId}`);
  }

  const data = {};

  for (const field of SCORE_FIELDS) {
    if (field in payload) {
      data[field] = clampScore(payload[field]);
    }
  }

  if ("laterHistoryJudgment" in payload) {
    data.laterHistoryJudgment = toDbLaterHistoryJudgment(payload.laterHistoryJudgment);
  }
  if ("moveWouldTakeNow" in payload) {
    data.moveWouldTakeNow = normalizeNullableText(payload.moveWouldTakeNow);
  }
  if ("driftAssessment" in payload) {
    data.driftAssessment = normalizeNullableText(payload.driftAssessment);
  }
  if ("notes" in payload) {
    data.notes = normalizeNullableText(payload.notes);
  }

  return {
    entryId,
    packetKind,
    data,
  };
}

export async function upsertReplayReviewEntry(userId, payload, prismaClient = prisma) {
  const artifacts = loadReplayReviewArtifacts();
  const session = await prismaClient.replayReviewSession.upsert({
    where: {
      userId_reviewKey: {
        userId,
        reviewKey: artifacts.reviewKey,
      },
    },
    create: {
      userId,
      reviewKey: artifacts.reviewKey,
      status: "IN_PROGRESS",
      packetAArtifactId: artifacts.packetA.packetId,
      packetBArtifactId: artifacts.packetB.packetId,
    },
    update: {
      packetAArtifactId: artifacts.packetA.packetId,
      packetBArtifactId: artifacts.packetB.packetId,
      status: "IN_PROGRESS",
      completedAt: null,
    },
  });

  const normalized = validateEntryPayload(payload, artifacts);

  const entry = await prismaClient.replayReviewEntry.upsert({
    where: {
      sessionId_packetKind_entryId: {
        sessionId: session.id,
        packetKind: toDbPacketKind(normalized.packetKind),
        entryId: normalized.entryId,
      },
    },
    create: {
      sessionId: session.id,
      packetKind: toDbPacketKind(normalized.packetKind),
      entryId: normalized.entryId,
      ...normalized.data,
    },
    update: normalized.data,
  });

  return serializeReviewEntry(entry);
}

export async function updateReplayReviewSession(userId, payload, prismaClient = prisma) {
  const artifacts = loadReplayReviewArtifacts();
  const existing = await findReplayReviewSession(userId, artifacts.reviewKey, prismaClient);
  if (!existing) {
    throw new Error("Replay review session does not exist yet.");
  }

  const updateData = {};
  if ("overallDecision" in payload) {
    updateData.overallDecision = toDbOverallDecision(payload.overallDecision);
  }
  if ("overallSummary" in payload) {
    updateData.overallSummary = normalizeNullableText(payload.overallSummary);
  }
  if ("status" in payload) {
    const normalizedStatus = normalizeText(payload.status).toLowerCase();
    if (!["in_progress", "completed"].includes(normalizedStatus)) {
      throw new Error("status must be in_progress or completed.");
    }
    updateData.status = normalizedStatus.toUpperCase();
    updateData.completedAt = normalizedStatus === "completed" ? new Date() : null;
  }

  const session = await prismaClient.replayReviewSession.update({
    where: { id: existing.id },
    data: updateData,
    include: {
      entries: {
        orderBy: {
          updatedAt: "asc",
        },
      },
    },
  });

  return serializeReviewSession(session);
}
