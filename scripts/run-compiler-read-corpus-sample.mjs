import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import crypto from "node:crypto";
import nextEnv from "@next/env";

import { runCompilerRead, CompilerReadError } from "../src/lib/compiler-read.js";

const { loadEnvConfig } = nextEnv;

const CWD = process.cwd();
const DEFAULT_ROOTS = ["docs", "version 1", "LoegosCLI/docs"].map((entry) => path.join(CWD, entry));
const DEFAULT_EXCLUDE_PATTERNS = ["archive/", "root-docs/"];
const DEFAULT_SAMPLE_SIZE = 8;
const DEFAULT_MIN_CHARS = 400;
const DEFAULT_MAX_CHARS = 18000;
const DEFAULT_REPEAT_COUNT = 2;
const DEFAULT_REVIEW_COUNT = 5;
const OUTPUT_ROOT = path.join(CWD, "output", "compiler-read-benchmarks");
const MARKDOWN_EXTENSIONS = new Set([".md", ".mdi"]);
const IGNORED_DIRS = new Set([".git", ".next", "node_modules", "output", "test-results"]);
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

function parseArgs(argv = []) {
  const options = {
    seed: "first-internal-2026-04-13-a",
    sampleSize: DEFAULT_SAMPLE_SIZE,
    minChars: DEFAULT_MIN_CHARS,
    maxChars: DEFAULT_MAX_CHARS,
    repeatCount: DEFAULT_REPEAT_COUNT,
    reviewCount: DEFAULT_REVIEW_COUNT,
    roots: [...DEFAULT_ROOTS],
    includePatterns: [],
    excludePatterns: [...DEFAULT_EXCLUDE_PATTERNS],
    strictness: "soft",
    outputRoot: OUTPUT_ROOT,
    packetVersion: "v2",
    reviewerIdentityModel: "single-founder",
    manifestFile: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    const takeValue = () => {
      index += 1;
      return next;
    };

    if (token === "--seed" && next) {
      options.seed = String(takeValue());
      continue;
    }
    if (token.startsWith("--seed=")) {
      options.seed = token.slice("--seed=".length);
      continue;
    }
    if (token === "--sample-size" && next) {
      options.sampleSize = Number.parseInt(takeValue(), 10) || DEFAULT_SAMPLE_SIZE;
      continue;
    }
    if (token.startsWith("--sample-size=")) {
      options.sampleSize = Number.parseInt(token.slice("--sample-size=".length), 10) || DEFAULT_SAMPLE_SIZE;
      continue;
    }
    if (token === "--min-chars" && next) {
      options.minChars = Number.parseInt(takeValue(), 10) || DEFAULT_MIN_CHARS;
      continue;
    }
    if (token.startsWith("--min-chars=")) {
      options.minChars = Number.parseInt(token.slice("--min-chars=".length), 10) || DEFAULT_MIN_CHARS;
      continue;
    }
    if (token === "--max-chars" && next) {
      options.maxChars = Number.parseInt(takeValue(), 10) || DEFAULT_MAX_CHARS;
      continue;
    }
    if (token.startsWith("--max-chars=")) {
      options.maxChars = Number.parseInt(token.slice("--max-chars=".length), 10) || DEFAULT_MAX_CHARS;
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
    if (token === "--review-count" && next) {
      options.reviewCount = Math.max(1, Number.parseInt(takeValue(), 10) || DEFAULT_REVIEW_COUNT);
      continue;
    }
    if (token.startsWith("--review-count=")) {
      options.reviewCount = Math.max(1, Number.parseInt(token.slice("--review-count=".length), 10) || DEFAULT_REVIEW_COUNT);
      continue;
    }
    if (token === "--root" && next) {
      options.roots.push(path.resolve(CWD, takeValue()));
      continue;
    }
    if (token.startsWith("--root=")) {
      options.roots.push(path.resolve(CWD, token.slice("--root=".length)));
      continue;
    }
    if (token === "--include" && next) {
      options.includePatterns.push(String(takeValue()));
      continue;
    }
    if (token.startsWith("--include=")) {
      options.includePatterns.push(token.slice("--include=".length));
      continue;
    }
    if (token === "--exclude" && next) {
      options.excludePatterns.push(String(takeValue()));
      continue;
    }
    if (token.startsWith("--exclude=")) {
      options.excludePatterns.push(token.slice("--exclude=".length));
      continue;
    }
    if (token === "--strictness" && next) {
      options.strictness = normalizeText(takeValue()) || "soft";
      continue;
    }
    if (token.startsWith("--strictness=")) {
      options.strictness = normalizeText(token.slice("--strictness=".length)) || "soft";
      continue;
    }
    if (token === "--packet-version" && next) {
      options.packetVersion = normalizeText(takeValue()) || "v2";
      continue;
    }
    if (token.startsWith("--packet-version=")) {
      options.packetVersion = normalizeText(token.slice("--packet-version=".length)) || "v2";
      continue;
    }
    if (token === "--reviewer-identity-model" && next) {
      options.reviewerIdentityModel = normalizeText(takeValue()) || "single-founder";
      continue;
    }
    if (token.startsWith("--reviewer-identity-model=")) {
      options.reviewerIdentityModel =
        normalizeText(token.slice("--reviewer-identity-model=".length)) || "single-founder";
      continue;
    }
    if (token === "--manifest-file" && next) {
      options.manifestFile = path.resolve(CWD, takeValue());
      continue;
    }
    if (token.startsWith("--manifest-file=")) {
      options.manifestFile = path.resolve(CWD, token.slice("--manifest-file=".length));
      continue;
    }
  }

  options.roots = [...new Set(options.roots.map((entry) => path.resolve(CWD, entry)))].filter((entry) =>
    existsSync(entry),
  );

  return options;
}

function hashSeed(seed = "") {
  const digest = crypto.createHash("sha256").update(String(seed || "")).digest("hex");
  return Number.parseInt(digest.slice(0, 8), 16) >>> 0;
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items = [], seed = "") {
  const rng = mulberry32(hashSeed(seed));
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function matchesPatternSet(value = "", patterns = []) {
  return patterns.some((pattern) => normalizeText(pattern) && String(value).includes(pattern));
}

function relativeWorkspacePath(filePath = "") {
  return path.relative(CWD, filePath).split(path.sep).join("/");
}

function hashContent(value = "") {
  return crypto.createHash("sha256").update(String(value || ""), "utf8").digest("hex");
}

function summarizeSampledDocument(document) {
  return {
    documentPath: document.relativePath,
    sourceRoot: document.sourceRoot,
    byteSize: document.byteSize,
    charCount: document.charCount,
    contentHash: document.contentHash,
  };
}

function buildCorpusHash(documents = []) {
  return hashContent(
    documents
      .map((document) =>
        [document.relativePath, document.contentHash, document.byteSize, document.charCount].join(":"),
      )
      .sort((left, right) => left.localeCompare(right))
      .join("\n"),
  );
}

function listEligibleDocuments(rootPath, options) {
  const results = [];

  function visit(currentPath) {
    const entries = readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) {
        if (entry.name !== ".well-known") {
          continue;
        }
      }

      const entryPath = path.join(currentPath, entry.name);
      const relativePath = relativeWorkspacePath(entryPath);

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) {
          continue;
        }
        if (matchesPatternSet(relativePath, options.excludePatterns)) {
          continue;
        }
        visit(entryPath);
        continue;
      }

      const extension = path.extname(entry.name).toLowerCase();
      if (!MARKDOWN_EXTENSIONS.has(extension)) {
        continue;
      }
      if (matchesPatternSet(relativePath, options.excludePatterns)) {
        continue;
      }
      if (options.includePatterns.length && !matchesPatternSet(relativePath, options.includePatterns)) {
        continue;
      }

      const text = readFileSync(entryPath, "utf8");
      const charCount = text.length;
      if (charCount < options.minChars || charCount > options.maxChars) {
        continue;
      }

      results.push({
        path: entryPath,
        relativePath,
        sourceRoot: relativeWorkspacePath(rootPath),
        byteSize: statSync(entryPath).size,
        charCount,
        title: path.basename(entryPath),
        text,
        contentHash: hashContent(text),
      });
    }
  }

  visit(rootPath);
  return results;
}

