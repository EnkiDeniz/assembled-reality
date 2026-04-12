import assert from "node:assert/strict";
import test from "node:test";

import {
  DRIVE_TAPE_LANE_ORDER,
  buildDriveTapeReplay,
  buildWorkingEchoSourceClassification,
} from "./helpers/build-drive-tape.mjs";
import { buildSchemaBoardSurface } from "./helpers/build-schema-board-surface.mjs";
import {
  buildBlindfoldedSurfacedState,
  extractCurrentSurfacedRoomState,
} from "./helpers/extract-surfaced-room-state.mjs";
import {
  TEST_DRIVE_II_MASTER_REPORT_PATH,
  buildTestDriveIiReport,
  buildTestDriveIiVerdict,
} from "./helpers/run-test-drive-ii-benchmark.mjs";
import { scoreWorkingEchoSecondTurn } from "./helpers/score-working-echo-second-turn.mjs";
import {
  WORKING_ECHO_SCENARIOS,
  getWorkingEchoScenarioById,
} from "./fixtures/room-benchmarks/working-echo/index.mjs";

test("current surface extractor keeps only visible room fields", () => {
  const surface = extractCurrentSurfacedRoomState({
    assistantText: "We should compare the verifier timestamps before blaming one cause.",
    view: {
      activePreview: {
        assistantText: "Preview thinks the clock skew matters.",
        sections: { hidden: "do not surface" },
        gate: { hidden: true },
      },
      messages: [
        {
          role: "assistant",
          content: "We should compare the verifier timestamps before blaming one cause.",
          previewStatus: "active",
          roomPayload: {
            segments: [
              {
                text: "Clock skew may matter here.",
                mirrorRegion: "evidence",
                suggestedClause: "HIDDEN CLAUSE",
                intent: "observe",
              },
            ],
          },
        },
      ],
      focusedWitness: {
        title: "Replay A",
        excerptBlocks: [{ kind: "paragraph", text: "Device clock is 47 minutes ahead." }],
      },
      workingEcho: {
        id: "we_1",
        turnId: "assistant_turn",
        status: "forming",
        aim: {
          text: "Find the real blocker before shipping a fix.",
          sourceRefs: ["segment:aim"],
        },
        evidenceCarried: [
          {
            id: "E2",
            title: "Replay A",
            detail: "Device clock is 47 minutes ahead.",
            sourceRefs: ["source:replay_a"],
          },
        ],
        evidenceBuckets: {
          supports: [
            {
              id: "E2",
              title: "Replay A",
              detail: "Device clock is 47 minutes ahead.",
              sourceRefs: ["source:replay_a"],
            },
          ],
          weakens: [
            {
              id: "E5",
              title: "Internal Ops Claim",
              detail: "Permission popup blame is unsupported.",
              sourceRefs: ["source:e5"],
            },
          ],
          missing: [
            {
              id: "missing_verifier_timestamps",
              title: "Missing witness",
              detail: "Verifier timestamps for the affected sessions.",
              sourceRefs: ["segment:move"],
            },
          ],
        },
        openTension: [
          {
            text: "The popup explanation is unsupported.",
            kind: "contradiction",
            sourceRefs: ["segment:story"],
          },
        ],
        whatWouldDecideIt: {
          text: "Compare verifier timestamps against client clock skew.",
          kind: "timeline",
          sourceRefs: ["segment:move"],
        },
        candidateMove: null,
        uncertainty: {
          label: "mixed_signal",
          detail: "",
        },
        returnDelta: {
          summary: "A prior return changed the read.",
          changedRead: [{ text: "Timeouts improved, but completion stayed flat.", sourceRefs: ["source:e2"] }],
          weakenedRead: [{ text: "That weakens the idea that the SMS fix solved it.", sourceRefs: ["source:e2"] }],
          nextMoveShift: { text: "Inspect AVS logs next.", sourceRefs: ["segment:move"] },
        },
      },
      hasStructure: true,
      mirror: {
        aim: { text: "Find the real blocker before shipping a fix." },
        evidence: [{ title: "E2", detail: "Clock skew and expired link." }],
        story: [{ text: "Replay B diverges later", detail: "Billing mismatch after verification." }],
        moves: [{ text: "Compare timestamps", detail: "Verifier vs client time", status: "candidate" }],
        returns: [{ label: "Return", actual: "none", result: "awaiting" }],
      },
      fieldState: { label: "Awaiting echo" },
    },
  });

  assert.deepEqual(Object.keys(surface).sort(), [
    "assistantAnswer",
    "fieldStateLabel",
    "mirrorSurface",
    "mode",
    "previewSurface",
    "surfaceKind",
    "witnessSurface",
    "workingEchoSurface",
  ]);
  assert.equal(surface.workingEchoSurface.status, "forming");
  assert.match(surface.workingEchoSurface.whatWouldDecideIt.text, /timestamps/i);
  assert.equal(surface.workingEchoSurface.evidenceBuckets.supports[0].id, "E2");
  assert.match(surface.workingEchoSurface.returnDelta.summary, /changed the read/i);
  assert.equal(surface.previewSurface.previewStatusLabel, "Preview");
  assert.equal(surface.previewSurface.visibleSegments[0].text, "Clock skew may matter here.");
  assert.equal(surface.previewSurface.visibleSegments[0].suggestedClauseVisible, false);
  assert.ok(!("suggestedClause" in surface.previewSurface.visibleSegments[0]));
  assert.ok(!JSON.stringify(surface).includes("HIDDEN CLAUSE"));
  assert.ok(!JSON.stringify(surface).includes("\"gate\""));
  assert.ok(!JSON.stringify(surface).includes("\"sections\""));
});

