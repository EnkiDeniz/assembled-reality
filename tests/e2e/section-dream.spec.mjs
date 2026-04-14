import { expect, test } from "@playwright/test";

test.setTimeout(180_000);

function parseClock(value = "") {
  const parts = String(value || "")
    .trim()
    .split(":")
    .map((entry) => Number.parseInt(entry, 10))
    .filter((entry) => Number.isFinite(entry));

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return 0;
}

async function bootstrapGuardian(page) {
  await page.goto("/api/auth/dev-guardian?action=bootstrap", { waitUntil: "commit" });
  await expect(page.locator("body")).toContainText('"ok":true');
}

function mediaMock() {
  const timers = new WeakMap();

  const clearTimer = (element) => {
    const timerId = timers.get(element);
    if (timerId) {
      clearInterval(timerId);
      timers.delete(element);
    }
  };

  const defineMediaProperty = (name, descriptor) => {
    try {
      Object.defineProperty(HTMLMediaElement.prototype, name, {
        configurable: true,
        ...descriptor,
      });
    } catch {}
  };

  defineMediaProperty("paused", {
    get() {
      return this.__mockPaused ?? true;
    },
  });

  defineMediaProperty("currentTime", {
    get() {
      return this.__mockCurrentTime ?? 0;
    },
    set(value) {
      this.__mockCurrentTime = Number(value) || 0;
    },
  });

  defineMediaProperty("duration", {
    get() {
      return this.__mockDuration ?? 12;
    },
  });

  Object.defineProperty(HTMLMediaElement.prototype, "load", {
    configurable: true,
    value() {
      this.__mockDuration = this.__mockDuration || 12;
      this.dispatchEvent(new Event("loadedmetadata"));
      this.dispatchEvent(new Event("canplay"));
    },
  });

  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    value() {
      this.__mockDuration = this.__mockDuration || 12;
      this.__mockPaused = false;
      this.dispatchEvent(new Event("loadedmetadata"));
      this.dispatchEvent(new Event("play"));
      clearTimer(this);

      const timerId = setInterval(() => {
        if (this.__mockPaused) {
          return;
        }

        this.__mockCurrentTime = Math.min((this.__mockCurrentTime || 0) + 0.5, this.__mockDuration);
        this.dispatchEvent(new Event("timeupdate"));

        if (this.__mockCurrentTime >= this.__mockDuration) {
          clearTimer(this);
          this.__mockPaused = true;
          this.dispatchEvent(new Event("ended"));
        }
      }, 50);

      timers.set(this, timerId);
      return Promise.resolve();
    },
  });

  Object.defineProperty(HTMLMediaElement.prototype, "pause", {
    configurable: true,
    value() {
      if (this.__mockPaused) {
        return;
      }

      this.__mockPaused = true;
      clearTimer(this);
      this.dispatchEvent(new Event("pause"));
    },
  });
}

async function installMediaMock(page) {
  await page.addInitScript(mediaMock);
  await page.evaluate(mediaMock);
}

async function mockDreamAudio(page) {
  await page.route("**/api/seven/audio", async (route) => {
    const payload = route.request().postDataJSON();

    await route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "X-Seven-Provider": "elevenlabs",
        "X-Seven-Voice-Id": payload?.voiceId || "section-dream",
      },
      body: "FAKEAUDIO",
    });
  });
}

