import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import nextEnv from "@next/env";

import { CompilerReadError, runCompilerRead } from "../src/lib/compiler-read.js";

const { loadEnvConfig } = nextEnv;

const CWD = process.cwd();
const OUTPUT_ROOT = path.join(CWD, "output", "compiler-read-benchmarks");
const DEFAULT_MANIFEST_FILE = path.join(CWD, "docs", "benchmark-manifest-historical-replay-pilot-2026-04-13.json");
const DEFAULT_REPEAT_COUNT = 2;
const DEFAULT_STRICTNESS = "soft";
const GENERIC_NEXT_MOVE_PREFIXES = [
  "Use this read as pressure, not proof.",
  "Keep only the grounded operational subset if you carry anything forward.",
  "Treat the blocked raw result as admission control, not terminal failure.",
];

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeLongText(value = "") {
  return String(value || "").trim();
}

function relativeWorkspacePath(filePath = "") {
  return path.relative(CWD, filePath).split(path.sep).join("/");
}

function hashContent(value = "") {
  return crypto.createHash("sha256").update(String(value || ""), "utf8").digest("hex");
}

function parseArgs(argv = []) {
  const options = {
    manifestFile: DEFAULT_MANIFEST_FILE,
    outputRoot: OUTPUT_ROOT,
    repeatCount: DEFAULT_REPEAT_COUNT,
    strictness: DEFAULT_STRICTNESS,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    const takeValue = () => {
      index += 1;
      return next;
    };

    if (token === "--manifest-file" && next) {
      options.manifestFile = path.resolve(CWD, takeValue());
      continue;
    }
    if (token.startsWith("--manifest-file=")) {
      options.manifestFile = path.resolve(CWD, token.slice("--manifest-file=".length));
      continue;
    }
    if (token === "--repeat" && next) {
      options.repeatCount = Math.max(1, Number.parseInt(takeValue(), 10) || DEFAULT_REPEAT_COUNT);
      continue;
    }
    if (token.startsWith("--repeat=")) {
      options.repeatCount = Math.max(1, Number.parseInt(token.slice("--repeat=".length), 10) || DEFAULT_REPEAT_COUNT);
      continue;
    }
    if (token === "--strictness" && next) {
      options.strictness = normalizeText(takeValue()) || DEFAULT_STRICTNESS;
      continue;
    }
    if (token.startsWith("--strictness=")) {
      options.strictness = normalizeText(token.slice("--strictness=".length)) || DEFAULT_STRICTNESS;
      continue;
    }
    if (token === "--output-root" && next) {
      options.outputRoot = path.resolve(CWD, takeValue());
      continue;
    }
    if (token.startsWith("--output-root=")) {
      options.outputRoot = path.resolve(CWD, token.slice("--output-root=".length));
      continue;
    }
  }

  return options;
}

function createGitAdapter({ cwd = CWD } = {}) {
  const run = (args = [], { allowFailure = false } = {}) => {
    try {
      return execFileSync("git", args, {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      if (allowFailure) {
        return null;
      }
      const stderr = error instanceof Error ? String(error.stderr || error.message || "").trim() : String(error);
      throw new Error(`git ${args.join(" ")} failed${stderr ? `: ${stderr}` : "."}`);
    }
  };

  return {
    showFileAtCommit(commitHash, filePath) {
      return run(["show", `${commitHash}:${filePath}`]);
    },
    listCommitsForPath(filePath) {
      const output = run(["log", "--follow", "--format=%H%x09%cI%x09%s", "--", filePath], {
        allowFailure: true,
      });
      if (!output) return [];
      return output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [commitHash, committedAt, ...subjectParts] = line.split("\t");
          return {
            commitHash: normalizeText(commitHash),
            committedAt: normalizeText(committedAt),
            subject: normalizeText(subjectParts.join("\t")),
          };
        });
    },
    pathExistsAtHead(filePath) {
      const result = run(["cat-file", "-e", `HEAD:${filePath}`], { allowFailure: true });
      return result !== null;
    },
  };
}

export function loadReplayManifestFile(manifestPath) {
  if (!manifestPath || !existsSync(manifestPath)) {
    throw new Error(`Replay manifest file not found: ${manifestPath}`);
  }

  const parsed = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (!Array.isArray(parsed?.replayEntries) || parsed.replayEntries.length !== 9) {
    throw new Error(`Replay manifest must contain exactly 9 replayEntries: ${manifestPath}`);
  }

  return parsed;
}

function validateReplayEntry(entry, index) {
  const replayId = normalizeText(entry?.replayId);
  const currentPath = normalizeText(entry?.currentPath);
  const pathAtCommit = normalizeText(entry?.pathAtCommit);
  const commitHash = normalizeText(entry?.commitHash);
  const eraLabel = normalizeText(entry?.eraLabel);
  const documentFamily = normalizeText(entry?.documentFamily);
  const sourceMode = normalizeText(entry?.sourceMode || "git_commit");
  const pinExceptionReason = normalizeLongText(entry?.pinExceptionReason);

  if (!replayId) throw new Error(`Replay entry ${index + 1} is missing replayId.`);
  if (!currentPath) throw new Error(`Replay entry ${replayId} is missing currentPath.`);
  if (!pathAtCommit) throw new Error(`Replay entry ${replayId} is missing pathAtCommit.`);
  if (!eraLabel) throw new Error(`Replay entry ${replayId} is missing eraLabel.`);
  if (!documentFamily) throw new Error(`Replay entry ${replayId} is missing documentFamily.`);
  if (sourceMode !== "git_commit" && sourceMode !== "current_snapshot") {
    throw new Error(`Replay entry ${replayId} has unsupported sourceMode: ${sourceMode}`);
  }
  if (sourceMode === "git_commit" && !commitHash) {
    throw new Error(`Replay entry ${replayId} must include commitHash for git_commit mode.`);
  }
  if (sourceMode === "current_snapshot" && !pinExceptionReason) {
    throw new Error(`Replay entry ${replayId} must explain the current_snapshot exception.`);
  }

  return {
    replayId,
    currentPath,
    pathAtCommit,
    commitHash: commitHash || null,
    eraLabel,
    documentFamily,
    sourceMode,
    pinExceptionReason: pinExceptionReason || null,
  };
}