function loadManifestFile(manifestPath) {
  if (!manifestPath || !existsSync(manifestPath)) {
    throw new Error(`Manifest file not found: ${manifestPath}`);
  }

  const parsed = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (!Array.isArray(parsed?.sampledDocuments) || !parsed.sampledDocuments.length) {
    throw new Error(`Manifest file is missing sampledDocuments: ${manifestPath}`);
  }

  return parsed;
}

function loadDocumentFromManifestEntry(entry) {
  const relativePath = normalizeText(entry?.documentPath || entry?.relativePath);
  if (!relativePath) {
    throw new Error("Manifest entry is missing documentPath.");
  }

  const absolutePath = path.resolve(CWD, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Manifest document not found: ${relativePath}`);
  }

  const text = readFileSync(absolutePath, "utf8");
  const contentHash = hashContent(text);
  const expectedHash = normalizeText(entry?.contentHash);
  if (expectedHash && expectedHash !== contentHash) {
    throw new Error(
      `Manifest hash mismatch for ${relativePath}: expected ${expectedHash}, got ${contentHash}.`,
    );
  }

  return {
    path: absolutePath,
    relativePath,
    sourceRoot: normalizeText(entry?.sourceRoot) || "manifest",
    byteSize: statSync(absolutePath).size,
    charCount: text.length,
    title: path.basename(absolutePath),
    text,
    contentHash,
  };
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
    if (compilerRead?.embeddedExecutableResult?.compileState === "clean") {
      caveats.push("Embedded executable source was kept distinct from translated subset success.");
    } else {
      caveats.push("Embedded executable candidate was detected but did not compile cleanly.");
    }
  }
  if (compilerRead?.limitationClass === "translation_loss") {
    caveats.push("The read identified translation loss rather than forcing a clean compile.");
  }
  if (compilerRead?.limitationClass === "compiler_gap") {
    caveats.push("The read flagged a compiler gap instead of flattening the document into a lossy subset.");
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

function deriveDocumentCategory(entry) {
  const primary = summarizePrimaryRun(entry);

  if (!primary) return "unknown";
  if (!primary.ok && primary.errorKind === "grounding_failure") return "hard";
  if (primary.ok && primary.compilerRead?.limitationClass === "excerpt_not_anchorable") return "hard";
  if (!entry?.stability?.repeatStable) return "edge";
  if (primary.ok) return "clean";
  return "unknown";
}

function buildRunSignature(run) {
  if (!run) {
    return "missing";
  }

  if (!run.ok) {
    return `error:${normalizeText(run.errorKind || "unknown")}`;
  }

  return `ok:${normalizeText(run.compilerRead?.outcomeClass || "null")}:${normalizeText(
    run.compilerRead?.verdict?.readDisposition || "null",
  )}`;
}

function formatRunSummary(run) {
  if (!run) {
    return "missing run";
  }

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
  const outcomes = new Set(
    successfulRuns.map((run) => normalizeText(run?.compilerRead?.outcomeClass || "null")),
  );
  const dispositions = new Set(
    successfulRuns.map((run) => normalizeText(run?.compilerRead?.verdict?.readDisposition || "null")),
  );
  const errorKinds = new Set(errorRuns.map((run) => normalizeText(run?.errorKind || "unknown")));
  const uniqueRunSignatures = [...new Set(runs.map((run) => buildRunSignature(run)))];
  const instabilityReasons = [];

  if (successfulRuns.length && errorRuns.length) {
    instabilityReasons.push("mixed_success_and_error");
  }
  if (successfulRuns.length > 1 && outcomes.size > 1) {
    instabilityReasons.push("outcome_changed");
  }
  if (successfulRuns.length > 1 && dispositions.size > 1) {
    instabilityReasons.push("disposition_changed");
  }
  if (errorRuns.length > 1 && errorKinds.size > 1) {
    instabilityReasons.push("error_kind_changed");
  }
  if (!instabilityReasons.length && uniqueRunSignatures.length > 1) {
    instabilityReasons.push("run_signature_changed");
  }

  return {
    repeatCount: runs.length,
    successfulRunCount: successfulRuns.length,
    errorRunCount: errorRuns.length,
    repeatStable: uniqueRunSignatures.length === 1,
    sameOutcomeClass: successfulRuns.length === runs.length && outcomes.size === 1,
    sameReadDisposition: successfulRuns.length === runs.length && dispositions.size === 1,
    sameErrorKind: errorRuns.length === runs.length && errorKinds.size === 1,
    stableClassification:
      successfulRuns.length === runs.length && outcomes.size === 1 && dispositions.size === 1,
    instabilityReasons,
    uniqueRunSignatures,
  };
}

async function runDocument(document, options) {
  const runs = [];

  for (let runIndex = 0; runIndex < options.repeatCount; runIndex += 1) {
    try {
      const compilerRead = await runCompilerRead({
        documentId: document.relativePath,
        title: document.title,
        text: document.text,
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

  return {
    documentPath: document.relativePath,
    documentTitle: document.title,
    sourceRoot: document.sourceRoot,
    byteSize: document.byteSize,
    charCount: document.charCount,
    sourcePreview: normalizeLongText(document.text).slice(0, 240),
    runs,
    stability: computeStability(runs),
  };
}

function summarizePrimaryRun(entry) {
  return entry.runs.find((run) => run.ok) || entry.runs[0] || null;
}

function buildAggregateMetrics(results, options) {
  const sampled = results.length;
  const successfulPrimaryRuns = results
    .map((entry) => summarizePrimaryRun(entry))
    .filter((run) => run?.ok);

  const countBy = (selector) => {
    const counts = {};
    successfulPrimaryRuns.forEach((run) => {
      const key = selector(run) || "null";
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  };

  const stableDocs = results.filter((entry) => entry.stability.stableClassification).length;
  const repeatStableDocs = results.filter((entry) => entry.stability.repeatStable).length;
  const omissionValidDocs = successfulPrimaryRuns.filter(
    (run) => run.compilerRead?.omissionPartitionValid,
  ).length;
  const groundingPassedDocs = successfulPrimaryRuns.filter(
    (run) => run.compilerRead?.excerptGroundingPassed,
  ).length;
  const lawfulSubsetDocs = successfulPrimaryRuns.filter(
    (run) => run.compilerRead?.translatedSubsetResult?.present,
  ).length;
  const actionableSignalDocs = successfulPrimaryRuns.filter(
    (run) => run.compilerRead?.meaningfulNextMoveSignalPresent,
  ).length;
  const fakeCompileDocs = successfulPrimaryRuns.filter((run) => {
    const read = run.compilerRead;
    return (
      !read?.translatedSubsetResult?.present &&
      !read?.embeddedExecutableResult?.present &&
      read?.translatedSubsetResult?.compileState === "clean"
    );
  }).length;

  return {
    sampledDocumentCount: sampled,
    successfulPrimaryRunCount: successfulPrimaryRuns.length,
    errorPrimaryRunCount: sampled - successfulPrimaryRuns.length,
    repeatCount: options.repeatCount,
    classificationDistribution: countBy((run) => run.compilerRead?.outcomeClass),
    limitationDistribution: countBy((run) => run.compilerRead?.limitationClass || "none"),
    dispositionDistribution: countBy((run) => run.compilerRead?.verdict?.readDisposition),
    documentCategoryDistribution: results.reduce((counts, entry) => {
      const key = deriveDocumentCategory(entry);
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {}),
    groundingPassRate:
      successfulPrimaryRuns.length > 0 ? groundingPassedDocs / successfulPrimaryRuns.length : 0,
    omissionPartitionValidityRate:
      successfulPrimaryRuns.length > 0 ? omissionValidDocs / successfulPrimaryRuns.length : 0,
    lawfulSubsetRate: sampled > 0 ? lawfulSubsetDocs / sampled : 0,
    meaningfulNextMoveSignalRate: sampled > 0 ? actionableSignalDocs / sampled : 0,
    noFakeCompileRate:
      successfulPrimaryRuns.length > 0 ? 1 - fakeCompileDocs / successfulPrimaryRuns.length : 0,
    repeatStabilityRate: sampled > 0 ? repeatStableDocs / sampled : 0,
    repeatInstabilityRate: sampled > 0 ? 1 - repeatStableDocs / sampled : 0,
    classificationStabilityRate: sampled > 0 ? stableDocs / sampled : 0,
    secondaryRawRuntimeDownrankRate:
      successfulPrimaryRuns.length > 0
        ? successfulPrimaryRuns.filter((run) => run.compilerRead?.secondaryRawRuntimeDownranked).length /
          successfulPrimaryRuns.length
        : 0,
  };
}

function buildTopFailureModes(results) {
  const buckets = new Map();

  const add = (label, documentPath) => {
    const bucket = buckets.get(label) || { label, count: 0, documentPaths: [], seenDocumentPaths: new Set() };
    bucket.count += 1;
    if (!bucket.seenDocumentPaths.has(documentPath) && bucket.documentPaths.length < 5) {
      bucket.documentPaths.push(documentPath);
      bucket.seenDocumentPaths.add(documentPath);
    }
    buckets.set(label, bucket);
  };

  results.forEach((entry) => {
    entry.runs.forEach((run) => {
      if (!run?.ok) {
        add(`error:${run.errorKind}`, entry.documentPath);
      }
    });

    const primary = summarizePrimaryRun(entry);
    if (!primary?.ok) return;

    const read = primary.compilerRead;
    if (read.limitationClass) {
      add(`limitation:${read.limitationClass}`, entry.documentPath);
    }
    if (
      read.embeddedExecutableResult?.present &&
      read.embeddedExecutableResult?.compileState !== "clean"
    ) {
      add("embedded_candidate_blocked", entry.documentPath);
    }
    if (
      read.rawDocumentResult?.compileState === "blocked" &&
      !read.translatedSubsetResult?.present &&
      read.outcomeClass === "raw_not_direct_source"
    ) {
      add("admission_only_no_structural_hold", entry.documentPath);
    }
    if (read.verdict?.readDisposition === "informative_only") {
      add("informative_only", entry.documentPath);
    }
  });

  return [...buckets.values()]
    .map((bucket) => ({
      label: bucket.label,
      count: bucket.count,
      documentPaths: bucket.documentPaths,
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);
}

function buildRepeatInstabilityCases(results) {
  return results
    .filter((entry) => !entry.stability.repeatStable)
    .map((entry) => ({
      documentPath: entry.documentPath,
      documentCategory: deriveDocumentCategory(entry),
      successfulRunCount: entry.stability.successfulRunCount,
      errorRunCount: entry.stability.errorRunCount,
      instabilityReasons: entry.stability.instabilityReasons,
      uniqueRunSignatures: entry.stability.uniqueRunSignatures,
      runSummaries: entry.runs.map((run) => formatRunSummary(run)),
    }))
    .sort((left, right) => {
      if (right.errorRunCount !== left.errorRunCount) {
        return right.errorRunCount - left.errorRunCount;
      }
      return left.documentPath.localeCompare(right.documentPath);
    });
}

function buildTopUsefulCases(results, reviewCount) {
  return results
    .map((entry) => {
      const primary = summarizePrimaryRun(entry);
      if (!primary?.ok) return null;
      const read = primary.compilerRead;
      return {
        documentPath: entry.documentPath,
        sourceRoot: entry.sourceRoot,
        documentCategory: deriveDocumentCategory(entry),
        outcomeClass: read.outcomeClass,
        readDisposition: read.verdict?.readDisposition,
        primaryFinding: read.verdict?.primaryFinding,
        nextMoves: read.nextMoves,
        usefulnessSignalScore: read.usefulnessSignalScore,
        repeatStable: entry.stability.repeatStable,
        instabilityReasons: entry.stability.instabilityReasons,
      };
    })
    .filter((entry) => entry && entry.usefulnessSignalScore > 0)
    .sort((left, right) => {
      if (right.usefulnessSignalScore !== left.usefulnessSignalScore) {
        return right.usefulnessSignalScore - left.usefulnessSignalScore;
      }
      if (left.repeatStable !== right.repeatStable) {
        return Number(right.repeatStable) - Number(left.repeatStable);
      }
      return left.documentPath.localeCompare(right.documentPath);
    })
    .slice(0, reviewCount);
}

function buildFixturePromotionCandidates(results, reviewCount) {
  const candidates = [];

  results.forEach((entry) => {
    const primary = summarizePrimaryRun(entry);
    if (!primary) return;

    if (!primary.ok) {
      candidates.push({
        documentPath: entry.documentPath,
        documentCategory: deriveDocumentCategory(entry),
        reason: `Promote if this error class is new or recurring (${primary.errorKind}).`,
      });
      return;
    }

    const read = primary.compilerRead;
    if (read.outcomeClass === "direct_source_compiled") {
      candidates.push({
        documentPath: entry.documentPath,
        documentCategory: deriveDocumentCategory(entry),
        reason: "Strong direct-source case worth keeping distinct in the reviewed corpus.",
      });
    }
    if (read.outcomeClass === "direct_program_found") {
      candidates.push({
        documentPath: entry.documentPath,
        documentCategory: deriveDocumentCategory(entry),
        reason: "Embedded executable case worth preserving as a stable benchmark subject.",
      });
    }
    if (
      read.embeddedExecutableResult?.present &&
      read.embeddedExecutableResult?.compileState !== "clean"
    ) {
      candidates.push({
        documentPath: entry.documentPath,
        documentCategory: deriveDocumentCategory(entry),
        reason: "Embedded executable candidate blocked and may reveal misleading-example behavior.",
      });
    }
    if (["compiler_gap", "translation_loss", "excerpt_not_anchorable"].includes(read.limitationClass)) {
      candidates.push({
        documentPath: entry.documentPath,
        documentCategory: deriveDocumentCategory(entry),
        reason: `Useful ${read.limitationClass} case for tightening the structural honesty harness.`,
      });
    }
    if (read.usefulnessSignalScore >= 3) {
      candidates.push({
        documentPath: entry.documentPath,
        documentCategory: deriveDocumentCategory(entry),
        reason: "High-signal useful case worth promoting into reviewed usefulness checks later.",
      });
    }
  });

  const seen = new Set();
  return candidates
    .filter((entry) => {
      const key = `${entry.documentPath}:${entry.reason}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, reviewCount);
}

