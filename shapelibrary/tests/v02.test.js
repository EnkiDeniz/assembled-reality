import test from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { migrate } from "../shape-store/db.js";
import {
  seedLibraryIfEmpty,
  insertMintedPrimitive,
  suggestPrimitiveLink,
  listLibrary,
} from "../shape-store/repository.js";
import { analyzeCanonicalIR } from "../shape-core/engine.js";
import { normalizeToCanonicalIR } from "../shape-core/translator.js";
import { evaluateEpisodes } from "../shape-eval/evaluator.js";
import { scoreExpectedAlignment, scoreGranularityAlignment } from "../shape-eval/metrics.js";
import { validateMythPayload, applyMythDecompression } from "../shape-core/myth.js";
import { validateIR } from "../shape-api/validator.js";
import {
  inferAssemblyClass,
  runMaturationGate,
} from "../shape-core/assembly-path.js";
import { buildOperatorRead, validateOperatorRead } from "../shape-core/bat.js";

test("analyze fidelity: matchBasis and nearMiss when enableV01Fidelity", () => {
  const ir = normalizeToCanonicalIR({
    runType: "single",
    inputMode: "human",
    mode: "standard",
    intentLayer: "behavior",
    assumptionStatus: "explicit",
    observables: ["queue"],
    timescale: { horizon: "short", window: "1 week" },
    constraints: ["c"],
    resourceBudget: { time: "1 week", money: "low", attention: "medium", other: [] },
    operationalFailure: "delay",
    invariant: "Unique wording that will not match library seeds xyz123.",
    granularity: "primitive",
    falsifier: "f",
    transferPrediction: "t",
  });
  const library = {
    primitives: [{ shapeId: "primitive_bottleneck", name: "B", invariantText: "One constrained step limits whole flow." }],
    assemblies: [],
  };
  const r = analyzeCanonicalIR(ir, { library, features: { enableV01Fidelity: true } });
  assert.equal(r.ok, true);
  assert.equal(r.value.matchBasis, "hybrid_structural_overlap");
  assert.ok(r.value.nearMiss && r.value.nearMiss.shapeId === "primitive_bottleneck");
});

test("candidate near-match emits specific symptom guidance for path-dependent bottleneck", () => {
  const ir = normalizeToCanonicalIR({
    runType: "single",
    inputMode: "human",
    mode: "standard",
    intentLayer: "behavior",
    assumptionStatus: "explicit",
    observables: ["queue growth", "late completions"],
    timescale: { horizon: "short", window: "2 weeks" },
    constraints: ["ordered transition"],
    resourceBudget: { time: "2 weeks", money: "low", attention: "high", other: [] },
    operationalFailure: "handoff friction remains unresolved",
    invariant:
      "The process slows at a transition point, but sequence causality is still unclear and unverified.",
    granularity: "primitive",
    assemblyClass: "path_dependent",
    joinPattern: "stage_a->stage_b->stage_c",
    falsifier: "reverse transition sequence and compare cycle time",
    transferPrediction: "if order is causal, reversing sequence changes delay profile",
  });
  const library = {
    primitives: [
      { shapeId: "primitive_bottleneck", name: "B", invariantText: "One constrained step limits whole flow." },
    ],
    assemblies: [],
  };
  const r = analyzeCanonicalIR(ir, { library, features: { enableV01Fidelity: true } });
  assert.equal(r.ok, true);
  assert.equal(r.value.resultType, "candidate_primitive");
  assert.equal(r.value.nearMiss?.shapeId, "primitive_bottleneck");
  assert.equal(
    r.value.nextLawfulMove,
    "Map the actual handoff sequence. Confirm order matters by testing whether reversing steps changes the outcome.",
  );
  assert.deepEqual(r.value.receiptCondition, {
    receiptType: "stage_transition_proof",
    validWhen: "ordered_sequence_confirmed && before_after_metric_shift",
  });
});

test("expectedAlignment aggregates against seeded primitive", () => {
  const episodes = [
    {
      episodeId: "align-1",
      label: "bottleneck label",
      payload: {
        runType: "evaluation",
        inputMode: "human",
        mode: "standard",
        intentLayer: "behavior",
        assumptionStatus: "explicit",
        observables: ["q"],
        timescale: { horizon: "short", window: "2 weeks" },
        constraints: ["one reviewer"],
        resourceBudget: { time: "2 weeks", money: "low", attention: "high", other: [] },
        operationalFailure: "cycle time keeps increasing",
        invariant: "One constrained step limits whole flow.",
        granularity: "primitive",
        falsifier: "Add second reviewer and check if cycle time remains unchanged",
        transferPrediction: "Throughput improves within one sprint after removing the gate",
      },
      expected: {
        granularity: "primitive",
        resultType: "primitive_match",
        shapeIds: ["primitive_bottleneck"],
      },
    },
  ];
  const library = {
    primitives: [{ shapeId: "primitive_bottleneck", name: "B", invariantText: "One constrained step limits whole flow." }],
    assemblies: [],
  };
  const r = evaluateEpisodes({ episodes, iterations: 2, library, features: {} });
  assert.ok(r.expectedAlignment != null && r.expectedAlignment >= 0.99);
  assert.ok(typeof r.utilityV01 === "number");
});

