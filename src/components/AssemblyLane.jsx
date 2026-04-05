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

function LaneEntry({
  entry,
  onOpenEntry,
  onInspectEvidence,
}) {
  const canOpen = typeof onOpenEntry === "function" && (entry?.actionKind || entry?.documentKey);
  const canInspect = Boolean(entry?.canInspectEvidence) && typeof onInspectEvidence === "function";

  return (
    <article
      className={`assembler-assembly-lane__entry ${
        canOpen ? "is-openable" : ""
      } ${entry?.isLeadingEdge ? "is-leading-edge" : ""}`}
    >
      <div className="assembler-assembly-lane__entry-topline">
        <span className="assembler-assembly-lane__entry-kind">{entry?.kindLabel || "Entry"}</span>
        <span className="assembler-assembly-lane__entry-time">{entry?.occurredAtLabel || "Undated"}</span>
      </div>

      <h3 className="assembler-assembly-lane__entry-title">{entry?.title || "Untitled entry"}</h3>
      <p className="assembler-assembly-lane__entry-detail">{entry?.detail || "No detail yet."}</p>

      <div className="assembler-assembly-lane__entry-badges">
        <LaneBadge label={entry?.stageStatusLabel || "Present"} tone="stage" />
        <LaneBadge label={entry?.proofStatusLabel || "Open"} tone="proof" />
        <LaneBadge label={entry?.evidenceBasisLabel || "Direct evidence"} />
        <LaneBadge
          label={entry?.certaintyKind === "event_backed" ? "Event-backed" : "Order inferred"}
        />
      </div>

      {entry?.trustSummary ? (
        <p className="assembler-assembly-lane__entry-trust">{entry.trustSummary}</p>
      ) : null}

      {entry?.linkedEntryIds?.length ? (
        <p className="assembler-assembly-lane__entry-links">
          Linked to {entry.linkedEntryIds.length} lane {entry.linkedEntryIds.length === 1 ? "entry" : "entries"}.
        </p>
      ) : null}

      {canOpen || canInspect ? (
        <div className="assembler-assembly-lane__entry-actions">
          {canOpen ? (
            <button
              type="button"
              className="assembler-assembly-lane__entry-button"
              onClick={() => onOpenEntry(entry)}
            >
              {entry?.actionLabel || "Open"}
            </button>
          ) : null}
          {canInspect ? (
            <button
              type="button"
              className="assembler-assembly-lane__entry-button is-secondary"
              onClick={() => onInspectEvidence(entry)}
            >
              Inspect evidence
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default function AssemblyLane({
  viewModel,
  currentPositionAction = null,
  onBrowseBoxes,
  onOpenEntry,
  onInspectEvidence,
  showMasthead = true,
  showSummary = true,
}) {
  const rootTitle = viewModel?.root?.text || "No root declared yet";
  const rootDetail = viewModel?.root?.gloss || "Sources can enter first. Root becomes necessary only when the workflow asks for it.";
  const liveEdgeTitle = viewModel?.liveEdge?.title || "No live edge yet";
  const liveEdgeDetail = viewModel?.liveEdge?.detail || "Add a source, listen, and shape what matters.";
  const proofTitle = viewModel?.proofSummary?.line || "Local proof only";
  const proofDetail =
    viewModel?.proofSummary?.detail || "Proof closes moves when the box can carry it.";
  const moveGroups = Array.isArray(viewModel?.moveGroups) ? viewModel.moveGroups : [];
  const entryCount = Array.isArray(viewModel?.entries) ? viewModel.entries.length : 0;

  return (
    <div className="assembler-assembly-lane">
      {showMasthead ? (
        <section className="assembler-assembly-lane__masthead">
          <div className="assembler-assembly-lane__copy">
            <span className="assembler-assembly-lane__eyebrow">Assembly lane</span>
            <h1 className="assembler-assembly-lane__title">{viewModel?.boxTitle || "Untitled Box"}</h1>
            <p className="assembler-assembly-lane__lede">{PRODUCT_SENTENCE}</p>
            <div className="assembler-assembly-lane__meta">
              <span>{PRODUCT_CHAIN_LABEL}</span>
              <span>{viewModel?.realSourceCount || 0} real sources</span>
              <span>{entryCount} lane entries</span>
              <span>{viewModel?.stateSummary?.chipLabel || "Collecting"}</span>
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
      ) : null}

      {showSummary ? (
        <section className="assembler-assembly-lane__summary-grid" aria-label="Assembly lane summary">
          <LaneSummaryCard label="Root / origin" title={rootTitle} detail={rootDetail} accent="root" />
          <LaneSummaryCard label="Live edge" title={liveEdgeTitle} detail={liveEdgeDetail} accent="live" />
          <LaneSummaryCard label="Proof closure" title={proofTitle} detail={proofDetail} accent="proof" />
        </section>
      ) : null}

      <section className="assembler-assembly-lane__entries-panel">
        <div className="assembler-assembly-lane__section-head">
          <span>Chain of evidence</span>
          <strong>{entryCount} total entries</strong>
        </div>

        {moveGroups.length ? (
          <div className="assembler-assembly-lane__groups">
            {moveGroups.map((group) => (
              <section key={group.id} className="assembler-assembly-lane__group">
                <div className="assembler-assembly-lane__group-head">
                  <span>{group.label}</span>
                  <strong>
                    {group.entries.length} {group.entries.length === 1 ? "entry" : "entries"}
                  </strong>
                </div>
                <ol className="assembler-assembly-lane__entries">
                  {group.entries.map((entry) => (
                    <li key={entry.id}>
                      <LaneEntry
                        entry={entry}
                        onOpenEntry={onOpenEntry}
                        onInspectEvidence={onInspectEvidence}
                      />
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        ) : (
          <p className="assembler-assembly-lane__empty">
            The lane is ready. Add a source, listen, and shape what matters.
          </p>
        )}
      </section>
    </div>
  );
}
