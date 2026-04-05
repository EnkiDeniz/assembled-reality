import { getAssemblyColorTokens, getGradientColorStep } from "@/lib/assembly-architecture";

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

export default function OperateSurface({
  viewModel = null,
  pending = false,
  errorMessage = "",
  result = null,
  receiptPending = false,
  onRunOperate,
  onDraftReceipt,
  onAskSeven,
}) {
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
  const gradientTone =
    viewModel?.gradientColorTokens ||
    getAssemblyColorTokens(getGradientColorStep(result?.gradient));

  return (
    <section className="assembler-phase assembler-phase--operate">
      <header className="assembler-phase__header">
        <div className="assembler-phase__copy">
          <span className="assembler-phase__eyebrow">Operate</span>
          <h2 className="assembler-phase__title">Read the box.</h2>
          <p className="assembler-phase__subtitle">
            Operate projects the smallest honest structure the box can support right now.
          </p>
        </div>
        <div className="assembler-phase__meta">
          <span>{viewModel?.title || result?.boxTitle || "Untitled Box"}</span>
          <span>{viewModel?.includedSourceCount || result?.includedSourceCount || 0} source{(viewModel?.includedSourceCount || result?.includedSourceCount || 0) === 1 ? "" : "s"}</span>
          <span>{viewModel?.includesAssembly || result?.includesAssembly ? "Seed ready" : "No seed yet"}</span>
        </div>
      </header>

      <div className="assembler-operate assembler-operate--surface">
        <div className="assembler-operate__surface-actions">
          <button
            type="button"
            className="terminal-button is-primary"
            onClick={onRunOperate}
            disabled={!viewModel?.canRunOperate || pending}
          >
            {pending ? "Operating…" : "Run Operate"}
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
            className="terminal-button"
            onClick={onDraftReceipt}
            disabled={!result || pending || receiptPending}
          >
            {receiptPending ? "Drafting…" : "Draft receipt"}
          </button>
        </div>

        {result ? (
          <div className="assembler-image-chooser__meta assembler-operate__surface-meta">
            <span>{formatOperateTimestamp(result.ranAt)}</span>
            <span>{summaryLine}</span>
          </div>
        ) : null}

        {pending && !result ? (
          <div className="assembler-operate__body">
            <p className="assembler-operate__loading">Operate is reading this box.</p>
          </div>
        ) : result ? (
          <div className="assembler-operate__body">
            <div className="assembler-operate__sentences">
              <OperateSentenceCard label="Aim" sentence={result.aim} />
              <OperateSentenceCard label="Ground" sentence={result.ground} />
              <OperateSentenceCard label="Bridge" sentence={result.bridge} />
            </div>

            <div className="assembler-operate__summary-grid">
              <div
                className="assembler-operate__summary-card assembler-operate__summary-card--gradient"
                style={{
                  "--assembly-tone": gradientTone.fill,
                  "--assembly-tone-soft": gradientTone.soft,
                  "--assembly-tone-border": gradientTone.border,
                  "--assembly-tone-glow": gradientTone.glow,
                  "--assembly-tone-text": gradientTone.text,
                }}
              >
                <span className="assembler-operate__summary-label">Gradient</span>
                <strong className="assembler-operate__summary-value assembler-operate__summary-value--gradient">
                  <span className="assembler-operate__gradient-badge">{result.gradient}</span>
                </strong>
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
              Run Operate when the box has a real source or seed.
            </p>
          </div>
        )}

        {errorMessage ? (
          <p className="assembler-operate__error" aria-live="polite">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
}
