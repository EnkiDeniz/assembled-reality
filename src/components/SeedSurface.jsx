import BoxObjectVisualization from "@/components/BoxObjectVisualization";
import SeedUpdatePanel from "@/components/SeedUpdatePanel";

export default function SeedSurface({
  viewModel,
  seedViewModel,
  activeDocument = null,
  currentSeedDocument = null,
  suggestion = null,
  suggestionPending = false,
  onOpenSeed,
  onOpenStage,
  onRunOperate,
  onAssemble,
  onApplySuggestion,
  onEditSuggestion,
  onDismissSuggestion,
  isMobileLayout = false,
  children,
}) {
  const selectedBlockCount = viewModel?.selectedBlockCount || 0;
  const stagedReplyCount = viewModel?.stagedReplyCount || 0;
  const stageCount = selectedBlockCount + stagedReplyCount;
  const showSeedDocument =
    Boolean(activeDocument?.documentKey) &&
    (activeDocument?.isAssembly || activeDocument?.documentType === "assembly");
  return (
    <section className="assembler-phase assembler-phase--create">
      <header className="assembler-phase__header assembler-phase__header--seed">
        <div className="assembler-phase__copy">
          <span className="assembler-phase__eyebrow">Seed</span>
          <h2 className="assembler-phase__title">Shape the seed.</h2>
        </div>
        <div className="assembler-phase__meta">
          <span>{viewModel?.boxTitle || "Untitled Box"}</span>
          <span>{selectedBlockCount} staged</span>
          <span>{stagedReplyCount} Seven repl{stagedReplyCount === 1 ? "y" : "ies"}</span>
        </div>
      </header>

      <div className="assembler-seed-surface__hero">
        <BoxObjectVisualization
          state={seedViewModel?.visualizationState}
          size="standard"
          title={seedViewModel?.seedTitle || "Seed"}
        />

        <div className="assembler-seed-surface__hero-copy">
          <span className="assembler-seed-surface__eyebrow">Current seed</span>
          <h3 className="assembler-seed-surface__title">
            {seedViewModel?.seedTitle || currentSeedDocument?.title || "No seed yet"}
          </h3>
          {isMobileLayout ? (
            <div className="assembler-seed-surface__hero-actions">
              <button type="button" className="terminal-button" onClick={onOpenStage}>
                Stage
              </button>
              <button
                type="button"
                className="terminal-button is-primary"
                onClick={onRunOperate}
                disabled={!viewModel?.hasSeed}
              >
                Operate
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <SeedUpdatePanel
        suggestion={suggestion}
        pending={suggestionPending}
        onApply={onApplySuggestion}
        onEdit={onEditSuggestion || onOpenSeed}
        onDismiss={onDismissSuggestion}
      />

      {showSeedDocument ? (
        children
      ) : (
        <div className="assembler-phase__empty">
          <div className="assembler-phase__empty-copy">
            <span className="assembler-phase__empty-label">Seed</span>
            <h3 className="assembler-phase__empty-title">
              {currentSeedDocument?.title || "No active seed yet"}
            </h3>
            <p className="assembler-phase__empty-text">
              {currentSeedDocument
                ? "Open seed."
                : "Stage. Shape. Seal."}
            </p>
          </div>

          <div className="assembler-phase__empty-actions">
            {currentSeedDocument ? (
              <button type="button" className="terminal-button" onClick={onOpenSeed}>
                Open seed
              </button>
            ) : null}
            <button
              type="button"
              className="terminal-button is-primary"
              onClick={onAssemble}
              disabled={!selectedBlockCount}
            >
              {selectedBlockCount ? "Shape from staging" : "Add blocks to staging"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