function buildReviewPacketEntries(report) {
  const merged = new Map();
  const documentsByPath = new Map(report.documents.map((entry) => [entry.documentPath, entry]));

  const upsert = (entry, sourceTag) => {
    if (!entry?.documentPath) {
      return;
    }

    const documentRecord = documentsByPath.get(entry.documentPath);
    const stability = documentRecord?.stability || null;

    const existing = merged.get(entry.documentPath) || {
      documentPath: entry.documentPath,
      primaryFinding: null,
      nextMoves: [],
      promotionReasons: [],
      sourceTags: [],
      repeatStable: stability ? stability.repeatStable : true,
      instabilityReasons: stability ? [...stability.instabilityReasons] : [],
      usefulnessSignalScore: null,
      outcomeClass: null,
      readDisposition: null,
      documentCategory: documentRecord ? deriveDocumentCategory(documentRecord) : "unknown",
    };

    if (!existing.primaryFinding && entry.primaryFinding) {
      existing.primaryFinding = entry.primaryFinding;
    }
    if (Array.isArray(entry.nextMoves)) {
      existing.nextMoves = [...new Set([...existing.nextMoves, ...entry.nextMoves])];
    }
    if (entry.reason) {
      existing.promotionReasons = [...new Set([...existing.promotionReasons, entry.reason])];
    }
    if (sourceTag) {
      existing.sourceTags = [...new Set([...existing.sourceTags, sourceTag])];
    }
    if (typeof entry.repeatStable === "boolean") {
      existing.repeatStable = entry.repeatStable;
    }
    if (Array.isArray(entry.instabilityReasons) && entry.instabilityReasons.length) {
      existing.instabilityReasons = [...new Set([...existing.instabilityReasons, ...entry.instabilityReasons])];
    }
    if (typeof entry.usefulnessSignalScore === "number") {
      existing.usefulnessSignalScore = Math.max(
        existing.usefulnessSignalScore ?? 0,
        entry.usefulnessSignalScore,
      );
    }
    if (!existing.outcomeClass && entry.outcomeClass) {
      existing.outcomeClass = entry.outcomeClass;
    }
    if (!existing.readDisposition && entry.readDisposition) {
      existing.readDisposition = entry.readDisposition;
    }
    if ((!existing.documentCategory || existing.documentCategory === "unknown") && entry.documentCategory) {
      existing.documentCategory = entry.documentCategory;
    }

    merged.set(entry.documentPath, existing);
  };

  report.topUsefulCases.forEach((entry) => upsert(entry, "top useful case"));
  report.fixturePromotionCandidates.forEach((entry) => upsert(entry, "fixture promotion candidate"));

  return [...merged.values()]
    .sort((left, right) => {
      const leftScore = left.usefulnessSignalScore ?? -1;
      const rightScore = right.usefulnessSignalScore ?? -1;
      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }
      return left.documentPath.localeCompare(right.documentPath);
    })
    .slice(0, report.meta.reviewCount);
}