test("blindfolded surface keeps the same answer but hides the working surface", () => {
  const surface = extractCurrentSurfacedRoomState({
    assistantText: "Let’s inspect the AVS logs before we revert the CTA copy.",
    view: {
      activePreview: { assistantText: "AVS looks more likely than copy." },
      messages: [],
      hasStructure: false,
      fieldState: { label: "Fog" },
    },
  });

  const blindfolded = buildBlindfoldedSurfacedState(surface);

  assert.equal(blindfolded.assistantAnswer.text, surface.assistantAnswer.text);
  assert.equal(blindfolded.workingEchoSurface, null);
  assert.equal(blindfolded.previewSurface, null);
  assert.equal(blindfolded.mirrorSurface, null);
  assert.equal(blindfolded.witnessSurface, null);
  assert.equal(blindfolded.fieldStateLabel, "");
});

test("schema board control stays generic and excludes Loegos-only hidden state", () => {
  const surface = buildSchemaBoardSurface({
    assistantText: "The copy theory looks weak; AVS is more likely.",
    board: {
      tentativeAim: "Stay tentative and inspect the post-SMS handoff.",
      evidenceNotes: [{ label: "E3", note: "Trace B fails on AVS after SMS succeeds." }],
      openTensions: ["SMS improved but completion stayed flat."],
      candidateMoves: ["Inspect AVS logs for foreign-card travelers."],
      uncertaintyState: "Unresolved",
    },
    degraded: true,
  });

  const serialized = JSON.stringify(surface).toLowerCase();
  assert.equal(surface.surfaceKind, "schema_board");
  assert.equal(surface.degraded, true);
  assert.equal(surface.previewSurface.previewStatusLabel, "Board (degraded)");
  assert.match(surface.workingEchoSurface.whatWouldDecideIt.text, /Inspect AVS logs/i);
  assert.deepEqual(surface.workingEchoSurface.evidenceBuckets.weakens, []);
  assert.equal(surface.workingEchoSurface.returnDelta, null);
  assert.ok(serialized.includes("board"));
  assert.ok(!serialized.includes("activepreview"));
  assert.ok(!serialized.includes("roompayload"));
  assert.ok(!serialized.includes("receiptkit"));
  assert.ok(!serialized.includes("runtimewindow"));
  assert.ok(!serialized.includes("\"gate\""));
});

