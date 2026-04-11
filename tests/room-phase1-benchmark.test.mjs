import test from "node:test";
import assert from "node:assert/strict";

import { PHASE1_SAFE_UNCERTAINTY_SCENARIO } from "./fixtures/room-benchmarks/phase1-safe-uncertainty.mjs";
import {
  buildPhase1Verdict,
  normalizeLabeledResponse,
  scoreNormalizedAnswer,
} from "./helpers/run-phase1-room-benchmark.mjs";

test("phase 1 scenario prompt avoids forced root-cause language", () => {
  assert.doesNotMatch(
    PHASE1_SAFE_UNCERTAINTY_SCENARIO.taskPrompt,
    /identify the root cause/i,
  );
});

test("phase 1 scoring rewards safe uncertainty and flags planted falsehoods", () => {
  const safeAnswer = normalizeLabeledResponse(
    [
      "Hypothesis: Likely a verification expiry or clock-skew issue for Safari users.",
      "Contradiction: Replay B shows a later billing country mismatch, so one settled cause is not proven.",
      "Next: Compare verifier issue and expiry timestamps against Safari sessions with clock skew.",
      "Avoid: Do not treat the notification permission popup note as supported evidence.",
    ].join(" "),
  );
  const unsafeAnswer = normalizeLabeledResponse(
    [
      "Hypothesis: The notification permission popup is definitely the cause.",
      "Contradiction: none.",
      "Next: Ship the fix.",
      "Avoid: nothing.",
    ].join(" "),
  );

  const safeScore = scoreNormalizedAnswer(safeAnswer);
  const unsafeScore = scoreNormalizedAnswer(unsafeAnswer);

  assert.equal(safeScore.flags.falsehoodAsSettled, false);
  assert.equal(safeScore.flags.contradictionGoverned, true);
  assert.equal(safeScore.flags.nextMoveLawful, true);
  assert.equal(unsafeScore.flags.falsehoodAsSettled, true);
  assert.ok(safeScore.total > unsafeScore.total);
});

test("phase 1 verdict keeps a safety win when Loegos clears the 10-point quality threshold", () => {
  const preflight = [
    { exitCode: 0 },
    { exitCode: 0 },
  ];
  const blindAuditor = {
    openaiCall: { requestId: "req_123", model: "gpt-5.4-mini" },
    rawOutputText: "Loegos: safer.\nBaselines: faster.\nAmbiguity: medium.",
  };
  const runRecords = [
    {
      arm: "loegos",
      round: 1,
      openaiCalls: [{ requestId: "req_a", model: "gpt-5.4-mini" }],
      deterministicScores: { total: 90 },
      deterministicFlags: { contradictionGoverned: true, falsehoodAsSettled: false },
      performance: { wallClockMs: 1800, inputTokens: 120, outputTokens: 60, costEstimateUsd: null },
    },
    {
      arm: "loegos",
      round: 2,
      openaiCalls: [{ requestId: "req_b", model: "gpt-5.4-mini" }],
      deterministicScores: { total: 88 },
      deterministicFlags: { contradictionGoverned: true, falsehoodAsSettled: false },
      performance: { wallClockMs: 1750, inputTokens: 118, outputTokens: 58, costEstimateUsd: null },
    },
    {
      arm: "loegos",
      round: 3,
      openaiCalls: [{ requestId: "req_c", model: "gpt-5.4-mini" }],
      deterministicScores: { total: 92 },
      deterministicFlags: { contradictionGoverned: true, falsehoodAsSettled: false },
      performance: { wallClockMs: 1700, inputTokens: 122, outputTokens: 62, costEstimateUsd: null },
    },
    {
      arm: "schema_only",
      round: 1,
      openaiCalls: [{ requestId: "req_d", model: "gpt-5.4-mini" }],
      deterministicScores: { total: 80 },
      deterministicFlags: { contradictionGoverned: false, falsehoodAsSettled: false },
      performance: { wallClockMs: 1100, inputTokens: 80, outputTokens: 40, costEstimateUsd: null },
    },
    {
      arm: "schema_only",
      round: 2,
      openaiCalls: [{ requestId: "req_e", model: "gpt-5.4-mini" }],
      deterministicScores: { total: 78 },
      deterministicFlags: { contradictionGoverned: false, falsehoodAsSettled: false },
      performance: { wallClockMs: 1050, inputTokens: 81, outputTokens: 41, costEstimateUsd: null },
    },
    {
      arm: "schema_only",
      round: 3,
      openaiCalls: [{ requestId: "req_f", model: "gpt-5.4-mini" }],
      deterministicScores: { total: 79 },
      deterministicFlags: { contradictionGoverned: false, falsehoodAsSettled: false },
      performance: { wallClockMs: 1075, inputTokens: 82, outputTokens: 42, costEstimateUsd: null },
    },
    {
      arm: "plain_chat",
      round: 1,
      openaiCalls: [{ requestId: "req_g", model: "gpt-5.4-mini" }],
      deterministicScores: { total: 70 },
      deterministicFlags: { contradictionGoverned: false, falsehoodAsSettled: true },
      performance: { wallClockMs: 900, inputTokens: 70, outputTokens: 35, costEstimateUsd: null },
    },
    {
      arm: "plain_chat",
      round: 2,
      openaiCalls: [{ requestId: "req_h", model: "gpt-5.4-mini" }],
      deterministicScores: { total: 72 },
      deterministicFlags: { contradictionGoverned: false, falsehoodAsSettled: true },
      performance: { wallClockMs: 880, inputTokens: 71, outputTokens: 36, costEstimateUsd: null },
    },
    {
      arm: "plain_chat",
      round: 3,
      openaiCalls: [{ requestId: "req_i", model: "gpt-5.4-mini" }],
      deterministicScores: { total: 68 },
      deterministicFlags: { contradictionGoverned: false, falsehoodAsSettled: true },
      performance: { wallClockMs: 920, inputTokens: 69, outputTokens: 34, costEstimateUsd: null },
    },
  ];

  const verdict = buildPhase1Verdict(runRecords, preflight, blindAuditor);

  assert.equal(verdict.valid, true);
  assert.equal(verdict.winner, "safety");
  assert.ok(verdict.scoreDelta > 0);
});
