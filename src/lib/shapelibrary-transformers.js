const STATUS_COPY = {
  not_sealable_yet:
    "I can see the shape of this problem, but I need more information before I can name it. Here's what to look for.",
  candidate_primitive:
    "Here's my current read. It's a hypothesis, not a verdict. Here's how to test it.",
  candidate_assembly:
    "Here's my current read. It's a hypothesis, not a verdict. Here's how to test it.",
  primitive_match:
    "This matches a known pattern. Here's what that means and what usually helps.",
  assembly_match:
    "This matches a known pattern. Here's what that means and what usually helps.",
  rejection:
    "This does not pass the current gate conditions. Repair the input and rerun.",
};

const ASSEMBLY_COPY = {
  combinable: "Combinable (parts can be assembled without strict order dependence).",
  path_dependent: "Path-dependent (the order things happen matters).",
  developmental_embodied:
    "Developmental/embodied (formation requires staged adaptation and lived contact).",
};

export function translateAnalyzeStatus(value = null) {
  if (!value || typeof value !== "object") return "No read yet.";
  const key = String(value.status || value.resultType || "").trim();
  return STATUS_COPY[key] || "Read produced. Review details below.";
}

export function translateAssemblyClass(assemblyClass = "") {
  const key = String(assemblyClass || "").trim();
  return ASSEMBLY_COPY[key] || "Assembly class not resolved yet.";
}

export function isHypothesisState(value = null) {
  const key = String(value?.status || value?.resultType || "").trim();
  return key === "not_sealable_yet" || key.startsWith("candidate_");
}

export function isConfirmedState(value = null) {
  const key = String(value?.status || value?.resultType || "").trim();
  return key === "primitive_match" || key === "assembly_match";
}

export function pickPrimaryCandidate(value = null) {
  if (!value || typeof value !== "object") return null;
  if (value.candidateId) return value.candidateId;
  return null;
}

export function requiredReceiptsForCandidate(candidate = null) {
  const klass = String(candidate?.assemblyClass || "").trim();
  if (klass === "path_dependent") {
    return ["runtime_observation", "stage_transition_proof", "falsifier_outcome"];
  }
  if (klass === "developmental_embodied") {
    return ["runtime_observation", "embodied_feedback", "falsifier_outcome", "settlement_receipt"];
  }
  return ["runtime_observation"];
}
