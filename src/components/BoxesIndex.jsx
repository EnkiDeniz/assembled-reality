import BoxObjectVisualization from "@/components/BoxObjectVisualization";
import { buildVisualizationState } from "@/lib/seed-model";

function getProjectCountLabel(project = null) {
  const sourceCount = Number(project?.sourceCount) || 0;
  const hasSeed = Boolean(project?.currentAssemblyDocumentKey);
  return `${sourceCount} source${sourceCount === 1 ? "" : "s"} · ${hasSeed ? "seed ready" : "no seed yet"}`;
}

export default function BoxesIndex({
  activeProject = null,
  activeProjectKey = "",
  projects = [],
  projectActionPending = "",
  onOpenProjectHome,
  onCreateProject,
  onManageProjects,
}) {
  const boxes = Array.isArray(projects) ? projects.filter(Boolean) : [];
  const activeBoxTitle = activeProject?.boxTitle || activeProject?.title || "Untitled Box";

  return (
    <div className="assembler-boxes-index">
      <section className="assembler-boxes-index__masthead">
        <div className="assembler-boxes-index__copy">
          <span className="assembler-boxes-index__eyebrow">Boxes</span>
          <h1 className="assembler-boxes-index__title">All boxes</h1>
          <p className="assembler-boxes-index__subtitle">
            Choose a box to orient and resume, or create a new one when the work needs a separate container.
          </p>
          <div className="assembler-boxes-index__meta">
            <span>{boxes.length} total</span>
            <span>Current: {activeBoxTitle}</span>
          </div>
        </div>

        <div className="assembler-boxes-index__actions">
          {activeProject?.projectKey ? (
            <button
              type="button"
              className="assembler-boxes-index__primary-button"
              onClick={() => onOpenProjectHome(activeProject.projectKey)}
              disabled={projectActionPending === activeProject.projectKey}
            >
              Open current box
            </button>
          ) : null}
          <div className="assembler-boxes-index__secondary-actions">
            <button
              type="button"
              className="assembler-boxes-index__secondary-button"
              onClick={onCreateProject}
              disabled={projectActionPending === "__create__"}
            >
              {projectActionPending === "__create__" ? "Creating…" : "New Box"}
            </button>
            <button
              type="button"
              className="assembler-boxes-index__secondary-button"
              onClick={onManageProjects}
              disabled={Boolean(projectActionPending)}
            >
              Box management
            </button>
          </div>
        </div>
      </section>

      <section className="assembler-boxes-index__panel">
        <div className="assembler-boxes-index__panel-head">
          <span>Available boxes</span>
          <span>{boxes.length}</span>
        </div>

        <div className="assembler-boxes-index__list">
          {boxes.map((project) => {
            const isActive = project.projectKey === activeProjectKey;
            const title = project.boxTitle || project.title || "Untitled Box";
            const subtitle = project.boxSubtitle || project.subtitle || "";
            const pending = projectActionPending === project.projectKey;
            const hasSeed = Boolean(project?.currentAssemblyDocumentKey);
            const visualizationState =
              project?.visualizationState ||
              buildVisualizationState({
                realSourceCount: Number(project?.sourceCount) || 0,
                hasSeed,
              });

            return (
              <div
                key={project.projectKey}
                className={`assembler-boxes-index__row ${isActive ? "is-active" : ""}`}
              >
                <BoxObjectVisualization
                  state={visualizationState}
                  size="compact"
                  title={title}
                  subtitle={hasSeed ? "Seed ready" : "Waiting for the first seed"}
                />
                <button
                  type="button"
                  className="assembler-boxes-index__row-body"
                  onClick={() => onOpenProjectHome(project.projectKey)}
                  disabled={pending}
                >
                  <span className="assembler-boxes-index__row-title">{title}</span>
                  <span className="assembler-boxes-index__row-meta">
                    {pending ? "Opening…" : getProjectCountLabel(project)}
                  </span>
                  {subtitle ? (
                    <span className="assembler-boxes-index__row-subtitle">{subtitle}</span>
                  ) : null}
                </button>

                <div className="assembler-boxes-index__row-aside">
                  {isActive ? (
                    <span className="assembler-boxes-index__row-badge">Current</span>
                  ) : null}
                  <button
                    type="button"
                    className="assembler-boxes-index__row-action"
                    onClick={() => onOpenProjectHome(project.projectKey)}
                    disabled={pending}
                  >
                    Open box
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
