"use client";

import { useState } from "react";
import { SignalChip } from "@/components/LoegosSystem";

function formatSignalLabel(signal = "") {
  const normalized = String(signal || "").trim().toLowerCase();
  if (normalized === "green") return "Grounded";
  if (normalized === "red") return "Broken";
  return "Partial";
}

function getSignalTone(signal = "") {
  const normalized = String(signal || "").trim().toLowerCase();
  if (normalized === "green") return "clear";
  if (normalized === "red") return "alert";
  return "active";
}

function formatOverrideStatus(status = "") {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "active") return "active";
  if (normalized === "orphaned") return "orphaned";
  return "stale";
}

function FindingRow({
  finding = null,
  selected = false,
  onSelect,
}) {
  return (
    <button
      type="button"
      className={`loegos-diagnostics__finding-row ${selected ? "is-active" : ""}`}
      onClick={onSelect}
    >
      <span className="loegos-diagnostics__finding-copy">
        <span className="loegos-diagnostics__finding-title">{finding?.blockId || "Block"}</span>
        <span className="loegos-diagnostics__finding-detail">
          {finding?.rationale || finding?.uncertainty || "Open inspect"}
        </span>
      </span>
      <span className="loegos-diagnostics__finding-meta">
        <SignalChip tone={getSignalTone(finding?.signal)} subtle>
          {formatSignalLabel(finding?.signal)}
        </SignalChip>
        <SignalChip tone={finding?.overrideApplied ? "neutral" : "active"} subtle>
          {finding?.overrideApplied ? "Override" : finding?.trustLevel || "L1"}
        </SignalChip>
      </span>
    </button>
  );
}