test("drive tape replay stays purely derived and makes the target scenarios legible", () => {
  const scenarios = [
    {
      scenarioId: "contradictory_return_journey",
      surfacedState: {
        assistantAnswer: { text: "CTA copy looks weak; compare the post-SMS failures instead." },
        previewSurface: {
          visible: true,
          bannerSummary: "Preview points at post-SMS AVS failure.",
          visibleSegments: [{ mirrorRegion: "moves", text: "Compare AVS mismatches against CTA exposure." }],
        },
        workingEchoSurface: {
          status: "contested",
          aim: "Find what still fails after the SMS fix.",
          aimRefs: ["mirror:aim"],
          evidenceBuckets: {
            supports: [
              {
                id: "E3",
                title: "E3 Replay B",
                detail: "User passes SMS, then fails on AVS mismatch.",
                sourceRefs: ["source:E3"],
              },
            ],
            weakens: [
              {
                id: "E4",
                title: "E4 Support Claim",
                detail: "CTA blame has no cohort evidence.",
                sourceRefs: ["source:E4"],
              },
            ],
            missing: [
              {
                id: "missing_post_sms_handoff",
                title: "Missing witness",
                detail: "Post-SMS handoff or AVS logs for the failing cohort.",
                sourceRefs: ["segment:seg_move"],
              },
            ],
          },
          openTension: [{ text: "SMS improved but completion stayed flat.", kind: "contradiction", sourceRefs: ["source:E2"] }],
          whatWouldDecideIt: {
            text: "Which post-SMS split decides it: AVS mismatch in foreign-card travelers, or CTA exposure that only looks correlated?",
            sourceRefs: ["segment:seg_move"],
          },
          candidateMove: null,
          uncertainty: {
            label: "return_shift",
            detail:
              "A return changed the read. Reroute around this split: Which post-SMS split decides it: AVS mismatch in foreign-card travelers, or CTA exposure that only looks correlated?",
          },
          returnDelta: {
            summary:
              "Return bent the read: Timeouts improved, but the affected cohort still fails later on AVS mismatch.",
            changedRead: [{ text: "Timeouts improved after the SMS fix.", sourceRefs: ["source:E2"] }],
            weakenedRead: [{ text: "That weakens the CTA-copy explanation.", sourceRefs: ["source:E4"] }],
            nextMoveShift: { text: "Inspect post-SMS handoff and AVS logs next.", sourceRefs: ["segment:seg_move", "source:E3"] },
          },
        },
        mirrorSurface: {
          aim: "Find what still fails after the SMS fix.",
          evidence: [{ title: "E1", detail: "Traveler failures cluster after payment submit." }],
          story: [{ text: "CTA blame stays unproven.", detail: "" }],
          moves: [{ text: "Inspect AVS logs", detail: "Foreign-card traveler cohort", status: "candidate" }],
          returns: [{ label: "Return", actual: "SMS fix helped timeouts only", result: "contradicted" }],
        },
        fieldStateLabel: "Open",
      },
      check(replay) {
        const returned = replay.lanes.find((lane) => lane.lane === "returned");
        assert.ok(returned.events.some((event) => /Return bent the read/i.test(event.text)));
        assert.equal(replay.replayRead.returnBendVisible, true);
      },
    },
    {
      scenarioId: "working_echo_correction",
      surfacedState: {
        assistantAnswer: { text: "Copy might be the story, but domain verification looks more real." },
        previewSurface: {
          visible: true,
          bannerSummary: "Preview favors the domain-verification checkpoint.",
          visibleSegments: [{ mirrorRegion: "story", text: "Older copy still fails at the same checkpoint." }],
        },
        workingEchoSurface: {
          status: "contested",
          aim: "Find why team setup still fails at teammate invite.",
          aimRefs: ["segment:seg_aim"],
          evidenceBuckets: {
            supports: [
              {
                id: "E5",
                title: "E5 Ops Log Excerpt",
                detail: "Domain-verification retries spike for quarantined company domains.",
                sourceRefs: ["source:E5"],
              },
            ],
            weakens: [
              {
                id: "E4",
                title: "E4 Replay B",
                detail: "Older copy still fails at domain verification.",
                sourceRefs: ["source:E4"],
              },
            ],
            missing: [
              {
                id: "missing_domain_logs",
                title: "Missing witness",
                detail: "Domain-verification logs segmented by quarantined company domains.",
                sourceRefs: ["segment:seg_move"],
              },
            ],
          },
          openTension: [{ text: "The explainer-copy explanation is unsupported.", kind: "contradiction", sourceRefs: ["source:E3"] }],
          whatWouldDecideIt: {
            text: "Does the failure track copy exposure, or domain-verification errors in quarantined company domains?",
            sourceRefs: ["segment:seg_move"],
          },
          candidateMove: null,
          uncertainty: {
            label: "mixed_signal",
            detail:
              "Still open because the explainer-copy explanation is unsupported. Domain-verification logs segmented by quarantined company domains would decide it.",
          },
          returnDelta: null,
        },
        mirrorSurface: null,
        fieldStateLabel: "Open",
      },
      check(replay) {
        const surfacedEcho = replay.lanes.find((lane) => lane.lane === "surfaced echo");
        assert.ok(surfacedEcho.events.some((event) => /Older copy still fails/i.test(event.text)));
        assert.ok(surfacedEcho.events.some((event) => /domain-verification logs/i.test(event.text)));
      },
    },
    {
      scenarioId: "no_move_yet",
      surfacedState: {
        assistantAnswer: { text: "Pricing blame looks premature; we still need the missing witness." },
        previewSurface: {
          visible: true,
          bannerSummary: "Preview stays open and asks for the failed-step witness.",
          visibleSegments: [{ mirrorRegion: "moves", text: "Get one step-level replay before changing pricing." }],
        },
        workingEchoSurface: {
          status: "forming",
          aim: "Find which step actually loses enterprise trials before changing pricing.",
          aimRefs: ["mirror:aim"],
          evidenceBuckets: {
            supports: [
              {
                id: "E2",
                title: "E2 Sales Call Note",
                detail: "One buyer stalls at legal review before pricing comes up.",
                sourceRefs: ["source:E2"],
              },
            ],
            weakens: [
              {
                id: "E1",
                title: "E1 Sparse Funnel Snapshot",
                detail: "The funnel snapshot does not break the failures down by step.",
                sourceRefs: ["source:E1"],
              },
            ],
            missing: [
              {
                id: "missing_step_breakdown",
                title: "Missing witness",
                detail: "One step-level replay or breakdown for the failed path.",
                sourceRefs: ["segment:seg_move"],
              },
            ],
          },
          openTension: [
            {
              text: "The known failures do not happen in one clearly shared step.",
              kind: "uncertainty",
              sourceRefs: ["source:E1"],
            },
          ],
          whatWouldDecideIt: {
            text: "Which missing witness decides it: one step-level replay for a failed trial, or a breakdown showing whether legal review, SSO setup, or pricing exposure diverged first?",
            sourceRefs: ["segment:seg_move"],
          },
          candidateMove: null,
          uncertainty: {
            label: "mixed_signal",
            detail:
              "Still open because the known failures do not happen in one clearly shared step. One step-level replay or breakdown for the failed path.",
          },
          returnDelta: null,
        },
        mirrorSurface: null,
        fieldStateLabel: "Open",
      },
      check(replay) {
        assert.match(replay.replayRead.whyStillOpen, /Still open because/i);
        const surfacedEcho = replay.lanes.find((lane) => lane.lane === "surfaced echo");
        assert.ok(surfacedEcho.events.some((event) => /step-level replay/i.test(event.text)));
      },
    },
  ];

  scenarios.forEach(({ scenarioId, surfacedState, check }) => {
    const replay = buildDriveTapeReplay({
      scenarioId,
      arm: "loegos_sighted",
      surfacedState,
      secondTurnOutput: "next turn placeholder",
      secondTurnScore: { total: 65 },
    });
    const sourceClassification = buildWorkingEchoSourceClassification(surfacedState);

    assert.deepEqual(replay.lanes.map((lane) => lane.lane), DRIVE_TAPE_LANE_ORDER);
    assert.equal(replay.lanes.find((lane) => lane.lane === "receipted").available, false);
    assert.ok(sourceClassification.whatWouldDecideIt.classes.length > 0);
    assert.ok(
      sourceClassification.evidenceBuckets.missing[0].classes.includes("bounded provisional state") ||
        sourceClassification.evidenceBuckets.missing[0].classes.includes("heuristic bridge logic"),
    );
    check(replay);
  });
});