async function mockCompilerRead(page) {
  await page.route("**/api/compiler-read", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        compilerRead: {
          documentSummary: {
            title: "field-notes.md",
            documentType: "protocol",
            dominantMode: "proposal",
            summary: "The document contains one operational subset worth pressure-testing.",
          },
          claimSet: [
            {
              id: "claim_protocol",
              text: "Pull one trace before changing the flow.",
              claimKind: "protocol",
              translationReadiness: "candidate_for_translation",
              provenanceClass: "self_reported",
              supportStatus: "weakly_supported",
              evidenceRefs: ["field-notes"],
              reason: "This is the smallest protocol step the document names.",
              sourceExcerpt: "Pull one trace before changing the flow.",
            },
            {
              id: "claim_phi",
              text: "The flow should feel hospitable to doubt.",
              claimKind: "philosophy",
              translationReadiness: "non_compilable_philosophy",
              provenanceClass: "unknown",
              supportStatus: "unsupported",
              evidenceRefs: [],
              reason: "This belongs outside the v0 translated subset.",
              sourceExcerpt: "The flow should feel hospitable to doubt.",
            },
          ],
          rawDocumentResult: {
            executed: true,
            compileState: "blocked",
            runtimeState: "closed",
            closureType: "closed",
            mergedWindowState: "shape_error",
            diagnostics: [
              {
                code: "SH007",
                severity: "error",
                message: "Closure attempt requires provenance-bearing return on the active path.",
                line: 1,
              },
            ],
            secondaryRuntimeTrusted: false,
          },
          translatedSubsetResult: {
            present: true,
            source: 'GND box @field_notes\nDIR aim "Pull one trace before changing the flow."\nMOV move "Pull one trace before changing the flow." via manual\nTST test "A concrete witness can confirm or falsify this protocol step."',
            translationStrategy: "Carried one protocol line and one move/test pair from the provisional claim set.",
            omittedClaims: ["claim_phi"],
            selectedClaimIds: ["claim_protocol"],
            executed: true,
            compileState: "clean",
            runtimeState: "awaiting",
            closureType: null,
            mergedWindowState: "awaiting",
            diagnostics: [],
          },
          embeddedExecutableResult: {
            present: true,
            source:
              'GND box @field_notes\nDIR aim "Reroute only after a witness arrives."\nMOV move "Request the trace." via manual\nTST test "The trace shows whether the current flow is still viable."\nRTN witness "Trace confirms the blocker."\nCLS reroute "Shift to the trace-supported path."',
            detectionMethod: "fenced_loe",
            executed: true,
            compileState: "clean",
            runtimeState: "closed",
            closureType: "reroute",
            mergedWindowState: "rerouted",
            diagnostics: [],
          },
          limitationClass: null,
          outcomeClass: "mixed",
          verdict: {
            overall: "lawful_subset_compiles",
            primaryFinding: "The language can hold part of this document, but the central protocol still needs stronger witness.",
            readDisposition: "needs_more_witness",
          },
          nextMoves: [
            "Add one quoted witness or external citation for the central protocol claim.",
            "Keep the operational subset, then rerun Compiler Read.",
          ],
        },
      }),
    });
  });
}

