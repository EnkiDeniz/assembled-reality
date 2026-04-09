export const ASSEMBLY_CLASSES = [
  "combinable",
  "path_dependent",
  "developmental_embodied",
];

const STAGE_MODEL = {
  combinable: {
    requiredStages: ["specify_components", "compose_and_verify"],
    requiredReceipts: ["runtime_observation"],
    nonImportable: ["none"],
  },
  path_dependent: {
    requiredStages: ["sequence_design", "ordered_transition", "stability_check"],
    requiredReceipts: ["runtime_observation", "stage_transition_proof", "falsifier_outcome"],
    nonImportable: ["ordered_transition", "failure_timing_dynamics"],
  },
  developmental_embodied: {
    requiredStages: ["field_contact", "adaptation_cycle", "settlement_check"],
    requiredReceipts: [
      "runtime_observation",
      "embodied_feedback",
      "falsifier_outcome",
      "settlement_receipt",
    ],
    nonImportable: ["adaptation_history", "real_cost_curve", "settlement_under_load"],
  },
};

function normalizeText(value = "") {
  return String(value || "").trim().toLowerCase();
}

function includesAny(text, needles) {
  const v = normalizeText(text);
  return needles.some((n) => v.includes(n));
}

export function inferAssemblyClass(ir, reads = {}) {
  const explicit = normalizeText(ir?.assemblyClass);
  if (ASSEMBLY_CLASSES.includes(explicit)) return explicit;

  const constraints = Array.isArray(ir?.constraints) ? ir.constraints.join(" ") : "";
  const time = normalizeText(ir?.resourceBudget?.time || "");
  const attention = normalizeText(ir?.resourceBudget?.attention || "");
  const hasJoin = String(ir?.joinPattern || "").trim().length > 0;
  const hasRepair = String(ir?.repairLogic || "").trim().length > 0;
  const isAssembly = normalizeText(ir?.granularity || ir?.shapeClass) === "assembly";
  const hasFieldCue =
    includesAny(constraints, ["compliance", "legal", "regulatory", "human", "field", "partner"]) ||
    includesAny(time, ["quarter", "month", "year"]) ||
    includesAny(attention, ["high", "sustained"]);

  if (hasFieldCue && (hasRepair || reads.testRepair?.status === "pass")) {
    return "developmental_embodied";
  }
  if (isAssembly || hasJoin || String(constraints).trim().length > 0) {
    return "path_dependent";
  }
  return "combinable";
}

export function getMaturationModel(assemblyClass) {
  return STAGE_MODEL[assemblyClass] || STAGE_MODEL.combinable;
}

export function runMaturationGate(ir, assemblyClass) {
  const failures = [];
  const warnings = [];
  const model = getMaturationModel(assemblyClass);

  if (assemblyClass === "path_dependent") {
    const hasOrderSignal =
      String(ir?.joinPattern || "").trim().length > 0 ||
      (Array.isArray(ir?.constraints) && ir.constraints.length > 0);
    if (!hasOrderSignal) failures.push("missing_order_signal");
    if (!String(ir?.timescale?.window || "").trim()) warnings.push("missing_stage_window");
  }

  if (assemblyClass === "developmental_embodied") {
    if (!String(ir?.resourceBudget?.time || "").trim()) failures.push("missing_embodied_time_budget");
    if (!String(ir?.operationalFailure || "").trim()) failures.push("missing_embodied_failure_anchor");
  }

  return {
    passed: failures.length === 0,
    failures,
    warnings,
    requiredStages: model.requiredStages,
  };
}

export function receiptsSatisfyAssemblyClass(receipts, assemblyClass) {
  const model = getMaturationModel(assemblyClass);
  const types = new Set(
    (Array.isArray(receipts) ? receipts : []).map((r) =>
      String(r?.receiptType || "").trim().toLowerCase(),
    ),
  );
  const missing = model.requiredReceipts.filter((t) => !types.has(t));
  return { passed: missing.length === 0, missing, required: model.requiredReceipts };
}