function recommendNextTighteningStep(report) {
  const [topFailureMode] = report.topFailureModes;
  if (!topFailureMode) {
    return "Promote the strongest direct-source and embedded-program cases into reviewed fixtures, then widen the sample.";
  }

  if (topFailureMode.label.startsWith("error:")) {
    return "Stabilize live extraction and error handling first so the sampler teaches us about the feature rather than transport noise.";
  }
  if (topFailureMode.label === "embedded_candidate_blocked") {
    return "Tighten malformed embedded-program interpretation so illustrative code blocks do not read as stronger than they are.";
  }
  if (topFailureMode.label === "limitation:translation_loss") {
    return "Improve split guidance and next-move specificity for documents whose meaning cannot yet survive current translation.";
  }
  if (topFailureMode.label === "limitation:compiler_gap") {
    return "Capture the dominant compiler-gap themes and decide which one deserves the next language-extension pass.";
  }
  if (topFailureMode.label === "limitation:excerpt_not_anchorable") {
    return "Keep the grounding gate strict and treat non-anchorable prose as an honest limitation until a narrower anchoring contract exists.";
  }
  if (topFailureMode.label === "informative_only") {
    return "Tighten useful-next-move language for informative-only reads so the tool explains why no stronger move exists yet.";
  }

  return "Promote the highest-signal failure cases into the reviewed corpus and rerun the same seed to confirm the next fix actually moved the benchmark.";
}

