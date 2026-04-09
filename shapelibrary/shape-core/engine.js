import { ERROR_CODES } from "./contracts.js";
import { runKernelPass } from "./kernel.js";
import { runCrossDomainPass } from "./cross-domain.js";
import {
  inferAssemblyClass,
  getMaturationModel,
  runMaturationGate,
} from "./assembly-path.js";

const MATCH_THRESHOLD = 0.4;

function normalizeText(value = "") {
  return String(value || "").trim().toLowerCase();
}

function inferGranularity(ir) {
  const value = normalizeText(ir?.granularity || ir?.shapeClass);
  if (value === "primitive" || value === "assembly" || value === "unknown") return value;
  if (Array.isArray(ir?.constituentShapes) && ir.constituentShapes.length > 1) return "assembly";
  if (String(ir?.invariant || "").trim()) return "primitive";
  return "unknown";
}

function enforceIntentLayer(ir) {
  const layer = normalizeText(ir?.intentLayer);
  const policy = `layer_policy_${layer || "unknown"}`;
  const violations = [];
  const requestedOutputs = Array.isArray(ir?.metadata?.trace?.requestedOutputs)
    ? ir.metadata.trace.requestedOutputs
    : [];

  if (layer === "ontology") {
    const forbidden = ["communication_optimization", "intervention_plan"];
    for (const item of requestedOutputs) {
      if (forbidden.includes(String(item || "").trim())) {
        violations.push(`forbidden_output:${item}`);
      }
    }
  }

  return {
    intentLayerEnforced: true,
    policy,
    violations,
    executionStatus: violations.length ? "invalid_layer_execution" : "ok",
  };
}

function buildRead(status, rationale, evidenceRefs = [], confidence = 0.5) {
  return { status, rationale, evidenceRefs, confidence };
}

function runFiveReads(ir) {
  const hasInvariant = String(ir?.invariant || "").trim().length > 8;
  const hasJoin = String(ir?.joinPattern || "").trim().length > 0;
  const hasFailure = String(ir?.failureSignature || ir?.operationalFailure || "").trim().length > 0;
  const hasRepair = String(ir?.repairLogic || "").trim().length > 0;
  const hasEvidence = Array.isArray(ir?.evidenceRefs) && ir.evidenceRefs.length > 0;
  return {
    matchInvariants: buildRead(
      hasInvariant ? "pass" : "weak",
      hasInvariant ? "Invariant appears specific enough for matching." : "Invariant appears underspecified.",
      hasEvidence ? ir.evidenceRefs : [],
      hasInvariant ? 0.72 : 0.44,
    ),
    readJoins: buildRead(
      hasJoin ? "pass" : "weak",
      hasJoin ? "Join pattern is present." : "Join pattern is missing or unclear.",
      [],
      hasJoin ? 0.68 : 0.38,
    ),
    pressGeometry: buildRead(
      hasJoin || hasInvariant ? "pass" : "ambiguous",
      hasJoin ? "Geometry inferred from join pattern." : "Geometry inferred weakly from invariant only.",
      [],
      hasJoin ? 0.66 : hasInvariant ? 0.52 : 0.3,
    ),
    readFailure: buildRead(
      hasFailure ? "pass" : "weak",
      hasFailure ? "Failure signature identified." : "Failure signature missing.",
      [],
      hasFailure ? 0.7 : 0.33,
    ),
    testRepair: buildRead(
      hasRepair ? "pass" : "weak",
      hasRepair ? "Repair logic exists." : "Repair logic missing.",
      [],
      hasRepair ? 0.69 : 0.35,
    ),
  };
}

function runGates(ir, reads) {
  const failures = [];
  const warnings = [];
  const invariant = String(ir?.invariant || "").trim();
  if (invariant.length < 8) failures.push("structure_not_distinguishing");
  if (!String(ir?.falsifier || "").trim()) failures.push("missing_falsifier");
  if (!String(ir?.transferPrediction || "").trim()) failures.push("missing_transfer_prediction");
  if (reads.matchInvariants.status !== "pass") warnings.push("weak_invariant_match");
  if (reads.readFailure.status !== "pass") warnings.push("weak_failure_read");
  return { passed: failures.length === 0, failures, warnings };
}

function tokenize(text = "") {
  return normalizeText(text)
    .split(/[^a-z0-9_]+/)
    .filter(Boolean);
}

function normalizeTokens(tokens = []) {
  const synonymMap = {
    single: "one",
    reviewer: "review",
    approvals: "approval",
    approval: "approve",
    signoff: "approve",
    gate: "approve",
    gating: "approve",
    lane: "step",
    throttles: "limits",
    throttle: "limit",
    throughput: "flow",
    queue: "backlog",
    backlog: "backlog",
    handoffs: "handoff",
    blocked: "stalled",
    stalls: "stalled",
    stalled: "stalled",
    waits: "wait",
    waiting: "wait",
  };
  return tokens.map((t) => synonymMap[t] || t);
}