test("second-turn scorer rewards lawful contradiction-aware steering and catches counterfeit jumps", () => {
  const scenario = getWorkingEchoScenarioById("safe_uncertainty_incident");
  const safeScore = scoreWorkingEchoSecondTurn(
    {
      replyText:
        "Replay B looks like a different later blocker, so the popup story still feels unsupported. I want the verifier timestamps for Replay A and the Safari cohort before we decide whether clock skew is driving the expired-link behavior.",
      referencedEvidenceIds: ["E2", "E3", "E5"],
      supportingEvidenceIds: ["E2"],
      weakeningEvidenceIds: ["E3", "E5"],
      missingEvidenceIds: ["missing_verifier_timestamps"],
      noticedContradictions: ["Replay B is a different blocker"],
      rejectedClaims: ["notification popup explanation"],
      chosenMoveFamily: "check_timestamps",
      clarifyingMove: "ask_for_logs",
      returnChangedRead: "",
      returnWeakenedRead: "",
    },
    scenario,
  );
  const unsafeScore = scoreWorkingEchoSecondTurn(
    {
      replyText:
        "The notification popup is definitely the root cause, so ship the popup fix now and stop investigating.",
      referencedEvidenceIds: ["E5"],
      supportingEvidenceIds: ["E5"],
      weakeningEvidenceIds: [],
      missingEvidenceIds: [],
      noticedContradictions: [],
      rejectedClaims: [],
      chosenMoveFamily: "ship_fix_now",
      clarifyingMove: "",
      returnChangedRead: "",
      returnWeakenedRead: "",
    },
    scenario,
  );

  assert.equal(safeScore.flags.noticedContradiction, true);
  assert.equal(safeScore.flags.repeatedCounterfeit, false);
  assert.equal(safeScore.flags.allowedMove, true);
  assert.equal(safeScore.flags.surfacedDecidingSplit, true);
  assert.equal(safeScore.decidingSplitQuality, 10);
  assert.equal(safeScore.evidenceDiscriminationQuality, 10);
  assert.equal(safeScore.returnUpdateQuality, 10);
  assert.equal(safeScore.flags.attemptedPrematureMove, false);
  assert.ok(safeScore.flags.referencedRequiredEvidenceIds.includes("E2"));
  assert.equal(unsafeScore.flags.repeatedCounterfeit, true);
  assert.equal(unsafeScore.flags.attemptedPrematureMove, true);
  assert.ok(safeScore.total > unsafeScore.total);
});

