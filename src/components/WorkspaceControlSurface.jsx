function ModeButton({ active = false, label, onClick }) {
  return (
    <button
      type="button"
      className={`assembler-control-surface__mode ${active ? "is-active" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function ActionButton({ active = false, disabled = false, label, onClick, tone = "" }) {
  return (
    <button
      type="button"
      className={`assembler-control-surface__action ${active ? "is-active" : ""} ${tone ? `is-${tone}` : ""}`}
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
  activeSidecar = "",
  onOpenBoxes,
  onOpenBoxHome,
  onSelectPhase,
  onOpenIntake,
  onOpenSpeak,
  onOpenSeven,
  onOpenStage,
  onRunOperate,
  onOpenReceipts,
  onManageBox,
}) {
  return (
    <div className={`assembler-control-surface ${isMobileLayout ? "is-mobile" : ""}`}>
      <div className="assembler-control-surface__identity">
        <button type="button" className="assembler-control-surface__link" onClick={onOpenBoxes}>
          Boxes
        </button>
        <button type="button" className="assembler-control-surface__title" onClick={onOpenBoxHome}>
          <span className="assembler-control-surface__title-label">{viewModel?.currentBoxTitle || "Untitled Box"}</span>
          <span className="assembler-control-surface__title-subtitle">
            {viewModel?.currentSeedTitle || "Seed"}
          </span>
        </button>
      </div>

      <div className="assembler-control-surface__modes">
        <ModeButton
          active={viewModel?.boxPhase === "think"}
          label="Think"
          onClick={() => onSelectPhase("think")}
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
        />
      </div>

      <div className="assembler-control-surface__actions">
        <ActionButton label="Add source" onClick={onOpenIntake} />
        <ActionButton label="Speak" onClick={onOpenSpeak} />
        <ActionButton active={activeSidecar === "seven"} label="Seven" onClick={onOpenSeven} />
        <ActionButton
          active={activeSidecar === "stage"}
          label={viewModel?.stageCount ? `Stage ${viewModel.stageCount}` : "Stage"}
          onClick={onOpenStage}
        />
        <ActionButton
          active={viewModel?.boxPhase === "operate"}
          label="Operate"
          onClick={onRunOperate}
          disabled={!viewModel?.canRunOperate}
          tone="primary"
        />
        <ActionButton
          active={viewModel?.boxPhase === "receipts"}
          label="Receipts"
          onClick={onOpenReceipts}
        />
        {!isMobileLayout ? (
          <ActionButton label="Box" onClick={onManageBox} />
        ) : null}
      </div>
    </div>
  );
}
