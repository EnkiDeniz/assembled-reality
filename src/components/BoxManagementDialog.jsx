function formatBoxMeta(project = null) {
  const sourceCount = Number(project?.sourceCount) || 0;
  const assemblyCount = Number(project?.assemblyCount) || 0;
  return `${sourceCount} source${sourceCount === 1 ? "" : "s"} · ${assemblyCount} assembl${assemblyCount === 1 ? "y" : "ies"}`;
}

export default function BoxManagementDialog({
  open = false,
  projects = [],
  selectedProjectKey = "",
  createTitle = "",
  renameTitle = "",
  pendingAction = "",
  errorMessage = "",
  onClose,
  onSelectProject,
  onCreateTitleChange,
  onRenameTitleChange,
  onCreate,
  onRename,
  onDelete,
  onOpenProject,
}) {
  if (!open) return null;

  const selectedProject =
    projects.find((project) => project.projectKey === selectedProjectKey) ||
    projects[0] ||
    null;
  const creating = pendingAction === "__create__";
  const renaming = pendingAction === "__rename__";
  const deleting = pendingAction === "__delete__";

  return (
    <div className="assembler-image-chooser assembler-image-chooser--box-management">
      <button
        type="button"
        className="assembler-image-chooser__backdrop"
        aria-label="Close box management"
        onClick={creating || renaming || deleting ? undefined : onClose}
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
            onClick={creating || renaming || deleting ? undefined : onClose}
            disabled={creating || renaming || deleting}
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
                disabled={creating || renaming || deleting}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && createTitle.trim() && !creating) {
                    event.preventDefault();
                    onCreate();
                  }
                }}
              />
              <button
                type="button"
                className="assembler-box-management__primary"
                onClick={onCreate}
                disabled={!createTitle.trim() || creating || renaming || deleting}
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
                  disabled={creating || renaming || deleting}
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
                    Rename the box here. Deleting a non-default box moves its sources, assemblies,
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
                    disabled={creating || renaming || deleting}
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
                      disabled={creating || renaming || deleting}
                    >
                      Open Box
                    </button>
                    <button
                      type="button"
                      className="assembler-box-management__primary"
                      onClick={onRename}
                      disabled={!renameTitle.trim() || creating || renaming || deleting}
                    >
                      {renaming ? "Saving…" : "Save name"}
                    </button>
                    {!selectedProject.isDefaultBox ? (
                      <button
                        type="button"
                        className="assembler-box-management__danger"
                        onClick={onDelete}
                        disabled={creating || renaming || deleting}
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