export default function WorkspaceOperateOverlayRail({
  overlay = null,
  open = false,
  pending = false,
  errorMessage = "",
  selectedFindingId = "",
  onToggleOpen,
  onRunOperate,
  onSelectFinding,
  onCreateOverride,
  onDeleteOverride,
}) {
  const [blockNote, setBlockNote] = useState("");
  const [spanNotes, setSpanNotes] = useState({});
  const findings = Array.isArray(overlay?.findings) ? overlay.findings : [];
  const selectedFinding =
    findings.find((finding) => finding.findingId === selectedFindingId) ||
    findings[0] ||
    null;
  const summary = overlay?.summary || {
    redCount: 0,
    amberCount: 0,
    greenCount: 0,
    overrideCount: 0,
  };
  const selectedOverrides = Array.isArray(selectedFinding?.overrides)
    ? selectedFinding.overrides
    : [];
  const activeBlockOverride = selectedOverrides.find(
    (override) =>
      override?.status === "active" &&
      !Number.isInteger(override?.spanStart) &&
      !Number.isInteger(override?.spanEnd),
  ) || null;

  return (
    <section className="loegos-diagnostics__section">
      <div className="loegos-diagnostics__section-head">
        <span>Inline Operate</span>
        <div className="loegos-diagnostics__actions">
          <button
            type="button"
            className="terminal-button"
            onClick={onToggleOpen}
          >
            {open ? "Hide overlay" : "Show overlay"}
          </button>
          <button
            type="button"
            className="terminal-button is-primary"
            onClick={onRunOperate}
            disabled={pending}
          >
            {pending ? "Running…" : findings.length ? "Refresh Operate" : "Run Operate"}
          </button>
        </div>
      </div>

      {errorMessage ? (
        <article className="loegos-diagnostics__callout is-alert" role="alert">
          <strong>Inline Operate could not finish.</strong>
          <p>{errorMessage}</p>
        </article>
      ) : null}

      {overlay?.stale ? (
        <article className="loegos-diagnostics__callout">
          <strong>Operate is stale.</strong>
          <p>The document or its witnesses changed after the last run. Refresh to trust this overlay.</p>
        </article>
      ) : null}

      <div className="loegos-diagnostics__metrics">
        <SignalChip tone="clear" subtle>{summary.greenCount || 0} grounded</SignalChip>
        <SignalChip tone="active" subtle>{summary.amberCount || 0} partial</SignalChip>
        <SignalChip tone="alert" subtle>{summary.redCount || 0} broken</SignalChip>
        <SignalChip tone="neutral" subtle>{summary.overrideCount || 0} overrides</SignalChip>
      </div>

      {open ? (
        <>
          <div className="loegos-diagnostics__finding-list">
            {findings.length ? (
              findings.map((finding) => (
                <FindingRow
                  key={finding.findingId}
                  finding={finding}
                  selected={finding.findingId === selectedFinding?.findingId}
                  onSelect={() => onSelectFinding?.(finding.findingId)}
                />
              ))
            ) : (
              <p className="loegos-diagnostics__empty">
                Run Operate to attach findings to the current seed.
              </p>
            )}
          </div>

          {selectedFinding ? (
            <article className="loegos-diagnostics__inspect">
              <div className="loegos-diagnostics__inspect-head">
                <strong>{selectedFinding.blockId}</strong>
                <div className="loegos-diagnostics__finding-meta">
                  <SignalChip tone={getSignalTone(selectedFinding.signal)} subtle>
                    {formatSignalLabel(selectedFinding.signal)}
                  </SignalChip>
                  <SignalChip tone={selectedFinding.overrideApplied ? "neutral" : "active"} subtle>
                    {selectedFinding.overrideApplied ? "Override" : selectedFinding.trustLevel || "L1"}
                  </SignalChip>
                </div>
              </div>

              {selectedFinding.rationale ? (
                <p className="loegos-diagnostics__inspect-copy">{selectedFinding.rationale}</p>
              ) : null}
              {selectedFinding.uncertainty ? (
                <p className="loegos-diagnostics__inspect-note">{selectedFinding.uncertainty}</p>
              ) : null}

              <div className="loegos-diagnostics__inspect-section">
                <span className="loegos-diagnostics__inspect-label">Evidence</span>
                {Array.isArray(selectedFinding.evidence) && selectedFinding.evidence.length ? (
                  selectedFinding.evidence.map((evidence) => (
                    <article key={evidence.id} className="loegos-diagnostics__inspect-evidence">
                      <strong>{evidence.documentTitle || evidence.documentKey || "Source"}</strong>
                      <p>{evidence.excerpt || ""}</p>
                    </article>
                  ))
                ) : (
                  <p className="loegos-diagnostics__empty">
                    No local evidence was attached to this finding.
                  </p>
                )}
              </div>

              {Array.isArray(selectedFinding.spans) && selectedFinding.spans.length ? (
                <div className="loegos-diagnostics__inspect-section">
                  <span className="loegos-diagnostics__inspect-label">Span hints</span>
                  <div className="loegos-diagnostics__inspect-spans">
                    {selectedFinding.spans.map((span) => {
                      const activeSpanOverride = selectedOverrides.find(
                        (override) =>
                          override?.status === "active" &&
                          override?.spanStart === span.start &&
                          override?.spanEnd === span.end,
                      ) || null;
                      const spanKey = `${selectedFinding.blockId}:${span.start}:${span.end}`;

                      return (
                        <article key={spanKey} className="loegos-diagnostics__inspect-span">
                          <div className="loegos-diagnostics__inspect-span-head">
                            <SignalChip tone={getSignalTone(span.signal)} subtle>
                              {span.text}
                            </SignalChip>
                            {activeSpanOverride ? (
                              <SignalChip tone="neutral" subtle>Override</SignalChip>
                            ) : null}
                          </div>
                          <p>{span.reason}</p>
                          {activeSpanOverride ? (
                            <button
                              type="button"
                              className="assembler-tiny-button"
                              onClick={() => onDeleteOverride?.(activeSpanOverride.id)}
                              disabled={pending}
                            >
                              Remove span override
                            </button>
                          ) : (
                            <div className="loegos-diagnostics__inspect-override">
                              <textarea
                                className="loegos-diagnostics__inspect-textarea"
                                value={spanNotes[spanKey] || ""}
                                rows={2}
                                placeholder="Why should this span be attested anyway?"
                                onChange={(event) =>
                                  setSpanNotes((previous) => ({
                                    ...previous,
                                    [spanKey]: event.target.value,
                                  }))
                                }
                              />
                              <button
                                type="button"
                                className="assembler-tiny-button"
                                onClick={() => {
                                  const note = String(spanNotes[spanKey] || "").trim();
                                  if (!note) return;
                                  onCreateOverride?.({
                                    blockId: selectedFinding.blockId,
                                    spanStart: span.start,
                                    spanEnd: span.end,
                                    note,
                                  });
                                }}
                                disabled={!String(spanNotes[spanKey] || "").trim() || pending}
                              >
                                Attest span
                              </button>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="loegos-diagnostics__inspect-section">
                <span className="loegos-diagnostics__inspect-label">Attested override</span>
                {activeBlockOverride ? (
                  <article className="loegos-diagnostics__inspect-evidence">
                    <strong>{formatOverrideStatus(activeBlockOverride.status)}</strong>
                    <p>{activeBlockOverride.note}</p>
                    <button
                      type="button"
                      className="assembler-tiny-button"
                      onClick={() => onDeleteOverride?.(activeBlockOverride.id)}
                      disabled={pending}
                    >
                      Remove override
                    </button>
                  </article>
                ) : (
                  <div className="loegos-diagnostics__inspect-override">
                    <textarea
                      className="loegos-diagnostics__inspect-textarea"
                      value={blockNote}
                      rows={3}
                      placeholder="Explain why this block should remain attested despite missing or partial evidence."
                      onChange={(event) => setBlockNote(event.target.value)}
                    />
                    <button
                      type="button"
                      className="assembler-tiny-button"
                      onClick={() => {
                        const note = String(blockNote || "").trim();
                        if (!note) return;
                        onCreateOverride?.({
                          blockId: selectedFinding.blockId,
                          note,
                        });
                      }}
                      disabled={!String(blockNote || "").trim() || pending}
                    >
                      Attest block
                    </button>
                  </div>
                )}
              </div>
            </article>
          ) : null}
        </>
      ) : (
        <p className="loegos-diagnostics__empty">
          Keep Operate hidden until you need grounded findings on the current seed.
        </p>
      )}
    </section>
  );
}
