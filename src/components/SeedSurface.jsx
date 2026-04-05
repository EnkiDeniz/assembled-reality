import BoxObjectVisualization from "@/components/BoxObjectVisualization";
import RootSummaryPanel from "@/components/RootSummaryPanel";
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
  onOpenConfirmation,
  onSaveRoot,
  onApplySuggestion,
  onEditSuggestion,
  onDismissSuggestion,
  rootPending = false,
  isMobileLayout = false,
  children,
}) {
  const selectedBlockCount = viewModel?.selectedBlockCount || 0;
  const stagedReplyCount = viewModel?.stagedReplyCount || 0;
  const stageCount = selectedBlockCount + stagedReplyCount;
  const showSeedDocument =
    Boolean(activeDocument?.documentKey) &&
    (activeDocument?.isAssembly || activeDocument?.documentType === "assembly");
  const rootPanelKey = [
    seedViewModel?.root?.text || "",
    seedViewModel?.root?.gloss || "",
    seedViewModel?.root?.hasRoot ? "1" : "0",
    seedViewModel?.stateSummary?.current || "",
    seedViewModel?.confirmationCount || 0,
  ].join("::");

  return (
    <section className="assembler-phase assembler-phase--create">
      <header className="assembler-phase__header assembler-phase__header--seed">
        <div className="assembler-phase__copy">
          <span className="assembler-phase__eyebrow">Seed</span>
          <h2 className="assembler-phase__title">Shape the seed.</h2>
          <p className="assembler-phase__subtitle">
            The seed is the living working position of the box. Feed it from sources, staging, and proof.
          </p>
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
          subtitle={
            suggestion
              ? "Seven sees a clearer shape for this seed."
              : currentSeedDocument
                ? "Current working object"
                : "The first seed appears after the first real signal."
          }
        />

        <div className="assembler-seed-surface__hero-copy">
          <span className="assembler-seed-surface__eyebrow">Current seed</span>
          <h3 className="assembler-seed-surface__title">
            {seedViewModel?.seedTitle || currentSeedDocument?.title || "No seed yet"}
          </h3>
          <p className="assembler-seed-surface__body">
            {currentSeedDocument
              ? "Keep the seed honest: name the aim, describe what is actually here, and keep the gap visible until proof closes it."
              : "The first real source will create the first seed. Until then, staging can keep gathering material."}
          </p>
          {isMobileLayout ? (
            <div className="assembler-seed-surface__hero-actions">
              <button type="button" className="terminal-button" onClick={onOpenStage}>
                {stageCount ? `Stage ${stageCount}` : "Stage"}
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

      <RootSummaryPanel
        key={rootPanelKey}
        root={seedViewModel?.root}
        stateSummary={seedViewModel?.stateSummary}
        confirmationCount={seedViewModel?.confirmationCount || 0}
        pending={rootPending}
        compact={isMobileLayout}
        onSaveRoot={onSaveRoot}
        onOpenConfirmation={onOpenConfirmation}
      />

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
                ? "Open the live seed to keep shaping it, or keep feeding staging until the next revision is ready."
                : "Keep collecting blocks in staging. The first real source will create the seed automatically."}
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
