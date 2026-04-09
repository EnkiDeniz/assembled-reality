"use client";

import { useMemo, useState } from "react";
import { promoteCandidate } from "@/lib/shapelibrary-client";

function hasReceipt(receiptEvidence = [], receiptType = "") {
  return receiptEvidence.some((entry) => String(entry?.receiptType || "") === receiptType);
}

export default function PromotionGatePanel({ draft }) {
  const [targetType, setTargetType] = useState("primitive");
  const [reproducibility, setReproducibility] = useState(0.85);
  const [utility, setUtility] = useState(0.55);
  const [libraryAction, setLibraryAction] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const requiredReceipts = useMemo(
    () => (Array.isArray(draft?.requiredReceipts) ? draft.requiredReceipts : []),
    [draft?.requiredReceipts],
  );
  const receiptEvidence = useMemo(
    () => (Array.isArray(draft?.receiptEvidence) ? draft.receiptEvidence : []),
    [draft?.receiptEvidence],
  );

  const missingReceipts = useMemo(
    () => requiredReceipts.filter((type) => !hasReceipt(receiptEvidence, type)),
    [receiptEvidence, requiredReceipts],
  );

  const thresholdsMet =
    Number(reproducibility) >= 0.8 && Number(utility) >= 0.5;
  const ready = Boolean(draft?.candidateId) && missingReceipts.length === 0 && thresholdsMet;

  async function handlePromote() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const payload = {
        candidateId: draft.candidateId,
        targetType,
        receiptEvidence,
        reproducibility: Number(reproducibility),
        utility: Number(utility),
        assemblyClass: draft.assemblyClass || undefined,
        libraryAction,
      };
      const response = await promoteCandidate(payload);
      setResult(response?.value || null);
    } catch (err) {
      const missing = err?.payload?.error?.code === "promotion_blocked_missing_receipts";
      if (missing) {
        setError("Missing receipts. Add the required evidence before promote.");
      } else {
        setError(err.message || "Promotion failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="shape-workbench-panel">
      <h2>Candidate → Promote</h2>
      <p className="shape-workbench-muted">
        Promote is enabled only when receipt and threshold gates are satisfied.
      </p>

      <div className="shape-workbench-grid">
        <p className="shape-workbench-kv">
          <strong>Candidate:</strong> {draft?.candidateId || "No candidate selected yet"}
        </p>
        <p className="shape-workbench-kv">
          <strong>Receipts present:</strong> {receiptEvidence.length}
        </p>
        <p className="shape-workbench-kv">
          <strong>Missing receipts:</strong>{" "}
          {missingReceipts.length ? missingReceipts.join(", ") : "none"}
        </p>
      </div>

      <div className="shape-workbench-grid two-col">
        <label className="shape-workbench-label">
          <span>Target type</span>
          <select value={targetType} onChange={(e) => setTargetType(e.target.value)} className="terminal-input">
            <option value="primitive">primitive</option>
            <option value="assembly">assembly</option>
          </select>
        </label>
        <label className="shape-workbench-label">
          <span>Library action</span>
          <select value={libraryAction} onChange={(e) => setLibraryAction(e.target.value)} className="terminal-input">
            <option value="pending">pending</option>
            <option value="link">link</option>
            <option value="mint">mint</option>
          </select>
        </label>
        <label className="shape-workbench-label">
          <span>Reproducibility</span>
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={reproducibility}
            onChange={(e) => setReproducibility(e.target.value)}
            className="terminal-input"
          />
        </label>
        <label className="shape-workbench-label">
          <span>Utility</span>
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={utility}
            onChange={(e) => setUtility(e.target.value)}
            className="terminal-input"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={handlePromote}
        disabled={!ready || loading}
        className="terminal-button is-primary"
      >
        {loading ? "Promoting..." : "Promote candidate"}
      </button>

      {!ready ? (
        <p className="shape-workbench-warning">
          Promotion blocked: {draft?.candidateId ? "complete missing gate requirements" : "select a candidate"}.
        </p>
      ) : null}

      {error ? <p className="shape-workbench-error">{error}</p> : null}
      {result ? (
        <p className={result.approved ? "shape-workbench-success" : "shape-workbench-warning"}>
          {result.approved
            ? "This read has been confirmed and added to the library."
            : `Promotion blocked. ${result.rationale || "Check missing receipts and thresholds."}`}
        </p>
      ) : null}
    </section>
  );
}
