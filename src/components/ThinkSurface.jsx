export default function ThinkSurface({
  boxTitle = "Untitled Box",
  sourceSummary = "",
  children,
}) {
  return (
    <section className="assembler-phase assembler-phase--think">
      <header className="assembler-phase__header">
        <div className="assembler-phase__copy">
          <span className="assembler-phase__eyebrow">Think</span>
          <h2 className="assembler-phase__title">Understand what is in the box.</h2>
          <p className="assembler-phase__subtitle">
            Read, listen, and ask Seven before you decide what belongs in the assembly.
          </p>
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
