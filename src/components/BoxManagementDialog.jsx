import InlineAssist from "@/components/InlineAssist";
import { validateRootText } from "@/lib/assembly-architecture";

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
  onCreateUpdatedExampleCopy,
  onRefreshExample,
  onDismissExampleUpdate,
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
  const selectedIsExample = Boolean(selectedProject?.isSystemExample);
  const selectedExampleUpdateAvailable = Boolean(selectedProject?.systemExampleUpdateAvailable);
  const selectedCanDelete = selectedProject && !selectedProject.isDefaultBox;
  const selectedDescription = selectedProject?.isDefaultBox
    ? "Rename the default box here. It stays."
    : selectedExampleUpdateAvailable
      ? selectedProject?.systemExampleUserModified
        ? "A newer Lœgos example exists. This copy was edited, so it will not refresh silently."
        : "A newer Lœgos example exists for this box."
    : selectedIsExample
      ? "Editable example from the real Lœgos origin corpus. Delete it to remove the example and anything kept inside it."
      : "Rename, pin, archive, or delete this box. Deleting it moves work into the default box.";

  return (
    <div className="assembler-sheet assembler-sheet--workspace is-open">
      <div
        className="assembler-sheet__backdrop"
        aria-hidden="true"
        onClick={mutating ? undefined : onClose}
      />

      <div
        className="assembler-sheet__panel assembler-sheet__panel--workspace assembler-box-management"
        role="dialog"
        aria-modal="true"
        aria-labelledby="box-management-title"
      >
        <div className="assembler-sheet__header">
          <div className="assembler-home__copy">
            <span className="assembler-sheet__eyebrow">Boxes</span>
            <h2 id="box-management-title" className="assembler-sheet__title">
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
              <span>Create box</span>
              <span>New</span>
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
              <InlineAssist
                error={validateRootText(createRootText)}
                visible={Boolean(createRootText.trim() && validateRootText(createRootText))}
                assemblyStep={0}
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
              <span>Boxes</span>
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
                    <span className="assembler-box-management__row-title-line">
                      <span className="assembler-box-management__row-title">
                        {project.boxTitle || project.title || "Untitled Box"}
                      </span>
                      {project.isSystemExample ? (
                        <span className="assembler-box-management__row-pill">
                          {project.systemExampleLabel || "Example"}
                        </span>
                      ) : null}
                      {project.systemExampleUpdateAvailable ? (
                        <span className="assembler-box-management__row-pill">
                          Update available
                        </span>
                      ) : null}
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
                <span>Selected box</span>
                <span>
                  {selectedProject.isDefaultBox
                    ? "Protected"
                    : selectedIsExample
                      ? selectedProject.systemExampleLabel || "Example"
                      : "Movable"}
                </span>
              </div>

              <div className="assembler-box-management__selected">
                <div className="assembler-box-management__selected-copy">
                  <strong className="assembler-box-management__selected-title-line">
                    <span>{selectedProject.boxTitle || selectedProject.title || "Untitled Box"}</span>
                    {selectedIsExample ? (
                      <span className="assembler-box-management__selected-pill">
                        {selectedProject.systemExampleLabel || "Example"}
                      </span>
                    ) : null}
                    {selectedExampleUpdateAvailable ? (
                      <span className="assembler-box-management__selected-pill">
                        Update available
                      </span>
                    ) : null}
                  </strong>
                  <p>{selectedDescription}</p>
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
                    {selectedExampleUpdateAvailable ? (
                      <>
                        <button
                          type="button"
                          className="assembler-box-management__primary"
                          onClick={onCreateUpdatedExampleCopy}
                          disabled={mutating}
                        >
                          Create updated copy
                        </button>
                        <button
                          type="button"
                          className="assembler-box-management__secondary"
                          onClick={onRefreshExample}
                          disabled={mutating}
                        >
                          Refresh this example
                        </button>
                        <button
                          type="button"
                          className="assembler-box-management__secondary"
                          onClick={onDismissExampleUpdate}
                          disabled={mutating}
                        >
                          Dismiss
                        </button>
                      </>
                    ) : null}
                    {selectedCanDelete ? (
                      <details className="assembler-box-management__danger-zone">
                        <summary>Danger zone</summary>
                        <div className="assembler-box-management__danger-actions">
                          <button
                            type="button"
                            className="assembler-box-management__secondary"
                            onClick={onToggleArchive}
                            disabled={mutating}
                          >
                            {selectedProject.isArchived ? "Restore" : "Archive"}
                          </button>
                          <button
                            type="button"
                            className="assembler-box-management__danger"
                            onClick={onDelete}
                            disabled={mutating}
                          >
                            {deleting
                              ? selectedIsExample
                                ? "Deleting example…"
                                : "Moving work…"
                              : selectedIsExample
                                ? "Delete example"
                                : "Delete Box"}
                          </button>
                        </div>
                      </details>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </div>

        {errorMessage ? (
          <p className="assembler-box-management__error" aria-live="polite">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
