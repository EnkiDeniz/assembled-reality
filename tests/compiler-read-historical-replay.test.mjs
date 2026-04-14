import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildLookAheadSummary,
  buildResolvedManifestArtifact,
  deriveReplayDocumentCategory,
  loadReplayManifestFile,
  loadReplaySource,
  runReplayEntry,
  selectReviewPacketEntries,
} from "../scripts/run-compiler-read-historical-replay.mjs";

const REPLAY_MANIFEST_PATH = path.join(
  process.cwd(),
  "docs",
  "benchmark-manifest-historical-replay-pilot-2026-04-13.json",
);

function buildCompilerRead({
  outcomeClass = "mixed",
  readDisposition = "needs_more_witness",
  primaryFinding = "A grounded subset exists but still needs stronger witness.",
  nextMoves = ["Add one quoted witness or external citation for the central protocol claim."],
  usefulnessSignalScore = null,
  groundingRejectedClaimCount = 0,
  limitationClass = null,
} = {}) {
  const compilerRead = {
    documentSummary: {
      title: "Replay fixture",
      documentType: "mixed",
      dominantMode: "mixed",
      summary: "Replay summary.",
    },
    claimSet: [
      {
        id: "claim_1",
        text: "Grounded claim.",
      },
    ],
    groundingRejectedClaimCount,
    groundingRejectedClaimIds: groundingRejectedClaimCount ? ["claim_rejected"] : [],
    rawDocumentResult: {
      compileState: "blocked",
      secondaryRuntimeTrusted: false,
    },
    translatedSubsetResult: {
      present: true,
      selectedClaimIds: ["claim_1"],
      omittedClaims: [],
      compileState: "clean",
    },
    embeddedExecutableResult: {
      present: false,
      compileState: "not_run",
    },
    limitationClass,
    outcomeClass,
    verdict: {
      overall: "lawful_subset_compiles",
      primaryFinding,
      readDisposition,
    },
    nextMoves,
  };

  if (typeof usefulnessSignalScore === "number") {
    compilerRead.nextMoves = nextMoves;
  }

  return compilerRead;
}

function makeReplayDocument({
  replayId,
  currentPath = `docs/${replayId}.md`,
  repeatStable = true,
  limitationClass = null,
  readDisposition = "needs_more_witness",
  outcomeClass = "mixed",
  usefulnessSignalScore = 2,
} = {}) {
  return {
    replayId,
    currentPath,
    eraLabel: "runtime",
    documentFamily: "fixture",
    runs: [
      {
        ok: true,
        runIndex: 0,
        compilerRead: {
          ...buildCompilerRead({
            limitationClass,
            readDisposition,
            outcomeClass,
          }),
          usefulnessSignalScore,
          trustCaveats: [],
          excerptGroundingPassed: limitationClass !== "excerpt_not_anchorable",
          omissionPartitionValid: true,
          secondaryRawRuntimeDownranked: true,
          meaningfulNextMoveSignalPresent: usefulnessSignalScore > 0,
        },
      },
    ],
    stability: {
      repeatStable,
      stableClassification: repeatStable,
      instabilityReasons: repeatStable ? [] : ["outcome_changed"],
      successfulRunCount: 1,
      errorRunCount: 0,
      uniqueRunSignatures: [repeatStable ? "ok:mixed:needs_more_witness" : "ok:mixed:needs_more_witness", "ok:raw_not_direct_source:informative_only"],
    },
    lookAheadSummary: {
      mode: "historical_commit",
      nextCommits: [],
      currentHeadExists: true,
      currentHeadPath: currentPath,
      renamedAtHead: null,
      pinExceptionReason: null,
    },
  };
}

test("historical replay manifest is frozen to exactly 9 entries and includes the explicit current-snapshot exception", () => {
  const manifest = loadReplayManifestFile(REPLAY_MANIFEST_PATH);

  assert.equal(manifest.replayEntries.length, 9);
  const currentSnapshotEntry = manifest.replayEntries.find((entry) => entry.sourceMode === "current_snapshot");
  assert.ok(currentSnapshotEntry);
  assert.equal(currentSnapshotEntry.currentPath, "docs/compiler-read-spec-2026-04-13.md");
  assert.match(currentSnapshotEntry.pinExceptionReason, /no reachable git introduction commit/i);
});

