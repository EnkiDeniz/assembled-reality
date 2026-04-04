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
  const active = document.documentKey === activeDocumentKey;
  const isGuide =
    document?.documentType === "builtin" || document?.sourceType === "builtin";

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
          {getDocumentBlockCountLabel(document)}
        </span>
      </button>

      <span className="assembler-source-rail__badge">
        {loadingDocumentKey === document.documentKey
          ? "Loading…"
          : getDocumentKindLabel(document)}
      </span>
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
  onPasteSource,
  onOpenDocument,
  uploading = false,
  sourceOpenMode = "assemble",
  ActionIcon,
  getDocumentBlockCountLabel,
  getDocumentKindLabel,
}) {
  const sourceRows = guideDocument
    ? [guideDocument, ...sourceDocuments]
    : sourceDocuments;

  return (
    <aside className="assembler-source-rail">
      <div className="assembler-source-rail__header">
        <div className="assembler-source-rail__copy">
          <span className="assembler-source-rail__eyebrow">Project</span>
          <span className="assembler-source-rail__project">
            {activeProject?.title || "Main Project"}
          </span>
        </div>

        <div className="assembler-source-rail__actions">
          <button
            type="button"
            className="assembler-source-rail__action"
            onClick={onOpenProjectHome}
          >
            Project
          </button>
          <button
            type="button"
            className="assembler-source-rail__action"
            onClick={onUpload}
            disabled={uploading}
          >
            {uploading ? "Importing…" : "Upload"}
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
                  onListen={() => onOpenDocument(document.documentKey, "listen")}
                  onOpen={() => onOpenDocument(document.documentKey, sourceOpenMode)}
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
            <span>Assemblies</span>
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
                  onListen={() => onOpenDocument(document.documentKey, "listen")}
                  onOpen={() => onOpenDocument(document.documentKey, "assemble")}
                  _ActionIcon={ActionIcon}
                  getDocumentBlockCountLabel={getDocumentBlockCountLabel}
                  getDocumentKindLabel={getDocumentKindLabel}
                />
              ))
            ) : (
              <p className="assembler-source-rail__empty">No assemblies yet.</p>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
}
