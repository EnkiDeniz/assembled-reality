import InlineAssist from "@/components/InlineAssist";

export default function ReceiptSealDialog({
  open = false,
  draft = null,
  deltaStatement = "",
  onChangeDelta,
  audit = null,
  auditPending = false,
  auditError = "",
  overrideAcknowledged = false,
  onChangeOverrideAcknowledged,
  pending = false,
  onRefreshAudit,
  onClose,
  onSeal,
}) {
  if (!open) return null;

  const requiresOverrideAcknowledgement = Boolean(audit?.requiresOverrideAcknowledgement);
  const canSealBase = Boolean(audit) && !auditPending && !pending && (
    Boolean(audit.sealReady) || Boolean(audit.canOverride)
  );
  const canSeal = canSealBase && (!requiresOverrideAcknowledgement || overrideAcknowledged);
  const primaryLabel = pending
    ? "Sealing…"
    : requiresOverrideAcknowledgement && !overrideAcknowledged
      ? "Acknowledge overrides to seal"
    : audit?.sealReady
      ? "Seal receipt"
      : audit?.canOverride
        ? "Seal anyway"
        : "Seal blocked";
  const auditButtonLabel = auditPending
    ? "Auditing…"
    : audit
      ? "Refresh audit"
      : deltaStatement.trim()
        ? "Refresh audit"
        : "Audit will update as you write";

  return (
    <div className="assembler-sheet assembler-sheet--workspace is-open">
      <div className="assembler-sheet__backdrop" onClick={pending ? undefined : onClose} aria-hidden="true" />
      <div className="assembler-sheet__panel assembler-sheet__panel--workspace assembler-sheet__panel--receipt-seal">
        <div className="assembler-sheet__header">
          <div className="assembler-home__copy">
            <span className="assembler-sheet__eyebrow">Seal receipt</span>
            <span className="assembler-sheet__title">
              {draft?.title || "Receipt draft"}
            </span>
          </div>

          <button type="button" className="assembler-sheet__close" onClick={pending ? undefined : onClose}>
            Done
          </button>
        </div>

        <div className="assembler-sheet__content">
          <section className="assembler-receipt-audit__section">
            <div className="assembler-receipt-audit__section-head">
              <span className="assembler-receipt-audit__label">Delta</span>
              <span className="assembler-receipt-audit__hint">One operator sentence</span>
            </div>
            <textarea
              className="assembler-root-panel__textarea assembler-receipt-audit__textarea"
              value={deltaStatement}
              onChange={(event) => onChangeDelta?.(event.target.value)}
              rows={4}
              placeholder="State the one operator sentence describing what changed."
              disabled={pending}
            />

            <InlineAssist
              error={!deltaStatement.trim() && audit ? "Write one operator sentence describing what changed." : ""}
              visible={Boolean(!deltaStatement.trim() && audit)}
              assemblyStep={0}
              onRequestAssist={!auditPending ? onRefreshAudit : undefined}
              assistPending={auditPending}
            />
          </section>

          <section className="assembler-receipt-audit__section">
            <div className="assembler-receipt-audit__section-head">
              <span className="assembler-receipt-audit__label">Pre-seal audit</span>
              <button
                type="button"
                className="terminal-button"
                onClick={pending || auditPending ? undefined : onRefreshAudit}
                disabled={pending || auditPending || !deltaStatement.trim()}
              >
                {auditButtonLabel}
              </button>
            </div>

            {audit ? (
              <div className="assembler-receipt-audit__summary">
                <p className="assembler-receipt-audit__summary-text">{audit.summary}</p>
                {audit.usedFallback ? (
                  <p className="assembler-receipt-audit__summary-note">
                    Seven was unavailable, so the box used structural checks instead.
                  </p>
                ) : null}
              </div>
            ) : auditError ? (
              <div className="assembler-receipt-audit__summary is-empty">
                <p className="assembler-receipt-audit__summary-text">{auditError}</p>
              </div>
            ) : (
              <div className="assembler-receipt-audit__summary is-empty">
                <p className="assembler-receipt-audit__summary-text">
                  {deltaStatement.trim()
                    ? "The audit is reading Root alignment, evidence contact, and Seed alignment as you write."
                    : "Audit will update as you write the delta statement."}
                </p>
              </div>
            )}

            <div className="assembler-receipt-audit__checks">
              {(audit?.checks || []).map((check) => (
                <article
                  key={check.key}
                  className={`assembler-receipt-audit__check is-${check.status}`}
                >
                  <div className="assembler-receipt-audit__check-head">
                    <strong>{check.label}</strong>
                    <span>{check.status}</span>
                  </div>
                  <p>{check.message}</p>
                </article>
              ))}
            </div>

            {audit?.warnings?.length || audit?.overrideSummary?.overrideCount ? (
              <div className="assembler-receipt-audit__summary">
                <div className="assembler-receipt-audit__section-head">
                  <span className="assembler-receipt-audit__label">Attested overrides</span>
                  <span className="assembler-receipt-audit__hint">
                    {audit?.overrideSummary?.activeOverrideCount || 0} active
                  </span>
                </div>
                <p className="assembler-receipt-audit__summary-note">
                  {audit?.overrideSummary?.overrideCount || 0} override
                  {(audit?.overrideSummary?.overrideCount || 0) === 1 ? "" : "s"} are attached to this receipt path.
                </p>
                {audit?.overrideSummary?.staleOverrideCount ? (
                  <p className="assembler-receipt-audit__summary-note">
                    {audit.overrideSummary.staleOverrideCount} override
                    {audit.overrideSummary.staleOverrideCount === 1 ? "" : "s"} no longer match current text.
                  </p>
                ) : null}
                {audit?.overrideSummary?.orphanedOverrideCount ? (
                  <p className="assembler-receipt-audit__summary-note">
                    {audit.overrideSummary.orphanedOverrideCount} override
                    {audit.overrideSummary.orphanedOverrideCount === 1 ? "" : "s"} lost their target block.
                  </p>
                ) : null}
                {(audit?.warnings || []).map((warning) => (
                  <p key={warning} className="assembler-receipt-audit__summary-note">
                    {warning}
                  </p>
                ))}
                {requiresOverrideAcknowledgement ? (
                  <label className="assembler-receipt-audit__acknowledgement">
                    <input
                      type="checkbox"
                      checked={overrideAcknowledged}
                      onChange={(event) => onChangeOverrideAcknowledged?.(event.target.checked)}
                      disabled={pending}
                    />
                    <span>
                      I acknowledge that attested overrides will remain visible in the sealed receipt context.
                    </span>
                  </label>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>

        <div className="assembler-sheet__footer">
          <button
            type="button"
            className="assembler-sheet__primary"
            onClick={canSeal ? onSeal : undefined}
            disabled={!canSeal}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
