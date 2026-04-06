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

function getTrustLevelStep(level) {
  const normalized = String(level || "").trim().toUpperCase();
  if (normalized === "L1") return 1;
  if (normalized === "L2") return 3;
  if (normalized === "L3") return 5;
  return 0;
}

function getConvergenceTone(convergence) {
  const normalized = String(convergence || "").trim().toLowerCase();
  if (normalized === "convergent") return getAssemblyColorTokens(4);
  if (normalized === "divergent") return getAssemblyColorTokens(6);
  return {
    fill: "var(--danger-fill)", soft: "var(--danger-soft)",
    border: "var(--danger-border)", glow: "var(--danger-glow)",
    text: "var(--danger-text)",
  };
}

function OperateSentenceCard({ label, sentence }) {
  const trustTone = getAssemblyColorTokens(getTrustLevelStep(sentence?.level));
  return (
    <article
      className="assembler-operate__sentence"
      style={{ "--sentence-trust-tone": trustTone.fill }}
    >
      <div className="assembler-operate__sentence-head">
        <span className="assembler-operate__sentence-label">{label}</span>
        <span
          className="assembler-assembly-chip"
          style={{
            "--assembly-tone": trustTone.fill,
            "--assembly-tone-soft": trustTone.soft,
            "--assembly-tone-border": trustTone.border,
            "--assembly-tone-glow": trustTone.glow,
            "--assembly-tone-text": trustTone.text,
          }}
        >
          {sentence?.level || "L1"}
        </span>
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
  const normalizedErrorMessage = String(errorMessage || "").trim();
  const isRateLimited = normalizedErrorMessage.includes("429");
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
          <span className="assembler-phase__eyebrow">Weld</span>
          <h2 className="assembler-phase__title">Operate on the box.</h2>
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
            {receiptPending ? "Saving…" : "Save draft"}
          </button>
        </div>

        {normalizedErrorMessage ? (
          isRateLimited ? (
            <div className="loegos-rate-limit" role="alert">
              <h3 className="loegos-rate-limit__title">Operate is rate-limited right now.</h3>
              <p className="loegos-rate-limit__body">
                The user should see more than generic failure here. Wait a moment, keep the box
                intact, then retry once capacity returns.
              </p>
            </div>
          ) : (
            <div className="loegos-rate-limit" role="alert">
              <h3 className="loegos-rate-limit__title">Operate could not finish.</h3>
              <p className="loegos-rate-limit__body">{normalizedErrorMessage}</p>
            </div>
          )
        ) : null}

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
                  {(() => {
                    const cTone = getConvergenceTone(result.convergence);
                    return (
                      <span
                        className="assembler-assembly-chip"
                        style={{
                          "--assembly-tone": cTone.fill,
                          "--assembly-tone-soft": cTone.soft,
                          "--assembly-tone-border": cTone.border,
                          "--assembly-tone-glow": cTone.glow,
                          "--assembly-tone-text": cTone.text,
                        }}
                      >
                        {formatConvergenceLabel(result.convergence)}
                      </span>
                    );
                  })()}
                </strong>
              </div>
              <div className="assembler-operate__summary-card">
                <span className="assembler-operate__summary-label">Floor</span>
                <strong className="assembler-operate__summary-value">
                  {(() => {
                    const fTone = getAssemblyColorTokens(getTrustLevelStep(result.trustFloor));
                    return (
                      <span
                        className="assembler-assembly-chip"
                        style={{
                          "--assembly-tone": fTone.fill,
                          "--assembly-tone-soft": fTone.soft,
                          "--assembly-tone-border": fTone.border,
                          "--assembly-tone-glow": fTone.glow,
                          "--assembly-tone-text": fTone.text,
                        }}
                      >
                        {result.trustFloor}
                      </span>
                    );
                  })()}
                </strong>
              </div>
              <div className="assembler-operate__summary-card">
                <span className="assembler-operate__summary-label">Ceiling</span>
                <strong className="assembler-operate__summary-value">
                  {(() => {
                    const ceilTone = getAssemblyColorTokens(getTrustLevelStep(result.trustCeiling));
                    return (
                      <span
                        className="assembler-assembly-chip"
                        style={{
                          "--assembly-tone": ceilTone.fill,
                          "--assembly-tone-soft": ceilTone.soft,
                          "--assembly-tone-border": ceilTone.border,
                          "--assembly-tone-glow": ceilTone.glow,
                          "--assembly-tone-text": ceilTone.text,
                        }}
                      >
                        {result.trustCeiling}
                      </span>
                    );
                  })()}
                </strong>
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
              Add a real source. Run Operate.
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
