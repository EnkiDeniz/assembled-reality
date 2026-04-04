export default function CreateSurface({
  viewModel,
  activeDocument = null,
  currentAssemblyDocument = null,
  onOpenAssembly,
  onAssemble,
  children,
}) {
  const selectedBlockCount = viewModel?.selectedBlockCount || 0;
  const stagedReplyCount = viewModel?.stagedReplyCount || 0;
  const showAssemblyDocument =
    Boolean(activeDocument?.documentKey) &&
    (activeDocument?.isAssembly || activeDocument?.documentType === "assembly");

  return (
    <section className="assembler-phase assembler-phase--create">
      <header className="assembler-phase__header">
        <div className="assembler-phase__copy">
          <span className="assembler-phase__eyebrow">Create</span>
          <h2 className="assembler-phase__title">Shape the assembly.</h2>
          <p className="assembler-phase__subtitle">
            Move selected material into staging, then assemble and rewrite the working position of the box.
          </p>
        </div>
        <div className="assembler-phase__meta">
          <span>{viewModel?.boxTitle || "Untitled Box"}</span>
          <span>{selectedBlockCount} staged</span>
          <span>{stagedReplyCount} Seven repl{stagedReplyCount === 1 ? "y" : "ies"}</span>
        </div>
      </header>

      {showAssemblyDocument ? (
        children
      ) : (
        <div className="assembler-phase__empty">
          <div className="assembler-phase__empty-copy">
            <span className="assembler-phase__empty-label">Assembly</span>
            <h3 className="assembler-phase__empty-title">
              {currentAssemblyDocument?.title || "No active assembly yet"}
            </h3>
            <p className="assembler-phase__empty-text">
              {currentAssemblyDocument
                ? "Open the current assembly to keep shaping it, or keep feeding staging until it is ready for the next draft."
                : "You can keep collecting blocks in staging and assemble them once the direction is clear."}
            </p>
          </div>

          <div className="assembler-phase__empty-actions">
            {currentAssemblyDocument ? (
              <button type="button" className="terminal-button" onClick={onOpenAssembly}>
                Open assembly
              </button>
            ) : null}
            <button
              type="button"
              className="terminal-button is-primary"
              onClick={onAssemble}
              disabled={!selectedBlockCount}
            >
              {selectedBlockCount ? "Assemble from staging" : "Add blocks to staging"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