async function mockReplayReview(page) {
  const currentPayload = {
    ok: true,
    reviewKey: "packet-a__packet-b",
    packetA: {
      packetId: "present:artifact",
      packetKind: "present_day_packet",
      title: "Packet A: Frozen present-day benchmark",
      generatedAt: "2026-04-14T02:40:08.960Z",
      sourceArtifactPath:
        "output/compiler-read-benchmarks/compiler-read-corpus-sample-first-reviewed-round-hand-frozen-2026-04-13.json",
      manifestSourcePath: "docs/benchmark-manifest-first-reviewed-round-2026-04-13.json",
      summaryMetrics: {
        meaningfulNextMoveSignalRate: 0.75,
        repeatStabilityRate: 0.75,
        classificationStabilityRate: 0.75,
        noFakeCompileRate: 1,
      },
      recommendation: "Hold the line on honesty while usefulness gets sharper.",
      trustCaveats: [
        "Meaningful next-move rate is still a heuristic pre-review signal, not proof of usefulness.",
      ],
      entries: [
        {
          entryId: "docs/seven-operate-receipt-contract.md",
          packetKind: "present_day_packet",
          label: "seven-operate-receipt-contract.md",
          sourcePath: "docs/seven-operate-receipt-contract.md",
          category: "clean",
          outcomeClass: "mixed",
          readDisposition: "needs_more_witness",
          primaryFinding: "The language can hold part of this document, but the central protocol still needs stronger witness.",
          nextMoves: [
            "Add one quoted witness or external citation for the central protocol claim.",
          ],
          repeatStability: {
            repeatStable: true,
            summary: "stable across repeats",
            instabilityReasons: [],
          },
          repeatDrift: {
            isDrifting: false,
            changedFields: [],
            runA: null,
            runB: null,
          },
          groundingRejectedClaimCount: 0,
          lookAheadSummary: null,
          currentSnapshotException: null,
          detailArtifactRefs: {
            packetJsonPath:
              "output/compiler-read-benchmarks/compiler-read-corpus-sample-first-reviewed-round-hand-frozen-2026-04-13.json",
            packetMarkdownPath:
              "output/compiler-read-benchmarks/compiler-read-corpus-sample-first-reviewed-round-hand-frozen-2026-04-13.md",
            reviewPacketPath:
              "output/compiler-read-benchmarks/compiler-read-corpus-review-packet-first-reviewed-round-hand-frozen-2026-04-13.md",
            manifestPath:
              "output/compiler-read-benchmarks/compiler-read-corpus-sample-first-reviewed-round-hand-frozen-2026-04-13.manifest.json",
          },
          sourceTags: ["top useful case"],
          promotionReasons: ["High-signal useful case worth promoting later."],
          preReviewUsefulnessSignal: 3,
        },
      ],
    },
    packetB: {
      packetId: "historical:artifact",
      packetKind: "historical_replay_packet",
      title: "Packet B: Replay Pilot 0",
      generatedAt: "2026-04-14T02:44:04.622Z",
      sourceArtifactPath:
        "output/compiler-read-benchmarks/compiler-read-historical-replay-pilot-2026-04-13.json",
      manifestSourcePath: "docs/benchmark-manifest-historical-replay-pilot-2026-04-13.json",
      summaryMetrics: {
        stableUsefulRate: 0.7778,
        repeatStabilityRate: 0.7778,
        classificationStabilityRate: 0.7778,
        groundingPassRate: 0.4444,
      },
      recommendation: "pilot useful but full dossier not justified yet",
      trustCaveats: ["This replay packet still includes an explicit current-snapshot exception."],
      entries: [
        {
          entryId: "pivot-foundation",
          packetKind: "historical_replay_packet",
          label: "pivot-foundation",
          sourcePath: "docs/ide-pivot-reset-foundation-2026-04-09.md",
          category: "edge",
          outcomeClass: "mixed",
          readDisposition: "needs_more_witness",
          primaryFinding: "The language can hold part of this document, but the central protocol still needs stronger witness.",
          nextMoves: ["Keep the operational subset, then rerun Compiler Read."],
          repeatStability: {
            repeatStable: false,
            summary: "unstable across repeats (outcome_changed, disposition_changed)",
            instabilityReasons: ["outcome_changed", "disposition_changed"],
          },
          repeatDrift: {
            isDrifting: true,
            changedFields: ["outcomeClass", "readDisposition"],
            runA: {
              ok: true,
              runIndex: 0,
              compilerRead: {
                outcomeClass: "mixed",
                verdict: { readDisposition: "needs_more_witness" },
              },
            },
            runB: {
              ok: true,
              runIndex: 1,
              compilerRead: {
                outcomeClass: "raw_not_direct_source",
                verdict: { readDisposition: "informative_only" },
              },
            },
          },
          groundingRejectedClaimCount: 1,
          lookAheadSummary: {
            mode: "historical_commit",
            currentHeadExists: true,
            currentHeadPath: "docs/ide-pivot-reset-foundation-2026-04-09.md",
            nextCommits: [],
          },
          currentSnapshotException: null,
          detailArtifactRefs: {
            packetJsonPath:
              "output/compiler-read-benchmarks/compiler-read-historical-replay-pilot-2026-04-13.json",
            packetMarkdownPath:
              "output/compiler-read-benchmarks/compiler-read-historical-replay-pilot-2026-04-13.md",
            reviewPacketPath:
              "output/compiler-read-benchmarks/compiler-read-historical-replay-review-packet-2026-04-13.md",
            manifestPath:
              "output/compiler-read-benchmarks/compiler-read-historical-replay-pilot-2026-04-13.manifest.json",
          },
          trustCaveats: ["Repeat drift is visible and should be treated as honest uncertainty."],
          eraLabel: "pivot",
          documentFamily: "foundation",
        },
        {
          entryId: "origin-evolution-feedback",
          packetKind: "historical_replay_packet",
          label: "origin-evolution-feedback",
          sourcePath:
            "docs/LoegosSeed/# Lœgos — Origin, Evolution, Feedback, and Receipt/# Lœgos — Origin, Evolution, Feedback, and Receipt.md",
          category: "honest_limit",
          outcomeClass: "raw_not_direct_source",
          readDisposition: "informative_only",
          primaryFinding: "The document is not direct source, so the structural read stays open at the interpretation boundary.",
          nextMoves: ["Read the translated subset or embedded executable layer before deciding what this document can carry."],
          repeatStability: {
            repeatStable: true,
            summary: "stable across repeats",
            instabilityReasons: [],
          },
          repeatDrift: {
            isDrifting: false,
            changedFields: [],
            runA: null,
            runB: null,
          },
          groundingRejectedClaimCount: 2,
          lookAheadSummary: {
            mode: "historical_commit",
            currentHeadExists: true,
            currentHeadPath:
              "docs/LoegosSeed/# Lœgos — Origin, Evolution, Feedback, and Receipt/# Lœgos — Origin, Evolution, Feedback, and Receipt.md",
            nextCommits: [{ commitHash: "15e113d", subject: "Consolidate Loegos seed docs and tighten v1 workbench spec" }],
          },
          currentSnapshotException: null,
          detailArtifactRefs: {
            packetJsonPath:
              "output/compiler-read-benchmarks/compiler-read-historical-replay-pilot-2026-04-13.json",
            packetMarkdownPath:
              "output/compiler-read-benchmarks/compiler-read-historical-replay-pilot-2026-04-13.md",
            reviewPacketPath:
              "output/compiler-read-benchmarks/compiler-read-historical-replay-review-packet-2026-04-13.md",
            manifestPath:
              "output/compiler-read-benchmarks/compiler-read-historical-replay-pilot-2026-04-13.manifest.json",
          },
          trustCaveats: ["The read stayed open at an honest limit."],
          eraLabel: "informative_limit",
          documentFamily: "origin",
        },
        {
          entryId: "compiler-read-spec-current-snapshot",
          packetKind: "historical_replay_packet",
          label: "compiler-read-spec-current-snapshot",
          sourcePath: "docs/compiler-read-spec-2026-04-13.md",
          category: "clean",
          outcomeClass: "mixed",
          readDisposition: "needs_more_witness",
          primaryFinding: "The language can hold part of this document, but the central protocol still needs stronger witness.",
          nextMoves: ["Add one quoted witness or external citation for the central protocol claim."],
          repeatStability: {
            repeatStable: true,
            summary: "stable across repeats",
            instabilityReasons: [],
          },
          repeatDrift: {
            isDrifting: false,
            changedFields: [],
            runA: null,
            runB: null,
          },
          groundingRejectedClaimCount: 0,
          lookAheadSummary: {
            mode: "current_snapshot_only",
            currentHeadExists: false,
            currentHeadPath: null,
            nextCommits: [],
            pinExceptionReason: "This document exists in the working tree but has no reachable git introduction commit in this worktree.",
          },
          currentSnapshotException: {
            reason: "This document exists in the working tree but has no reachable git introduction commit in this worktree.",
            mode: "current_snapshot",
          },
          detailArtifactRefs: {
            packetJsonPath:
              "output/compiler-read-benchmarks/compiler-read-historical-replay-pilot-2026-04-13.json",
            packetMarkdownPath:
              "output/compiler-read-benchmarks/compiler-read-historical-replay-pilot-2026-04-13.md",
            reviewPacketPath:
              "output/compiler-read-benchmarks/compiler-read-historical-replay-review-packet-2026-04-13.md",
            manifestPath:
              "output/compiler-read-benchmarks/compiler-read-historical-replay-pilot-2026-04-13.manifest.json",
          },
          trustCaveats: ["This entry is a current-snapshot exception."],
          eraLabel: "compiler_read",
          documentFamily: "spec",
        },
      ],
      currentSnapshotExceptions: [
        {
          replayId: "compiler-read-spec-current-snapshot",
          sourcePath: "docs/compiler-read-spec-2026-04-13.md",
          reason: "This document exists in the working tree but has no reachable git introduction commit in this worktree.",
        },
      ],
    },
    session: {
      id: "review_session_1",
      status: "in_progress",
      overallDecision: "",
      overallSummary: "",
      entries: [
        {
          id: "entry_saved",
          sessionId: "review_session_1",
          packetKind: "present_day_packet",
          entryId: "docs/seven-operate-receipt-contract.md",
          honestyScore: 3,
          understandabilityScore: 2,
          specificityScore: 2,
          actionabilityScore: 2,
          convergenceValueScore: 3,
          wouldUseAgainScore: 2,
          laterHistoryJudgment: null,
          moveWouldTakeNow: "Pull one trace before changing the flow.",
          driftAssessment: null,
          notes: "Strong and usable.",
        },
      ],
    },
  };

  await page.route("**/api/replay-review/current", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(currentPayload),
    });
  });

  await page.route("**/api/replay-review/session", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(currentPayload),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        session: {
          ...currentPayload.session,
          status: route.request().postDataJSON()?.status || "in_progress",
          overallDecision: route.request().postDataJSON()?.overallDecision || "",
          overallSummary: route.request().postDataJSON()?.overallSummary || "",
        },
      }),
    });
  });

  await page.route("**/api/replay-review/entry", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        entry: route.request().postDataJSON(),
      }),
    });
  });
}

