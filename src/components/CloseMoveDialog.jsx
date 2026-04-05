function CloseMoveSentence({ label, text }) {
  return (
    <article className="assembler-close-move__sentence">
      <span className="assembler-close-move__sentence-label">{label}</span>
      <p>{text || "No line returned."}</p>
    </article>
  );
}

export default function CloseMoveDialog({
  open = false,
  result = null,
  mode = "reroute",
  deltaStatement = "",
  pending = false,
  errorMessage = "",
  onChangeDelta,
  onClose,
  onPrimaryAction,
  onSaveDraft,
}) {
  if (!open || !result) return null;

  const primaryLabel =
    mode === "seal"
      ? pending
        ? "Sealing…"
        : "Seal"
      : pending
        ? "Rerouting…"
        : "Reroute";

  return (
    <div className="assembler-sheet assembler-sheet--workspace is-open">
      <div
        className="assembler-sheet__backdrop"
        onClick={pending ? undefined : onClose}
        aria-hidden="true"
      />
      <div className="assembler-sheet__panel assembler-sheet__panel--workspace assembler-sheet__panel--close-move">
        <div className="assembler-sheet__header">
          <div className="assembler-home__copy">
            <span className="assembler-sheet__eyebrow">Close move</span>
            <span className="assembler-sheet__title">
              {mode === "seal" ? "Seal or save the move" : "Reroute from the read"}
            </span>
          </div>

          <button
            type="button"
            className="assembler-sheet__close"
            onClick={pending ? undefined : onClose}
          >
            Done
          </button>
        </div>

        <div className="assembler-sheet__content assembler-close-move">
          <div className="assembler-close-move__intro">
            <p>
              {mode === "seal"
                ? "Operate found a convergent enough line to close. Seal it now or save the draft for later."
                : "Operate found a real turn, but not a proof-ready one. Reroute the seed without forcing a receipt."}
            </p>
          </div>

          <div className="assembler-close-move__sentences">
            <CloseMoveSentence label="Aim" text={result?.aim?.sentence} />
            <CloseMoveSentence label="Ground" text={result?.ground?.sentence} />
            <CloseMoveSentence label="Bridge" text={result?.bridge?.sentence} />
          </div>

          <section className="assembler-close-move__section">
            <div className="assembler-close-move__section-head">
              <span>Next move</span>
              <strong>
                {result?.convergence || "working"} · gradient {result?.gradient || "?"}
              </strong>
            </div>
            <p className="assembler-close-move__next">{result?.nextMove || "No move returned."}</p>
          </section>

          <section className="assembler-close-move__section">
            <div className="assembler-close-move__section-head">
              <span>Delta</span>
              <strong>One operator sentence</strong>
            </div>
            <textarea
              className="assembler-root-panel__textarea assembler-close-move__textarea"
              value={deltaStatement}
              onChange={(event) => onChangeDelta?.(event.target.value)}
              rows={4}
              placeholder="State the operator sentence that this move closes or reroutes."
              disabled={pending}
            />
          </section>

          {errorMessage ? (
            <p className="assembler-close-move__error">{errorMessage}</p>
          ) : null}
        </div>

        <div className="assembler-sheet__footer assembler-close-move__footer">
          <button
            type="button"
            className="terminal-button"
            onClick={onSaveDraft}
            disabled={pending}
          >
            Save draft
          </button>
          <button
            type="button"
            className="assembler-sheet__primary"
            onClick={onPrimaryAction}
            disabled={pending}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
