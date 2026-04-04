function DockButton({ active = false, disabled = false, tone = "", label, shortLabel = "", onClick }) {
  return (
    <button
      type="button"
      className={`assembler-mobile-dock__button ${active ? "is-active" : ""} ${tone ? `is-${tone}` : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <span>{shortLabel || label}</span>
    </button>
  );
}

export default function MobileControlDock({
  open = false,
  viewModel,
  onToggleOpen,
  onOpenBoxes,
  onSelectPhase,
  onOpenIntake,
  onOpenPhoto,
  onOpenSpeak,
  onToggleAi,
  onRunOperate,
  onOpenReceipts,
}) {
  return (
    <div className={`assembler-mobile-dock ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="assembler-mobile-dock__toggle"
        onClick={onToggleOpen}
        aria-label={open ? "Collapse controls" : "Open controls"}
      >
        <span className="assembler-mobile-dock__toggle-mode">
          {viewModel?.boxPhase === "operate"
            ? "Operate"
            : viewModel?.boxPhase === "receipts"
              ? "Receipts"
              : viewModel?.boxPhase === "create"
                ? "Seed"
                : "Think"}
        </span>
        <span className="assembler-mobile-dock__toggle-action">
          {viewModel?.primaryActionLabel || "Open"}
        </span>
      </button>

      {open ? (
        <div className="assembler-mobile-dock__panel">
          <div className="assembler-mobile-dock__column">
            <DockButton active={viewModel?.boxPhase === "think"} shortLabel="T" label="Think" onClick={() => onSelectPhase("think")} />
            <DockButton active={viewModel?.boxPhase === "create"} shortLabel="S" label="Seed" onClick={() => onSelectPhase("create")} />
            <DockButton active={viewModel?.boxPhase === "operate"} shortLabel="O" label="Operate" onClick={() => onSelectPhase("operate")} />
            <DockButton active={viewModel?.boxPhase === "receipts"} shortLabel="R" label="Receipts" onClick={() => onSelectPhase("receipts")} />
          </div>
          <div className="assembler-mobile-dock__column">
            <DockButton shortLabel="+" label="Add source" onClick={onOpenIntake} />
            <DockButton shortLabel="Pic" label="Photo" onClick={onOpenPhoto} />
            <DockButton shortLabel="Mic" label="Speak" onClick={onOpenSpeak} />
            <DockButton active={Boolean(viewModel?.aiOpen)} shortLabel="7" label="Seven" onClick={onToggleAi} />
            <DockButton
              tone="primary"
              shortLabel="Go"
              label="Operate now"
              onClick={onRunOperate}
              disabled={!viewModel?.canRunOperate}
            />
            <DockButton shortLabel="Box" label="Boxes" onClick={onOpenBoxes} />
            <DockButton shortLabel="Rcpt" label="Open receipts" onClick={onOpenReceipts} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
