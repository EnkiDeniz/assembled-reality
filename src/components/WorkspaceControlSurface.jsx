import RealityInstrument from "@/components/RealityInstrument";
import RootBar from "@/components/RootBar";

function ModeButton({ active = false, label, onClick, attentionTone = "" }) {
  return (
    <button
      type="button"
      className={`assembler-control-surface__mode ${active ? "is-active" : ""}`}
      onClick={onClick}
    >
      <span>{label}</span>
      {attentionTone ? (
        <span
          className={`assembler-control-surface__mode-alert is-${attentionTone}`}
          aria-hidden="true"
        />
      ) : null}
    </button>
  );
}

function ActionButton({ disabled = false, label, onClick, tone = "" }) {
  return (
    <button
      type="button"
      className={`assembler-control-surface__action ${tone ? `is-${tone}` : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

export default function WorkspaceControlSurface({
  viewModel,
  isMobileLayout = false,
  onOpenBoxes,
  onOpenBoxHome,
  onSelectPhase,
  onOpenIntake,
  onOpenSpeak,
  onManageBox,
  onOpenConfirmation,
  instrument = null,
  onInstrumentMove,
  receiptAttentionTone = "",
  onOpenRoot,
}) {
  return (
    <div className={`assembler-control-surface ${isMobileLayout ? "is-mobile" : ""}`}>
      <div className="assembler-control-surface__identity">
        <button type="button" className="assembler-control-surface__link" onClick={onOpenBoxes}>
          Boxes
        </button>
        <button type="button" className="assembler-control-surface__title" onClick={onOpenBoxHome}>
          <span
            className="assembler-control-surface__title-dot"
            aria-hidden="true"
            style={{
              "--assembly-tone": viewModel?.stateColorTokens?.fill,
              "--assembly-tone-border": viewModel?.stateColorTokens?.border,
              "--assembly-tone-glow": viewModel?.stateColorTokens?.glow,
            }}
          />
          <span className="assembler-control-surface__title-copy">
            <span className="assembler-control-surface__title-label">
              {viewModel?.currentBoxTitle || "Untitled Box"}
            </span>
            <span className="assembler-control-surface__title-subtitle">
              {viewModel?.currentSurfaceLabel || viewModel?.currentSeedTitle || "Assembly lane"}
            </span>
          </span>
        </button>
      </div>

      <div className="assembler-control-surface__modes">
        <ModeButton
          active={viewModel?.boxPhase === "lane"}
          label="Assembly lane"
          onClick={() => onSelectPhase("lane")}
        />
        <ModeButton
          active={viewModel?.boxPhase === "create"}
          label="Seed"
          onClick={() => onSelectPhase("create")}
        />
        <ModeButton
          active={viewModel?.boxPhase === "operate"}
          label="Operate"
          onClick={() => onSelectPhase("operate")}
        />
        <ModeButton
          active={viewModel?.boxPhase === "receipts"}
          label="Receipts"
          onClick={() => onSelectPhase("receipts")}
          attentionTone={receiptAttentionTone}
        />
      </div>

      <div className="assembler-control-surface__actions">
        <ActionButton label="Add source" onClick={onOpenIntake} tone="primary" />
        <ActionButton label="Speak" onClick={onOpenSpeak} />
        {!isMobileLayout ? (
          <ActionButton label="Box" onClick={onManageBox} />
        ) : null}
      </div>

      <RootBar
        rootText={viewModel?.rootText}
        hasRoot={viewModel?.hasRoot}
        stateSummary={viewModel?.stateSummary}
        confirmationCount={viewModel?.confirmationCount || 0}
        onOpen={onOpenRoot}
        onOpenConfirmation={onOpenConfirmation}
      />

      {instrument ? (
        <RealityInstrument
          viewModel={instrument}
          variant="compact"
          onMove={onInstrumentMove}
        />
      ) : null}
    </div>
  );
}
