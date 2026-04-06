import { buildSourceSummaryViewModel } from "@/lib/box-view-models";
import { SettlementHex, SignalChip } from "@/components/LoegosSystem";

function formatTrustLabel(value = "") {
  const normalized = String(value || "").trim();
  return normalized ? `${normalized} trust` : "";
}

function buildSourceBadges(sourceSummary, role = "source") {
  if (!sourceSummary) return [];

  return [
    role === "artifact" ? "Artifact" : "",
    sourceSummary.trustProfile?.exampleSourceClassificationLabel || "",
    sourceSummary.badge || "",
    sourceSummary.originLabel || "",
    formatTrustLabel(sourceSummary.trustProfile?.trustLevelHint),
  ].filter(Boolean);
}

function buildSourceProvenanceLine(sourceSummary, document) {
  if (!sourceSummary) return "";

  return (
    sourceSummary.trustProfile?.summary ||
    (sourceSummary.provenance?.sourceLabel &&
    sourceSummary.provenance.sourceLabel !== document?.title
      ? sourceSummary.provenance.sourceLabel
      : "")
  );
}

function SourceRailRow({
  document,
  role = "source",
  activeDocumentKey,
  loadingDocumentKey,
  onListen,
  onOpen,
  _ActionIcon,
  getDocumentBlockCountLabel,
  getDocumentKindLabel,
}) {
  const sourceSummary = buildSourceSummaryViewModel(document);
  const active = document.documentKey === activeDocumentKey;
  const isGuide =
    document?.documentType === "builtin" || document?.sourceType === "builtin";
  const badges = buildSourceBadges(sourceSummary, role);
  const provenanceLine = buildSourceProvenanceLine(sourceSummary, document);

  return (
    <div
      className={`assembler-source-rail__row ${active ? "is-active" : ""} ${isGuide ? "is-guide" : ""} ${
        role === "artifact" ? "is-artifact" : ""
      }`}
    >
      <button
        type="button"
        className="assembler-source-rail__quick"
        onClick={onListen}
        aria-label={`Listen to ${document.title}`}
      >
        <_ActionIcon kind="listen" />
      </button>

      <button
        type="button"
        className="assembler-source-rail__body"
        onClick={onOpen}
      >
        <span className="assembler-source-rail__title">{document.title}</span>
        <span className="assembler-source-rail__meta">
          {sourceSummary?.metaLine || getDocumentBlockCountLabel(document)}
        </span>
        {provenanceLine ? (
          <span className="assembler-source-rail__provenance">{provenanceLine}</span>
        ) : null}
      </button>

      <div className="assembler-source-rail__badges">
        {loadingDocumentKey === document.documentKey ? (
          <span className="assembler-source-rail__badge">Loading…</span>
        ) : (
          badges.map((badge) => (
            <span key={`${document.documentKey}-${badge}`} className="assembler-source-rail__badge">
              {badge}
            </span>
          ))
        )}
        {!badges.length && !loadingDocumentKey ? (
          <span className="assembler-source-rail__badge">
            {getDocumentKindLabel(document)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function SourceRail({
  activeProject,
  artifactDocumentKey = "",
  activeDocumentKey,
  loadingDocumentKey = "",
  guideDocument = null,
  sourceDocuments = [],
  assemblyDocuments = [],
  buildState = null,
  onOpenProjectHome,
  onOpenReceipts,
  onUpload,
  onOpenPhoto,
  onPasteSource,
  onOpenDocument,
  uploading = false,
  ActionIcon,
  getDocumentBlockCountLabel,
  getDocumentKindLabel,
}) {
  const boxTitle = activeProject?.boxTitle || activeProject?.title || "Untitled Box";
  const sourceRows = guideDocument
    ? [guideDocument, ...sourceDocuments]
    : sourceDocuments;
  const artifactRows = [...assemblyDocuments].sort((left, right) => {
    const leftPinned = left?.documentKey === artifactDocumentKey ? 1 : 0;
    const rightPinned = right?.documentKey === artifactDocumentKey ? 1 : 0;
    return rightPinned - leftPinned;
  });

  return (
    <aside className="assembler-source-rail">
      <div className="assembler-source-rail__header">
        <div className="assembler-source-rail__copy">
          <span className="assembler-source-rail__eyebrow">Box</span>
          <span className="assembler-source-rail__project">{boxTitle}</span>
        </div>

        <div className="assembler-source-rail__actions">
          <button
            type="button"
            className="assembler-source-rail__action"
            onClick={onOpenProjectHome}
          >
            Overview
          </button>
          <button
            type="button"
            className="assembler-source-rail__action"
            onClick={onUpload}
            disabled={uploading}
          >
            {uploading ? "Importing…" : "Add file"}
          </button>
          <button
            type="button"
            className="assembler-source-rail__action"
            onClick={onOpenPhoto}
            disabled={uploading}
          >
            Photo
          </button>
          <button
            type="button"
            className="assembler-source-rail__action"
            onClick={onPasteSource}
          >
            Paste
          </button>
        </div>
      </div>

      {buildState ? (
        <section className="assembler-source-rail__runtime">
          <div className="assembler-source-rail__runtime-head">
            <div className="assembler-source-rail__runtime-copy">
              <span className="assembler-source-rail__eyebrow">Runtime</span>
              <strong className="assembler-source-rail__runtime-title">
                IDE state stays live.
              </strong>
            </div>
            <SettlementHex
              stageCount={buildState.settlementStage || 0}
              label={`stage ${buildState.settlementStage || 0}`}
            />
          </div>

          <div className="assembler-source-rail__runtime-metrics">
            <div className="assembler-source-rail__runtime-metric">
              <span>Convergence</span>
              <strong>{buildState.convergencePercent || 0}%</strong>
            </div>
            <div className="assembler-source-rail__runtime-metric">
              <span>Trust</span>
              <strong>{buildState.trustFloor || "L1"}</strong>
            </div>
            <div className="assembler-source-rail__runtime-metric">
              <span>Branches</span>
              <strong>{buildState.branchCount || 0}</strong>
            </div>
            <div className="assembler-source-rail__runtime-metric">
              <span>Receipts</span>
              <strong>{buildState.receiptCount || 0}</strong>
            </div>
          </div>

          <div className="assembler-source-rail__runtime-footer">
            <SignalChip
              tone={buildState.canSeal ? "clear" : buildState.errorCount ? "alert" : "active"}
              subtle
            >
              {buildState.canSeal
                ? "ready to seal"
                : buildState.errorCount
                  ? `${buildState.errorCount} blockers`
                  : "in progress"}
            </SignalChip>
            <button
              type="button"
              className="assembler-source-rail__runtime-link"
              onClick={onOpenReceipts}
            >
              Open build output
            </button>
          </div>
        </section>
      ) : null}

      <div className="assembler-source-rail__scroll">
        <section className="assembler-source-rail__section">
          <div className="assembler-source-rail__section-head">
            <span>Artifact</span>
            <span>{artifactRows.length}</span>
          </div>

          <div className="assembler-source-rail__list">
            {artifactRows.length ? (
              artifactRows.map((document) => (
                <SourceRailRow
                  key={document.documentKey}
                  document={document}
                  role="artifact"
                  activeDocumentKey={activeDocumentKey}
                  loadingDocumentKey={loadingDocumentKey}
                  onListen={() => onOpenDocument(document.documentKey, "listen", { phase: "think" })}
                  onOpen={() => onOpenDocument(document.documentKey, "assemble", { phase: "create" })}
                  _ActionIcon={ActionIcon}
                  getDocumentBlockCountLabel={getDocumentBlockCountLabel}
                  getDocumentKindLabel={getDocumentKindLabel}
                />
              ))
            ) : (
              <p className="assembler-source-rail__empty">No artifact is pinned yet.</p>
            )}
          </div>
        </section>

        <section className="assembler-source-rail__section">
          <div className="assembler-source-rail__section-head">
            <span>Sources</span>
            <span>{sourceRows.length}</span>
          </div>

          <div className="assembler-source-rail__list">
            {sourceRows.length ? (
              sourceRows.map((document) => (
                <SourceRailRow
                  key={document.documentKey}
                  document={document}
                  activeDocumentKey={activeDocumentKey}
                  loadingDocumentKey={loadingDocumentKey}
                  onListen={() => onOpenDocument(document.documentKey, "listen", { phase: "think" })}
                  onOpen={() => onOpenDocument(document.documentKey, "assemble", { phase: "create" })}
                  _ActionIcon={ActionIcon}
                  getDocumentBlockCountLabel={getDocumentBlockCountLabel}
                  getDocumentKindLabel={getDocumentKindLabel}
                />
              ))
            ) : (
              <p className="assembler-source-rail__empty">No imported sources yet.</p>
            )}
          </div>
        </section>

        <section className="assembler-source-rail__section assembler-source-rail__section--receipts">
          <div className="assembler-source-rail__section-head">
            <span>Receipts</span>
            <span>{buildState?.receiptCount || 0}</span>
          </div>

          <button
            type="button"
            className="assembler-source-rail__receipt-card"
            onClick={onOpenReceipts}
          >
            <span className="assembler-source-rail__receipt-label">Build output</span>
            <strong className="assembler-source-rail__receipt-title">
              {buildState?.receiptCount ? "Open the latest receipts" : "No sealed receipt yet"}
            </strong>
            <span className="assembler-source-rail__receipt-detail">
              Receipts stay outside the editable file world.
            </span>
          </button>
        </section>
      </div>
    </aside>
  );
}