test("dream library uploads markdown, plays, pauses, and restores the last position", async ({
  page,
}) => {
  await bootstrapGuardian(page);

  await page.goto("/dream", { waitUntil: "commit" });
  await installMediaMock(page);
  await mockDreamAudio(page);
  await expect(page.getByTestId("dream-screen")).toBeVisible();

  await page.getByTestId("dream-upload-input").setInputFiles({
    name: "field-notes.md",
    mimeType: "text/markdown",
    buffer: Buffer.from(
      "# Opening\n\nThis is the first paragraph for Dream Library.\n\nThis is the second paragraph so the player has enough text to continue.",
    ),
  });

  await expect(page.getByTestId("dream-player")).toContainText("field-notes.md");
  await expect(page.getByTestId("dream-play-toggle")).toHaveAttribute("aria-label", "Pause playback");
  await expect
    .poll(async () => parseClock(await page.getByTestId("dream-current-time").textContent()))
    .toBeGreaterThan(0);

  await page.getByTestId("dream-play-toggle").click();
  await expect(page.getByTestId("dream-play-toggle")).toHaveAttribute("aria-label", "Continue playback");

  const pausedAt = parseClock(await page.getByTestId("dream-current-time").textContent());
  expect(pausedAt).toBeGreaterThan(0);

  await page.reload({ waitUntil: "commit" });

  await expect(page.getByTestId("dream-player")).toContainText("field-notes.md");
  await expect
    .poll(async () => parseClock(await page.getByTestId("dream-current-time").textContent()))
    .toBeGreaterThan(0);

  await page.getByTestId("dream-play-toggle").click();
  await expect(page.getByTestId("dream-play-toggle")).toHaveAttribute("aria-label", "Pause playback");
  await expect
    .poll(async () => parseClock(await page.getByTestId("dream-current-time").textContent()))
    .toBeGreaterThan(pausedAt);
});

