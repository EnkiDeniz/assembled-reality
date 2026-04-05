import { buildSourceSummaryViewModel } from "@/lib/box-view-models";

function formatReceiptModeLabel(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "operate") return "Operate";
  if (normalized === "assemble") return "Seed";
  if (normalized === "receipt") return "Receipt";
  return "Draft";
}

function buildSourceBadges(sourceSummary) {
  if (!sourceSummary) return [];

  return [
    sourceSummary.badge || "",
    sourceSummary.originLabel || "",
  ].filter(Boolean);
}

function ProjectHomeDocumentRow({
  document,
  loadingDocumentKey = "",
  onOpen,
  getDocumentBlockCountLabel,
  getDocumentKindLabel,
}) {
  const sourceSummary = buildSourceSummaryViewModel(document);
  const badges = buildSourceBadges(sourceSummary);
  const isLoading = loadingDocumentKey === document.documentKey;

  return (
    <button
      type="button"
      className="assembler-project-home__row assembler-project-home__row-button"
      onClick={onOpen}
    >
      <span className="assembler-project-home__row-copy">
        <span className="assembler-project-home__row-title">{document.title}</span>
        <span className="assembler-project-home__row-meta">
          {sourceSummary?.metaLine || getDocumentBlockCountLabel(document)}
        </span>
      </span>

      <span className="assembler-project-home__row-aside">
        {isLoading ? (
          <span className="assembler-project-home__row-badge">Loading…</span>
        ) : badges.length ? (
          badges.slice(0, 2).map((badge) => (
            <span key={`${document.documentKey}-${badge}`} className="assembler-project-home__row-badge">
              {badge}
            </span>
          ))
        ) : (
          <span className="assembler-project-home__row-badge">
            {getDocumentKindLabel(document)}
          </span>
        )}
      </span>
    </button>
  );
}

function ReceiptRow({ draft }) {
  return (
    <div className="assembler-project-home__receipt-row">
      <div className="assembler-project-home__receipt-copy">
        <span className="assembler-project-home__receipt-title">
          {draft.title || "Untitled receipt"}
        </span>
        <span className="assembler-project-home__receipt-detail">
          {formatReceiptModeLabel(draft.mode)}
          {draft.updatedAt
            ? ` · ${new Intl.DateTimeFormat(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }).format(new Date(draft.updatedAt))}`
            : ""}
        </span>
      </div>
      <span className="assembler-project-home__receipt-meta">
        {draft.courthouseStatusLine || draft.statusLabel}
      </span>
    </div>
  );
}

