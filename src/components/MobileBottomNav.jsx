import WorkspaceGlyph from "@/components/WorkspaceGlyph";

function NavItem({
  active = false,
  disabled = false,
  icon,
  label,
  onClick,
  badge = "",
  onBadgeClick,
  tone = null,
}) {
  return (
    <div className="assembler-mobile-nav__slot">
      <button
        type="button"
        className={`assembler-mobile-nav__item ${active ? "is-active" : ""}`}
        onClick={onClick}
        disabled={disabled}
        aria-current={active ? "page" : undefined}
      >
        <span className="assembler-mobile-nav__icon" aria-hidden="true">
          <WorkspaceGlyph kind={icon} />
          {tone ? (
            <span
              className="assembler-mobile-nav__tone-dot"
              style={{
                "--assembly-tone": tone.fill,
                "--assembly-tone-soft": tone.soft,
                "--assembly-tone-border": tone.border,
                "--assembly-tone-glow": tone.glow,
              }}
            />
          ) : null}
        </span>
        <span className="assembler-mobile-nav__label">{label}</span>
      </button>
      {badge ? (
        <button
          type="button"
          className="assembler-mobile-nav__badge"
          onClick={onBadgeClick}
          aria-label={`Open confirmation queue. ${badge} items waiting.`}
        >
          ⊘ {badge}
        </button>
      ) : null}
    </div>
  );
}

export default function MobileBottomNav({
  activeTab = "home",
  canOpenSeed = false,
  confirmationCount = 0,
  stateTone = null,
  onGoHome,
  onGoListen,
  onGoSeed,
  onGoReceipts,
  onOpenAdd,
  onOpenConfirmation,
}) {
  const badgeLabel =
    Number(confirmationCount) > 99 ? "99+" : Number(confirmationCount) > 0 ? String(confirmationCount) : "";

  return (
    <div className="assembler-mobile-nav">
      <div className="assembler-mobile-nav__bar">
        <NavItem
          active={activeTab === "home"}
          icon="box"
          label="Home"
          onClick={onGoHome}
          badge={badgeLabel}
          onBadgeClick={onOpenConfirmation}
          tone={stateTone}
        />
        <NavItem
          active={activeTab === "listen"}
          icon="listen"
          label="Listen"
          onClick={onGoListen}
        />
        <div className="assembler-mobile-nav__add-slot" aria-hidden="true" />
        <NavItem
          active={activeTab === "seed" || activeTab === "operate"}
          disabled={!canOpenSeed}
          icon="seed"
          label="Seed"
          onClick={onGoSeed}
        />
        <NavItem
          active={activeTab === "receipts"}
          icon="receipt"
          label="Receipts"
          onClick={onGoReceipts}
        />
      </div>

      <button
        type="button"
        className="assembler-mobile-nav__add"
        onClick={onOpenAdd}
        aria-label="Add source"
      >
        <span className="assembler-mobile-nav__add-icon" aria-hidden="true">
          <WorkspaceGlyph kind="plus" />
        </span>
        <span className="assembler-mobile-nav__add-label">Add</span>
      </button>
    </div>
  );
}
