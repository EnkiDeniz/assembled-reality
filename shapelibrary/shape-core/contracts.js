export const INTENT_LAYERS = [
  "ontology",
  "behavior",
  "communication",
  "intervention",
  "evaluation",
];

export const RUN_TYPES = ["single", "evaluation", "promotion_check"];
export const INPUT_MODES = ["human", "ai", "myth"];
export const EXECUTION_MODES = ["exploratory", "standard"];
export const GRANULARITIES = ["primitive", "assembly", "unknown"];
export const ASSEMBLY_CLASSES = ["combinable", "path_dependent", "developmental_embodied"];
export const ASSUMPTION_STATUSES = ["explicit", "inferred", "repaired"];
export const CONFIDENCE_SOURCES = ["convergence", "heuristic", "single_run"];
export const RESULT_TYPES = [
  "primitive_match",
  "assembly_match",
  "candidate_primitive",
  "candidate_assembly",
  "rejection",
];

export const EDGE_TYPES = ["amplifies", "inhibits", "gates", "saturates", "extracts"];

export const PROMOTION_STATES = ["candidate", "provisional", "promoted", "deprecated"];

export const ERROR_CODES = {
  INVALID_INPUT: "invalid_input",
  INVALID_LAYER_EXECUTION: "invalid_layer_execution",
  GATE_FAILED: "gate_failed",
  PROMOTION_BLOCKED_MISSING_RECEIPTS: "promotion_blocked_missing_receipts",
  MYTH_MODE_DISABLED: "myth_mode_disabled",
  PROMOTION_BLOCKED_MYTH_EVIDENCE_ONLY: "promotion_blocked_myth_evidence_only",
};
