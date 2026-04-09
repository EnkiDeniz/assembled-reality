import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { evaluateEpisodes } from "../shape-eval/evaluator.js";

test("evaluation computes reproducibility and utility", () => {
  const filePath = path.resolve(process.cwd(), "fixtures", "episodes", "benchmark.episodes.json");
  const episodes = JSON.parse(fs.readFileSync(filePath, "utf8")).slice(0, 6);
  const result = evaluateEpisodes({
    episodes,
    iterations: 3,
    library: { primitives: [], assemblies: [] }
  });
  assert.equal(typeof result.reproducibility, "number");
  assert.equal(typeof result.utility, "number");
  assert.equal(typeof result.utilityV01, "number");
  assert.ok(result.expectedAlignment === null || typeof result.expectedAlignment === "number");
  assert.ok(result.granularityAlignment === null || typeof result.granularityAlignment === "number");
  assert.equal(typeof result.crossDomainPass, "boolean");
  assert.equal(typeof result.domainCoverageCount, "number");
  assert.equal(typeof result.maturationScore, "number");
  assert.equal(typeof result.maturationPass, "boolean");
  assert.equal(typeof result.maturationThreshold, "number");
  assert.ok(Array.isArray(result.hardFailures));
  assert.equal(typeof result.matchBasisDistribution, "object");
  assert.equal(typeof result.nearMissHistogram, "object");
  assert.ok(Array.isArray(result.episodes));
  assert.ok(result.episodes.every((ep) => typeof ep.utilityV01 === "number"));
});

test("reproducibility drift guard returns deterministic score for same inputs", () => {
  const episodes = [
    {
      episodeId: "drift-1",
      label: "drift guard",
      payload: {
        runType: "evaluation",
        inputMode: "human",
        mode: "standard",
        intentLayer: "behavior",
        assumptionStatus: "explicit",
        observables: ["queue"],
        timescale: { horizon: "short", window: "1 week" },
        constraints: ["single reviewer"],
        resourceBudget: { time: "1 week", money: "low", attention: "medium", other: [] },
        operationalFailure: "delay",
        invariant: "single lane constrains throughput",
        granularity: "primitive",
        falsifier: "split lane",
        transferPrediction: "throughput improves"
      },
      expected: { granularity: "primitive" }
    }
  ];

  const run1 = evaluateEpisodes({ episodes, iterations: 4, library: { primitives: [], assemblies: [] } });
  const run2 = evaluateEpisodes({ episodes, iterations: 4, library: { primitives: [], assemblies: [] } });
  assert.equal(run1.reproducibility, run2.reproducibility);
});

test("adversarial correct pre-screen does not trigger maturation hard failure", () => {
  const episodes = [
    {
      episodeId: "adv-prescreen-1",
      label: "adversarial path dependent no order signal",
      payload: {
        runType: "evaluation",
        inputMode: "human",
        mode: "standard",
        intentLayer: "behavior",
        assumptionStatus: "explicit",
        assemblyClass: "path_dependent",
        observables: ["slow team"],
        timescale: { horizon: "short", window: "2 weeks" },
        constraints: [],
        resourceBudget: { time: "2 weeks", money: "low", attention: "medium", other: [] },
        operationalFailure: "work slow",
        invariant: "Ordering appears to matter somehow.",
        granularity: "primitive",
        falsifier: "change order and observe",
        transferPrediction: "throughput changes",
      },
      expected: { granularity: "primitive" },
    },
  ];

  const result = evaluateEpisodes({
    episodes,
    iterations: 3,
    library: { primitives: [], assemblies: [] },
  });
  assert.equal(result.episodes[0].maturationPass, true);
  assert.deepEqual(result.episodes[0].hardFailures, []);
  assert.deepEqual(result.hardFailures, []);
});
