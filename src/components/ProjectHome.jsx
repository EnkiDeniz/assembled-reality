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
  const isGuide =
    document?.documentType === "builtin" || document?.sourceType === "builtin";

  return (
    <div className={`assembler-project-home__row ${isGuide ? "is-guide" : ""}`}>
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
            title={`Delete ${document.title}`}
          >
            <_ActionIcon kind="delete" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ProjectHomeAction({
  title,
  description,
  icon,
  onClick,
  disabled = false,
  _ActionIcon,
  tone = "",
}) {
  return (
    <button
      type="button"
      className={`assembler-project-home__action ${tone ? `is-${tone}` : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="assembler-project-home__action-icon" aria-hidden="true">
        <_ActionIcon kind={icon} />
      </span>
      <span className="assembler-project-home__action-copy">
        <span className="assembler-project-home__action-title">{title}</span>
        <span className="assembler-project-home__action-detail">{description}</span>
      </span>
    </button>
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
  const sourceRows = guideDocument
    ? [guideDocument, ...sourceDocuments]
    : sourceDocuments;
  const sourceCount = sourceRows.length;
  const assemblyCount = currentAssemblyDocument
    ? 1 + recentAssemblies.length
    : recentAssemblies.length;
  const featuredDrafts = projectDrafts.slice(0, 3);
  const secondaryActions = [
    {
      title: "Add source",
      description: "PDF, DOCX, Markdown, TXT, or link.",
      icon: "upload",
      onClick: onOpenIntake,
      disabled: busy,
      tone: "source",
    },
    {
      title: "Paste to staging",
      description: clipboardCount
        ? `${clipboardCount} block${clipboardCount === 1 ? "" : "s"} ready to place.`
        : "Move copied material into the working assembly.",
      icon: "paste-source",
      onClick: onPasteClipboard,
      disabled: busy,
      tone: "staging",
    },
    {
      title: "Speak note",
      description: "Capture a voice memo as source material.",
      icon: "speak",
      onClick: onOpenSpeak,
      disabled: busy,
      tone: "note",
    },
  ];

  return (
    <div className="assembler-project-home">
      <section className="assembler-project-home__masthead">
        <div className="assembler-project-home__copy">
          <span className="assembler-project-home__eyebrow">Workspace</span>
          <h1 className="assembler-project-home__title">
            {activeProject?.title || "Main Project"}
          </h1>
          <p className="assembler-project-home__subtitle">
            {activeProject?.subtitle || "Import a source, ask Seven, shape the current assembly, keep the receipt."}
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

        {projects.length > 1 ? (
          <div className="assembler-project-home__projects">
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
          </div>
        ) : null}
      </section>

      <section className="assembler-project-home__control-strip">
        <ProjectHomeAction
          title={primaryAction.label}
          description={`${primaryAction.title}${primaryAction.detail ? ` · ${primaryAction.detail}` : ""}`}
          icon={primaryAction.icon}
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          _ActionIcon={ActionIcon}
          tone="primary"
        />

        <div className="assembler-project-home__actions">
          {secondaryActions.map((action) => (
            <ProjectHomeAction
              key={action.title}
              title={action.title}
              description={action.description}
              icon={action.icon}
              onClick={action.onClick}
              disabled={action.disabled}
              _ActionIcon={ActionIcon}
              tone={action.tone}
            />
          ))}
        </div>
      </section>

      <div className="assembler-project-home__layout">
        <section className="assembler-project-home__panel assembler-project-home__panel--materials">
          <div className="assembler-project-home__section-head">
            <span>Sources</span>
            <span>{sourceCount}</span>
          </div>

          <div className="assembler-project-home__list">
            {sourceRows.length ? (
              sourceRows.slice(0, 8).map((document) => (
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

        <div className="assembler-project-home__stack">
          <section className="assembler-project-home__panel">
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
                  No current assembly yet. Start with a source and keep building.
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

          <section className="assembler-project-home__panel">
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
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
