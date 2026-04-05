import {
  ArrowUpRight,
  FileCheck,
  FileText,
  Flag,
  Rows3,
  ScanLine,
  Sprout,
} from "lucide-react";

const ICON_SIZE = 16;
const ICON_STROKE = 1.8;

const ENTRY_KIND_ICONS = {
  root: Flag,
  source: FileText,
  "derived-source": FileText,
  "history-export": ScanLine,
  move: Rows3,
  seed: Sprout,
  receipt: FileCheck,
};

function LaneBadge({ label, tone = "" }) {
  return (
    <span className={`assembler-assembly-lane__badge ${tone ? `is-${tone}` : ""}`}>
      {label}
    </span>
  );
}

function LaneIconButton({ label, icon, onClick }) {
  const IconComponent = icon;

  return (
    <button
      type="button"
      className="assembler-assembly-lane__icon-button"
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      <IconComponent size={ICON_SIZE} strokeWidth={ICON_STROKE} />
    </button>
  );
}

function LaneEntry({ entry, onOpenEntry, onInspectEvidence }) {
  const EntryKindIcon = ENTRY_KIND_ICONS[entry?.kind] || FileText;
  const canOpen = typeof onOpenEntry === "function" && (entry?.actionKind || entry?.documentKey);
  const canInspect = Boolean(entry?.canInspectEvidence) && typeof onInspectEvidence === "function";

  return (
    <article
      className={`assembler-assembly-lane__entry ${entry?.isLeadingEdge ? "is-leading-edge" : ""}`}
    >
      <div className="assembler-assembly-lane__entry-head">
        <div className="assembler-assembly-lane__entry-title-row">
          <span className="assembler-assembly-lane__entry-icon" aria-hidden="true">
            <EntryKindIcon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
          </span>

          <div className="assembler-assembly-lane__entry-copy">
            <div className="assembler-assembly-lane__entry-topline">
              <span className="assembler-assembly-lane__entry-kind">
                {entry?.kindLabel || "Entry"}
              </span>
              <span className="assembler-assembly-lane__entry-time">
                {entry?.occurredAtLabel || "Undated"}
              </span>
            </div>
            <h3 className="assembler-assembly-lane__entry-title">{entry?.title || "Untitled entry"}</h3>
          </div>
        </div>

        {canOpen || canInspect ? (
          <div className="assembler-assembly-lane__entry-actions">
            {canOpen ? (
              <LaneIconButton
                label={entry?.actionLabel || "Open entry"}
                icon={ArrowUpRight}
                onClick={() => onOpenEntry(entry)}
              />
            ) : null}
            {canInspect ? (
              <LaneIconButton
                label="Inspect evidence"
                icon={ScanLine}
                onClick={() => onInspectEvidence(entry)}
              />
            ) : null}
          </div>
        ) : null}
      </div>

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
          Linked to {entry.linkedEntryIds.length} lane{" "}
          {entry.linkedEntryIds.length === 1 ? "entry" : "entries"}.
        </p>
      ) : null}
    </article>
  );
}

export default function AssemblyLane({ viewModel, onOpenEntry, onInspectEvidence }) {
  const moveGroups = Array.isArray(viewModel?.moveGroups) ? viewModel.moveGroups : [];
  const entryCount = Array.isArray(viewModel?.entries) ? viewModel.entries.length : 0;
  const metaItems = [
    viewModel?.stateSummary?.chipLabel || "Collecting",
    `${viewModel?.realSourceCount || 0} sources`,
    `${entryCount} ${entryCount === 1 ? "entry" : "entries"}`,
  ];

  return (
    <div className="assembler-assembly-lane">
      <section className="assembler-assembly-lane__meta-strip" aria-label="Assembly lane summary">
        <div className="assembler-assembly-lane__strip-copy">
          <span className="assembler-assembly-lane__strip-label">Assembly lane</span>
          <div className="assembler-assembly-lane__strip-title-row">
            <strong className="assembler-assembly-lane__strip-title">
              {viewModel?.boxTitle || "Untitled Box"}
            </strong>
            <div className="assembler-assembly-lane__strip-meta">
              {metaItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="assembler-assembly-lane__entries-panel">
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