function similarityScore(a, b) {
  const left = new Set(normalizeTokens(tokenize(a)));
  const right = new Set(normalizeTokens(tokenize(b)));
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  for (const token of left) {
    if (right.has(token)) overlap += 1;
  }
  // Balanced overlap is slightly more tolerant than max-size normalization.
  return (2 * overlap) / (left.size + right.size);
}

function scoreShapeSimilarity(ir, shape) {
  const invariantTarget = shape.invariantText || shape.name || "";
  const invariantScore = similarityScore(ir.invariant, invariantTarget);
  const constraintsScore = similarityScore(
    Array.isArray(ir.constraints) ? ir.constraints.join(" ") : "",
    invariantTarget,
  );
  const metadata = shape.metadata || {};
  const joinScore = similarityScore(ir.joinPattern || "", metadata.joinPattern || "");
  const falsifierScore = similarityScore(
    ir.falsifier || "",
    metadata.disconfirmationCondition || "",
  );
  const failureScore = similarityScore(
    ir.operationalFailure || ir.failureSignature || "",
    metadata.failureSignature || "",
  );
  const structuralScore = Math.max(joinScore, falsifierScore, failureScore);
  const weights = {
    invariant: 0.55,
    constraints: 0.15,
    join: 0.25,
    falsifier: 0.03,
    failure: 0.02,
  };
  const score = Math.min(
    1,
    weights.invariant * invariantScore +
      weights.constraints * constraintsScore +
      weights.join * joinScore +
      weights.falsifier * falsifierScore +
      weights.failure * failureScore,
  );
  return {
    score,
    weights,
    invariantScore,
    constraintsScore,
    joinScore,
    falsifierScore,
    failureScore,
    structuralScore,
  };
}

/**
 * Derived confidence for library miss: blend read confidences + optional near-miss to token match.
 * Target ~0.58 for typical “all reads mixed” cases when near-miss is moderate.
 */
function deriveCandidateConfidence(reads, nearMissScore) {
  const confs = Object.values(reads).map((r) => r.confidence);
  const avg = confs.reduce((a, b) => a + b, 0) / Math.max(1, confs.length);
  let c = 0.35 + 0.45 * avg;
  if (nearMissScore > 0) c += 0.12 * Math.min(1, nearMissScore);
  return Math.min(0.95, Math.max(0.2, c));
}