function formatPercent(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

function formatMarkdownReport(report) {
  const lines = [
    "# Compiler Read First Internal Benchmark Run",
    "",
    `- Seed: \`${report.meta.seed}\``,
    `- Packet version: \`${report.meta.packetVersion}\``,
    `- Reviewer identity model: \`${report.meta.reviewerIdentityModel}\``,
    `- Manifest mode: \`${report.meta.manifestMode}\``,
    `- Manifest source: ${report.meta.manifestSourcePath ? `\`${report.meta.manifestSourcePath}\`` : "_generated during run_"}`,
    `- Manifest output: ${report.meta.manifestOutputPath ? `\`${report.meta.manifestOutputPath}\`` : "_pending write_"}`,
    `- Sample size: ${report.meta.sampleSize}`,
    `- Repeat count: ${report.meta.repeatCount}`,
    `- Approved roots: ${report.meta.roots.map((entry) => `\`${entry}\``).join(", ")}`,
    `- Model: \`${report.meta.model}\``,
    `- Generated at: ${report.meta.generatedAt}`,
    ...(report.sampleManifest?.eligibleCorpusHash
      ? [
          `- Eligible document count: ${report.sampleManifest.eligibleDocumentCount}`,
          `- Eligible corpus hash: \`${report.sampleManifest.eligibleCorpusHash}\``,
        ]
      : []),
    "",
    "## Aggregate Metrics",
    "",
    `- Documents sampled: ${report.aggregateMetrics.sampledDocumentCount}`,
    `- Successful primary runs: ${report.aggregateMetrics.successfulPrimaryRunCount}`,
    `- Primary-run errors: ${report.aggregateMetrics.errorPrimaryRunCount}`,
    `- Grounding pass rate: ${formatPercent(report.aggregateMetrics.groundingPassRate)}`,
    `- Omission partition validity rate: ${formatPercent(report.aggregateMetrics.omissionPartitionValidityRate)}`,
    `- Lawful subset rate: ${formatPercent(report.aggregateMetrics.lawfulSubsetRate)}`,
    `- Meaningful next-move heuristic rate (pre-review): ${formatPercent(report.aggregateMetrics.meaningfulNextMoveSignalRate)}`,
    `- No-fake-compile rate: ${formatPercent(report.aggregateMetrics.noFakeCompileRate)}`,
    `- Repeat stability rate: ${formatPercent(report.aggregateMetrics.repeatStabilityRate)}`,
    `- Repeat instability rate: ${formatPercent(report.aggregateMetrics.repeatInstabilityRate)}`,
    `- Classification stability rate (successful repeats only): ${formatPercent(report.aggregateMetrics.classificationStabilityRate)}`,
    `- Secondary raw runtime downrank rate: ${formatPercent(report.aggregateMetrics.secondaryRawRuntimeDownrankRate)}`,
    "",
    "_Meaningful next-move heuristic rate is a pre-review signal only. It does not yet prove the read was actually useful._",
    "",
    "## Sample Manifest",
    "",
    ...report.sampleManifest.sampledDocuments.map(
      (document) =>
        `- \`${document.documentPath}\` (\`${document.sourceRoot}\`, sha256 \`${document.contentHash.slice(0, 12)}...\`)`,
    ),
    "",
    "### Classification Distribution",
    "",
    ...Object.entries(report.aggregateMetrics.classificationDistribution).map(
      ([label, count]) => `- \`${label}\`: ${count}`,
    ),
    "",
    "### Limitation Distribution",
    "",
    ...Object.entries(report.aggregateMetrics.limitationDistribution).map(
      ([label, count]) => `- \`${label}\`: ${count}`,
    ),
    "",
    "### Document Categories",
    "",
    ...Object.entries(report.aggregateMetrics.documentCategoryDistribution).map(
      ([label, count]) => `- \`${label}\`: ${count}`,
    ),
    "",
    "## Top Failure Modes",
    "",
    ...report.topFailureModes.flatMap((entry) => [
      `- \`${entry.label}\` (${entry.count})`,
      `  Paths: ${entry.documentPaths.map((item) => `\`${item}\``).join(", ")}`,
    ]),
    "",
    "## Top Useful Cases",
    "",
    ...report.topUsefulCases.flatMap((entry) => [
      `- \`${entry.documentPath}\``,
      `  Category: \`${entry.documentCategory}\`; outcome: \`${entry.outcomeClass}\`; disposition: \`${entry.readDisposition}\`; usefulness signal: ${entry.usefulnessSignalScore}`,
      `  Repeat stability: ${entry.repeatStable ? "stable" : `unstable (${entry.instabilityReasons.join(", ")})`}`,
      `  Finding: ${entry.primaryFinding}`,
      ...entry.nextMoves.map((move) => `  Next move: ${move}`),
    ]),
    "",
    "## Fixture-Promotion Candidates",
    "",
    ...report.fixturePromotionCandidates.map(
      (entry) => `- \`${entry.documentPath}\` (\`${entry.documentCategory}\`): ${entry.reason}`,
    ),
    "",
    "## Repeat Instability",
    "",
    ...(report.repeatInstabilityCases.length
      ? report.repeatInstabilityCases.flatMap((entry) => [
          `- \`${entry.documentPath}\``,
          `  Category: \`${entry.documentCategory}\``,
          `  Reasons: ${entry.instabilityReasons.join(", ") || "none recorded"}`,
          `  Successful runs: ${entry.successfulRunCount}; error runs: ${entry.errorRunCount}`,
          `  Signatures: ${entry.uniqueRunSignatures.map((item) => `\`${item}\``).join(", ")}`,
          ...entry.runSummaries.map((summary) => `  Run: ${summary}`),
        ])
      : ["- None recorded in this sample."]),
    "",
    "## Recommended Next Tightening Step",
    "",
    report.recommendedNextTighteningStep,
    "",
  ];

  return lines.join("\n");
}

function formatReviewPacket(report) {
  const lines = [
    "# Compiler Read Benchmark Review Packet v2",
    "",
    `Seed: \`${report.meta.seed}\``,
    `Packet version: \`${report.meta.packetVersion}\``,
    `Reviewer identity model: \`${report.meta.reviewerIdentityModel}\``,
    `Manifest mode: \`${report.meta.manifestMode}\``,
    `Manifest source: ${report.meta.manifestSourcePath ? `\`${report.meta.manifestSourcePath}\`` : "_generated during run_"}`,
    "",
    "Use this fixed 0-3 scale:",
    "- 0 = no",
    "- 1 = weak / partial",
    "- 2 = solid",
    "- 3 = strong",
    "",
    "Score these fields with the same scale: honest, understandable, specific, actionable, convergence value, would use again.",
    "",
  ];

  const reviewEntries = buildReviewPacketEntries(report);

  reviewEntries.forEach((entry, index) => {
    lines.push(`## Review ${index + 1}: \`${entry.documentPath}\``);
    if (entry.sourceTags.length) {
      lines.push("", `- Included because: ${entry.sourceTags.join("; ")}`);
    }
    if (entry.outcomeClass || entry.readDisposition) {
      lines.push(
        `- Structural summary: category=\`${entry.documentCategory || "n/a"}\`; outcome=\`${entry.outcomeClass || "n/a"}\`; disposition=\`${entry.readDisposition || "n/a"}\``,
      );
    }
    lines.push(
      `- Repeat stability: ${
        entry.repeatStable
          ? "stable across repeats"
          : `unstable across repeats (${entry.instabilityReasons.join(", ") || "details in benchmark report"})`
      }`,
    );
    if (typeof entry.usefulnessSignalScore === "number") {
      lines.push(`- Pre-review usefulness signal: ${entry.usefulnessSignalScore}`);
    }
    if (entry.primaryFinding) {
      lines.push("", `- Finding: ${entry.primaryFinding}`);
    }
    if (Array.isArray(entry.nextMoves) && entry.nextMoves.length) {
      lines.push("- Next moves:");
      entry.nextMoves.forEach((move) => lines.push(`  - ${move}`));
    }
    if (entry.promotionReasons.length) {
      lines.push("- Promotion reasons:");
      entry.promotionReasons.forEach((reason) => lines.push(`  - ${reason}`));
    }
    lines.push(
      "- Honest (0-3):",
      "- Understandable (0-3):",
      "- Specific (0-3):",
      "- Actionable (0-3):",
      "- Convergence value (0-3):",
      "- Would use again (0-3):",
      "- What move would you take now because of this read? (Required):",
      "- Reviewer notes:",
      "- 48-72 hour follow-up:",
      "  - Did you take the move?:",
      "  - What happened?:",
      "",
    );
  });

  return lines.join("\n");
}

