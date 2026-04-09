import test from "node:test";
import assert from "node:assert/strict";
import { normalizeToCanonicalIR } from "../shape-core/translator.js";
import { analyzeCanonicalIR } from "../shape-core/engine.js";

test("analyze returns structured result for standard input", () => {
  const ir = normalizeToCanonicalIR({
    runType: "single",
    inputMode: "human",
    mode: "standard",
    intentLayer: "behavior",
    assumptionStatus: "explicit",
    observables: ["queue delay"],
    timescale: { horizon: "short", window: "2 weeks" },
    constraints: ["single reviewer"],
    resourceBudget: { time: "2 weeks", money: "low", attention: "high", other: [] },
    operationalFailure: "delay",
    invariant: "A constrained step limits throughput in repeated cycles.",
    granularity: "primitive",
    falsifier: "add reviewer",
    transferPrediction: "throughput up"
  });
  const result = analyzeCanonicalIR(ir, { library: { primitives: [], assemblies: [] } });
  assert.equal(result.ok, true);
  assert.equal(typeof result.value.resultType, "string");
  assert.equal(result.value.gate.passed, true);
  assert.equal(typeof result.value.assemblyClass, "string");
  assert.ok(Array.isArray(result.value.maturation.requiredStages));
});

test("intent-layer violation returns invalid_layer_execution", () => {
  const ir = normalizeToCanonicalIR({
    runType: "single",
    inputMode: "ai",
    mode: "standard",
    intentLayer: "ontology",
    assumptionStatus: "explicit",
    observables: ["none"],
    timescale: { horizon: "short", window: "1 week" },
    constraints: [],
    resourceBudget: { time: "1 week", money: "low", attention: "low", other: [] },
    operationalFailure: "untestable claim",
    invariant: "Narrative only claim",
    granularity: "unknown",
    falsifier: "add metric",
    transferPrediction: "unknown",
    metadata: {
      trace: {
        requestedOutputs: ["communication_optimization"]
      }
    }
  });
  const result = analyzeCanonicalIR(ir, { library: { primitives: [], assemblies: [] } });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "invalid_layer_execution");
});
