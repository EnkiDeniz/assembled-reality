import {
  ShapeNav,
  VerbToolbar,
  buildStaticShapeNav,
} from "@/components/LoegosSystem";

export default function BoxHomeScreen({
  title = "Box home",
  subtitle = "Orient, review the next move, and enter the room that matches the work.",
  activeShape = "aim",
  activeVerb = "declare",
  children,
}) {
  return (
    <div className="loegos-screen loegos-box-home">
      <section className="loegos-box-home__panel">
        <div className="loegos-box-home__masthead">
          <div className="loegos-box-home__brandline">
            <span className="loegos-wordmark">
              Lœgos <span className="loegos-wordmark__sub">Box home</span>
            </span>
            <span className="loegos-thesis">Navigate by shape. Act by verb.</span>
          </div>
          <div className="loegos-box-home__resume">
            <span className="loegos-kicker">Current box</span>
            <h2 className="loegos-box-home__resume-title">{title}</h2>
            <p className="loegos-box-home__resume-copy">{subtitle}</p>
          </div>
        </div>

        <ShapeNav items={buildStaticShapeNav(activeShape)} activeShape={activeShape} compact />
        <VerbToolbar shapeKey={activeShape} activeVerb={activeVerb} />
      </section>

      {children}
    </div>
  );
}
