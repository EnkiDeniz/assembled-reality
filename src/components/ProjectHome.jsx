import { buildSourceSummaryViewModel } from "@/lib/box-view-models";
import {
  AssembledCard,
  BoxMetric,
  SignalChip,
} from "@/components/LoegosSystem";

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
    <div className="loegos-box-home">
      <section className="loegos-box-home__panel">
        <div className="loegos-box-home__grid">
          <div className="loegos-box-home__stack">
            <div className="loegos-box-home__resume">
              <span className="loegos-kicker">Box home</span>
              <h1 className="loegos-box-home__resume-title">{boxTitle}</h1>
              <p className="loegos-box-home__resume-copy">
                {showOnboarding
                  ? "Add a source, then enter Reality or Weld."
                  : "Resume the object, review the latest proof, or move into the room that matches the next step."}
              </p>
            </div>

            <div className="loegos-box-home__metrics">
              <BoxMetric
                label="Reality"
                value={boxViewModel?.realSourceCount || 0}
                detail={`Real source${(boxViewModel?.realSourceCount || 0) === 1 ? "" : "s"}`}
              />
              <BoxMetric
                label="Weld"
                value={boxViewModel?.hasSeed ? "Ready" : "Idle"}
                detail={boxViewModel?.hasSeed ? "Seed is live." : "No seed yet."}
              />
              <BoxMetric
                label="Seal"
                value={receiptSummary.draftCount || 0}
                detail={`Proof draft${(receiptSummary.draftCount || 0) === 1 ? "" : "s"}`}
              />
              <BoxMetric label="Return" value={boxViewModel?.resumeTarget?.verb || "Resume"} detail={boxViewModel?.resumeTarget?.detail || "The line is clear when the box is ready."} />
            </div>
          </div>

          <AssembledCard
            shapeKey="aim"
            label="Next move"
            title={boxViewModel?.resumeTarget?.title || "No active position yet"}
            body={boxViewModel?.resumeTarget?.detail || "The line is clear when the box is ready."}
            signal={boxViewModel?.hasSeed ? "Active" : "Waiting"}
            signalTone={boxViewModel?.hasSeed ? "active" : "neutral"}
            stageCount={boxViewModel?.hasSeed ? 4 : 2}
            footer="Orientation"
            action={currentPositionAction ? (
              <button
                type="button"
                className="terminal-button is-primary"
                onClick={currentPositionAction.onClick}
                disabled={currentPositionAction.disabled}
              >
                {currentPositionAction.label}
              </button>
            ) : (
              <button
                type="button"
                className="terminal-button"
                onClick={onBrowseBoxes}
              >
                All boxes
              </button>
            )}
          />
        </div>
      </section>

      <div className="loegos-box-home__cards">
        <AssembledCard
          shapeKey="reality"
          label="Reality"
          title={recentSources[0]?.title || "No recent sources"}
          body={recentSources[0] ? "Capture, listen, and inspect the materials currently inside this box." : "Add a source to give the box something to inspect."}
          detail={`${recentSources.length} recent source${recentSources.length === 1 ? "" : "s"}`}
          signal={recentSources.length ? "Active" : "Waiting"}
          signalTone={recentSources.length ? "active" : "neutral"}
          stageCount={recentSources.length ? 3 : 1}
          footer="Recent sources"
        />
        <AssembledCard
          shapeKey="seal"
          label="Seal"
          title={proofLine}
          body={proofDetail}
          detail={`${recentDrafts.length} recent proof item${recentDrafts.length === 1 ? "" : "s"}`}
          signal={recentDrafts.length ? "Verified" : "Unknown"}
          signalTone={recentDrafts.length ? "clear" : "neutral"}
          stageCount={recentDrafts.length ? 5 : 2}
          footer="Proof"
          action={(
            <button
              type="button"
              className="terminal-button"
              onClick={onOpenReceipts}
            >
              Review proof
            </button>
          )}
        />
      </div>

      <div className="loegos-box-home__grid">
        <section className="loegos-box-home__panel">
          <div className="loegos-box-home__section-head">
            <h2 className="loegos-box-home__section-title">Recent sources</h2>
            <SignalChip tone={recentSources.length ? "active" : "neutral"}>
              {recentSources.length}
            </SignalChip>
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
                {showOnboarding ? "Add a source. Then enter Reality." : "No sources yet."}
              </p>
            )}
          </div>
        </section>

        <section className="loegos-box-home__panel">
          <div className="loegos-box-home__section-head">
            <h2 className="loegos-box-home__section-title">Recent proof</h2>
            <SignalChip tone={recentDrafts.length ? "clear" : "neutral"}>
              {recentDrafts.length}
            </SignalChip>
          </div>

          <div className="assembler-project-home__receipt-panel">
            {recentDrafts.length ? (
              recentDrafts.map((draft) => <ReceiptRow key={draft.id} draft={draft} />)
            ) : (
              <p className="assembler-project-home__empty">
                Proof appears here once a draft is created or sealed.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
