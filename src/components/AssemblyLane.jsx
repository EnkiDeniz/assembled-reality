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

const PROTOCOL_STEPS = [
  { id: "collecting", label: "Collecting" },
  { id: "shaping", label: "Shaping" },
  { id: "proving", label: "Proving" },
];

const CONTEXTUAL_ACTION_ICONS = {
  "open-create": Sprout,
  "run-operate": Rows3,
  "open-seal": FileCheck,
};

function LaneBadge({ label, tone = "", hasEvidence = false }) {
  return (
    <span className={`assembler-assembly-lane__badge ${tone ? `is-${tone}` : ""} ${hasEvidence ? "has-evidence" : ""}`}>
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

function LaneActionButton({ action, onClick }) {
  const IconComponent = CONTEXTUAL_ACTION_ICONS[action?.kind] || ArrowUpRight;

  return (
    <button
      type="button"
      className="assembler-assembly-lane__contextual-action"
      onClick={() => onClick(action)}
    >
      <IconComponent size={ICON_SIZE} strokeWidth={ICON_STROKE} />
      <span>{action?.label || "Continue"}</span>
    </button>
  );
}

function LaneEntry({ entry, onOpenEntry, onInspectEvidence }) {
  const EntryKindIcon = ENTRY_KIND_ICONS[entry?.kind] || FileText;
  const canOpen = typeof onOpenEntry === "function" && (entry?.actionKind || entry?.documentKey);
  const canInspect = Boolean(entry?.canInspectEvidence) && typeof onInspectEvidence === "function";
  const evidenceMeta = [
    entry?.evidenceBasisLabel || "",
    entry?.certaintyKind === "event_backed" ? "Event-backed" : "Order inferred",
  ].filter(Boolean);

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
        <LaneBadge
          label={entry?.stageStatusLabel || "Present"}
          tone="stage"
          hasEvidence={entry?.proofStatus === "sealed" || entry?.proofStatus === "evidenced"}
        />
      </div>

      {evidenceMeta.length ? (
        <p className="assembler-assembly-lane__entry-meta-note">{evidenceMeta.join(" · ")}</p>
      ) : null}
    </article>
  );
}

export default function AssemblyLane({
  viewModel,
  onOpenEntry,
  onInspectEvidence,
  onRunContextualAction,
}) {
  const moveGroups = Array.isArray(viewModel?.moveGroups) ? viewModel.moveGroups : [];
  const entryCount = Array.isArray(viewModel?.entries) ? viewModel.entries.length : 0;
  const protocolPosition = viewModel?.protocolPosition || "collecting";
  const metaItems = [
    viewModel?.protocolStateLabel || viewModel?.stateSummary?.chipLabel || "Collecting",
    `${viewModel?.realSourceCount || 0} sources`,
    `${entryCount} ${entryCount === 1 ? "entry" : "entries"}`,
  ];
  const canRunContextualAction =
    viewModel?.contextualAction && typeof onRunContextualAction === "function";

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
          <div
            className="assembler-assembly-lane__protocol-strip"
            aria-label="Assembly protocol position"
          >
            {PROTOCOL_STEPS.map((step) => (
              <span
                key={step.id}
                className={`assembler-assembly-lane__protocol-step ${
                  protocolPosition === step.id ? `is-active is-${step.id}` : ""
                }`}
                aria-current={protocolPosition === step.id ? "step" : undefined}
              >
                {step.label}
              </span>
            ))}
          </div>
        </div>
        {canRunContextualAction ? (
          <LaneActionButton
            action={viewModel.contextualAction}
            onClick={onRunContextualAction}
          />
        ) : null}
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