export function loadReplaySource(entry, { cwd = CWD, git = createGitAdapter({ cwd }) } = {}) {
  const sourceMode = normalizeText(entry?.sourceMode || "git_commit");
  if (sourceMode === "current_snapshot") {
    const absolutePath = path.resolve(cwd, entry.currentPath);
    if (!existsSync(absolutePath)) {
      throw new Error(`Current snapshot replay source not found: ${entry.currentPath}`);
    }
    const text = readFileSync(absolutePath, "utf8");
    return {
      sourceMode,
      absolutePath,
      sourcePath: entry.currentPath,
      byteSize: statSync(absolutePath).size,
      charCount: text.length,
      text,
      sourceHash: hashContent(text),
      sourceLabel: `current snapshot ${entry.currentPath}`,
    };
  }

  const text = git.showFileAtCommit(entry.commitHash, entry.pathAtCommit);
  return {
    sourceMode,
    absolutePath: null,
    sourcePath: entry.pathAtCommit,
    byteSize: Buffer.byteLength(text, "utf8"),
    charCount: text.length,
    text,
    sourceHash: hashContent(text),
    sourceLabel: `${entry.commitHash}:${entry.pathAtCommit}`,
  };
}

function validateLoadedReplaySource(entry, loadedSource) {
  if (!normalizeLongText(loadedSource?.text)) {
    throw new Error(`Replay entry ${entry.replayId} loaded empty source text.`);
  }
  if (!normalizeText(loadedSource?.sourceHash)) {
    throw new Error(`Replay entry ${entry.replayId} is missing a loaded source hash.`);
  }
}

function classifyRunError(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (/source excerpt is not present/i.test(message)) return "grounding_failure";
  if (/invalid Compiler Read payload/i.test(message)) return "invalid_extraction_payload";
  if (/extraction failed/i.test(message)) return "extraction_request_failed";
  if (/fetch failed|ENOTFOUND|ECONNRESET|ETIMEDOUT|network/i.test(message)) return "network_failure";
  if (error instanceof CompilerReadError && error.unavailable) return "compiler_read_unavailable";
  return "unexpected_error";
}

function deriveTrustCaveats(compilerRead) {
  const caveats = [];
  if (compilerRead?.rawDocumentResult?.compileState === "blocked") {
    caveats.push("Raw blocked prose was treated as admission control, not terminal failure.");
  }
  if (compilerRead?.rawDocumentResult?.compileState === "blocked" && !compilerRead?.rawDocumentResult?.secondaryRuntimeTrusted) {
    caveats.push("Secondary raw runtime state was downranked as low-trust.");
  }
  if (compilerRead?.translatedSubsetResult?.present) {
    caveats.push("Translated subset remained explicit and separate from the source document.");
  }
  if (compilerRead?.embeddedExecutableResult?.present) {
    caveats.push(
      compilerRead?.embeddedExecutableResult?.compileState === "clean"
        ? "Embedded executable source was kept distinct from translated subset success."
        : "Embedded executable candidate was detected but did not compile cleanly.",
    );
  }
  if (compilerRead?.limitationClass === "translation_loss") {
    caveats.push("The read identified translation loss rather than forcing a clean compile.");
  }
  if (compilerRead?.limitationClass === "compiler_gap") {
    caveats.push("The read flagged a compiler gap instead of flattening the document into a lossy subset.");
  }
  if (compilerRead?.limitationClass === "excerpt_not_anchorable") {
    caveats.push("The grounding gate held and the read stayed at an honest non-anchorable limit.");
  }
  if (compilerRead?.outcomeClass === "direct_source_compiled") {
    caveats.push("The document compiled directly as source and was not collapsed into translated-subset success.");
  }
  if (Number(compilerRead?.groundingRejectedClaimCount || 0) > 0) {
    caveats.push(
      `The grounding gate rejected ${compilerRead.groundingRejectedClaimCount} claim${
        compilerRead.groundingRejectedClaimCount === 1 ? "" : "s"
      } before interpretation.`,
    );
  }
  return caveats;
}

function isMeaningfulNextMove(move = "") {
  const normalized = normalizeText(move);
  if (!normalized) return false;
  if (GENERIC_NEXT_MOVE_PREFIXES.includes(normalized)) return false;
  return normalized.length >= 24;
}

function scoreUsefulnessSignal(compilerRead) {
  const readDisposition = normalizeText(compilerRead?.verdict?.readDisposition);
  const nextMoves = Array.isArray(compilerRead?.nextMoves) ? compilerRead.nextMoves : [];
  const meaningfulCount = nextMoves.filter((move) => isMeaningfulNextMove(move)).length;
  let score = meaningfulCount ? 1 : 0;

  if (
    [
      "needs_more_witness",
      "needs_clearer_split",
      "needs_language_extension",
      "ready_for_room_work",
      "inspect_direct_program",
      "inspect_direct_source",
    ].includes(readDisposition)
  ) {
    score += 1;
  }

  if (
    ["translated_subset_compiled", "direct_program_found", "direct_source_compiled", "mixed"].includes(
      normalizeText(compilerRead?.outcomeClass),
    )
  ) {
    score += 1;
  }

  return score;
}

