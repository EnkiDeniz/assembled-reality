import test from "node:test";
import assert from "node:assert/strict";
import { normalizeToCanonicalIR } from "../shape-core/translator.js";
import {
  validateIR,
  validatePromote,
  assertAnalyzeResultShape,
  assertEvaluateResultShape,
} from "../shape-api/validator.js";

test("canonical IR validates", () => {
  const ir = normalizeToCanonicalIR({
    runType: "single",
    inputMode: "human",
    mode: "standard",
    intentLayer: "behavior",
    assumptionStatus: "explicit",
    observables: ["x"],
    timescale: { horizon: "short", window: "1 week" },
    constraints: ["c"],
    resourceBudget: { time: "1 week", money: "low", attention: "low", other: [] },
    operationalFailure: "f",
    invariant: "a specific invariant statement",
    granularity: "primitive",
    assemblyClass: "path_dependent",
    falsifier: "test",
    transferPrediction: "predict"
  });
  const valid = validateIR(ir);
  assert.equal(valid.ok, true);
});

test("analyze/evaluate schema validators accept expected structure", () => {
  const analyzeOk = assertAnalyzeResultShape({
    runId: "r1",
    resultType: "candidate_primitive",
    shapeIds: [],
    granularity: "primitive",
    gate: { passed: true, failures: [], warnings: [] },
    reads: {},
    ambiguities: [],
    discriminatingTest: {
      observable: "o",
      expectedOutcomeA: "a",
      expectedOutcomeB: "b",
      timeWindow: "w"
    },
    requiredReceipts: ["runtime_observation"],
    confidence: 0.7,
    confidenceSource: "heuristic",
    candidateId: "c1"
  });
  assert.equal(analyzeOk, true);

  const evaluateOk = assertEvaluateResultShape({
    reproducibility: 0.82,
    utility: 0.58,
    thresholds: { reproducibility: 0.8, utility: 0.5 },
    quality: { diversityPass: true, adversarialPass: true, structuredPass: true },
    releaseGatePass: true,
    episodes: []
  });
  assert.equal(evaluateOk, true);
});

test("standard mode requires non-empty observables", () => {
  const ir = normalizeToCanonicalIR({
    runType: "single",
    inputMode: "human",
    mode: "standard",
    intentLayer: "behavior",
    assumptionStatus: "explicit",
    observables: [],
    timescale: { horizon: "short", window: "1 week" },
    constraints: ["c"],
    resourceBudget: { time: "1 week", money: "low", attention: "low", other: [] },
    operationalFailure: "f",
    invariant: "a specific invariant statement",
    granularity: "primitive",
    falsifier: "test",
    transferPrediction: "predict",
  });
  const valid = validateIR(ir);
  assert.equal(valid.ok, false);
});

test("exploratory mode requires inferred or repaired assumption status", () => {
  const ir = normalizeToCanonicalIR({
    runType: "single",
    inputMode: "human",
    mode: "exploratory",
    intentLayer: "behavior",
    assumptionStatus: "explicit",
    invariant: "early discovery statement",
    granularity: "unknown",
    falsifier: "test",
    transferPrediction: "predict",
  });
  const valid = validateIR(ir);
  assert.equal(valid.ok, false);
});

test("assembly promotion requires assembly-specific fields", () => {
  const validMissing = validatePromote({
    candidateId: "c1",
    targetType: "assembly",
    receiptEvidence: [{ receiptType: "runtime_observation", payload: { ok: true } }],
    reproducibility: 0.9,
    utility: 0.7,
    assemblyClass: "developmental_embodied",
  });
  assert.equal(validMissing.ok, false);

  const validPresent = validatePromote({
    candidateId: "c1",
    targetType: "assembly",
    nonAdditive: true,
    newFailureSignature: true,
    newTransferPrediction: true,
    receiptEvidence: [{ receiptType: "runtime_observation", payload: { ok: true } }],
    reproducibility: 0.9,
    utility: 0.7,
  });
  assert.equal(validPresent.ok, true);
});
