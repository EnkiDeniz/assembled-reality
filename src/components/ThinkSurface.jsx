export default function ThinkSurface({
  boxTitle = "Untitled Box",
  sourceSummary = "",
  children,
}) {
  return (
    <section className="assembler-phase assembler-phase--think">
      <header className="assembler-phase__header">
        <div className="assembler-phase__copy">
          <span className="assembler-phase__eyebrow">Reality</span>
          <h2 className="assembler-phase__title">Inspect what is actually in the box.</h2>
        </div>
        <div className="assembler-phase__meta">
          <span>{boxTitle}</span>
          {sourceSummary ? <span>{sourceSummary}</span> : null}
        </div>
      </header>

      {children}
    </section>
  );
}