test("scoreExpectedAlignment partial expected", () => {
  const run = { granularity: "primitive", resultType: "candidate_primitive", shapeIds: [] };
  const a = scoreExpectedAlignment(run, { granularity: "primitive" });
  assert.equal(a, null);
  const g = scoreGranularityAlignment(run, { granularity: "primitive" });
  assert.equal(g, 1);
  const b = scoreExpectedAlignment(run, {
    resultType: "primitive_match",
  });
  assert.equal(b, 0);
});

test("myth payload validates and expands to standard IR fields", () => {
  const raw = normalizeToCanonicalIR({
    inputMode: "myth",
    mode: "standard",
    intentLayer: "behavior",
    assumptionStatus: "explicit",
    timescale: { horizon: "short", window: "1 week" },
    constraints: [],
    resourceBudget: { time: "1 week", money: "low", attention: "medium", other: [] },
    granularity: "primitive",
    transferPrediction: "t",
    mythDecompression: {
      canonicalInvariant: "Gate before passage",
      falsifier: "remove gate",
      triLayerMap: { operational: ["waiting tasks"] },
    },
  });
  const mv = validateMythPayload(raw);
  assert.equal(mv.ok, true);
  const expanded = applyMythDecompression(raw);
  const v = validateIR(expanded);
  assert.equal(v.ok, true);
  assert.ok(expanded.observables.length >= 1);
});

test("repository suggestPrimitiveLink and mint", () => {
  const db = new Database(":memory:");
  migrate(db);
  seedLibraryIfEmpty(db);
  const id = suggestPrimitiveLink(db, "One constrained review step limits the full flow.");
  assert.equal(id, "primitive_bottleneck");
  insertMintedPrimitive(db, {
    shapeId: "mint_test123",
    name: "T",
    invariantText: "custom invariant",
    metadata: { test: true },
  });
  const lib = listLibrary(db, { type: "all" });
  assert.ok(lib.primitives.some((p) => p.shapeId === "mint_test123"));
});

test("kernel and cross-domain blocks when flags on", () => {
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
    invariant: "long enough invariant text here",
    granularity: "primitive",
    falsifier: "z",
    transferPrediction: "y",
    crossDomainMap: { domains: ["a", "b"], consistencyScore: 0.7 },
  });
  const r = analyzeCanonicalIR(ir, {
    library: { primitives: [], assemblies: [] },
    features: { enableV01Fidelity: false, enableKernel: true, enableCrossDomain: true },
  });
  assert.equal(r.ok, true);
  assert.ok(r.value.kernel && r.value.kernel.stateMode);
  assert.ok(r.value.crossDomain && r.value.crossDomain.convergenceScore === 0.7);
});

test("assembly class inference and maturation gate", () => {
  const ir = normalizeToCanonicalIR({
    mode: "standard",
    intentLayer: "behavior",
    assumptionStatus: "explicit",
    observables: ["queue"],
    timescale: { horizon: "short", window: "2 weeks" },
    constraints: ["single approver"],
    resourceBudget: { time: "2 weeks", money: "low", attention: "high", other: [] },
    operationalFailure: "delay accumulates",
    invariant: "One constrained step limits full flow.",
    granularity: "primitive",
    falsifier: "parallel approvals",
    transferPrediction: "queue depth drops",
  });
  const klass = inferAssemblyClass(ir);
  assert.equal(klass, "path_dependent");
  const gate = runMaturationGate(ir, klass);
  assert.equal(gate.passed, true);
});

test("read-order precheck returns not_sealable_yet without candidate naming", () => {
  const ir = normalizeToCanonicalIR({
    mode: "standard",
    intentLayer: "behavior",
    assumptionStatus: "explicit",
    assemblyClass: "path_dependent",
    observables: ["handoff"],
    timescale: { horizon: "short", window: "2 weeks" },
    constraints: [],
    resourceBudget: { time: "2 weeks", money: "low", attention: "high", other: [] },
    operationalFailure: "handoff latency",
    invariant: "A constrained transition step governs downstream flow.",
    granularity: "primitive",
    falsifier: "parallelize transition",
    transferPrediction: "latency drops",
  });
  const r = analyzeCanonicalIR(ir, {
    library: { primitives: [], assemblies: [] },
    features: { enableV01Fidelity: true },
  });
  assert.equal(r.ok, true);
  assert.equal(r.value.status, "not_sealable_yet");
  assert.equal(r.value.resultType, undefined);
  assert.equal(r.value.shapeIds, undefined);
  assert.ok(Array.isArray(r.value.maturationBlockers));
  assert.equal(r.value.operatorRead?.closureLanguageAllowed, false);
  assert.equal(typeof r.value.operatorRead?.whatToPingNow, "string");
});

test("bat operator read validates and enforces one bounded move", () => {
  const operatorRead = buildOperatorRead({
    status: "candidate_primitive",
    assemblyClass: "path_dependent",
    gatePassed: true,
    maturationGatePassed: true,
    requiredReceipts: ["stage_transition_proof"],
    nextLawfulMove: "Map the sequence and then run three strategy tracks.",
    receiptCondition: {
      receiptType: "stage_transition_proof",
      validWhen: "ordered_sequence_confirmed && before_after_metric_shift",
    },
    possibleDisconfirmation: "If order changes do not affect outcomes, reclassify.",
    falsifier: "reverse order and compare cycle time",
  });
  const validated = validateOperatorRead(operatorRead);
  assert.equal(validated.ok, true);
  assert.equal(operatorRead.closureLanguageAllowed, false);
  assert.ok(!/\bthen\b/i.test(operatorRead.whatToPingNow));
});