async function runBenchmark(options) {
  let sampledDocuments = [];
  let sampleManifest = null;

  if (options.manifestFile) {
    const manifest = loadManifestFile(options.manifestFile);
    sampledDocuments = manifest.sampledDocuments.map((entry) => loadDocumentFromManifestEntry(entry));
    sampleManifest = {
      mode: "frozen",
      sourcePath: relativeWorkspacePath(options.manifestFile),
      eligibleDocumentCount: manifest.eligibleDocumentCount ?? null,
      eligibleCorpusHash: manifest.eligibleCorpusHash ?? null,
      sampledDocuments: sampledDocuments.map((document) => summarizeSampledDocument(document)),
    };
  } else {
    const eligible = options.roots
      .flatMap((rootPath) => listEligibleDocuments(rootPath, options))
      .sort((left, right) => left.relativePath.localeCompare(right.relativePath));

    if (!eligible.length) {
      throw new Error("No eligible markdown documents matched the sampler configuration.");
    }

    const shuffled = shuffle(eligible, options.seed);
    sampledDocuments = shuffled.slice(0, Math.min(options.sampleSize, shuffled.length));
    sampleManifest = {
      mode: "generated",
      sourcePath: null,
      eligibleDocumentCount: eligible.length,
      eligibleCorpusHash: buildCorpusHash(eligible),
      sampledDocuments: sampledDocuments.map((document) => summarizeSampledDocument(document)),
    };
  }

  const results = [];

  for (const document of sampledDocuments) {
    results.push(await runDocument(document, options));
  }

  const report = {
    meta: {
      seed: options.seed,
      sampleSize: sampledDocuments.length,
      repeatCount: options.repeatCount,
      roots: options.roots.map((entry) => relativeWorkspacePath(entry)),
      strictness: options.strictness,
      minChars: options.minChars,
      maxChars: options.maxChars,
      reviewCount: options.reviewCount,
      packetVersion: options.packetVersion,
      reviewerIdentityModel: options.reviewerIdentityModel,
      manifestMode: sampleManifest.mode,
      manifestSourcePath: sampleManifest.sourcePath,
      manifestOutputPath: null,
      model: process.env.OPENAI_SEVEN_MODEL || process.env.OPENAI_TEXT_MODEL || "gpt-5.1",
      generatedAt: new Date().toISOString(),
    },
    sampleManifest,
    documents: results,
  };

  report.aggregateMetrics = buildAggregateMetrics(results, options);
  report.topFailureModes = buildTopFailureModes(results);
  report.topUsefulCases = buildTopUsefulCases(results, options.reviewCount);
  report.fixturePromotionCandidates = buildFixturePromotionCandidates(results, options.reviewCount);
  report.repeatInstabilityCases = buildRepeatInstabilityCases(results);
  report.recommendedNextTighteningStep = recommendNextTighteningStep(report);

  return report;
}