test("current-snapshot replay source hashes match the resolved manifest artifact", () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "historical-replay-"));
  try {
    const filePath = path.join(tempDir, "current-snapshot.md");
    const content = "# Snapshot\n\nCurrent working-tree content.\n";
    writeFileSync(filePath, content, "utf8");

    const entry = {
      replayId: "snapshot",
      currentPath: "current-snapshot.md",
      pathAtCommit: "current-snapshot.md",
      commitHash: null,
      eraLabel: "compiler_read",
      documentFamily: "fixture",
      sourceMode: "current_snapshot",
      pinExceptionReason: "Fixture exception.",
    };

    const loaded = loadReplaySource(entry, { cwd: tempDir });
    const artifact = buildResolvedManifestArtifact({
      meta: {
        replayName: "fixture",
        generatedAt: "2026-04-13T00:00:00.000Z",
        manifestSourcePath: "docs/replay.json",
        repeatCount: 1,
        strictness: "soft",
      },
      documents: [
        {
          replayId: entry.replayId,
          currentPath: entry.currentPath,
          pathAtCommit: entry.pathAtCommit,
          commitHash: entry.commitHash,
          eraLabel: entry.eraLabel,
          documentFamily: entry.documentFamily,
          sourceMode: entry.sourceMode,
          pinExceptionReason: entry.pinExceptionReason,
          sourceHash: loaded.sourceHash,
          sourceByteSize: loaded.byteSize,
          sourceCharCount: loaded.charCount,
          lookAheadSummary: {
            mode: "current_snapshot_only",
            nextCommits: [],
            currentHeadExists: false,
            currentHeadPath: null,
            renamedAtHead: null,
            pinExceptionReason: entry.pinExceptionReason,
          },
        },
      ],
    });

    assert.equal(artifact.replayEntries[0].loadedSourceHash, loaded.sourceHash);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("runReplayEntry keeps look-ahead unavailable until after the read completes", async () => {
  let lookAheadCalls = 0;

  const entry = {
    replayId: "read-first",
    currentPath: "docs/read-first.md",
    pathAtCommit: "docs/read-first.md",
    commitHash: "abc123",
    eraLabel: "runtime",
    documentFamily: "fixture",
    sourceMode: "git_commit",
    pinExceptionReason: null,
  };

  const result = await runReplayEntry(
    entry,
    { repeatCount: 1, strictness: "soft" },
    {
      loadSource() {
        return {
          sourceMode: "git_commit",
          absolutePath: null,
          sourcePath: entry.pathAtCommit,
          byteSize: 12,
          charCount: 12,
          text: "Fixture text",
          sourceHash: "fixture-hash",
          sourceLabel: "fixture-label",
        };
      },
      async compilerReadFn() {
        assert.equal(lookAheadCalls, 0);
        return buildCompilerRead();
      },
      loadLookAheadSummary() {
        lookAheadCalls += 1;
        return {
          mode: "historical_commit",
          nextCommits: [],
          currentHeadExists: true,
          currentHeadPath: entry.currentPath,
          renamedAtHead: null,
          pinExceptionReason: null,
        };
      },
    },
  );

  assert.equal(lookAheadCalls, 1);
  assert.equal(result.runs[0].ok, true);
  assert.equal(result.lookAheadSummary.mode, "historical_commit");
});

test("buildLookAheadSummary reports rename-following history and current HEAD absence honestly", () => {
  const renamedEntry = {
    replayId: "renamed",
    currentPath: "docs/new-name.md",
    pathAtCommit: "docs/old-name.md",
    commitHash: "c1",
    sourceMode: "git_commit",
  };

  const renamedSummary = buildLookAheadSummary(renamedEntry, {
    git: {
      listCommitsForPath() {
        return [
          { commitHash: "c3", committedAt: "2026-04-13T03:00:00.000Z", subject: "third" },
          { commitHash: "c2", committedAt: "2026-04-13T02:00:00.000Z", subject: "second" },
          { commitHash: "c1", committedAt: "2026-04-13T01:00:00.000Z", subject: "first" },
        ];
      },
      pathExistsAtHead() {
        return true;
      },
    },
  });

  assert.equal(renamedSummary.currentHeadExists, true);
  assert.equal(renamedSummary.currentHeadPath, "docs/new-name.md");
  assert.equal(renamedSummary.renamedAtHead, "docs/new-name.md");
  assert.deepEqual(
    renamedSummary.nextCommits.map((entry) => entry.commitHash),
    ["c2", "c3"],
  );

  const missingHeadSummary = buildLookAheadSummary(
    {
      replayId: "deleted",
      currentPath: "docs/missing.md",
      pathAtCommit: "docs/missing.md",
      commitHash: "c1",
      sourceMode: "git_commit",
    },
    {
      git: {
        listCommitsForPath() {
          return [{ commitHash: "c1", committedAt: "2026-04-13T01:00:00.000Z", subject: "first" }];
        },
        pathExistsAtHead() {
          return false;
        },
      },
    },
  );

  assert.equal(missingHeadSummary.currentHeadExists, false);
  assert.equal(missingHeadSummary.currentHeadPath, null);
});

test("replay categories distinguish clean, edge, and honest-limit documents", () => {
  const clean = makeReplayDocument({ replayId: "clean", repeatStable: true });
  const edge = makeReplayDocument({ replayId: "edge", repeatStable: false });
  const honestLimit = makeReplayDocument({
    replayId: "limit",
    repeatStable: true,
    limitationClass: "excerpt_not_anchorable",
    readDisposition: "informative_only",
    usefulnessSignalScore: 0,
  });

  assert.equal(deriveReplayDocumentCategory(clean), "clean");
  assert.equal(deriveReplayDocumentCategory(edge), "edge");
  assert.equal(deriveReplayDocumentCategory(honestLimit), "honest_limit");
});

test("review packet selection keeps the required clean, edge, and honest-limit mix", () => {
  const report = {
    documents: [
      makeReplayDocument({ replayId: "clean-a", usefulnessSignalScore: 3 }),
      makeReplayDocument({ replayId: "clean-b", usefulnessSignalScore: 2 }),
      makeReplayDocument({ replayId: "edge-a", repeatStable: false, usefulnessSignalScore: 2 }),
      makeReplayDocument({
        replayId: "limit-a",
        limitationClass: "excerpt_not_anchorable",
        readDisposition: "informative_only",
        usefulnessSignalScore: 0,
      }),
    ],
  };

  const packet = selectReviewPacketEntries(report);
  assert.equal(packet.length, 4);
  assert.deepEqual(
    packet.map((entry) => entry.category).sort(),
    ["clean", "clean", "edge", "honest_limit"].sort(),
  );
});
