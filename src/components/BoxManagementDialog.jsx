function formatBoxMeta(project = null) {
  const sourceCount = Number(project?.sourceCount) || 0;
  const seedCount = Number(project?.assemblyCount) || 0;
  const parts = [
    `${sourceCount} source${sourceCount === 1 ? "" : "s"}`,
    `${seedCount} seed${seedCount === 1 ? "" : "s"}`,
  ];
  if (project?.isPinned) parts.push("pinned");
  if (project?.isArchived) parts.push("archived");
  return parts.join(" · ");
}

export default function BoxManagementDialog({
  open = false,
  projects = [],
  selectedProjectKey = "",
  createTitle = "",
  createRootText = "",
  createRootGloss = "",
  renameTitle = "",
  pendingAction = "",
  errorMessage = "",
  onClose,
  onSelectProject,
  onCreateTitleChange,
  onCreateRootTextChange,
  onCreateRootGlossChange,
  onRenameTitleChange,
  onCreate,
  onRename,
  onDelete,
  onOpenProject,
  onTogglePin,
  onToggleArchive,
}) {
  if (!open) return null;

  const selectedProject =
    projects.find((project) => project.projectKey === selectedProjectKey) ||
    projects[0] ||
    null;
  const creating = pendingAction === "__create__";
  const renaming = pendingAction === "__rename__";
  const deleting = pendingAction === "__delete__";
  const mutating = Boolean(pendingAction);

  return (
    <div className="assembler-image-chooser assembler-image-chooser--box-management">
      <button
        type="button"
        className="assembler-image-chooser__backdrop"
        aria-label="Close box management"
        onClick={mutating ? undefined : onClose}
      />

      <div
        className="assembler-image-chooser__panel assembler-box-management"
        role="dialog"
        aria-modal="true"
        aria-labelledby="box-management-title"
      >
        <div className="assembler-image-chooser__header">
          <div className="assembler-image-chooser__copy">
            <span className="assembler-sheet__eyebrow">Boxes</span>
            <h2 id="box-management-title" className="assembler-image-chooser__title">
              Manage boxes
            </h2>
          </div>

          <button
            type="button"
            className="assembler-sheet__close"
            onClick={mutating ? undefined : onClose}
            disabled={mutating}
          >
            Close
          </button>
        </div>

        <div className="assembler-box-management__body">
          <section className="assembler-box-management__section">
            <div className="assembler-box-management__section-head">
              <span>Create a new Box</span>
              <span>In-product flow</span>
            </div>

            <div className="assembler-box-management__form">
              <input
                className="assembler-box-management__input"
                value={createTitle}
                onChange={(event) => onCreateTitleChange(event.target.value)}
                placeholder="Untitled Box"
                aria-label="New Box title"
                disabled={mutating}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && createTitle.trim() && !creating) {
                    event.preventDefault();
                    onCreate();
                  }
                }}
              />
              <input
                className="assembler-box-management__input"
                value={createRootText}
                onChange={(event) => onCreateRootTextChange(event.target.value)}
                placeholder="Root (7 words or fewer)"
                aria-label="New Box root"
                disabled={mutating}
              />
              <textarea
                className="assembler-box-management__input assembler-box-management__textarea"
                value={createRootGloss}
                onChange={(event) => onCreateRootGlossChange(event.target.value)}
                placeholder="Gloss: one sentence expanding the root."
                aria-label="New Box root gloss"
                disabled={mutating}
                rows={3}
              />
              <button
                type="button"
                className="assembler-box-management__primary"
                onClick={onCreate}
                disabled={!createTitle.trim() || !createRootText.trim() || !createRootGloss.trim() || mutating}
              >
                {creating ? "Creating…" : "Create Box"}
              </button>
            </div>
          </section>

          <section className="assembler-box-management__section">
            <div className="assembler-box-management__section-head">
              <span>Manage existing Boxes</span>
              <span>{projects.length}</span>
            </div>

            <div className="assembler-box-management__list">
              {projects.map((project) => (
                <button
                  key={project.projectKey}
                  type="button"
                  className={`assembler-box-management__row ${
                    project.projectKey === selectedProject?.projectKey ? "is-active" : ""
                  }`}
                  onClick={() => onSelectProject(project.projectKey)}
                  disabled={mutating}
                >
                  <span className="assembler-box-management__row-copy">
                    <span className="assembler-box-management__row-title">
                      {project.boxTitle || project.title || "Untitled Box"}
                    </span>
                    <span className="assembler-box-management__row-meta">
                      {formatBoxMeta(project)}
                      {project.isDefaultBox ? " · default box" : ""}
                    </span>
                  </span>
                  <span className="assembler-box-management__row-action">Manage</span>
                </button>
              ))}
            </div>
          </section>

          {selectedProject ? (
            <section className="assembler-box-management__section">
              <div className="assembler-box-management__section-head">
                <span>Selected Box</span>
                <span>{selectedProject.isDefaultBox ? "Protected" : "Movable"}</span>
              </div>

              <div className="assembler-box-management__selected">
                <div className="assembler-box-management__selected-copy">
                  <strong>{selectedProject.boxTitle || selectedProject.title || "Untitled Box"}</strong>
                  <p>
                    Rename the box here. Deleting a non-default box moves its sources, seeds,
                    and receipt drafts into the default box instead of deleting the work.
                  </p>
                </div>

                <div className="assembler-box-management__form">
                  <input
                    className="assembler-box-management__input"
                    value={renameTitle}
                    onChange={(event) => onRenameTitleChange(event.target.value)}
                    placeholder="Untitled Box"
                    aria-label="Selected Box title"
                    disabled={mutating}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && renameTitle.trim() && !renaming) {
                        event.preventDefault();
                        onRename();
                      }
                    }}
                  />

                  <div className="assembler-box-management__selected-actions">
                    <button
                      type="button"
                      className="assembler-box-management__secondary"
                      onClick={onOpenProject}
                      disabled={mutating}
                    >
                      Open Box
                    </button>
                    <button
                      type="button"
                      className="assembler-box-management__primary"
                      onClick={onRename}
                      disabled={!renameTitle.trim() || mutating}
                    >
                      {renaming ? "Saving…" : "Save name"}
                    </button>
                    <button
                      type="button"
                      className="assembler-box-management__secondary"
                      onClick={onTogglePin}
                      disabled={mutating}
                    >
                      {selectedProject.isPinned ? "Unpin" : "Pin"}
                    </button>
                    {!selectedProject.isDefaultBox ? (
                      <button
                        type="button"
                        className="assembler-box-management__secondary"
                        onClick={onToggleArchive}
                        disabled={mutating}
                      >
                        {selectedProject.isArchived ? "Restore" : "Archive"}
                      </button>
                    ) : null}
                    {!selectedProject.isDefaultBox ? (
                      <button
                        type="button"
                        className="assembler-box-management__danger"
                        onClick={onDelete}
                        disabled={mutating}
                      >
                        {deleting ? "Moving work…" : "Delete Box"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </div>

        {errorMessage ? (
          <p className="assembler-delete-dialog__error" aria-live="polite">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
