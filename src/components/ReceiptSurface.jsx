import { useState } from "react";
import { formatWorkspaceLogTime, getWorkspaceLogActionColor } from "@/lib/document-blocks";

function ReceiptStatusPill({ label, tone = "" }) {
  return (
    <span className={`assembler-receipt-surface__pill ${tone ? `is-${tone}` : ""}`}>
      {label}
    </span>
  );
}

export default function ReceiptSurface({
  logEntries = [],
  drafts = [],
  receiptSummary = null,
  receiptPending = false,
  activeDocumentTitle = "",
  onCreateReceipt,
  onSealReceipt,
  onRunOperate,
  onExportReceipt,
  onExportDocument,
  onOpenGetReceipts,
  onRetryRemoteSync,
  onOpenVerifyUrl,
  isMobileLayout = false,
}) {
  const summary = receiptSummary || {
    draftCount: Array.isArray(drafts) ? drafts.length : 0,
    latestDraftTitle: "",
    latestDraftStatusLabel: "Local only",
    latestDraftSummary: "",
    connectionStatusLabel: "Not connected",
    connectionStatus: "DISCONNECTED",
    syncLine: "Draft a local receipt when the box is ready.",
    latestRemoteError: "",
    recentDrafts: Array.isArray(drafts) ? drafts : [],
  };
  const latestDraft = summary.latestDraft || null;
  const hasLatestProof = Boolean(latestDraft);
  const showConnectAction =
    summary.connectionStatus !== "CONNECTED" &&
    summary.courthouseAction?.kind === "connect";
  const canRetryLatest = Boolean(summary.latestCanRetryRemoteSync && latestDraft?.id);
  const canVerifyLatest = Boolean(summary.latestVerifyUrl && latestDraft?.id);
  const [showMore, setShowMore] = useState(false);
  return (
    <section className="assembler-phase assembler-phase--receipts">
      <header className="assembler-phase__header">
        <div className="assembler-phase__copy">
          <span className="assembler-phase__eyebrow">Receipts</span>
          <h2 className="assembler-phase__title">Preserve the proof.</h2>
        </div>
        <div className="assembler-phase__meta">
          <span>{summary.draftCount} draft{summary.draftCount === 1 ? "" : "s"}</span>
        </div>
      </header>

      <div className="assembler-receipt-surface">
        <section className="assembler-receipt-surface__hero">
          <div className="assembler-receipt-surface__hero-copy">
            <span className="assembler-receipt-surface__eyebrow">Latest proof</span>
            <h3 className="assembler-receipt-surface__title">
              {hasLatestProof ? summary.latestDraftTitle : `Draft a receipt for ${activeDocumentTitle || "this box"}`}
            </h3>
            <p className="assembler-receipt-surface__body">
              {hasLatestProof
                ? summary.latestDraftSummary || "Review the latest proof."
                : "Local proof. Portable when sealed."}
            </p>
          </div>

          <div className="assembler-receipt-surface__hero-meta">
            <ReceiptStatusPill
              label={summary.latestDraftStatusLabel || "Local only"}
              tone={summary.latestRemoteError ? "error" : summary.latestDraftStatus === "REMOTE_DRAFT" ? "success" : ""}
            />
            {summary.courthouseStatusLine && summary.courthouseStatusLine !== summary.latestDraftStatusLabel ? (
              <ReceiptStatusPill
                label={summary.courthouseStatusLine}
                tone={summary.courthouseStatusTone || ""}
              />
            ) : null}
          </div>

          <div className="assembler-receipt-surface__hero-actions">
            <button
              type="button"
              className="terminal-button is-primary"
              onClick={onCreateReceipt}
              disabled={receiptPending}
            >
              {receiptPending ? "Drafting…" : "Draft receipt"}
            </button>
            {hasLatestProof && summary.latestDraftStatus !== "SEALED" && onSealReceipt ? (
              <button type="button" className="terminal-button" onClick={() => onSealReceipt(summary.latestDraft)}>
                Seal receipt
              </button>
            ) : null}
            {canRetryLatest ? (
              <button
                type="button"
                className="terminal-button"
                onClick={() => onRetryRemoteSync?.(latestDraft)}
              >
                Retry sync
              </button>
            ) : null}
            {canVerifyLatest ? (
              <button
                type="button"
                className="assembler-receipt-surface__text-link"
                onClick={() => onOpenVerifyUrl?.(summary.latestVerifyUrl)}
              >
                Verify
              </button>
            ) : null}
            {isMobileLayout && onRunOperate ? (
              <button type="button" className="terminal-button" onClick={onRunOperate}>
                Operate
              </button>
            ) : null}
            {showMore ? (
              <>
                {showConnectAction ? (
                  <button type="button" className="terminal-button" onClick={onOpenGetReceipts}>
                    {summary.courthouseAction?.label || "Connect GetReceipts"}
                  </button>
                ) : null}
                {!isMobileLayout ? (
                  <button type="button" className="terminal-button" onClick={onExportReceipt}>
                    Export receipts
                  </button>
                ) : null}
                {!isMobileLayout ? (
                  <button type="button" className="terminal-button" onClick={onExportDocument}>
                    Export doc
                  </button>
                ) : null}
              </>
            ) : (showConnectAction || !isMobileLayout) ? (
              <button
                type="button"
                className="assembler-receipt-surface__text-link"
                onClick={() => setShowMore(true)}
              >
                More
              </button>
            ) : null}
          </div>
        </section>

        <section className="assembler-receipt-surface__panel">
          <div className="assembler-receipt-surface__panel-head">
            <span>Recent receipt drafts</span>
            <span>{summary.recentDrafts?.length || 0}</span>
          </div>

          <div className="assembler-receipt-surface__drafts">
            {summary.recentDrafts?.length ? (
              summary.recentDrafts.map((draft) => (
                <article key={draft.id} className="assembler-receipt-surface__draft">
                  <div className="assembler-receipt-surface__draft-head">
                    <strong>{draft.title || "Untitled receipt"}</strong>
                    <div className="assembler-receipt-surface__draft-meta">
                      <ReceiptStatusPill label={draft.statusLabel || "Local only"} />
                      {draft.courthouseStatusLine ? (
                        <ReceiptStatusPill
                          label={draft.courthouseStatusLine}
                          tone={draft.courthouseStatusTone || ""}
                        />
                      ) : null}
                    </div>
                  </div>
                  <p className="assembler-receipt-surface__draft-body">
                    {draft.payload?.decision ||
                      draft.payload?.learned ||
                      draft.implications ||
                      draft.interpretation ||
                      "Receipt draft preserved for later review."}
                  </p>
                  {draft.courthouseAction?.kind || draft.verifyUrl ? (
                    <div className="assembler-receipt-surface__draft-actions">
                      {draft.canRetryRemoteSync ? (
                        <button
                          type="button"
                          className="terminal-button"
                          onClick={() => onRetryRemoteSync?.(draft)}
                        >
                          Retry sync
                        </button>
                      ) : null}
                      {draft.verifyUrl ? (
                        <button
                          type="button"
                          className="terminal-button"
                          onClick={() => onOpenVerifyUrl?.(draft.verifyUrl)}
                        >
                          Verify
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="assembler-receipt-surface__empty">
                No receipt drafts yet. Draft one after Seed or Operate.
              </p>
            )}
          </div>
        </section>

        <section className="assembler-receipt-surface__panel">
          <div className="assembler-receipt-surface__panel-head">
            <span>Evidence trail</span>
            <span>{logEntries.length}</span>
          </div>

          <div className="assembler-log">
            {logEntries.length ? (
              logEntries.map((entry) => (
                <div key={entry.id} className="assembler-log__row">
                  <span className="assembler-log__time">{formatWorkspaceLogTime(entry.time)}</span>
                  <span
                    className="assembler-log__action"
                    style={{ color: getWorkspaceLogActionColor(entry.action) }}
                  >
                    {entry.action}
                  </span>
                  <span className="assembler-log__detail">{entry.detail}</span>
                </div>
              ))
            ) : (
              <p className="assembler-log__empty">No visible receipt events yet.</p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
