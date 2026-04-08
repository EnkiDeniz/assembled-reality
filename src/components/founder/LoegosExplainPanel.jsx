"use client";

import { useMemo, useState } from "react";
import { ShapeGlyph, SignalChip } from "@/components/LoegosSystem";
import { getOverlaySignalTone } from "@/lib/operate-overlay";
import { buildExplainPanelView } from "@/lib/founder-renderer";

function ExplainSection({ label = "", children }) {
  if (!children) return null;

  return (
    <section className="loegos-explain__section">
      <span className="loegos-explain__label">{label}</span>
      {children}
    </section>
  );
}

export default function LoegosExplainPanel({
  block = null,
  finding = null,
  contextTitle = "",
  contextCopy = "",
  contextExcerptLabel = "",
  contextExcerpt = "",
  witnessBlock = null,
  witnessTitle = "",
  activeTitle = "",
  mobileOpen = false,
  onCloseMobile,
  overridePending = false,
  onCreateOverride,
  onDeleteOverride,
}) {
  const [blockNoteDraft, setBlockNoteDraft] = useState({ key: "", value: "" });
  const noteKey = `${block?.id || ""}:${finding?.findingId || ""}`;
  const blockNote = blockNoteDraft.key === noteKey ? blockNoteDraft.value : "";
  const view = useMemo(
    () =>
      buildExplainPanelView({
        block,
        finding,
        contextTitle,
        contextCopy,
        contextExcerptLabel,
        contextExcerpt,
        witnessBlock,
        witnessTitle,
        activeTitle,
      }),
    [activeTitle, block, contextCopy, contextExcerpt, contextExcerptLabel, contextTitle, finding, witnessBlock, witnessTitle],
  );

  return (
    <aside
      className={`loegos-explain ${mobileOpen ? "is-mobile-open" : ""}`}
      data-testid="founder-shell-read"
      aria-label="Lœgos read"
    >
      <button
        type="button"
        className="loegos-explain__backdrop"
        onClick={onCloseMobile}
        aria-label="Close block inspection"
      />

      <div className="loegos-explain__sheet">
        <div className="loegos-explain__head">
          <div className="loegos-explain__heading">
            <span className="founder-shell__panel-eyebrow">Lœgos read</span>
            <strong className="founder-shell__panel-title">
              {view.empty ? view.title : `Line ${String((block?.sourcePosition || 0) + 1).padStart(3, "0")}`}
            </strong>
          </div>
          <button
            type="button"
            className="loegos-explain__close"
            onClick={onCloseMobile}
            aria-label="Close explainability panel"
          >
            Close
          </button>
        </div>

        {view.empty ? (
          <div className="loegos-explain__empty">
            <p className="founder-shell__panel-copy">{view.copy}</p>
            {view.contextExcerpt ? (
              <div className="founder-shell__excerpt">
                {view.contextExcerptLabel ? (
                  <span className="founder-shell__excerpt-label">{view.contextExcerptLabel}</span>
                ) : null}
                <p className="founder-shell__excerpt-copy">{view.contextExcerpt}</p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="loegos-explain__body">
            <div className="loegos-explain__summary" data-testid={finding ? "workspace-operate-inspect" : undefined}>
              <div className="loegos-explain__shape">
                <ShapeGlyph shapeKey={view.shapeKey} size={18} />
                <span>{view.shapeLabel}</span>
              </div>
              <div className="loegos-explain__chips">
                <SignalChip tone={view.signalKey === "neutral" ? "neutral" : getOverlaySignalTone(view.signalKey)} subtle>
                  {view.signalLabel}
                </SignalChip>
                {view.trustLevel ? (
                  <SignalChip tone={view.signalKey === "override" ? "neutral" : "active"} subtle>
                    {view.trustLevel}
                  </SignalChip>
                ) : null}
              </div>
            </div>

            <ExplainSection label="Signal rationale">
              <p className="founder-shell__panel-copy">{view.signalRationale}</p>
              {view.uncertainty ? (
                <p className="loegos-explain__note">{view.uncertainty}</p>
              ) : null}
            </ExplainSection>

            <ExplainSection label="Shape rationale">
              <p className="founder-shell__panel-copy">{view.shapeRationale}</p>
            </ExplainSection>

            {view.compilerChecks?.length ? (
              <ExplainSection label="Compiler truth">
                <div className="loegos-explain__checks">
                  {view.compilerChecks.map((check) => (
                    <article
                      key={check.key}
                      className={`loegos-explain__check loegos-explain__check--${check.tone || "neutral"}`}
                    >
                      <strong>{check.label}</strong>
                      <p>{check.detail}</p>
                    </article>
                  ))}
                </div>
              </ExplainSection>
            ) : null}

            {view.compareSummary ? (
              <ExplainSection label="Commitment boundary">
                <p className="founder-shell__panel-copy">{view.compareSummary}</p>
              </ExplainSection>
            ) : null}

            <ExplainSection label="Trust chain">
              <div className="loegos-explain__list">
                {view.trustChain.map((item) => (
                  <p key={item} className="loegos-explain__list-item">
                    {item}
                  </p>
                ))}
              </div>
            </ExplainSection>

            <ExplainSection label="Evidence">
              {view.evidence.length ? (
                <div className="loegos-explain__evidence-list">
                  {view.evidence.map((evidence) => (
                    <article key={evidence.id} className="loegos-explain__evidence">
                      <strong>{evidence.documentTitle || evidence.documentKey || "Source"}</strong>
                      <p>{evidence.excerpt || ""}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="loegos-explain__empty-copy">
                  No local witness excerpt is attached to this line yet.
                </p>
              )}
            </ExplainSection>

            <ExplainSection label="What would change the signal">
              <p className="founder-shell__panel-copy">{view.signalChangeHint}</p>
            </ExplainSection>

            <ExplainSection label="Attested override">
              {view.activeBlockOverride ? (
                <article className="loegos-explain__evidence">
                  <strong>Attested by human declaration</strong>
                  <p>{view.activeBlockOverride.note}</p>
                  {finding?.overrideApplied ? (
                    <p className="loegos-explain__note">
                      Underlying machine read: {finding?.baseSignal || finding?.signal || "amber"} at{" "}
                      {finding?.baseTrustLevel || finding?.trustLevel || "L1"}.
                    </p>
                  ) : null}
                  <button
                    type="button"
                    className="assembler-tiny-button"
                    onClick={() => onDeleteOverride?.(view.activeBlockOverride.id)}
                    disabled={overridePending}
                    data-testid="workspace-attest-block-remove"
                  >
                    Remove override
                  </button>
                </article>
              ) : finding?.findingId && onCreateOverride ? (
                <div className="loegos-explain__override">
                  <textarea
                    className="loegos-explain__textarea"
                    value={blockNote}
                    rows={3}
                    placeholder="Explain why this line should remain attested despite missing or partial evidence."
                    data-testid="workspace-attest-block-input"
                    onChange={(event) =>
                      setBlockNoteDraft({
                        key: noteKey,
                        value: event.target.value,
                      })
                    }
                  />
                  <button
                    type="button"
                    className="assembler-tiny-button"
                    onClick={() => {
                      onCreateOverride?.({
                        blockId: finding.blockId,
                        note: blockNote,
                      });
                      setBlockNoteDraft({
                        key: noteKey,
                        value: "",
                      });
                    }}
                    disabled={!String(blockNote || "").trim() || overridePending}
                    data-testid="workspace-attest-block-submit"
                  >
                    Attest block
                  </button>
                </div>
              ) : (
                <p className="loegos-explain__empty-copy">
                  No attested override on this line.
                </p>
              )}
            </ExplainSection>

            {view.contextExcerpt ? (
              <div className="founder-shell__excerpt">
                {view.contextExcerptLabel ? (
                  <span className="founder-shell__excerpt-label">{view.contextExcerptLabel}</span>
                ) : null}
                <p className="founder-shell__excerpt-copy">{view.contextExcerpt}</p>
              </div>
            ) : null}

            {view.witnessExcerpt ? (
              <div className="founder-shell__excerpt">
                {view.witnessExcerptLabel ? (
                  <span className="founder-shell__excerpt-label">{view.witnessExcerptLabel}</span>
                ) : null}
                <p className="founder-shell__excerpt-copy">{view.witnessExcerpt}</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </aside>
  );
}