test("section dream is reachable from signed-in menus and remains usable on mobile", async ({
  page,
}) => {
  await bootstrapGuardian(page);
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/account", { waitUntil: "commit" });
  await page.getByTestId("shell-mode-dream").click();
  await expect(page.getByTestId("dream-screen")).toBeVisible();
  await expect(page.getByTestId("dream-player")).toBeVisible();

  await page.goto("/workspace", { waitUntil: "commit" });
  await expect(page.getByTestId("shell-mode-dream")).toBeVisible();
  await page.getByTestId("shell-mode-dream").click();
  await expect(page.getByTestId("dream-screen")).toBeVisible();
});

test("dream runs compiler read inline and clears it on refresh", async ({ page }) => {
  await bootstrapGuardian(page);
  await installMediaMock(page);
  await mockDreamAudio(page);
  await mockCompilerRead(page);

  await page.goto("/dream", { waitUntil: "commit" });
  await expect(page.getByTestId("dream-screen")).toBeVisible();

  await page.getByTestId("dream-upload-input").setInputFiles({
    name: "field-notes.md",
    mimeType: "text/markdown",
    buffer: Buffer.from(
      "# Field Notes\n\nPull one trace before changing the flow.\n\nThe flow should feel hospitable to doubt.",
    ),
  });

  await page.getByTestId("dream-compiler-read").click();
  await expect(page.getByTestId("dream-compiler-read-panel")).toBeVisible();
  await expect(page.getByTestId("dream-compiler-read-admission")).toContainText("Not direct source");
  await expect(page.getByTestId("dream-compiler-read-admission")).toContainText("Blocked");
  await expect(page.getByTestId("dream-compiler-read-interpretation")).toContainText(
    "The language can hold part of this document",
  );
  await expect(page.getByTestId("dream-compiler-read-embedded")).toContainText("Direct program found");
  await expect(page.getByTestId("dream-compiler-read-claims")).toContainText(
    "Seven-assisted extraction remains provisional",
  );
  await expect(page.getByTestId("dream-compiler-read-omitted")).toContainText(
    "The flow should feel hospitable to doubt.",
  );
  await expect(page.getByTestId("dream-compiler-read-diagnostics")).toContainText("SH007");
  await expect(page.getByTestId("dream-compiler-read-next-moves")).toContainText(
    "Add one quoted witness or external citation",
  );

  await page.getByTestId("dream-compiler-read-inspect").click();
  await expect(page.getByTestId("dream-compiler-read-inspect")).toContainText("GND box @field_notes");
  await expect(page.getByTestId("dream-compiler-read-inspect")).toContainText(
    "Secondary runtime trusted: No",
  );

  await page.getByTestId("dream-paste-toggle").click();
  await page.getByTestId("dream-paste-input").fill("# New draft\n\nThis is not saved yet.");
  await expect(page.getByTestId("dream-compiler-read")).toBeDisabled();
  await expect(page.getByTestId("dream-compiler-read-disabled-reason")).toContainText(
    "Update pasted markdown first.",
  );
  await expect(page.getByTestId("dream-compiler-read-panel")).toHaveCount(0);

  await page.reload({ waitUntil: "commit" });
  await expect(page.getByTestId("dream-player")).toContainText("field-notes.md");
  await expect(page.getByTestId("dream-compiler-read-panel")).toHaveCount(0);
});