export default function ProjectHome({
  boxViewModel,
  activeProject,
  loadingDocumentKey = "",
  guideDocument = null,
  sourceDocuments = [],
  currentPositionAction = null,
  onBrowseBoxes,
  onOpenReceipts,
  onOpenDocument,
  getDocumentBlockCountLabel,
  getDocumentKindLabel,
  sourceOpenMode,
}) {
  const boxTitle =
    boxViewModel?.boxTitle || activeProject?.boxTitle || activeProject?.title || "Untitled Box";
  const sourceRows = guideDocument ? [guideDocument, ...sourceDocuments] : sourceDocuments;
  const receiptSummary = boxViewModel?.receiptSummary || {
    draftCount: 0,
    latestDraftStatusLabel: "Local only",
    recentDrafts: [],
  };
  const recentSources = sourceRows.slice(0, 5);
  const recentDrafts = (receiptSummary.recentDrafts || []).slice(0, 4);
  const showOnboarding = !boxViewModel?.root?.hasRoot && (boxViewModel?.realSourceCount || 0) === 0;
  const proofLine = receiptSummary.courthouseStatusLine || receiptSummary.latestDraftStatusLabel || "Local only";
  const proofDetail =
    receiptSummary.latestDraftTitle ||
    receiptSummary.syncLine ||
    "Local proof. Portable when sealed.";

  function handleOpenDocument(document) {
    const isAssembly = document?.isAssembly || document?.documentType === "assembly";
    onOpenDocument(
      document.documentKey,
      isAssembly ? "assemble" : sourceOpenMode,
      {
        phase: isAssembly ? "create" : "think",
      },
    );
  }

  return (
    <div className="assembler-project-home assembler-project-home--compressed">
      <section className="assembler-project-home__masthead">
        <div className="assembler-project-home__copy">
          <span className="assembler-project-home__eyebrow">Box home</span>
          <h1 className="assembler-project-home__title">{boxTitle}</h1>
          {showOnboarding ? (
            <p className="assembler-project-home__subtitle">Add a source. Shape the seed.</p>
          ) : null}
          <div className="assembler-project-home__meta">
            <span>
              {boxViewModel?.realSourceCount || 0} real source
              {(boxViewModel?.realSourceCount || 0) === 1 ? "" : "s"}
            </span>
            <span>{boxViewModel?.hasSeed ? "Seed ready" : "No seed yet"}</span>
            <span>
              {receiptSummary.draftCount || 0} proof draft
              {(receiptSummary.draftCount || 0) === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="assembler-project-home__secondary-button"
          onClick={onBrowseBoxes}
        >
          All boxes
        </button>
      </section>

      <div className="assembler-project-home__layout assembler-project-home__layout--compressed">
        <section className="assembler-project-home__panel">
          <div className="assembler-project-home__section-head">
            <span>Resume</span>
          </div>
          <div className="assembler-project-home__compact-copy">
            <strong className="assembler-project-home__compact-title">
              {boxViewModel?.resumeTarget?.title || "No active position yet"}
            </strong>
            <p className="assembler-project-home__compact-detail">
              {boxViewModel?.resumeTarget?.detail || "The line is clear when the box is ready."}
            </p>
            {currentPositionAction ? (
              <button
                type="button"
                className="assembler-project-home__primary-button"
                onClick={currentPositionAction.onClick}
                disabled={currentPositionAction.disabled}
              >
                {currentPositionAction.label}
              </button>
            ) : null}
          </div>
        </section>

        <section className="assembler-project-home__panel">
          <div className="assembler-project-home__section-head">
            <span>Proof</span>
            <button
              type="button"
              className="assembler-project-home__section-action"
              onClick={onOpenReceipts}
            >
              Review proof
            </button>
          </div>
          <div className="assembler-project-home__compact-copy">
            <strong className="assembler-project-home__compact-title">{proofLine}</strong>
            <p className="assembler-project-home__compact-detail">{proofDetail}</p>
          </div>
        </section>
      </div>

      <div className="assembler-project-home__layout">
        <section className="assembler-project-home__panel assembler-project-home__panel--sources">
          <div className="assembler-project-home__section-head">
            <span>Recent sources</span>
            <span>{recentSources.length}</span>
          </div>

          <div className="assembler-project-home__list">
            {recentSources.length ? (
              recentSources.map((document) => (
                <ProjectHomeDocumentRow
                  key={document.documentKey}
                  document={document}
                  loadingDocumentKey={loadingDocumentKey}
                  onOpen={() => handleOpenDocument(document)}
                  getDocumentBlockCountLabel={getDocumentBlockCountLabel}
                  getDocumentKindLabel={getDocumentKindLabel}
                />
              ))
            ) : (
              <p className="assembler-project-home__empty">
                {showOnboarding ? "Add a source. Shape the seed." : "No sources yet."}
              </p>
            )}
          </div>
        </section>

        <section className="assembler-project-home__panel">
          <div className="assembler-project-home__section-head">
            <span>Recent proof</span>
            <span>{recentDrafts.length}</span>
          </div>

          <div className="assembler-project-home__receipt-panel">
            {recentDrafts.length ? (
              recentDrafts.map((draft) => <ReceiptRow key={draft.id} draft={draft} />)
            ) : (
              <p className="assembler-project-home__empty">
                Local proof. Portable when sealed.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