function validateOmissionPartition(compilerRead) {
  const selected = new Set(compilerRead?.translatedSubsetResult?.selectedClaimIds || []);
  const omitted = new Set(compilerRead?.translatedSubsetResult?.omittedClaims || []);
  const claimIds = new Set((compilerRead?.claimSet || []).map((claim) => claim.id));

  for (const id of claimIds) {
    if (selected.has(id) && omitted.has(id)) return false;
    if (!selected.has(id) && !omitted.has(id)) return false;
  }

  return true;
}

function summarizeCompilerRead(compilerRead) {
  return {
    documentSummary: compilerRead.documentSummary,
    rawDocumentResult: compilerRead.rawDocumentResult,
    translatedSubsetResult: compilerRead.translatedSubsetResult,
    embeddedExecutableResult: compilerRead.embeddedExecutableResult,
    limitationClass: compilerRead.limitationClass,
    outcomeClass: compilerRead.outcomeClass,
    verdict: compilerRead.verdict,
    nextMoves: compilerRead.nextMoves,
    claimCount: Array.isArray(compilerRead.claimSet) ? compilerRead.claimSet.length : 0,
    groundingRejectedClaimCount: Number(compilerRead.groundingRejectedClaimCount || 0),
    groundingRejectedClaimIds: Array.isArray(compilerRead.groundingRejectedClaimIds)
      ? [...compilerRead.groundingRejectedClaimIds]
      : [],
    selectedClaimCount: Array.isArray(compilerRead.translatedSubsetResult?.selectedClaimIds)
      ? compilerRead.translatedSubsetResult.selectedClaimIds.length
      : 0,
    omittedClaimCount: Array.isArray(compilerRead.translatedSubsetResult?.omittedClaims)
      ? compilerRead.translatedSubsetResult.omittedClaims.length
      : 0,
    excerptGroundingPassed: Number(compilerRead.groundingRejectedClaimCount || 0) === 0,
    omissionPartitionValid: validateOmissionPartition(compilerRead),
    secondaryRawRuntimeDownranked:
      compilerRead?.rawDocumentResult?.compileState === "blocked" &&
      !compilerRead?.rawDocumentResult?.secondaryRuntimeTrusted,
    trustCaveats: deriveTrustCaveats(compilerRead),
    meaningfulNextMoveSignalPresent: (compilerRead?.nextMoves || []).some((move) =>
      isMeaningfulNextMove(move),
    ),
    usefulnessSignalScore: scoreUsefulnessSignal(compilerRead),
  };
}

function buildRunSignature(run) {
  if (!run) return "missing";
  if (!run.ok) return `error:${normalizeText(run.errorKind || "unknown")}`;
  return `ok:${normalizeText(run.compilerRead?.outcomeClass || "null")}:${normalizeText(
    run.compilerRead?.verdict?.readDisposition || "null",
  )}`;
}

function formatRunSummary(run) {
  if (!run) return "missing run";
  if (!run.ok) {
    return `run ${Number(run.runIndex) + 1}: error ${normalizeText(run.errorKind || "unknown")}`;
  }

  return `run ${Number(run.runIndex) + 1}: outcome=${normalizeText(
    run.compilerRead?.outcomeClass || "null",
  )}, disposition=${normalizeText(run.compilerRead?.verdict?.readDisposition || "null")}`;
}

function computeStability(runs = []) {
  if (!runs.length) {
    return {
      repeatCount: 0,
      successfulRunCount: 0,
      errorRunCount: 0,
      repeatStable: false,
      stableClassification: false,
      sameOutcomeClass: false,
      sameReadDisposition: false,
      sameErrorKind: false,
      instabilityReasons: [],
      uniqueRunSignatures: [],
    };
  }

  const successfulRuns = runs.filter((run) => run?.ok);
  const errorRuns = runs.filter((run) => !run?.ok);
  const outcomes = new Set(successfulRuns.map((run) => normalizeText(run?.compilerRead?.outcomeClass || "null")));
  const dispositions = new Set(
    successfulRuns.map((run) => normalizeText(run?.compilerRead?.verdict?.readDisposition || "null")),
  );
  const errorKinds = new Set(errorRuns.map((run) => normalizeText(run?.errorKind || "unknown")));
  const uniqueRunSignatures = [...new Set(runs.map((run) => buildRunSignature(run)))];
  const instabilityReasons = [];

  if (successfulRuns.length && errorRuns.length) instabilityReasons.push("mixed_success_and_error");
  if (successfulRuns.length > 1 && outcomes.size > 1) instabilityReasons.push("outcome_changed");
  if (successfulRuns.length > 1 && dispositions.size > 1) instabilityReasons.push("disposition_changed");
  if (errorRuns.length > 1 && errorKinds.size > 1) instabilityReasons.push("error_kind_changed");
  if (!instabilityReasons.length && uniqueRunSignatures.length > 1) instabilityReasons.push("run_signature_changed");

  return {
    repeatCount: runs.length,
    successfulRunCount: successfulRuns.length,
    errorRunCount: errorRuns.length,
    repeatStable: uniqueRunSignatures.length === 1,
    sameOutcomeClass: successfulRuns.length === runs.length && outcomes.size === 1,
    sameReadDisposition: successfulRuns.length === runs.length && dispositions.size === 1,
    sameErrorKind: errorRuns.length === runs.length && errorKinds.size === 1,
    stableClassification: successfulRuns.length === runs.length && outcomes.size === 1 && dispositions.size === 1,
    instabilityReasons,
    uniqueRunSignatures,
  };
}

function summarizePrimaryRun(entry) {
  return entry.runs.find((run) => run.ok) || entry.runs[0] || null;
}

