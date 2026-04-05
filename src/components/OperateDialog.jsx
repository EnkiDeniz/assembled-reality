function formatOperateTimestamp(value) {
  const parsed = Date.parse(String(value || ""));
  if (Number.isNaN(parsed)) return "Just now";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(parsed));
}

function formatConvergenceLabel(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "hallucinating") return "Hallucinating";
  if (normalized === "divergent") return "Divergent";
  return "Convergent";
}

function OperateSentenceCard({ label, sentence }) {
  return (
    <article className="assembler-operate__sentence">
      <div className="assembler-operate__sentence-head">
        <span className="assembler-operate__sentence-label">{label}</span>
        <span className="assembler-operate__sentence-level">{sentence?.level || "L1"}</span>
      </div>
      <p className="assembler-operate__sentence-text">{sentence?.sentence || ""}</p>
      <p className="assembler-operate__sentence-rationale">{sentence?.rationale || ""}</p>
    </article>
  );
}

export default function OperateDialog({
  open = false,
  pending = false,
  errorMessage = "",
  result = null,
  receiptPending = false,
  onDraftReceipt,
  onAskSeven,
  onClose,
}) {
  if (!open) return null;

  const includedDocuments = Array.isArray(result?.includedDocuments)
    ? result.includedDocuments
    : [];
  const summaryLine = result
    ? [
        result.includedSourceCount
          ? `${result.includedSourceCount} source${result.includedSourceCount === 1 ? "" : "s"}`
          : "0 sources",
        result.includesAssembly ? "seed included" : "no seed",
      ].join(" · ")
    : "";

  return (
    <div className="assembler-image-chooser assembler-image-chooser--operate">
      <button
        type="button"
        className="assembler-image-chooser__backdrop"
        aria-label="Close Operate result"
        onClick={pending || receiptPending ? undefined : onClose}
      />

      <div
        className="assembler-image-chooser__panel assembler-operate"
        role="dialog"
        aria-modal="true"
        aria-labelledby="operate-dialog-title"
      >
        <div className="assembler-image-chooser__header">
          <div className="assembler-image-chooser__copy">
            <span className="assembler-sheet__eyebrow">Operate</span>
            <h2 id="operate-dialog-title" className="assembler-image-chooser__title">
              {result?.boxTitle || "Untitled Box"}
            </h2>
          </div>

          <button
            type="button"
            className="assembler-sheet__close"
            onClick={pending || receiptPending ? undefined : onClose}
            disabled={pending || receiptPending}
          >
            Close
          </button>
        </div>

        {result ? (
          <div className="assembler-image-chooser__meta">
            <span>{formatOperateTimestamp(result.ranAt)}</span>
            <span>{summaryLine}</span>
          </div>
        ) : null}

        {pending && !result ? (
          <div className="assembler-operate__body">
            <p className="assembler-operate__loading">
              Operate is reading this box.
            </p>
          </div>
        ) : result ? (
          <div className="assembler-operate__body">
            <div className="assembler-operate__sentences">
              <OperateSentenceCard label="Aim" sentence={result.aim} />
              <OperateSentenceCard label="Ground" sentence={result.ground} />
              <OperateSentenceCard label="Bridge" sentence={result.bridge} />
            </div>

            <div className="assembler-operate__summary-grid">
              <div className="assembler-operate__summary-card">
                <span className="assembler-operate__summary-label">Gradient</span>
                <strong className="assembler-operate__summary-value">{result.gradient}</strong>
              </div>
              <div className="assembler-operate__summary-card">
                <span className="assembler-operate__summary-label">Convergence</span>
                <strong className="assembler-operate__summary-value">
                  {formatConvergenceLabel(result.convergence)}
                </strong>
              </div>
              <div className="assembler-operate__summary-card">
                <span className="assembler-operate__summary-label">Floor</span>
                <strong className="assembler-operate__summary-value">{result.trustFloor}</strong>
              </div>
              <div className="assembler-operate__summary-card">
                <span className="assembler-operate__summary-label">Ceiling</span>
                <strong className="assembler-operate__summary-value">{result.trustCeiling}</strong>
              </div>
            </div>

            <div className="assembler-operate__next">
              <span className="assembler-operate__next-label">Next move</span>
              <p className="assembler-operate__next-text">{result.nextMove}</p>
            </div>

            {includedDocuments.length ? (
              <div className="assembler-operate__included">
                <span className="assembler-operate__next-label">Included material</span>
                <div className="assembler-operate__included-list">
                  {includedDocuments.map((document) => (
                    <div
                      key={`${document.documentKey}-${document.role}`}
                      className="assembler-operate__included-row"
                    >
                      <span className="assembler-operate__included-title">
                        {document.title || "Untitled document"}
                      </span>
                      <span className="assembler-operate__included-meta">
                        {document.sourceSummary || document.role}
                        {document.blockCount ? ` · ${document.blockCount} blocks` : ""}
                        {document.truncated ? " · partial read" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="assembler-operate__body">
            <p className="assembler-operate__loading">
              Operate could not read this box.
            </p>
          </div>
        )}

        {errorMessage ? (
          <p className="assembler-operate__error" aria-live="polite">
            {errorMessage}
          </p>
        ) : null}

        <div className="assembler-delete-dialog__actions assembler-operate__actions">
          <button
            type="button"
            className="terminal-button"
            onClick={onClose}
            disabled={pending || receiptPending}
          >
            Close
          </button>
          <button
            type="button"
            className="terminal-button"
            onClick={onAskSeven}
            disabled={!result || pending || receiptPending}
          >
            Ask Seven to audit
          </button>
          <button
            type="button"
            className="terminal-button is-primary"
            onClick={onDraftReceipt}
            disabled={!result || pending || receiptPending}
          >
            {receiptPending ? "Saving…" : "Save draft"}
          </button>
        </div>
      </div>
    </div>
  );
}
