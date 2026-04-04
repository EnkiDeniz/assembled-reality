import Link from "next/link";

function ProjectHomeDocumentRow({
  document,
  loadingDocumentKey,
  onListen,
  onOpen,
  onDelete,
  _ActionIcon,
  getDocumentBlockCountLabel,
  getDocumentKindLabel,
}) {
  return (
    <div className="assembler-project-home__row">
      <button
        type="button"
        className="assembler-project-home__row-quick"
        onClick={onListen}
        aria-label={`Listen to ${document.title}`}
      >
        <_ActionIcon kind="listen" />
      </button>

      <button
        type="button"
        className="assembler-project-home__row-body"
        onClick={onOpen}
      >
        <span className="assembler-project-home__row-title">{document.title}</span>
        <span className="assembler-project-home__row-meta">
          {getDocumentBlockCountLabel(document)}
        </span>
      </button>

      <div className="assembler-project-home__row-aside">
        <span className="assembler-project-home__row-badge">
          {loadingDocumentKey === document.documentKey
            ? "Loading…"
            : getDocumentKindLabel(document)}
        </span>
        {onDelete ? (
          <button
            type="button"
            className="assembler-project-home__row-delete"
            onClick={onDelete}
            aria-label={`Delete ${document.title}`}
          >
            Delete
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function ProjectHome({
  activeProject,
  activeProjectKey,
  projects,
  projectDrafts = [],
  projectActionPending = "",
  loadingDocumentKey = "",
  busy = false,
  clipboardCount = 0,
  primaryAction,
  guideDocument = null,
  sourceDocuments = [],
  currentAssemblyDocument = null,
  recentAssemblies = [],
  onCreateProject,
  onOpenDocument,
  onOpenProject,
  onDeleteDocument,
  onPasteClipboard,
  onOpenSpeak,
  onOpenIntake,
  ActionIcon,
  getDocumentBlockCountLabel,
  getDocumentKindLabel,
  canDeleteDocument,
  sourceOpenMode,
}) {
  const sourceCount = sourceDocuments.length + (guideDocument ? 1 : 0);
  const assemblyCount = currentAssemblyDocument
    ? 1 + recentAssemblies.length
    : recentAssemblies.length;
  const featuredDrafts = projectDrafts.slice(0, 3);

  return (
    <div className="assembler-project-home">
      <section className="assembler-project-home__hero">
        <div className="assembler-project-home__copy">
          <span className="assembler-project-home__eyebrow">Project home</span>
          <h1 className="assembler-project-home__title">
            {activeProject?.title || "Main Project"}
          </h1>
          <p className="assembler-project-home__subtitle">
            {activeProject?.subtitle || "Start from a source and build toward a working assembly."}
          </p>
          <div className="assembler-project-home__meta">
            <span>{sourceCount} source{sourceCount === 1 ? "" : "s"}</span>
            <span>{assemblyCount} assembl{assemblyCount === 1 ? "y" : "ies"}</span>
            <span>{projectDrafts.length} receipt{projectDrafts.length === 1 ? "" : "s"}</span>
            {clipboardCount ? (
              <span>{clipboardCount} staged</span>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          className="assembler-project-home__primary"
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
        >
          <div className="assembler-project-home__primary-copy">
            <span className="assembler-project-home__primary-label">{primaryAction.label}</span>
            <span className="assembler-project-home__primary-title">{primaryAction.title}</span>
            <span className="assembler-project-home__primary-detail">{primaryAction.detail}</span>
          </div>
          <span className="assembler-project-home__primary-icon" aria-hidden="true">
            <ActionIcon kind={primaryAction.icon} />
          </span>
        </button>
      </section>

      {projects.length > 1 ? (
        <section className="assembler-project-home__section">
          <div className="assembler-project-home__section-head">
            <span>Projects</span>
            <button
              type="button"
              className="assembler-project-home__section-action"
              onClick={onCreateProject}
              disabled={projectActionPending === "__create__"}
            >
              {projectActionPending === "__create__" ? "Creating…" : "New"}
            </button>
          </div>

          <div className="assembler-project-home__project-list">
            {projects.map((project) => (
              <button
                key={project.projectKey}
                type="button"
                className={`assembler-project-home__project-row ${
                  project.projectKey === activeProjectKey ? "is-active" : ""
                }`}
                onClick={() => onOpenProject(project.projectKey)}
                disabled={projectActionPending === project.projectKey}
              >
                <span className="assembler-project-home__project-title">{project.title}</span>
                <span className="assembler-project-home__project-meta">
                  {projectActionPending === project.projectKey
                    ? "Opening…"
                    : `${project.sourceCount} sources · ${project.assemblyCount} assemblies`}
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {guideDocument ? (
        <section className="assembler-project-home__guide">
          <div className="assembler-project-home__guide-copy">
            <span className="assembler-project-home__guide-label">Built-in guide</span>
            <h2 className="assembler-project-home__guide-title">{guideDocument.title}</h2>
            <p className="assembler-project-home__guide-body">
              The product teaching itself. Listen first, then pull blocks into your working assembly.
            </p>
            <div className="assembler-project-home__guide-meta">
              <span>{getDocumentBlockCountLabel(guideDocument)}</span>
              <span>{getDocumentKindLabel(guideDocument)}</span>
            </div>
          </div>

          <div className="assembler-project-home__guide-actions">
            <button
              type="button"
              className="terminal-button is-primary"
              onClick={() => onOpenDocument(guideDocument.documentKey, "listen")}
            >
              Listen
            </button>
            <button
              type="button"
              className="terminal-button"
              onClick={() => onOpenDocument(guideDocument.documentKey, sourceOpenMode)}
            >
              Open guide
            </button>
          </div>
        </section>
      ) : null}

      <div className="assembler-project-home__grid">
        <section className="assembler-project-home__section">
          <div className="assembler-project-home__section-head">
            <span>Sources</span>
            <span>{sourceDocuments.length}</span>
          </div>

          <div className="assembler-project-home__list">
            {sourceDocuments.length ? (
              sourceDocuments.slice(0, 6).map((document) => (
                <ProjectHomeDocumentRow
                  key={document.documentKey}
                  document={document}
                  loadingDocumentKey={loadingDocumentKey}
                  onListen={() => onOpenDocument(document.documentKey, "listen")}
                  onOpen={() => onOpenDocument(document.documentKey, sourceOpenMode)}
                  onDelete={
                    canDeleteDocument(document) && onDeleteDocument
                      ? () => onDeleteDocument(document)
                      : null
                  }
                  _ActionIcon={ActionIcon}
                  getDocumentBlockCountLabel={getDocumentBlockCountLabel}
                  getDocumentKindLabel={getDocumentKindLabel}
                />
              ))
            ) : (
              <p className="assembler-project-home__empty">
                No imported sources yet. Add one and start building.
              </p>
            )}
          </div>
        </section>

        <section className="assembler-project-home__section">
          <div className="assembler-project-home__section-head">
            <span>Current assembly</span>
            <span>{currentAssemblyDocument ? "Active" : "Empty"}</span>
          </div>

          <div className="assembler-project-home__list">
            {currentAssemblyDocument ? (
              <ProjectHomeDocumentRow
                document={currentAssemblyDocument}
                loadingDocumentKey={loadingDocumentKey}
                onListen={() => onOpenDocument(currentAssemblyDocument.documentKey, "listen")}
                onOpen={() => onOpenDocument(currentAssemblyDocument.documentKey, "assemble")}
                onDelete={
                  canDeleteDocument(currentAssemblyDocument) && onDeleteDocument
                    ? () => onDeleteDocument(currentAssemblyDocument)
                    : null
                }
                _ActionIcon={ActionIcon}
                getDocumentBlockCountLabel={getDocumentBlockCountLabel}
                getDocumentKindLabel={getDocumentKindLabel}
              />
            ) : (
              <p className="assembler-project-home__empty">
                No current assembly yet. Start with a source or the built-in guide.
              </p>
            )}

            {recentAssemblies.map((document) => (
              <ProjectHomeDocumentRow
                key={document.documentKey}
                document={document}
                loadingDocumentKey={loadingDocumentKey}
                onListen={() => onOpenDocument(document.documentKey, "listen")}
                onOpen={() => onOpenDocument(document.documentKey, "assemble")}
                onDelete={
                  canDeleteDocument(document) && onDeleteDocument
                    ? () => onDeleteDocument(document)
                    : null
                }
                _ActionIcon={ActionIcon}
                getDocumentBlockCountLabel={getDocumentBlockCountLabel}
                getDocumentKindLabel={getDocumentKindLabel}
              />
            ))}
          </div>
        </section>

        <section className="assembler-project-home__section">
          <div className="assembler-project-home__section-head">
            <span>Receipts</span>
            {projectDrafts.length ? (
              <Link href="/account" className="assembler-project-home__section-link">
                Review
              </Link>
            ) : null}
          </div>

          <div className="assembler-project-home__receipt-panel">
            {featuredDrafts.length ? (
              featuredDrafts.map((draft) => (
                <div key={draft.id} className="assembler-project-home__receipt-row">
                  <span className="assembler-project-home__receipt-title">
                    {draft.title || "Untitled receipt"}
                  </span>
                  <span className="assembler-project-home__receipt-meta">
                    {String(draft.status || "local_draft").toLowerCase().replace(/_/g, " ")}
                  </span>
                </div>
              ))
            ) : (
              <p className="assembler-project-home__empty">
                No receipts yet. Draft one from the receipt log after you assemble.
              </p>
            )}

            {clipboardCount ? (
              <div className="assembler-project-home__receipt-note">
                {clipboardCount} block{clipboardCount === 1 ? "" : "s"} already staged for your next assembly.
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <div className="assembler-project-home__footer-actions">
        <button
          type="button"
          className="terminal-button"
          onClick={onOpenSpeak}
          disabled={busy}
        >
          Speak note
        </button>
        <button
          type="button"
          className="terminal-button"
          onClick={onOpenIntake}
          disabled={busy}
        >
          Import source
        </button>
        <button
          type="button"
          className="terminal-button"
          onClick={onPasteClipboard}
          disabled={busy}
        >
          Paste to staging
        </button>
      </div>
    </div>
  );
}