function writeOutputs(report, options) {
  mkdirSync(options.outputRoot, { recursive: true });
  const safeSeed = options.seed.replace(/[^a-z0-9_-]+/gi, "_");
  const jsonPath = path.join(options.outputRoot, `compiler-read-corpus-sample-${safeSeed}.json`);
  const markdownPath = path.join(options.outputRoot, `compiler-read-corpus-sample-${safeSeed}.md`);
  const reviewPath = path.join(options.outputRoot, `compiler-read-corpus-review-packet-${safeSeed}.md`);
  const manifestPath = path.join(options.outputRoot, `compiler-read-corpus-sample-${safeSeed}.manifest.json`);

  report.meta.manifestOutputPath = relativeWorkspacePath(manifestPath);

  const manifestArtifact = {
    version: 1,
    seed: report.meta.seed,
    packetVersion: report.meta.packetVersion,
    reviewerIdentityModel: report.meta.reviewerIdentityModel,
    manifestMode: report.meta.manifestMode,
    manifestSourcePath: report.meta.manifestSourcePath,
    roots: report.meta.roots,
    strictness: report.meta.strictness,
    minChars: report.meta.minChars,
    maxChars: report.meta.maxChars,
    generatedAt: report.meta.generatedAt,
    eligibleDocumentCount: report.sampleManifest.eligibleDocumentCount,
    eligibleCorpusHash: report.sampleManifest.eligibleCorpusHash,
    sampledDocuments: report.sampleManifest.sampledDocuments,
  };

  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync(markdownPath, `${formatMarkdownReport(report)}\n`, "utf8");
  writeFileSync(reviewPath, `${formatReviewPacket(report)}\n`, "utf8");
  writeFileSync(manifestPath, `${JSON.stringify(manifestArtifact, null, 2)}\n`, "utf8");

  return {
    jsonPath,
    markdownPath,
    reviewPath,
    manifestPath,
  };
}

export async function main(argv = process.argv.slice(2)) {
  loadEnvConfig(CWD);
  const options = parseArgs(argv);
  const report = await runBenchmark(options);
  const outputs = writeOutputs(report, options);

  console.log(
    JSON.stringify(
      {
        ok: true,
        seed: report.meta.seed,
        packetVersion: report.meta.packetVersion,
        reviewerIdentityModel: report.meta.reviewerIdentityModel,
        sampledDocumentCount: report.aggregateMetrics.sampledDocumentCount,
        meaningfulNextMoveSignalRate: report.aggregateMetrics.meaningfulNextMoveSignalRate,
        repeatInstabilityRate: report.aggregateMetrics.repeatInstabilityRate,
        classificationStabilityRate: report.aggregateMetrics.classificationStabilityRate,
        jsonPath: outputs.jsonPath,
        markdownPath: outputs.markdownPath,
        reviewPath: outputs.reviewPath,
        manifestPath: outputs.manifestPath,
        recommendedNextTighteningStep: report.recommendedNextTighteningStep,
      },
      null,
      2,
    ),
  );
}

const isDirectExecution =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

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
