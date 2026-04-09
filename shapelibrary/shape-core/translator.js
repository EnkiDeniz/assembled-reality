import { randomUUID } from "node:crypto";

export function normalizeToCanonicalIR(payload = {}) {
  const source = payload?.ir && typeof payload.ir === "object" ? payload.ir : payload;
  const now = new Date().toISOString();
  const trace = { ...(source?.metadata?.trace || {}) };
  const irVersion = source.irVersion === "0.2" ? "0.2" : "0.1";

  return {
    irVersion,
    runId: String(source.runId || randomUUID()),
    runType: String(source.runType || "single"),
    inputMode: String(source.inputMode || "human"),
    mode: String(source.mode || "standard"),
    intentLayer: String(source.intentLayer || ""),
    assumptionStatus: String(source.assumptionStatus || "explicit"),
    observables: Array.isArray(source.observables) ? source.observables : [],
    timescale: source.timescale || { horizon: "short", window: "unknown" },
    constraints: Array.isArray(source.constraints) ? source.constraints : [],
    resourceBudget: source.resourceBudget || {
      time: "unknown",
      money: "unknown",
      attention: "unknown",
      other: [],
    },
    operationalFailure: String(source.operationalFailure || ""),
    invariant: String(source.invariant || ""),
    variables: Array.isArray(source.variables) ? source.variables : [],
    granularity: String(source.granularity || source.shapeClass || "unknown"),
    shapeClass: String(source.shapeClass || source.granularity || "unknown"),
    constituentShapes: Array.isArray(source.constituentShapes) ? source.constituentShapes : [],
    assemblyRule: source.assemblyRule || { edges: [] },
    joinPattern: String(source.joinPattern || ""),
    pressureClaim: String(source.pressureClaim || ""),
    failureSignature: String(source.failureSignature || ""),
    repairLogic: String(source.repairLogic || ""),
    falsifier: String(source.falsifier || ""),
    transferPrediction: String(source.transferPrediction || ""),
    evidenceRefs: Array.isArray(source.evidenceRefs) ? source.evidenceRefs : [],
    metadata: {
      source: String(source?.metadata?.source || source.source || "api"),
      createdAt: String(source?.metadata?.createdAt || now),
      trace,
    },
    ...(source.mythDecompression && typeof source.mythDecompression === "object"
      ? { mythDecompression: source.mythDecompression }
      : {}),
    ...(source.aliases && typeof source.aliases === "object" ? { aliases: source.aliases } : {}),
    ...(source.crossDomainMap && typeof source.crossDomainMap === "object"
      ? { crossDomainMap: source.crossDomainMap }
      : {}),
    ...(source.stateMode ? { stateMode: String(source.stateMode) } : {}),
    ...(source.assemblyClass ? { assemblyClass: String(source.assemblyClass) } : {}),
  };
}
