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
  onExportReceipt,
  onExportDocument,
  onOpenGetReceipts,
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
  const showConnectAction = summary.connectionStatus !== "CONNECTED";
  const syncTone = summary.latestRemoteError
    ? "error"
    : summary.connectionStatus === "CONNECTED"
      ? "success"
      : "";

  return (
    <section className="assembler-phase assembler-phase--receipts">
      <header className="assembler-phase__header">
        <div className="assembler-phase__copy">
          <span className="assembler-phase__eyebrow">Receipts</span>
          <h2 className="assembler-phase__title">Preserve the proof.</h2>
          <p className="assembler-phase__subtitle">
            Receipts keep the current proof state legible without blocking local work.
          </p>
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
                ? summary.latestDraftSummary || "The latest proof is ready to review or push."
                : "Use Draft receipt to preserve the current source, assembly, or Operate result as local proof."}
            </p>
          </div>

          <div className="assembler-receipt-surface__hero-meta">
            <ReceiptStatusPill
              label={summary.latestDraftStatusLabel || "Local only"}
              tone={summary.latestRemoteError ? "error" : summary.latestDraftStatus === "REMOTE_DRAFT" ? "success" : ""}
            />
            <ReceiptStatusPill label={summary.connectionStatusLabel || "Not connected"} tone={syncTone} />
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
            {showConnectAction ? (
              <button type="button" className="terminal-button" onClick={onOpenGetReceipts}>
                Connect GetReceipts
              </button>
            ) : null}
            <button type="button" className="terminal-button" onClick={onExportReceipt}>
              Export receipts
            </button>
            <button type="button" className="terminal-button" onClick={onExportDocument}>
              Export doc
            </button>
          </div>
        </section>

        <section className="assembler-receipt-surface__status-grid">
          <article className="assembler-receipt-surface__status-card">
            <span className="assembler-receipt-surface__status-label">Receipt draft status</span>
            <strong className="assembler-receipt-surface__status-value">
              {summary.latestDraftStatusLabel || "No draft yet"}
            </strong>
            <p className="assembler-receipt-surface__status-detail">
              {summary.syncLine}
            </p>
          </article>

          <article className="assembler-receipt-surface__status-card">
            <span className="assembler-receipt-surface__status-label">GetReceipts</span>
            <strong className="assembler-receipt-surface__status-value">
              {summary.connectionStatusLabel || "Not connected"}
            </strong>
            <p className="assembler-receipt-surface__status-detail">
              {summary.latestRemoteError
                ? `${summary.latestRemoteError} Local proof is still preserved.`
                : showConnectAction
                  ? "Connection is optional. Local drafts stay first-class."
                  : "Connected for optional remote proof pushes."}
            </p>
          </article>
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
                    <ReceiptStatusPill label={draft.statusLabel || "Local only"} />
                  </div>
                  <p className="assembler-receipt-surface__draft-body">
                    {draft.payload?.decision ||
                      draft.payload?.learned ||
                      draft.implications ||
                      draft.interpretation ||
                      "Receipt draft preserved for later review."}
                  </p>
                </article>
              ))
            ) : (
              <p className="assembler-receipt-surface__empty">
                No receipt drafts yet. Draft one after Create or Operate.
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
