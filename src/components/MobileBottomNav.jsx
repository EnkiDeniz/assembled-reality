import WorkspaceGlyph from "@/components/WorkspaceGlyph";

function NavItem({ active = false, disabled = false, icon, label, onClick }) {
  return (
    <button
      type="button"
      className={`assembler-mobile-nav__item ${active ? "is-active" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? "page" : undefined}
    >
      <span className="assembler-mobile-nav__icon" aria-hidden="true">
        <WorkspaceGlyph kind={icon} />
      </span>
      <span className="assembler-mobile-nav__label">{label}</span>
    </button>
  );
}

export default function MobileBottomNav({
  activeTab = "home",
  canOpenSeed = false,
  onGoHome,
  onGoListen,
  onGoSeed,
  onGoReceipts,
  onOpenAdd,
}) {
  return (
    <div className="assembler-mobile-nav">
      <div className="assembler-mobile-nav__bar">
        <NavItem active={activeTab === "home"} icon="box" label="Home" onClick={onGoHome} />
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
