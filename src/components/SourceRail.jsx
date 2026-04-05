import { buildSourceSummaryViewModel } from "@/lib/box-view-models";

function formatTrustLabel(value = "") {
  const normalized = String(value || "").trim();
  return normalized ? `${normalized} trust` : "";
}

function buildSourceBadges(sourceSummary) {
  if (!sourceSummary) return [];

  return [
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
  const badges = buildSourceBadges(sourceSummary);
  const provenanceLine = buildSourceProvenanceLine(sourceSummary, document);

  return (
    <div className={`assembler-source-rail__row ${active ? "is-active" : ""} ${isGuide ? "is-guide" : ""}`}>
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
  activeDocumentKey,
  loadingDocumentKey = "",
  guideDocument = null,
  sourceDocuments = [],
  assemblyDocuments = [],
  onOpenProjectHome,
  onUpload,
  onOpenPhoto,
  onPasteSource,
  onOpenDocument,
  uploading = false,
  sourceOpenMode = "listen",
  ActionIcon,
  getDocumentBlockCountLabel,
  getDocumentKindLabel,
}) {
  const boxTitle = activeProject?.boxTitle || activeProject?.title || "Untitled Box";
  const sourceRows = guideDocument
    ? [guideDocument, ...sourceDocuments]
    : sourceDocuments;

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
            Assembly lane
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

      <div className="assembler-source-rail__scroll">
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
                  onOpen={() => onOpenDocument(document.documentKey, sourceOpenMode, { phase: "think" })}
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

        <section className="assembler-source-rail__section">
          <div className="assembler-source-rail__section-head">
            <span>Seeds</span>
            <span>{assemblyDocuments.length}</span>
          </div>

          <div className="assembler-source-rail__list">
            {assemblyDocuments.length ? (
              assemblyDocuments.map((document) => (
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
              <p className="assembler-source-rail__empty">No seed yet.</p>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
}
