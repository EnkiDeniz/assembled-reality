import { getAssemblyColorTokens } from "@/lib/assembly-architecture";

export default function RootBar({
  rootText = "",
  hasRoot = false,
  stateSummary = null,
  confirmationCount = 0,
  onOpen,
  compact = false,
}) {
  const stateTone = stateSummary?.colorTokens || getAssemblyColorTokens(stateSummary?.colorStep);
  const stateLabel = stateSummary?.label || "Name box";
  const phaseLabel = stateSummary?.phaseLabel || "";
  const eyebrowLabel = hasRoot ? "Root" : "Box";
  const actionLabel = hasRoot ? rootText : "Name box";

  return (
    <div className={`assembler-root-bar ${compact ? "is-compact" : ""} ${hasRoot ? "" : "is-empty"}`}>
      <button
        type="button"
        className="assembler-root-bar__main"
        onClick={onOpen}
        aria-label={hasRoot ? `Edit Root: ${rootText}` : "Name box"}
      >
        <span className="assembler-root-bar__eyebrow">{eyebrowLabel}</span>
        <span className="assembler-root-bar__text">{actionLabel}</span>
      </button>

      <div className="assembler-root-bar__meta">
        {hasRoot ? (
          <span
            className="assembler-assembly-chip assembler-root-bar__state"
            style={{
              "--assembly-tone": stateTone.fill,
              "--assembly-tone-soft": stateTone.soft,
              "--assembly-tone-border": stateTone.border,
              "--assembly-tone-glow": stateTone.glow,
              "--assembly-tone-text": stateTone.text,
            }}
          >
            {stateLabel}
          </span>
        ) : null}
        {hasRoot && phaseLabel ? (
          <span className="assembler-root-bar__phase">{phaseLabel}</span>
        ) : null}
        {confirmationCount > 0 ? (
          <span
            className={`assembler-root-bar__queue ${stateSummary?.isLooping ? "is-looping" : ""}`}
          >
            ⊘ {confirmationCount}
          </span>
        ) : null}
      </div>
    </div>
  );
}
