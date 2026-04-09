/**
 * Deterministic braid-kernel-style pass: synthetic pressure from read/gate signals.
 * v0.2: additive only — does not flip v0.1 gate.passed by default.
 */
export function runKernelPass(ir, reads, gate, features) {
  if (!features?.enableKernel) return null;

  let pressure = 0;
  if (reads.readJoins?.status !== "pass") pressure += 0.35;
  if (reads.testRepair?.status !== "pass") pressure += 0.35;
  const warnCount = Array.isArray(gate.warnings) ? gate.warnings.length : 0;
  if (warnCount) pressure += 0.08 * Math.min(warnCount, 3);

  let stateMode = ir.stateMode || "candidate";
  if (pressure >= 0.65) stateMode = "unstable";
  else if (pressure >= 0.35) stateMode = "viable";
  else stateMode = "viable";

  return {
    stateMode,
    kernelGateDetails: {
      buildPhase: "reinforced_structure",
      breakPhase: pressure >= 0.5 ? "constraint_pressure_high" : "constraint_pressure_low",
      pressureScore: Math.min(1, pressure),
      warnings: Array.isArray(gate.warnings) ? [...gate.warnings] : [],
    },
  };
}