export function deriveReplayDocumentCategory(entry) {
  const primary = summarizePrimaryRun(entry);
  if (!primary?.ok) return "error";

  if (
    primary.compilerRead?.limitationClass === "excerpt_not_anchorable" ||
    primary.compilerRead?.verdict?.readDisposition === "informative_only"
  ) {
    return "honest_limit";
  }

  if (!entry?.stability?.repeatStable) {
    return "edge";
  }

  return "clean";
}

export function buildLookAheadSummary(entry, { cwd = CWD, git = createGitAdapter({ cwd }) } = {}) {
  const sourceMode = normalizeText(entry?.sourceMode || "git_commit");

  if (sourceMode === "current_snapshot") {
    const headExists = git.pathExistsAtHead(entry.currentPath);
    return {
      mode: "current_snapshot_only",
      nextCommits: [],
      currentHeadExists: headExists,
      currentHeadPath: headExists ? entry.currentPath : null,
      workingTreePath: entry.currentPath,
      renamedAtHead: null,
      pinExceptionReason: normalizeLongText(entry.pinExceptionReason),
    };
  }

  const commitHistory = git.listCommitsForPath(entry.currentPath);
  const chronological = [...commitHistory].reverse();
  const index = chronological.findIndex((item) => item.commitHash === entry.commitHash);
  const nextCommits = index >= 0 ? chronological.slice(index + 1, index + 3) : [];
  const currentHeadExists = git.pathExistsAtHead(entry.currentPath);
  const renamedAtHead = entry.currentPath !== entry.pathAtCommit ? entry.currentPath : null;

  return {
    mode: "historical_commit",
    nextCommits,
    currentHeadExists,
    currentHeadPath: currentHeadExists ? entry.currentPath : null,
    renamedAtHead,
    pinExceptionReason: null,
  };
}

