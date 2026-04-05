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

function WordTermPill({ term }) {
  return (
    <li className="assembler-assembly-lane__word-pill">
      <span>{term?.term || "term"}</span>
      <strong>{term?.count || 0}</strong>
    </li>
  );
}

function WordTermList({ title, terms = [], emptyText = "" }) {
  return (
    <section className="assembler-assembly-lane__word-group">
      <div className="assembler-assembly-lane__word-group-head">
        <span>{title}</span>
        <strong>{terms.length}</strong>
      </div>
      {terms.length ? (
        <ul className="assembler-assembly-lane__word-pills">
          {terms.map((term) => (
            <WordTermPill
              key={`${title}-${term.term}`}
              term={term}
            />
          ))}
        </ul>
      ) : (
        <p className="assembler-assembly-lane__word-empty">{emptyText || "Nothing clear yet."}</p>
      )}
    </section>
  );
}

function WordSelectionList({ moments = [] }) {
  return (
    <section className="assembler-assembly-lane__word-group">
      <div className="assembler-assembly-lane__word-group-head">
        <span>Selection points</span>
        <strong>{moments.length}</strong>
      </div>
      {moments.length ? (
        <ul className="assembler-assembly-lane__word-selection-list">
          {moments.map((moment) => (
            <li
              key={moment.id}
              className={moment.supportsLakinMoment ? "is-lakin" : ""}
            >
              <strong>{moment.label}</strong>
              <span>{moment.orderKind === "explicit" ? "Chronology explicit" : "Order inferred"}</span>
              {moment.pivotPair ? (
                <span
                  className={`assembler-assembly-lane__word-selection-relation ${
                    moment.supportsLakinMoment ? "is-lakin" : ""
                  }`}
                >
                  {moment.supportsLakinMoment ? `Lakin pair · ${moment.pivotPair}` : moment.pivotPair}
                </span>
              ) : moment.supportsLakinMoment ? (
                <span className="assembler-assembly-lane__word-selection-relation is-lakin">
                  Lakin pair
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="assembler-assembly-lane__word-empty">No selection points are strong enough to show yet.</p>
      )}
    </section>
  );
}

function WordHypothesisList({ hypotheses = [] }) {
  if (!hypotheses.length) return null;

  return (
    <section className="assembler-assembly-lane__word-hypotheses" aria-label="Seven hypotheses">
      <div className="assembler-assembly-lane__word-hypotheses-head">
        <span>Seven hypotheses</span>
        <strong>{hypotheses.length}</strong>
      </div>
      <ol className="assembler-assembly-lane__word-hypothesis-list">
        {hypotheses.map((hypothesis, index) => (
          <li key={`${hypothesis?.label || "hypothesis"}-${index + 1}`}>
            <strong>{hypothesis?.label || `Hypothesis ${index + 1}`}</strong>
            <p>{hypothesis?.summary || "No summary returned."}</p>
            <div className="assembler-assembly-lane__word-hypothesis-meta">
              {Array.isArray(hypothesis?.evidenceTerms) && hypothesis.evidenceTerms.length ? (
                <span>{hypothesis.evidenceTerms.join(" · ")}</span>
              ) : null}
              {hypothesis?.confidence ? (
                <span>{hypothesis.confidence === "medium" ? "Medium confidence" : "Low confidence"}</span>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function WordLayerSection({
  wordLayer,
  defaultExpanded = false,
  onInterpretWordLayer,
  wordLayerHypotheses = [],
  wordLayerHypothesesPending = false,
  wordLayerHypothesesError = "",
}) {
  const classSummary = Array.isArray(wordLayer?.classSummary)
    ? wordLayer.classSummary.filter((entry) => entry?.count > 0)
    : [];
  const canInterpret =
    Boolean(wordLayer?.hypothesisReadyEvidence?.available) && typeof onInterpretWordLayer === "function";
  const selectionPointCount = wordLayer?.hasEnoughChronology
    ? Array.isArray(wordLayer?.divergenceMoments)
      ? wordLayer.divergenceMoments.length
      : 0
    : 0;
  const summaryItems = [
    `${wordLayer?.termCount || 0} terms`,
    `${selectionPointCount} ${selectionPointCount === 1 ? "selection point" : "selection points"}`,
  ];

  return (
    <details
      className="assembler-assembly-lane__word-layer-shell"
      open={defaultExpanded}
    >
      <summary className="assembler-assembly-lane__word-layer-summary">
        <div className="assembler-assembly-lane__word-layer-copy">
          <span className="assembler-assembly-lane__strip-label">Word layer</span>
          <strong className="assembler-assembly-lane__word-layer-title">Lexical archaeology</strong>
        </div>
        <div className="assembler-assembly-lane__word-layer-summary-meta">
          {summaryItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </summary>

      <section className="assembler-assembly-lane__word-layer" aria-label="Word layer">
        {canInterpret ? (
          <div className="assembler-assembly-lane__word-layer-tools">
            <button
              type="button"
              className="assembler-assembly-lane__word-action"
              onClick={onInterpretWordLayer}
              disabled={wordLayerHypothesesPending}
            >
              <ScanLine size={ICON_SIZE} strokeWidth={ICON_STROKE} />
              <span>{wordLayerHypothesesPending ? "Reading…" : "Interpret with Seven"}</span>
            </button>
          </div>
        ) : null}

        {wordLayer?.empty ? (
          <p className="assembler-assembly-lane__word-empty">
            Add more language to the box before reading for load-bearing words.
          </p>
        ) : (
          <>
            {classSummary.length ? (
              <div className="assembler-assembly-lane__word-summary-row">
                {classSummary.map((entry) => (
                  <span key={entry.id} className="assembler-assembly-lane__word-summary-pill">
                    <strong>{entry.label}</strong>
                    <span>{entry.count}</span>
                  </span>
                ))}
              </div>
            ) : null}

            <div className="assembler-assembly-lane__word-grid">
              <WordTermList
                title="Invariant"
                terms={wordLayer?.hasEnoughChronology ? wordLayer?.invariantTerms || [] : []}
                emptyText={
                  wordLayer?.hasEnoughChronology
                    ? "No invariant language is strong enough to show yet."
                    : wordLayer?.lowHistoryNote || "More history is needed for time-based reading."
                }
              />
              <WordTermList
                title="Emerging"
                terms={wordLayer?.hasEnoughChronology ? wordLayer?.emergentTerms || [] : []}
                emptyText={
                  wordLayer?.hasEnoughChronology
                    ? "No emerging terms are strong enough to show yet."
                    : wordLayer?.lowHistoryNote || "More history is needed for time-based reading."
                }
              />
              <WordTermList
                title="Receding"
                terms={wordLayer?.hasEnoughChronology ? wordLayer?.recedingTerms || [] : []}
                emptyText={
                  wordLayer?.hasEnoughChronology
                    ? "No receding terms are strong enough to show yet."
                    : wordLayer?.lowHistoryNote || "More history is needed for time-based reading."
                }
              />
            </div>

            <div className="assembler-assembly-lane__word-grid assembler-assembly-lane__word-grid--secondary">
              <WordTermList
                title="Carried"
                terms={wordLayer?.carriedTerms || []}
                emptyText="No carried terms are clear enough yet."
              />
              <WordTermList
                title="Dropped"
                terms={wordLayer?.droppedTerms || []}
                emptyText="Nothing has clearly fallen away yet."
              />
              <WordSelectionList
                moments={wordLayer?.hasEnoughChronology ? wordLayer?.divergenceMoments || [] : []}
              />
            </div>
          </>
        )}

        {wordLayerHypothesesError ? (
          <p className="assembler-assembly-lane__word-error">{wordLayerHypothesesError}</p>
        ) : null}

        <WordHypothesisList hypotheses={wordLayerHypotheses} />

        <p className="assembler-assembly-lane__word-disclaimer">
          {wordLayer?.disclaimer || "Interpretations are hypotheses, not facts."}
        </p>
      </section>
    </details>
  );
}

function LaneEntry({ entry, onOpenEntry, onInspectEvidence, showLakinDefinition = false }) {
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

      {entry?.pivotPair ? (
        <p className="assembler-assembly-lane__entry-pivot">{entry.pivotPair}</p>
      ) : null}

      <div className="assembler-assembly-lane__entry-badges">
        <LaneBadge
          label={entry?.stageStatusLabel || "Present"}
          tone="stage"
          hasEvidence={entry?.proofStatus === "sealed" || entry?.proofStatus === "evidenced"}
        />
        {entry?.isLakinMoment ? (
          <LaneBadge
            label="Lakin moment"
            tone="lakin"
          />
        ) : null}
      </div>

      {showLakinDefinition ? (
        <p className="assembler-assembly-lane__entry-note">
          A Lakin moment is a turn where something fell away and something more durable was carried forward.
        </p>
      ) : null}
    </article>
  );
}

export default function AssemblyLane({
  viewModel,
  onOpenEntry,
  onInspectEvidence,
  onRunContextualAction,
  onInterpretWordLayer,
  wordLayerHypotheses,
  wordLayerHypothesesPending,
  wordLayerHypothesesError,
}) {
  const moveGroups = Array.isArray(viewModel?.moveGroups) ? viewModel.moveGroups : [];
  const entryCount = Array.isArray(viewModel?.entries) ? viewModel.entries.length : 0;
  const protocolPosition = viewModel?.protocolPosition || "collecting";
  const firstLakinEntryId =
    moveGroups
      .flatMap((group) => (Array.isArray(group?.entries) ? group.entries : []))
      .find((entry) => entry?.isLakinMoment)?.id || "";
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
          {viewModel?.introLine ? (
            <p className="assembler-assembly-lane__strip-intro">{viewModel.introLine}</p>
          ) : null}
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
                        showLakinDefinition={entry.id === firstLakinEntryId}
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

      <WordLayerSection
        wordLayer={viewModel?.wordLayer}
        defaultExpanded={Boolean(viewModel?.wordLayerDefaultExpanded)}
        onInterpretWordLayer={
          typeof onInterpretWordLayer === "function"
            ? () => onInterpretWordLayer(viewModel?.wordLayer)
            : null
        }
        wordLayerHypotheses={wordLayerHypotheses}
        wordLayerHypothesesPending={wordLayerHypothesesPending}
        wordLayerHypothesesError={wordLayerHypothesesError}
      />
    </div>
  );
}
