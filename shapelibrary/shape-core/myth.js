/**
 * Myth inputMode: map structured myth decomposition onto operational IR fields
 * before Five Reads / gates. Provenance only — not evidential truth.
 */
export function applyMythDecompression(ir) {
  const md = ir.mythDecompression || {};
  const inv = String(md.canonicalInvariant || ir.invariant || "");
  const fals = String(md.falsifier || ir.falsifier || "");
  const op = md.triLayerMap?.operational;
  let observables = Array.isArray(ir.observables) ? [...ir.observables] : [];
  if (!observables.length) {
    if (Array.isArray(op)) observables = op.map((x) => String(x));
    else if (op != null && op !== "") observables = [String(op)];
  }
  const operationalFailure = String(
    ir.operationalFailure || md.operationalFailure || "myth-derived operational signal",
  );
  const transferPrediction = String(
    ir.transferPrediction || md.transferPrediction || "observe structural response across one iteration",
  );
  return {
    ...ir,
    invariant: inv,
    falsifier: fals,
    observables,
    operationalFailure,
    transferPrediction,
    metadata: {
      ...ir.metadata,
      source: ir.metadata?.source || "myth_handle",
      trace: { ...(ir.metadata?.trace || {}), isMythDerived: true },
    },
  };
}

export function validateMythPayload(ir) {
  const md = ir.mythDecompression;
  if (!md || typeof md !== "object") {
    return { ok: false, message: "mythDecompression object required for inputMode myth" };
  }
  if (!String(md.canonicalInvariant || "").trim()) {
    return { ok: false, message: "mythDecompression.canonicalInvariant required" };
  }
  if (!String(md.falsifier || "").trim()) {
    return { ok: false, message: "mythDecompression.falsifier required" };
  }
  const op = md.triLayerMap?.operational;
  const hasOperational =
    (Array.isArray(op) && op.length > 0) ||
    (typeof op === "string" && op.trim().length > 0) ||
    (Array.isArray(ir.observables) && ir.observables.length > 0);
  if (!hasOperational) {
    return {
      ok: false,
      message: "At least one operational mapping required (triLayerMap.operational or observables)",
    };
  }
  return { ok: true };
}

/** Receipt types that count as myth-only evidence (cannot satisfy promotion alone for myth-derived). */
export const MYTH_ONLY_RECEIPT_TYPES = new Set(["myth_interpretation", "myth_handle_only", "myth_only"]);

export function hasNonMythReceipt(receipts) {
  if (!Array.isArray(receipts) || !receipts.length) return false;
  return receipts.some((r) => !MYTH_ONLY_RECEIPT_TYPES.has(String(r.receiptType || "").trim()));
}