export async function runReplayEntry(
  entry,
  options,
  {
    cwd = CWD,
    git = createGitAdapter({ cwd }),
    compilerReadFn = runCompilerRead,
    loadSource = loadReplaySource,
    loadLookAheadSummary = buildLookAheadSummary,
  } = {},
) {
  const loadedSource = loadSource(entry, { cwd, git });
  validateLoadedReplaySource(entry, loadedSource);
  const runs = [];

  for (let runIndex = 0; runIndex < options.repeatCount; runIndex += 1) {
    try {
      const compilerRead = await compilerReadFn({
        documentId: `${entry.replayId}@${entry.commitHash || "current_snapshot"}`,
        title: path.basename(entry.currentPath),
        text: loadedSource.text,
        strictness: options.strictness,
      });

      runs.push({
        ok: true,
        runIndex,
        compilerRead: summarizeCompilerRead(compilerRead),
      });
    } catch (error) {
      runs.push({
        ok: false,
        runIndex,
        errorKind: classifyRunError(error),
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const lookAheadSummary = loadLookAheadSummary(entry, { cwd, git, loadedSource });

  return {
    replayId: entry.replayId,
    currentPath: entry.currentPath,
    pathAtCommit: entry.pathAtCommit,
    commitHash: entry.commitHash,
    eraLabel: entry.eraLabel,
    documentFamily: entry.documentFamily,
    sourceMode: entry.sourceMode,
    pinExceptionReason: entry.pinExceptionReason,
    sourceLoaded: true,
    sourceHash: loadedSource.sourceHash,
    sourceLabel: loadedSource.sourceLabel,
    sourceByteSize: loadedSource.byteSize,
    sourceCharCount: loadedSource.charCount,
    sourcePreview: normalizeLongText(loadedSource.text).slice(0, 240),
    runs,
    stability: computeStability(runs),
    lookAheadSummary,
  };
}

function buildAggregateMetrics(results = []) {
  const successfulPrimaryRuns = results.map((entry) => summarizePrimaryRun(entry)).filter((run) => run?.ok);
  const countBy = (selector) => {
    const counts = {};
    successfulPrimaryRuns.forEach((run) => {
      const key = selector(run) || "null";
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  };

  const totalEntries = results.length;
  const repeatStableEntries = results.filter((entry) => entry.stability.repeatStable).length;
  const stableClassificationEntries = results.filter((entry) => entry.stability.stableClassification).length;
  const omissionValidEntries = successfulPrimaryRuns.filter((run) => run.compilerRead?.omissionPartitionValid).length;
  const groundingPassedEntries = successfulPrimaryRuns.filter((run) => run.compilerRead?.excerptGroundingPassed).length;
  const cleanEntries = results.filter((entry) => deriveReplayDocumentCategory(entry) === "clean").length;
  const edgeEntries = results.filter((entry) => deriveReplayDocumentCategory(entry) === "edge").length;
  const honestLimitEntries = results.filter((entry) => deriveReplayDocumentCategory(entry) === "honest_limit").length;
  const stableUsefulEntries = results.filter((entry) => {
    const primary = summarizePrimaryRun(entry);
    return primary?.ok && entry.stability.repeatStable && Number(primary.compilerRead?.usefulnessSignalScore || 0) > 0;
  }).length;

  return {
    totalEntries,
    successfulPrimaryRunCount: successfulPrimaryRuns.length,
    errorPrimaryRunCount: totalEntries - successfulPrimaryRuns.length,
    groundingPassRate: successfulPrimaryRuns.length ? groundingPassedEntries / successfulPrimaryRuns.length : 0,
    omissionPartitionValidityRate: successfulPrimaryRuns.length ? omissionValidEntries / successfulPrimaryRuns.length : 0,
    repeatStabilityRate: totalEntries ? repeatStableEntries / totalEntries : 0,
    classificationStabilityRate: totalEntries ? stableClassificationEntries / totalEntries : 0,
    stableUsefulRate: totalEntries ? stableUsefulEntries / totalEntries : 0,
    cleanCount: cleanEntries,
    edgeCount: edgeEntries,
    honestLimitCount: honestLimitEntries,
    currentSnapshotExceptionCount: results.filter((entry) => entry.sourceMode === "current_snapshot").length,
    outcomeDistribution: countBy((run) => run.compilerRead?.outcomeClass),
    limitationDistribution: countBy((run) => run.compilerRead?.limitationClass || "none"),
    dispositionDistribution: countBy((run) => run.compilerRead?.verdict?.readDisposition),
  };
}

function buildTopFailureModes(results = []) {
  const buckets = new Map();

  const add = (label, replayId, currentPath) => {
    const bucket = buckets.get(label) || {
      label,
      count: 0,
      replayIds: [],
      documentPaths: [],
      seenReplayIds: new Set(),
      seenDocumentPaths: new Set(),
    };
    bucket.count += 1;
    if (!bucket.seenReplayIds.has(replayId) && bucket.replayIds.length < 5) {
      bucket.replayIds.push(replayId);
      bucket.seenReplayIds.add(replayId);
    }
    if (!bucket.seenDocumentPaths.has(currentPath) && bucket.documentPaths.length < 5) {
      bucket.documentPaths.push(currentPath);
      bucket.seenDocumentPaths.add(currentPath);
    }
    buckets.set(label, bucket);
  };

  results.forEach((entry) => {
    entry.runs.forEach((run) => {
      if (!run.ok) add(`error:${run.errorKind}`, entry.replayId, entry.currentPath);
    });

    const primary = summarizePrimaryRun(entry);
    if (!primary?.ok) return;
    const read = primary.compilerRead;
    if (read.limitationClass) add(`limitation:${read.limitationClass}`, entry.replayId, entry.currentPath);
    if (read.verdict?.readDisposition === "informative_only") {
      add("informative_only", entry.replayId, entry.currentPath);
    }
    if (read.embeddedExecutableResult?.present && read.embeddedExecutableResult?.compileState !== "clean") {
      add("embedded_candidate_blocked", entry.replayId, entry.currentPath);
    }
  });

  return [...buckets.values()]
    .map((bucket) => ({
      label: bucket.label,
      count: bucket.count,
      replayIds: bucket.replayIds,
      documentPaths: bucket.documentPaths,
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, 5);
}

function buildRepeatInstabilityCases(results = []) {
  return results
    .filter((entry) => !entry.stability.repeatStable)
    .map((entry) => ({
      replayId: entry.replayId,
      currentPath: entry.currentPath,
      documentCategory: deriveReplayDocumentCategory(entry),
      successfulRunCount: entry.stability.successfulRunCount,
      errorRunCount: entry.stability.errorRunCount,
      instabilityReasons: entry.stability.instabilityReasons,
      uniqueRunSignatures: entry.stability.uniqueRunSignatures,
      runSummaries: entry.runs.map((run) => formatRunSummary(run)),
    }))
    .sort((left, right) => right.errorRunCount - left.errorRunCount || left.currentPath.localeCompare(right.currentPath));
}

function buildReplayCase(entry, category) {
  const primary = summarizePrimaryRun(entry);
  if (!primary?.ok) return null;
  return {
    replayId: entry.replayId,
    currentPath: entry.currentPath,
    eraLabel: entry.eraLabel,
    documentFamily: entry.documentFamily,
    category,
    outcomeClass: primary.compilerRead?.outcomeClass || null,
    readDisposition: primary.compilerRead?.verdict?.readDisposition || null,
    primaryFinding: primary.compilerRead?.verdict?.primaryFinding || null,
    nextMoves: primary.compilerRead?.nextMoves || [],
    usefulnessSignalScore: primary.compilerRead?.usefulnessSignalScore || 0,
    groundingRejectedClaimCount: Number(primary.compilerRead?.groundingRejectedClaimCount || 0),
    repeatStable: entry.stability.repeatStable,
    repeatStabilitySummary: entry.stability.repeatStable
      ? "stable across repeats"
      : `unstable across repeats (${entry.stability.instabilityReasons.join(", ") || "details in dossier"})`,
    instabilityReasons: entry.stability.instabilityReasons,
    trustCaveats: primary.compilerRead?.trustCaveats || [],
    lookAheadSummary: entry.lookAheadSummary,
  };
}

export function selectReviewPacketEntries(report) {
  const successfulEntries = report.documents.filter((entry) => summarizePrimaryRun(entry)?.ok);
  const used = new Set();
  const packet = [];

  const add = (entry, category) => {
    if (!entry || used.has(entry.replayId)) return;
    const reviewEntry = buildReplayCase(entry, category);
    if (!reviewEntry) return;
    packet.push(reviewEntry);
    used.add(entry.replayId);
  };

  const stableUseful = successfulEntries
    .filter((entry) => entry.stability.repeatStable)
    .sort((left, right) => {
      const leftPrimary = summarizePrimaryRun(left);
      const rightPrimary = summarizePrimaryRun(right);
      const leftScore = Number(leftPrimary?.compilerRead?.usefulnessSignalScore || 0);
      const rightScore = Number(rightPrimary?.compilerRead?.usefulnessSignalScore || 0);
      if (rightScore !== leftScore) return rightScore - leftScore;
      return left.currentPath.localeCompare(right.currentPath);
    });

  add(stableUseful[0], "clean");
  add(stableUseful[1], "clean");

  const edgeCandidate = successfulEntries
    .filter((entry) => !entry.stability.repeatStable)
    .sort((left, right) => {
      const leftPrimary = summarizePrimaryRun(left);
      const rightPrimary = summarizePrimaryRun(right);
      const leftScore = Number(leftPrimary?.compilerRead?.usefulnessSignalScore || 0);
      const rightScore = Number(rightPrimary?.compilerRead?.usefulnessSignalScore || 0);
      if (right.stability.errorRunCount !== left.stability.errorRunCount) {
        return right.stability.errorRunCount - left.stability.errorRunCount;
      }
      if (right.stability.instabilityReasons.length !== left.stability.instabilityReasons.length) {
        return right.stability.instabilityReasons.length - left.stability.instabilityReasons.length;
      }
      if (rightScore !== leftScore) return rightScore - leftScore;
      return left.currentPath.localeCompare(right.currentPath);
    })[0];
  add(edgeCandidate, "edge");

  const honestLimitCandidate = successfulEntries
    .filter((entry) => {
      const primary = summarizePrimaryRun(entry);
      return (
        primary?.compilerRead?.limitationClass === "excerpt_not_anchorable" ||
        primary?.compilerRead?.verdict?.readDisposition === "informative_only"
      );
    })
    .sort((left, right) => {
      const leftPrimary = summarizePrimaryRun(left);
      const rightPrimary = summarizePrimaryRun(right);
      const leftIsAnchorableLimit = leftPrimary?.compilerRead?.limitationClass === "excerpt_not_anchorable";
      const rightIsAnchorableLimit = rightPrimary?.compilerRead?.limitationClass === "excerpt_not_anchorable";
      if (Number(rightIsAnchorableLimit) !== Number(leftIsAnchorableLimit)) {
        return Number(rightIsAnchorableLimit) - Number(leftIsAnchorableLimit);
      }
      const leftRejected = Number(leftPrimary?.compilerRead?.groundingRejectedClaimCount || 0);
      const rightRejected = Number(rightPrimary?.compilerRead?.groundingRejectedClaimCount || 0);
      if (rightRejected !== leftRejected) return rightRejected - leftRejected;
      return left.currentPath.localeCompare(right.currentPath);
    })[0];
  add(honestLimitCandidate, "honest_limit");

  const remaining = successfulEntries
    .filter((entry) => !used.has(entry.replayId))
    .sort((left, right) => {
      const leftPrimary = summarizePrimaryRun(left);
      const rightPrimary = summarizePrimaryRun(right);
      const leftScore = Number(leftPrimary?.compilerRead?.usefulnessSignalScore || 0);
      const rightScore = Number(rightPrimary?.compilerRead?.usefulnessSignalScore || 0);
      if (rightScore !== leftScore) return rightScore - leftScore;
      return left.currentPath.localeCompare(right.currentPath);
    });

  while (packet.length < 4 && remaining.length) {
    add(remaining.shift(), "clean");
  }

  return packet.slice(0, 4);
}

export function buildResolvedManifestArtifact(report) {
  return {
    version: 1,
    name: report.meta.replayName,
    generatedAt: report.meta.generatedAt,
    manifestSourcePath: report.meta.manifestSourcePath,
    repeatCount: report.meta.repeatCount,
    strictness: report.meta.strictness,
    replayEntries: report.documents.map((entry) => ({
      replayId: entry.replayId,
      currentPath: entry.currentPath,
      pathAtCommit: entry.pathAtCommit,
      commitHash: entry.commitHash,
      eraLabel: entry.eraLabel,
      documentFamily: entry.documentFamily,
      sourceMode: entry.sourceMode,
      pinExceptionReason: entry.pinExceptionReason,
      loadedSourceHash: entry.sourceHash,
      loadedByteSize: entry.sourceByteSize,
      loadedCharCount: entry.sourceCharCount,
      lookAheadSummary: entry.lookAheadSummary,
    })),
  };
}

function deriveFinalRecommendation(report) {
  const categories = new Set(report.reviewPacketEntries.map((entry) => entry.category));
  const hasCategoryMix = categories.has("clean") && categories.has("edge") && categories.has("honest_limit");
  const pinnedReplayLoaded = report.documents
    .filter((entry) => entry.sourceMode === "git_commit")
    .every((entry) => entry.sourceLoaded);
  const noPinExceptions = report.aggregateMetrics.currentSnapshotExceptionCount === 0;

  if (
    report.aggregateMetrics.errorPrimaryRunCount === 0 &&
    pinnedReplayLoaded &&
    hasCategoryMix &&
    noPinExceptions
  ) {
    return "full historical dossier justified now";
  }

  return "pilot useful but full dossier not justified yet";
}

function formatPercent(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

function formatLookAheadSummary(lookAheadSummary) {
  const lines = [];
  lines.push(`Mode: \`${lookAheadSummary.mode}\``);
  lines.push(`Exists at HEAD: ${lookAheadSummary.currentHeadExists ? "yes" : "no"}`);
  if (lookAheadSummary.currentHeadPath) {
    lines.push(`Current HEAD path: \`${lookAheadSummary.currentHeadPath}\``);
  }
  if (lookAheadSummary.renamedAtHead) {
    lines.push(`Renamed at HEAD: \`${lookAheadSummary.renamedAtHead}\``);
  }
  if (lookAheadSummary.pinExceptionReason) {
    lines.push(`Pin exception: ${lookAheadSummary.pinExceptionReason}`);
  }
  if (Array.isArray(lookAheadSummary.nextCommits) && lookAheadSummary.nextCommits.length) {
    lines.push(
      `Next commits: ${lookAheadSummary.nextCommits
        .map((entry) => `\`${entry.commitHash.slice(0, 7)}\` ${entry.subject}`)
        .join("; ")}`,
    );
  } else {
    lines.push("Next commits: none recorded in this replay summary.");
  }
  return lines;
}

function formatMarkdownReport(report) {
  const lines = [
    "# Compiler Read Historical Replay Pilot",
    "",
    `- Replay name: \`${report.meta.replayName}\``,
    `- Manifest source: \`${report.meta.manifestSourcePath}\``,
    `- Repeat count: ${report.meta.repeatCount}`,
    `- Strictness: \`${report.meta.strictness}\``,
    `- Generated at: ${report.meta.generatedAt}`,
    "",
    "## Aggregate Metrics",
    "",
    `- Total replay entries: ${report.aggregateMetrics.totalEntries}`,
    `- Successful primary runs: ${report.aggregateMetrics.successfulPrimaryRunCount}`,
    `- Primary-run errors: ${report.aggregateMetrics.errorPrimaryRunCount}`,
    `- Grounding pass rate: ${formatPercent(report.aggregateMetrics.groundingPassRate)}`,
    `- Omission partition validity rate: ${formatPercent(report.aggregateMetrics.omissionPartitionValidityRate)}`,
    `- Repeat stability rate: ${formatPercent(report.aggregateMetrics.repeatStabilityRate)}`,
    `- Classification stability rate: ${formatPercent(report.aggregateMetrics.classificationStabilityRate)}`,
    `- Stable useful rate: ${formatPercent(report.aggregateMetrics.stableUsefulRate)}`,
    `- Clean count: ${report.aggregateMetrics.cleanCount}`,
    `- Edge count: ${report.aggregateMetrics.edgeCount}`,
    `- Honest-limit count: ${report.aggregateMetrics.honestLimitCount}`,
    `- Current-snapshot exception count: ${report.aggregateMetrics.currentSnapshotExceptionCount}`,
    "",
    "## Replay Manifest",
    "",
    ...report.documents.map(
      (entry) =>
        `- \`${entry.replayId}\` [\`${entry.eraLabel}\` / \`${entry.documentFamily}\`] ${entry.commitHash ? `\`${entry.commitHash.slice(0, 12)}...\`` : "_current snapshot_"} -> \`${entry.currentPath}\` (sha256 \`${entry.sourceHash.slice(0, 12)}...\`)`,
    ),
    "",
    "## Top Failure Modes",
    "",
    ...(report.topFailureModes.length
      ? report.topFailureModes.flatMap((entry) => [
          `- \`${entry.label}\` (${entry.count})`,
          `  Replay IDs: ${entry.replayIds.map((item) => `\`${item}\``).join(", ")}`,
          `  Paths: ${entry.documentPaths.map((item) => `\`${item}\``).join(", ")}`,
        ])
      : ["- No major failure modes recorded in this pilot."]),
    "",
    "## Repeat Drift",
    "",
    ...(report.repeatInstabilityCases.length
      ? report.repeatInstabilityCases.flatMap((entry) => [
          `- \`${entry.replayId}\` (\`${entry.currentPath}\`)`,
          `  Category: \`${entry.documentCategory}\``,
          `  Reasons: ${entry.instabilityReasons.join(", ") || "none recorded"}`,
          `  Signatures: ${entry.uniqueRunSignatures.map((item) => `\`${item}\``).join(", ")}`,
          ...entry.runSummaries.map((summary) => `  Run: ${summary}`),
        ])
      : ["- No repeat drift recorded in this pilot."]),
    "",
    "## Replay Entries",
    "",
  ];

  report.documents.forEach((entry) => {
    const primary = summarizePrimaryRun(entry);
    const category = deriveReplayDocumentCategory(entry);
    lines.push(`### \`${entry.replayId}\``);
    lines.push("");
    lines.push(`- Path now: \`${entry.currentPath}\``);
    lines.push(`- Replay source: ${entry.commitHash ? `\`${entry.commitHash.slice(0, 12)}...\` at \`${entry.pathAtCommit}\`` : "_current snapshot exception_"}`);
    lines.push(`- Era / family: \`${entry.eraLabel}\` / \`${entry.documentFamily}\``);
    lines.push(`- Category: \`${category}\``);
    lines.push(`- Repeat stability: ${entry.stability.repeatStable ? "stable" : `unstable (${entry.stability.instabilityReasons.join(", ") || "details below"})`}`);
    if (entry.pinExceptionReason) {
      lines.push(`- Pin exception: ${entry.pinExceptionReason}`);
    }
    if (primary?.ok) {
      lines.push(`- Outcome / disposition: \`${primary.compilerRead.outcomeClass}\` / \`${primary.compilerRead.verdict.readDisposition}\``);
      lines.push(`- Primary finding: ${primary.compilerRead.verdict.primaryFinding}`);
      lines.push(`- Grounding rejected claims: ${primary.compilerRead.groundingRejectedClaimCount}`);
      lines.push(`- Next moves: ${(primary.compilerRead.nextMoves || []).join(" | ") || "none"}`);
      if (primary.compilerRead.trustCaveats?.length) {
        lines.push(`- Trust caveats: ${primary.compilerRead.trustCaveats.join(" | ")}`);
      }
    } else {
      lines.push(`- Primary run error: \`${primary?.errorKind || "unknown"}\``);
      lines.push(`- Error detail: ${primary?.errorMessage || "unknown error"}`);
    }
    lines.push("- Look-ahead:");
    formatLookAheadSummary(entry.lookAheadSummary).forEach((line) => lines.push(`  - ${line}`));
    lines.push("- Run summaries:");
    entry.runs.forEach((run) => lines.push(`  - ${formatRunSummary(run)}`));
    lines.push("");
  });

  lines.push("## First Internal Review Packet");
  lines.push("");
  report.reviewPacketEntries.forEach((entry) => {
    lines.push(`- \`${entry.replayId}\` [\`${entry.category}\`] \`${entry.outcomeClass || "n/a"}\` / \`${entry.readDisposition || "n/a"}\``);
    lines.push(`  Finding: ${entry.primaryFinding || "n/a"}`);
    lines.push(`  Repeat stability: ${entry.repeatStabilitySummary}`);
    lines.push(`  Look-ahead: ${formatLookAheadSummary(entry.lookAheadSummary).join(" | ")}`);
  });
  lines.push("");
  lines.push("## Recommendation");
  lines.push("");
  lines.push(report.finalRecommendation);
  lines.push("");

  return lines.join("\n");
}

function formatReviewPacket(report) {
  const lines = [
    "# Compiler Read Historical Replay Review Packet",
    "",
    `Replay name: \`${report.meta.replayName}\``,
    `Manifest source: \`${report.meta.manifestSourcePath}\``,
    `Repeat count: ${report.meta.repeatCount}`,
    "",
  ];

  report.reviewPacketEntries.forEach((entry, index) => {
    lines.push(`## Review ${index + 1}: \`${entry.replayId}\``);
    lines.push("");
    lines.push(`- Path: \`${entry.currentPath}\``);
    lines.push(`- Category: \`${entry.category}\``);
    lines.push(`- Outcome / disposition: \`${entry.outcomeClass || "n/a"}\` / \`${entry.readDisposition || "n/a"}\``);
    lines.push(`- Primary finding: ${entry.primaryFinding || "n/a"}`);
    lines.push(`- Repeat stability: ${entry.repeatStabilitySummary}`);
    if (entry.nextMoves.length) {
      lines.push("- Next moves:");
      entry.nextMoves.forEach((move) => lines.push(`  - ${move}`));
    }
    lines.push("- Look-ahead summary:");
    formatLookAheadSummary(entry.lookAheadSummary).forEach((line) => lines.push(`  - ${line}`));
    lines.push("- Human prompts:");
    lines.push("  - Was this honest for that moment?");
    lines.push("  - Was it understandable?");
    lines.push("  - Would this next move likely have helped convergence?");
    lines.push("  - Did later history support or weaken the read?");
    lines.push("");
  });

  return lines.join("\n");
}

function writeOutputs(report, options) {
  mkdirSync(options.outputRoot, { recursive: true });
  const jsonPath = path.join(options.outputRoot, "compiler-read-historical-replay-pilot-2026-04-13.json");
  const markdownPath = path.join(options.outputRoot, "compiler-read-historical-replay-pilot-2026-04-13.md");
  const reviewPath = path.join(
    options.outputRoot,
    "compiler-read-historical-replay-review-packet-2026-04-13.md",
  );
  const manifestPath = path.join(
    options.outputRoot,
    "compiler-read-historical-replay-pilot-2026-04-13.manifest.json",
  );

  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync(markdownPath, `${formatMarkdownReport(report)}\n`, "utf8");
  writeFileSync(reviewPath, `${formatReviewPacket(report)}\n`, "utf8");
  writeFileSync(manifestPath, `${JSON.stringify(buildResolvedManifestArtifact(report), null, 2)}\n`, "utf8");

  return {
    jsonPath,
    markdownPath,
    reviewPath,
    manifestPath,
  };
}

export async function runHistoricalReplay(
  options,
  {
    cwd = CWD,
    git = createGitAdapter({ cwd }),
    compilerReadFn = runCompilerRead,
    loadSource = loadReplaySource,
    loadLookAheadSummary = buildLookAheadSummary,
  } = {},
) {
  const manifest = loadReplayManifestFile(options.manifestFile);
  const entries = manifest.replayEntries.map((entry, index) => validateReplayEntry(entry, index));
  const results = [];

  for (const entry of entries) {
    results.push(
      await runReplayEntry(entry, options, {
        cwd,
        git,
        compilerReadFn,
        loadSource,
        loadLookAheadSummary,
      }),
    );
  }

  const report = {
    meta: {
      replayName: normalizeText(manifest.name) || "historical-replay-pilot-2026-04-13",
      manifestSourcePath: relativeWorkspacePath(options.manifestFile),
      repeatCount: options.repeatCount,
      strictness: options.strictness,
      generatedAt: new Date().toISOString(),
    },
    documents: results,
  };

  report.aggregateMetrics = buildAggregateMetrics(results);
  report.topFailureModes = buildTopFailureModes(results);
  report.repeatInstabilityCases = buildRepeatInstabilityCases(results);
  report.reviewPacketEntries = selectReviewPacketEntries(report);
  report.finalRecommendation = deriveFinalRecommendation(report);

  return report;
}

export async function main(argv = process.argv.slice(2)) {
  loadEnvConfig(CWD);
  const options = parseArgs(argv);
  const report = await runHistoricalReplay(options);
  const outputs = writeOutputs(report, options);

  console.log(
    JSON.stringify(
      {
        ok: true,
        replayName: report.meta.replayName,
        entryCount: report.aggregateMetrics.totalEntries,
        successfulPrimaryRunCount: report.aggregateMetrics.successfulPrimaryRunCount,
        errorPrimaryRunCount: report.aggregateMetrics.errorPrimaryRunCount,
        repeatStabilityRate: report.aggregateMetrics.repeatStabilityRate,
        classificationStabilityRate: report.aggregateMetrics.classificationStabilityRate,
        finalRecommendation: report.finalRecommendation,
        jsonPath: outputs.jsonPath,
        markdownPath: outputs.markdownPath,
        reviewPath: outputs.reviewPath,
        manifestPath: outputs.manifestPath,
      },
      null,
      2,
    ),
  );
}

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main().catch((error) => {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  });
}