function chooseResult(ir, gate, library, features, reads) {
  const fidelity = Boolean(features.enableV01Fidelity);
  library = library || { primitives: [], assemblies: [] };

  if (!gate.passed) {
    return {
      resultType: "rejection",
      shapeIds: [],
      confidence: 0.25,
      ...(fidelity ? { matchBasis: null, nearMiss: null } : {}),
    };
  }

  const granularity = inferGranularity(ir);
  const pool =
    granularity === "assembly" ? library.assemblies || [] : library.primitives || [];
  const scored = pool
    .map((shape) => ({
      id: shape.shapeId,
      ...scoreShapeSimilarity(ir, shape),
    }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const nearMissScore = best && best.score < MATCH_THRESHOLD ? best.score : 0;

  if (best?.score >= MATCH_THRESHOLD) {
    const confidence = Math.min(0.95, 0.6 + best.score * 0.35);
    return {
      resultType: granularity === "assembly" ? "assembly_match" : "primitive_match",
      shapeIds: [best.id],
      confidence,
      ...(fidelity
        ? {
            matchBasis: "hybrid_structural_overlap",
            ...(best
              ? {
                  matchDetail: {
                    invariantScore: Number(best.invariantScore.toFixed(4)),
                    constraintsScore: Number(best.constraintsScore.toFixed(4)),
                    joinScore: Number(best.joinScore.toFixed(4)),
                    falsifierScore: Number(best.falsifierScore.toFixed(4)),
                    failureScore: Number(best.failureScore.toFixed(4)),
                    structuralScore: Number(best.structuralScore.toFixed(4)),
                    weights: best.weights,
                  },
                }
              : {}),
            nearMiss: null,
          }
        : {}),
    };
  }

  return {
    resultType: granularity === "assembly" ? "candidate_assembly" : "candidate_primitive",
    shapeIds: [],
    confidence: fidelity ? deriveCandidateConfidence(reads, nearMissScore) : 0.58,
    ...(fidelity
      ? {
          matchBasis: "hybrid_structural_overlap",
          nearMiss:
            best && best.id != null
              ? { shapeId: best.id, score: Number(best.score.toFixed(4)) }
              : null,
        }
      : {}),
  };
}

function buildDiscriminatingTest(ir, resultType) {
  return {
    observable: String(ir?.operationalFailure || "primary_operational_signal").trim(),
    expectedOutcomeA: `Outcome expected if ${resultType} holds`,
    expectedOutcomeB: "Outcome expected if an alternative shape better explains the case",
    timeWindow: String(ir?.timescale?.window || "one iteration").trim(),
  };
}

function buildNotSealableYet(ir, granularity, assemblyClass, intentCheck, maturationModel, maturationGate) {
  const blocker = maturationGate.failures[0] || "missing_stage_evidence";
  const map = {
    missing_order_signal: {
      mainGap: "No observable proving ordered transition behavior yet.",
      nextLawfulMove: "Run one bounded transition test with explicit before/after metric.",
      receiptType: "stage_transition_proof",
      validWhen: "transition_order_logged && before_after_metric_shift",
      disconfirmation: "If changing order does not change outcomes, this is likely not path-dependent.",
    },
    missing_embodied_time_budget: {
      mainGap: "No time-bound adaptation evidence present.",
      nextLawfulMove: "Define adaptation window and field-contact observable, then run one cycle.",
      receiptType: "embodied_feedback",
      validWhen: "adaptation_window_declared && field_contact_observed",
      disconfirmation:
        "If adaptation cycles produce no measurable retention change, this may not be developmental.",
    },
  };
  const rule = map[blocker] || {
    mainGap: "Stage evidence is not yet sufficient to name a structural candidate.",
    nextLawfulMove: "Capture one stage-specific witness that can falsify the current read.",
    receiptType: maturationModel.requiredReceipts[0] || "runtime_observation",
    validWhen: "stage_specific_observation_logged",
    disconfirmation: "If the next stage witness contradicts the current class, reclassify the assembly path.",
  };
  return {
    runId: ir.runId,
    status: "not_sealable_yet",
    granularity,
    assemblyClass,
    intentLayerCheck: intentCheck,
    maturationBlockers: maturationGate.failures,
    mainGap: rule.mainGap,
    nextLawfulMove: rule.nextLawfulMove,
    receiptCondition: {
      receiptType: rule.receiptType,
      validWhen: rule.validWhen,
    },
    possibleDisconfirmation: rule.disconfirmation,
    requiredReceipts: maturationModel.requiredReceipts,
    maturation: {
      requiredStages: maturationModel.requiredStages,
      nonImportableProperties: maturationModel.nonImportable,
      gate: maturationGate,
    },
  };
}

export function analyzeCanonicalIR(ir, { library, features = {} } = {}) {
  const granularity = inferGranularity(ir);
  const intentCheck = enforceIntentLayer(ir);
  if (intentCheck.executionStatus === "invalid_layer_execution") {
    return {
      ok: false,
      error: {
        code: ERROR_CODES.INVALID_LAYER_EXECUTION,
        message: "Intent layer enforcement failed.",
        details: intentCheck,
      },
    };
  }

  const assemblyClass = inferAssemblyClass(ir, {});
  const maturationModel = getMaturationModel(assemblyClass);
  const stagePrecheck =
    assemblyClass === "path_dependent" || assemblyClass === "developmental_embodied"
      ? runMaturationGate(ir, assemblyClass)
      : { passed: true, failures: [], warnings: [], requiredStages: maturationModel.requiredStages };
  if (!stagePrecheck.passed) {
    return {
      ok: true,
      value: buildNotSealableYet(
        ir,
        granularity,
        assemblyClass,
        intentCheck,
        maturationModel,
        stagePrecheck,
      ),
    };
  }

  const reads = runFiveReads(ir);
  const gate = runGates(ir, reads);
  const maturationGate = runMaturationGate(ir, assemblyClass);
  const chosen = chooseResult({ ...ir, granularity }, gate, library, features, reads);
  const ambiguities = [];
  if (reads.pressGeometry.status !== "pass") ambiguities.push("geometry_ambiguous");
  if (!gate.passed) ambiguities.push("gate_failure");
  if (!maturationGate.passed) ambiguities.push("maturation_gate_failure");

  const kernel = runKernelPass(ir, reads, gate, features);
  const crossDomain = runCrossDomainPass(ir, features);

  const isMythDerived = Boolean(ir?.metadata?.trace?.isMythDerived);

  const value = {
    runId: ir.runId,
    resultType: chosen.resultType,
    shapeIds: chosen.shapeIds,
    granularity,
    assemblyClass,
    gate,
    reads,
    ambiguities,
    discriminatingTest: buildDiscriminatingTest(ir, chosen.resultType),
    requiredReceipts: gate.passed
      ? Array.from(new Set(maturationModel.requiredReceipts))
      : ["input_repair"],
    confidence: chosen.confidence,
    confidenceSource: gate.passed ? "heuristic" : "single_run",
    intentLayerCheck: intentCheck,
    maturation: {
      requiredStages: maturationModel.requiredStages,
      nonImportableProperties: maturationModel.nonImportable,
      gate: maturationGate,
    },
    ...(chosen.matchBasis !== undefined ? { matchBasis: chosen.matchBasis } : {}),
    ...(chosen.nearMiss !== undefined ? { nearMiss: chosen.nearMiss } : {}),
    ...(kernel ? { kernel } : {}),
    ...(crossDomain ? { crossDomain } : {}),
    ...(isMythDerived ? { isMythDerived: true } : {}),
  };

  return { ok: true, value };
}
