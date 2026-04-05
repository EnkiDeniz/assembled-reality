import { useSyncExternalStore } from "react";

function subscribeToHydration() {
  return () => {};
}

function RealityMoveButton({
  move,
  onMove,
}) {
  if (!move) return null;

  return (
    <button
      type="button"
      className={`assembler-reality__move ${move.kind === "primary" ? "is-primary" : ""} ${
        move.tone ? `is-${move.tone}` : ""
      }`}
      disabled={move.disabled}
      onClick={() => onMove?.(move)}
    >
      {move.label}
    </button>
  );
}

export default function RealityInstrument({
  viewModel = null,
  variant = "panel",
  onMove,
  onExpand,
  onClose,
  children = null,
}) {
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );

  if (!mounted || !viewModel) return null;

  const tone = viewModel.tone || {};
  const stateTone = viewModel?.stateSummary?.colorTokens || null;
  const primaryMove = viewModel?.primaryMove || null;
  const secondaryMoves = (Array.isArray(viewModel?.moveSpace) ? viewModel.moveSpace : []).slice(1, 4);
  const compact = variant === "compact";

  if (compact) {
    return (
      <section
        className={`assembler-reality assembler-reality--compact ${
          viewModel.hasIssue ? "has-issue" : "is-clear"
        }`}
        style={{
          "--reality-tone": tone.fill,
          "--reality-tone-soft": tone.soft,
          "--reality-tone-border": tone.border,
          "--reality-tone-glow": tone.glow,
          "--reality-tone-text": tone.text,
        }}
      >
        <div className="assembler-reality__compact-copy">
          <div className="assembler-reality__compact-meta">
            <span className="assembler-reality__eyebrow">Reality</span>
            {viewModel.stateChipLabel ? (
              <span
                className="assembler-assembly-chip assembler-reality__state-chip"
                style={{
                  "--assembly-tone": stateTone?.fill,
                  "--assembly-tone-soft": stateTone?.soft,
                  "--assembly-tone-border": stateTone?.border,
                  "--assembly-tone-glow": stateTone?.glow,
                  "--assembly-tone-text": stateTone?.text,
                }}
              >
                {viewModel.stateChipLabel}
              </span>
            ) : null}
          </div>
          <strong className="assembler-reality__compact-headline">{viewModel.positionLabel}</strong>
          <p className="assembler-reality__compact-summary">{viewModel.compactSummary}</p>
        </div>

        <div className="assembler-reality__compact-actions">
          {primaryMove ? <RealityMoveButton move={primaryMove} onMove={onMove} /> : null}
          {onExpand ? (
            <button type="button" className="assembler-reality__move" onClick={onExpand}>
              Open
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section
      className={`assembler-reality assembler-reality--${variant} ${
        viewModel.hasIssue ? "has-issue" : "is-clear"
      }`}
      style={{
        "--reality-tone": tone.fill,
        "--reality-tone-soft": tone.soft,
        "--reality-tone-border": tone.border,
        "--reality-tone-glow": tone.glow,
        "--reality-tone-text": tone.text,
      }}
    >
      <div className="assembler-reality__head">
        <div className="assembler-reality__copy">
          <div className="assembler-reality__meta">
            <span className="assembler-reality__eyebrow">{viewModel.panelTitle}</span>
            {viewModel.stateChipLabel ? (
              <span
                className="assembler-assembly-chip assembler-reality__state-chip"
                style={{
                  "--assembly-tone": stateTone?.fill,
                  "--assembly-tone-soft": stateTone?.soft,
                  "--assembly-tone-border": stateTone?.border,
                  "--assembly-tone-glow": stateTone?.glow,
                  "--assembly-tone-text": stateTone?.text,
                }}
              >
                {viewModel.stateChipLabel}
              </span>
            ) : null}
          </div>
          <strong className="assembler-reality__headline">{viewModel.headline}</strong>
          {viewModel.positionLabel ? (
            <p className="assembler-reality__position">{viewModel.positionLabel}</p>
          ) : null}
        </div>
        {onClose ? (
          <button type="button" className="assembler-reality__close" onClick={onClose}>
            Close
          </button>
        ) : null}
      </div>

      {viewModel.summary ? (
        <p className="assembler-reality__summary">{viewModel.summary}</p>
      ) : null}

      {viewModel.evidence?.length ? (
        <div className="assembler-reality__evidence">
          {viewModel.evidence.map((entry) => (
            <span key={`${entry.label}-${entry.value}`} className="assembler-reality__evidence-chip">
              <span className="assembler-reality__evidence-label">{entry.label}</span>
              <span className="assembler-reality__evidence-value">{entry.value}</span>
            </span>
          ))}
        </div>
      ) : null}

      {viewModel.moveSpace?.length ? (
        <div className="assembler-reality__moves">
          {primaryMove ? <RealityMoveButton move={primaryMove} onMove={onMove} /> : null}
          {secondaryMoves.length ? (
            <div className="assembler-reality__moves-secondary">
              {secondaryMoves.map((move) => (
                <RealityMoveButton key={move.key} move={move} onMove={onMove} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {children}
    </section>
  );
}
