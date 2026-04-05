import {
  PRODUCT_CHAIN_LABEL,
  PRODUCT_CHAIN_NOTE,
  PRODUCT_SENTENCE,
} from "@/lib/product-language";

function LaneBadge({ label, tone = "" }) {
  return (
    <span className={`assembler-assembly-lane__badge ${tone ? `is-${tone}` : ""}`}>
      {label}
    </span>
  );
}

function LaneSummaryCard({ label, title, detail, accent = "" }) {
  return (
    <article className={`assembler-assembly-lane__summary-card ${accent ? `is-${accent}` : ""}`}>
      <span className="assembler-assembly-lane__summary-label">{label}</span>
      <strong className="assembler-assembly-lane__summary-title">{title}</strong>
      <p className="assembler-assembly-lane__summary-detail">{detail}</p>
    </article>
  );
}

function LaneEntry({ entry, onOpenEntry }) {
  const canOpen = typeof onOpenEntry === "function" && (entry?.actionKind || entry?.documentKey);
  const Container = canOpen ? "button" : "article";

  return (
    <Container
      type={canOpen ? "button" : undefined}
      className={`assembler-assembly-lane__entry ${
        canOpen ? "is-openable" : ""
      } ${entry?.isLeadingEdge ? "is-leading-edge" : ""}`}
      onClick={canOpen ? () => onOpenEntry(entry) : undefined}
    >
      <div className="assembler-assembly-lane__entry-topline">
        <span className="assembler-assembly-lane__entry-kind">{entry?.kindLabel || "Entry"}</span>
        <span className="assembler-assembly-lane__entry-time">{entry?.occurredAtLabel || "Undated"}</span>
      </div>

      <h3 className="assembler-assembly-lane__entry-title">{entry?.title || "Untitled entry"}</h3>
      <p className="assembler-assembly-lane__entry-detail">{entry?.detail || "No detail yet."}</p>

      <div className="assembler-assembly-lane__entry-badges">
        <LaneBadge label={entry?.stageStatusLabel || "Selected"} tone="stage" />
        <LaneBadge label={entry?.proofStatusLabel || "Open"} tone="proof" />
        <LaneBadge label={entry?.evidenceBasisLabel || "Direct evidence"} />
      </div>

      {entry?.trustSummary ? (
        <p className="assembler-assembly-lane__entry-trust">{entry.trustSummary}</p>
      ) : null}

      {canOpen ? (
        <span className="assembler-assembly-lane__entry-action">
          {entry?.actionLabel || "Open"}
        </span>
      ) : null}
    </Container>
  );
}

export default function AssemblyLane({
  viewModel,
  currentPositionAction = null,
  onBrowseBoxes,
  onOpenEntry,
}) {
  const rootTitle = viewModel?.root?.text || "Root not declared yet";
  const rootDetail = viewModel?.root?.gloss || "Declare the line this box must return to.";
  const liveEdgeTitle = viewModel?.liveEdge?.title || "No live edge yet";
  const liveEdgeDetail = viewModel?.liveEdge?.detail || "Add a source and shape the first seed.";
  const proofTitle = viewModel?.proofSummary?.line || "Local proof only";
  const proofDetail =
    viewModel?.proofSummary?.detail || "Proof closes moves when the box can carry it.";

  return (
    <div className="assembler-assembly-lane">
      <section className="assembler-assembly-lane__masthead">
        <div className="assembler-assembly-lane__copy">
          <span className="assembler-assembly-lane__eyebrow">Assembly lane</span>
          <h1 className="assembler-assembly-lane__title">{viewModel?.boxTitle || "Untitled Box"}</h1>
          <p className="assembler-assembly-lane__lede">{PRODUCT_SENTENCE}</p>
          <div className="assembler-assembly-lane__meta">
            <span>{PRODUCT_CHAIN_LABEL}</span>
            <span>{viewModel?.realSourceCount || 0} real sources</span>
            <span>{viewModel?.entryCount || 0} lane entries</span>
            <span>{viewModel?.stateSummary?.chipLabel || "Declare-root"}</span>
          </div>
          <p className="assembler-assembly-lane__note">{PRODUCT_CHAIN_NOTE}</p>
        </div>

        <div className="assembler-assembly-lane__masthead-actions">
          {currentPositionAction ? (
            <button
              type="button"
              className="assembler-assembly-lane__primary-button"
              onClick={currentPositionAction.onClick}
              disabled={currentPositionAction.disabled}
            >
              {currentPositionAction.label}
            </button>
          ) : null}
          {typeof onBrowseBoxes === "function" ? (
            <button
              type="button"
              className="assembler-assembly-lane__secondary-button"
              onClick={onBrowseBoxes}
            >
              All boxes
            </button>
          ) : null}
        </div>
      </section>

      <section className="assembler-assembly-lane__summary-grid" aria-label="Assembly lane summary">
        <LaneSummaryCard label="Root / origin" title={rootTitle} detail={rootDetail} accent="root" />
        <LaneSummaryCard label="Live edge" title={liveEdgeTitle} detail={liveEdgeDetail} accent="live" />
        <LaneSummaryCard label="Proof closure" title={proofTitle} detail={proofDetail} accent="proof" />
      </section>

      <section className="assembler-assembly-lane__entries-panel">
        <div className="assembler-assembly-lane__section-head">
          <span>Chain of evidence</span>
          <strong>
            {viewModel?.recentWitnessCount || 0} chronology witness
            {(viewModel?.recentWitnessCount || 0) === 1 ? "" : "es"}
          </strong>
        </div>

        {viewModel?.entries?.length ? (
          <ol className="assembler-assembly-lane__entries">
            {viewModel.entries.map((entry) => (
              <li key={entry.id}>
                <LaneEntry entry={entry} onOpenEntry={onOpenEntry} />
              </li>
            ))}
          </ol>
        ) : (
          <p className="assembler-assembly-lane__empty">
            The lane is empty. Add a source and declare the root to start the chain.
          </p>
        )}
      </section>
    </div>
  );
}