test("dream opens replay review inline and surfaces clean, edge, and honest-limit packets", async ({
  page,
}) => {
  await bootstrapGuardian(page);
  await mockReplayReview(page);

  await page.goto("/dream", { waitUntil: "commit" });
  await expect(page.getByTestId("dream-screen")).toBeVisible();

  await page.getByTestId("dream-replay-review").click();
  await expect(page.getByTestId("dream-replay-review-panel")).toBeVisible();
  await expect(page.getByTestId("dream-replay-review-entry-title")).toContainText(
    "seven-operate-receipt-contract.md",
  );
  await expect(page.getByTestId("dream-replay-review-save-status")).toContainText("Autosave");

  await page.getByTestId("dream-replay-review-packet-historical_replay_packet").click();
  await expect(page.getByTestId("dream-replay-review-entry-title")).toContainText(
    "pivot-foundation",
  );
  await expect(page.getByTestId("dream-replay-review-panel")).toContainText("Changed fields");

  await page.getByRole("button", { name: "origin-evolution-feedback" }).click();
  await expect(page.getByTestId("dream-replay-review-honest-limit")).toContainText(
    "restraint, not failure",
  );

  await page.getByRole("button", { name: "compiler-read-spec-current-snapshot" }).click();
  await expect(page.getByTestId("dream-replay-review-snapshot-exception")).toContainText(
    "Current-snapshot exception",
  );

  await page.getByTestId("dream-replay-review-context-toggle").click();
  await expect(page.getByTestId("dream-replay-review-context")).toContainText(
    "Next commits: none recorded in this replay summary.",
  );
});