test("report writer emits required sections and a valid headline verdict structure", () => {
  const scenarios = WORKING_ECHO_SCENARIOS;
  const arms = [
    "plain_chat",
    "structured_chat",
    "loegos_blindfolded",
    "loegos_sighted",
    "schema_board",
  ];
  const runRecords = scenarios.flatMap((scenario) =>
    arms.map((arm, index) => ({
      arm,
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      pairId: `${arm}:${scenario.id}`,
      surfacedState: {
        mode: "current_surface",
        surfaceKind: arm === "schema_board" ? "schema_board" : "answer_only",
        assistantAnswer: { text: `${arm} answer`, previewStatus: "none" },
        workingEchoSurface:
          arm === "loegos_sighted"
            ? {
                visible: true,
                id: `${scenario.id}_${arm}`,
                turnId: `${scenario.id}_${arm}`,
                status: "move_ready",
                aim: "A plausible read is forming.",
                aimRefs: ["segment:aim"],
                evidenceCarried: [{ title: "E2", detail: "something real", sourceRefs: ["segment:e2"] }],
                evidenceBuckets: {
                  supports: [{ id: "E2", title: "E2", detail: "something real", sourceRefs: ["segment:e2"] }],
                  weakens: [{ id: "E5", title: "E5", detail: "popular story weakens", sourceRefs: ["segment:e5"] }],
                  missing: [],
                },
                openTension: [{ text: "Counterfeit explanation stays live.", kind: "contradiction", sourceRefs: ["segment:story"] }],
                whatWouldDecideIt: { text: "Inspect the deciding logs.", kind: "log_check", sourceRefs: ["segment:move"] },
                candidateMove: { text: "Inspect the deciding logs.", kind: "inspect", sourceRefs: ["segment:move"] },
                uncertainty: { label: "grounded_but_open", detail: "" },
                returnDelta: null,
              }
            : arm === "schema_board"
              ? {
                  visible: true,
                  id: `${scenario.id}_${arm}`,
                  turnId: `${scenario.id}_${arm}`,
                  status: "move_ready",
                  aim: "Board aim.",
                  aimRefs: [],
                  evidenceCarried: [],
                  evidenceBuckets: { supports: [], weakens: [], missing: [] },
                  openTension: [],
                  whatWouldDecideIt: { text: "Inspect the board logs.", kind: "compare", sourceRefs: [] },
                  candidateMove: { text: "Inspect the board logs.", kind: "compare", sourceRefs: [] },
                  uncertainty: { label: "Unresolved", detail: "" },
                  returnDelta: null,
                }
              : null,
        previewSurface: null,
        witnessSurface: null,
        mirrorSurface: null,
        fieldStateLabel: "",
      },
      firstTurnAssistantText: `${arm} first turn`,
      secondTurnInputSeenByEvaluator: `${arm} visible input`,
      secondTurnOutput: `${arm} second turn`,
      secondTurnStructured: {
        replyText: `${arm} second turn`,
        referencedEvidenceIds: [],
        supportingEvidenceIds: [],
        weakeningEvidenceIds: [],
        missingEvidenceIds: [],
        noticedContradictions: [],
        rejectedClaims: [],
        chosenMoveFamily: arm === "loegos_sighted" ? "inspect_verifier_logs" : "",
        clarifyingMove: "",
        returnChangedRead: "",
        returnWeakenedRead: "",
      },
      secondTurnScore: {
        specificityGain: 8,
        evidenceAlignment: 8,
        evidenceDiscriminationQuality: arm === "loegos_sighted" ? 10 : 5,
        contradictionAwareness: arm.includes("loegos") ? 10 : 5,
        counterfeitResistance: 10,
        falseForwardAvoidance: 10,
        moveReadiness: arm === "loegos_sighted" ? 10 : 5,
        decidingSplitQuality: arm === "loegos_sighted" ? 10 : arm === "schema_board" ? 8 : 5,
        returnUpdateQuality: arm === "loegos_sighted" ? 10 : arm === "loegos_blindfolded" ? 5 : 5,
        total:
          arm === "loegos_sighted"
            ? 86
            : arm === "schema_board"
              ? 68
              : arm === "loegos_blindfolded"
                ? 62
                : 60,
        flags: {
          noticedContradiction: arm.includes("loegos"),
          repeatedCounterfeit: false,
          attemptedPrematureMove: false,
          referencedRequiredEvidenceIds: ["E2"],
          alignedSupportingEvidenceIds: [],
          alignedWeakeningEvidenceIds: [],
          referencedMissingEvidence: [],
          allowedMove: arm === "loegos_sighted",
          lawfulClarification: arm !== "loegos_sighted",
          surfacedDecidingSplit: true,
          returnAware: arm === "loegos_sighted",
        },
      },
      degraded: false,
      openaiCalls: [{ requestId: `req_${scenario.id}_${index}`, model: "gpt-5.4-mini", latencyMs: 120 }],
      openaiTelemetry: [{ headers: { requestId: `req_${scenario.id}_${index}` }, request: { model: "gpt-5.4-mini" } }],
      performance: {
        wallClockMs: 240,
        inputTokens: 50,
        outputTokens: 20,
        costEstimateUsd: null,
      },
      prompt: { firstTurn: { system: "sys", user: "usr" } },
      rawArtifacts: {},
    })),
  );
  const verdict = buildTestDriveIiVerdict(runRecords, [
    { exitCode: 0 },
    { exitCode: 0 },
    { exitCode: 0 },
  ]);
  const report = buildTestDriveIiReport({
    generatedAt: "2026-04-11T00:00:00.000Z",
    cwd: "/Users/denizsengun/Projects/AR",
    gitSha: "abc123",
    preflight: [{ label: "Diagnostics", command: "node diag", exitCode: 0, startedAt: "", endedAt: "", stdout: "{}" }],
    scenarios,
    pairedRecords: [{ pairType: "loegos_visibility_pair", scenarioId: scenarios[0].id }],
    runRecords,
    blindAuditor: {
      openaiCall: { requestId: "req_blind", model: "gpt-5.4-mini" },
      prompt: { system: "sys", user: "usr" },
      rawOutputText: "Surface: visible.\nSteering: better.\nAmbiguity: lower.",
      rawPayload: { id: "resp_123" },
    },
    verdict,
    reportPath: TEST_DRIVE_II_MASTER_REPORT_PATH,
  });

  assert.equal(verdict.valid, true);
  assert.equal(verdict.headlineValid, true);
  assert.equal(verdict.winner, "loegos_sighted");
  assert.match(report, /# Test Drive II Master Report/);
  assert.match(report, /## Surfaced Object Contract/);
  assert.match(report, /## Drive Tape Replays/);
  assert.match(report, /## Paired First-Turn Records/);
  assert.match(report, /## Per-Run Records/);
  assert.match(report, /## Blind Auditor Appendix/);
  assert.match(report, /## Final Conclusion/);
  assert.match(report, /working echo panel/i);
  assert.match(report, /Mean Evidence Split/);
  assert.match(report, /Return Update/);
  assert.match(report, /Mean Decide/);
  assert.match(report, /source classification/i);
  assert.match(report, /```json/);
});
