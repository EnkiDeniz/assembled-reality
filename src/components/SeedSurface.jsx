import BoxObjectVisualization from "@/components/BoxObjectVisualization";
import SeedUpdatePanel from "@/components/SeedUpdatePanel";

export default function SeedSurface({
  viewModel,
  seedViewModel,
  activeDocument = null,
  currentSeedDocument = null,
  sourceFirstEntry = null,
  suggestion = null,
  suggestionPending = false,
  onOpenSeed,
  onOpenStage,
  onRunOperate,
  onAssemble,
  onApplySuggestion,
  onEditSuggestion,
  onDismissSuggestion,
  onDismissRerouteContext,
  onReturnToSource,
  isMobileLayout = false,
  children,
}) {
  const selectedBlockCount = viewModel?.selectedBlockCount || 0;
  const stagedReplyCount = viewModel?.stagedReplyCount || 0;
  const rerouteContext = viewModel?.rerouteContext || null;
  const showSeedDocument =
    Boolean(activeDocument?.documentKey) &&
    (activeDocument?.isAssembly || activeDocument?.documentType === "assembly");
  return (
    <section className="assembler-phase assembler-phase--create">
      {sourceFirstEntry ? (
        <section
          className="assembler-seed-surface__starter-guide"
          data-testid="workspace-shape-seed-guide"
        >
          <div className="assembler-seed-surface__starter-guide-copy">
            <span className="assembler-seed-surface__eyebrow">Next step</span>
            <strong>Shape the first seed.</strong>
            <p>
              Turn <strong>{sourceFirstEntry.sourceTitle || "this source"}</strong> into the
              first working seed. Start in plain language, then refine it once the seed exists.
            </p>
          </div>
          <div className="assembler-seed-surface__starter-guide-actions">
            {onReturnToSource ? (
              <button
                type="button"
                className="terminal-button"
                data-testid="workspace-shape-seed-back-to-source"
                onClick={onReturnToSource}
              >
                Back to source
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

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

      {rerouteContext ? (
        <section className="assembler-seed-surface__reroute">
          <div className="assembler-seed-surface__reroute-copy">
            <span className="assembler-seed-surface__eyebrow">Reroute context</span>
            <strong>
              {rerouteContext.delta || rerouteContext.nextMove || "Operate preserved a real turn."}
            </strong>
            <p>
              {[rerouteContext.aim, rerouteContext.bridge]
                .filter(Boolean)
                .join(" · ") || rerouteContext.ground || "Carry this line into the next seed pass."}
            </p>
          </div>
          <button
            type="button"
            className="terminal-button"
            onClick={onDismissRerouteContext}
          >
            Dismiss
          </button>
        </section>
      ) : null}

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
              {sourceFirstEntry
                ? "Start by shaping the source into the first seed draft. Keep it simple and concrete."
                : currentSeedDocument
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
