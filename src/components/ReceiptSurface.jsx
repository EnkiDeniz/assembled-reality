import { formatWorkspaceLogTime, getWorkspaceLogActionColor } from "@/lib/document-blocks";

export default function ReceiptSurface({
  logEntries = [],
  receiptPending = false,
  onCreateReceipt,
  onExportReceipt,
  onExportDocument,
}) {
  return (
    <section className="assembler-phase assembler-phase--receipts">
      <header className="assembler-phase__header">
        <div className="assembler-phase__copy">
          <span className="assembler-phase__eyebrow">Receipts</span>
          <h2 className="assembler-phase__title">Preserve the proof.</h2>
          <p className="assembler-phase__subtitle">
            Review the visible trail of listening, selection, assembly, Operate, and receipt drafting.
          </p>
        </div>
        <div className="assembler-phase__meta">
          <span>{logEntries.length} entr{logEntries.length === 1 ? "y" : "ies"}</span>
        </div>
      </header>

      <div className="assembler-log">
        <div className="assembler-log__top">
          <div className="assembler-log__header">
            RECEIPTS · {logEntries.length} entr{logEntries.length === 1 ? "y" : "ies"}
          </div>
          <div className="assembler-log__actions">
            <button type="button" className="assembler-tiny-button" onClick={onCreateReceipt}>
              {receiptPending ? "Drafting…" : "Draft receipt"}
            </button>
            <button type="button" className="assembler-tiny-button" onClick={onExportReceipt}>
              Export receipts
            </button>
            <button type="button" className="assembler-tiny-button" onClick={onExportDocument}>
              Export doc
            </button>
          </div>
        </div>

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
  );
}
