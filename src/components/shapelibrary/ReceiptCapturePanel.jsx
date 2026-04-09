"use client";

import { useEffect, useMemo, useState } from "react";
import { listCandidates } from "@/lib/shapelibrary-client";
import { requiredReceiptsForCandidate } from "@/lib/shapelibrary-transformers";

function sanitizeText(value) {
  return String(value || "").trim();
}

function buildReceiptPayload(type, draft, attachmentName = "") {
  if (type === "runtime_observation") {
    return { note: sanitizeText(draft.runtime_observation) };
  }
  if (type === "stage_transition_proof") {
    return {
      note: sanitizeText(draft.stage_transition_proof),
      attachmentName: sanitizeText(attachmentName),
    };
  }
  if (type === "falsifier_outcome") {
    return { note: sanitizeText(draft.falsifier_outcome) };
  }
  if (type === "embodied_feedback") {
    return { note: sanitizeText(draft.embodied_feedback) };
  }
  if (type === "settlement_receipt") {
    return { note: sanitizeText(draft.settlement_receipt) };
  }
  return { note: "" };
}

export default function ReceiptCapturePanel({ candidateId, assemblyClass, onDraftChange }) {
  const [allCandidates, setAllCandidates] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(candidateId || "");
  const [attachmentName, setAttachmentName] = useState("");
  const [draft, setDraft] = useState({
    runtime_observation: "",
    stage_transition_proof: "",
    falsifier_outcome: "",
    embodied_feedback: "",
    settlement_receipt: "",
  });

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await listCandidates();
        if (!active) return;
        const candidates = Array.isArray(response?.value) ? response.value : [];
        setAllCandidates(candidates);
        if (!candidateId && candidates[0]?.candidateId) {
          setSelectedCandidateId(candidates[0].candidateId);
        }
      } catch (err) {
        if (active) setError(err.message || "Could not load candidates.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [candidateId]);

  const selectedCandidate = useMemo(
    () =>
      allCandidates.find((candidate) => candidate.candidateId === selectedCandidateId) || null,
    [allCandidates, selectedCandidateId],
  );

  const resolvedClass = String(
    assemblyClass || selectedCandidate?.assemblyClass || "combinable",
  ).trim();
  const required = requiredReceiptsForCandidate({ assemblyClass: resolvedClass });

  useEffect(() => {
    if (typeof onDraftChange !== "function") return;
    const receiptEvidence = required
      .map((type) => ({
        receiptType: type,
        payload: buildReceiptPayload(type, draft, attachmentName),
      }))
      .filter((entry) => sanitizeText(entry.payload.note));

    onDraftChange({
      candidateId: selectedCandidateId || "",
      assemblyClass: resolvedClass,
      requiredReceipts: required,
      receiptEvidence,
    });
  }, [attachmentName, draft, onDraftChange, required, resolvedClass, selectedCandidateId]);

  function updateDraft(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <section className="shape-workbench-panel">
      <h2>Receipt Capture</h2>
      <p className="shape-workbench-muted">
        Capture only the receipts required for the current assembly path.
      </p>

      {error ? <p className="shape-workbench-error">{error}</p> : null}

      <label className="shape-workbench-label">
        <span>Candidate</span>
        <select
          value={selectedCandidateId}
          onChange={(event) => setSelectedCandidateId(event.target.value)}
          className="terminal-input"
          disabled={loading}
        >
          <option value="">Select candidate</option>
          {allCandidates.map((candidate) => (
            <option key={candidate.candidateId} value={candidate.candidateId}>
              {candidate.candidateId} · {candidate.resultType} · {candidate.assemblyClass}
            </option>
          ))}
        </select>
      </label>

      <p className="shape-workbench-kv">
        <strong>Required for {resolvedClass || "unknown"}:</strong> {required.join(", ")}
      </p>

      {required.includes("runtime_observation") ? (
        <label className="shape-workbench-label">
          <span>Runtime observation</span>
          <textarea
            rows={3}
            className="terminal-textarea"
            value={draft.runtime_observation}
            onChange={(event) => updateDraft("runtime_observation", event.target.value)}
          />
        </label>
      ) : null}

      {required.includes("stage_transition_proof") ? (
        <>
          <label className="shape-workbench-label">
            <span>Stage transition proof</span>
            <textarea
              rows={3}
              className="terminal-textarea"
              value={draft.stage_transition_proof}
              onChange={(event) => updateDraft("stage_transition_proof", event.target.value)}
            />
          </label>
          <label className="shape-workbench-label">
            <span>Optional attachment</span>
            <input
              type="file"
              onChange={(event) => setAttachmentName(event.target.files?.[0]?.name || "")}
              className="terminal-input"
            />
          </label>
        </>
      ) : null}

      {required.includes("falsifier_outcome") ? (
        <label className="shape-workbench-label">
          <span>Falsifier outcome</span>
          <textarea
            rows={3}
            className="terminal-textarea"
            value={draft.falsifier_outcome}
            onChange={(event) => updateDraft("falsifier_outcome", event.target.value)}
          />
        </label>
      ) : null}

      {required.includes("embodied_feedback") ? (
        <label className="shape-workbench-label">
          <span>Embodied feedback</span>
          <textarea
            rows={3}
            className="terminal-textarea"
            value={draft.embodied_feedback}
            onChange={(event) => updateDraft("embodied_feedback", event.target.value)}
          />
        </label>
      ) : null}

      {required.includes("settlement_receipt") ? (
        <label className="shape-workbench-label">
          <span>Settlement receipt</span>
          <textarea
            rows={3}
            className="terminal-textarea"
            value={draft.settlement_receipt}
            onChange={(event) => updateDraft("settlement_receipt", event.target.value)}
          />
        </label>
      ) : null}

      {attachmentName ? (
        <p className="shape-workbench-meta">
          Attached: {attachmentName}
        </p>
      ) : null}
    </section>
  );
}
