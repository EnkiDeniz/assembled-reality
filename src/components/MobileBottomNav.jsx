import { ShapeNav, buildLoegosNavItems } from "@/components/LoegosSystem";

export default function MobileBottomNav({
  activeShape = "aim",
  activeVerb = "declare",
  onSelectShape,
  onOpenAdd,
}) {
  return (
    <div className="loegos-mobile-nav">
      <ShapeNav
        items={buildLoegosNavItems({ activeShape, activeVerb })}
        activeShape={activeShape}
        compact
        onSelect={onSelectShape}
      />

      <div className="loegos-mobile-nav__actions">
        <button
          type="button"
          className="loegos-mobile-nav__add"
          onClick={onOpenAdd}
          aria-label="Add source"
        >
          Add source
        </button>
      </div>
    </div>
  );
}
