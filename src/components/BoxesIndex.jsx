import { useMemo, useState } from "react";
import {
  getAssemblyColorTokens,
  getAssemblyStateColorStep,
  normalizeProjectArchitectureMeta,
} from "@/lib/assembly-architecture";
import BoxObjectVisualization from "@/components/BoxObjectVisualization";
import WorkspaceGlyph from "@/components/WorkspaceGlyph";
import { PRODUCT_MARK } from "@/lib/product-language";
import { buildVisualizationState } from "@/lib/seed-model";

const BOX_SCOPES = Object.freeze({
  recent: "recent",
  all: "all",
  archived: "archived",
});

function getTimestamp(value = "") {
  const parsed = Date.parse(String(value || ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatRelativeTime(value = "") {
  const timestamp = getTimestamp(value);
  if (!timestamp) return "No recent activity";

  const deltaMs = Date.now() - timestamp;
  const deltaMinutes = Math.max(1, Math.round(deltaMs / 60000));
  if (deltaMinutes < 60) return `${deltaMinutes}m ago`;

  const deltaHours = Math.round(deltaMinutes / 60);
  if (deltaHours < 24) return `${deltaHours}h ago`;

  const deltaDays = Math.round(deltaHours / 24);
  if (deltaDays < 7) return `${deltaDays}d ago`;

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}

function getProofLabel(project = null) {
  const draftCount = Number(project?.receiptDraftCount) || 0;
  if (draftCount > 0) {
    return `${draftCount} proof draft${draftCount === 1 ? "" : "s"}`;
  }
  return "No proof yet";
}

function getSourceLabel(project = null) {
  const sourceCount = Number(project?.sourceCount) || 0;
  return `${sourceCount} source${sourceCount === 1 ? "" : "s"}`;
}

function getSeedLabel(project = null) {
  return project?.currentAssemblyDocumentKey ? "Seed ready" : "No seed";
}

function buildSearchText(project = null) {
  return [
    project?.boxTitle,
    project?.title,
    project?.boxSubtitle,
    project?.subtitle,
    project?.projectKey,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function sortBoxes(projects = []) {
  return [...projects].sort((left, right) => {
    const pinWeight = Number(Boolean(right?.isPinned)) - Number(Boolean(left?.isPinned));
    if (pinWeight !== 0) return pinWeight;

    return getTimestamp(right?.updatedAt || right?.createdAt) - getTimestamp(left?.updatedAt || left?.createdAt);
  });
}

function ScopeButton({ active = false, label, onClick }) {
  return (
    <button
      type="button"
      className={`assembler-boxes-index__scope ${active ? "is-active" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function BoxRow({
  project,
  activeProjectKey = "",
  projectActionPending = "",
  onOpenProjectHome,
}) {
  const isActive = project.projectKey === activeProjectKey;
  const pending = projectActionPending === project.projectKey;
  const title = project.boxTitle || project.title || "Untitled Box";
  const subtitle = project.boxSubtitle || project.subtitle || "";
  const hasSeed = Boolean(project?.currentAssemblyDocumentKey);
  const architectureMeta = normalizeProjectArchitectureMeta(
    project?.metadataJson || project?.architectureMeta || null,
  );
  const stateColorStep = getAssemblyStateColorStep(
    architectureMeta.assemblyState.current || (architectureMeta.root.text ? "rooted" : "declare-root"),
  );
  const visualizationState =
    project?.visualizationState ||
    {
      ...buildVisualizationState({
        realSourceCount: Number(project?.sourceCount) || 0,
        hasSeed,
        localReceiptCount: Number(project?.receiptDraftCount) || 0,
      }),
      colorStep: stateColorStep,
      colorTokens: getAssemblyColorTokens(stateColorStep),
    };

  return (
    <div
      className={`assembler-boxes-index__row ${isActive ? "is-active" : ""} ${
        project?.isArchived ? "is-archived" : ""
      }`}
    >
      <BoxObjectVisualization
        state={visualizationState}
        size="compact"
        title={title}
        subtitle={getSeedLabel(project)}
      />

      <button
        type="button"
        className="assembler-boxes-index__row-body"
        onClick={() => onOpenProjectHome(project.projectKey)}
        disabled={pending}
      >
        <span className="assembler-boxes-index__row-title-line">
          <span className="assembler-boxes-index__row-title">{title}</span>
          <span className="assembler-boxes-index__row-time">
            {pending ? "Opening…" : formatRelativeTime(project?.updatedAt || project?.createdAt)}
          </span>
        </span>
        <span className="assembler-boxes-index__row-meta">
          {getSourceLabel(project)} · {getSeedLabel(project)} · {getProofLabel(project)}
        </span>
        {subtitle ? (
          <span className="assembler-boxes-index__row-subtitle">{subtitle}</span>
        ) : null}
      </button>

      <div className="assembler-boxes-index__row-aside">
        <div className="assembler-boxes-index__row-badges">
          {project?.isPinned ? (
            <span className="assembler-boxes-index__row-badge">Pinned</span>
          ) : null}
          {project?.isArchived ? (
            <span className="assembler-boxes-index__row-badge">Archived</span>
          ) : isActive ? (
            <span className="assembler-boxes-index__row-badge">Current</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function BoxesIndex({
  activeProject = null,
  activeProjectKey = "",
  projects = [],
  resumeTarget: _resumeTarget = null,
  projectActionPending = "",
  onOpenProjectHome,
  onResumeProject,
  onManageProjects,
  onOpenIntake,
}) {
  const [scope, setScope] = useState(BOX_SCOPES.recent);
  const [query, setQuery] = useState("");
  const boxes = useMemo(
    () => sortBoxes(Array.isArray(projects) ? projects.filter(Boolean) : []),
    [projects],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const visibleBoxes = normalizedQuery
    ? boxes.filter((project) => buildSearchText(project).includes(normalizedQuery))
    : boxes;
  const activeBoxes = visibleBoxes.filter((project) => !project?.isArchived);
  const pinnedBoxes = activeBoxes.filter((project) => project?.isPinned);
  const archivedBoxes = visibleBoxes.filter((project) => project?.isArchived);
  const recentBoxes = normalizedQuery
    ? activeBoxes.slice(0, 8)
    : activeBoxes.filter((project) => !project?.isPinned).slice(0, 8);
  const scopeBoxes =
    scope === BOX_SCOPES.archived
      ? archivedBoxes
      : scope === BOX_SCOPES.all
        ? activeBoxes
        : recentBoxes;
  const activeBoxTitle = activeProject?.boxTitle || activeProject?.title || "Untitled Box";

  return (
    <div className="assembler-boxes-index assembler-boxes-index--next">
      <section className="assembler-boxes-index__masthead">
        <div className="assembler-boxes-index__brand">
          <span className="assembler-boxes-index__brand-mark">{PRODUCT_MARK}</span>
          <span className="assembler-boxes-index__brand-meta">Boxes</span>
        </div>

        <div className="assembler-boxes-index__copy">
          <h1 className="assembler-boxes-index__title">Open the right box and keep moving.</h1>
          <div className="assembler-boxes-index__meta">
            <span>{activeBoxes.length} active</span>
            <span>{archivedBoxes.length} archived</span>
            <span>Current: {activeBoxTitle}</span>
          </div>
        </div>

        <div className="assembler-boxes-index__compact-actions">
          <button
            type="button"
            className="terminal-button is-primary"
            onClick={() => activeProject?.projectKey && onResumeProject?.(activeProject.projectKey)}
            disabled={!activeProject?.projectKey || projectActionPending === activeProject?.projectKey}
          >
            Resume
          </button>
          <button
            type="button"
            className="terminal-button"
            onClick={() => activeProject?.projectKey && onOpenProjectHome(activeProject.projectKey)}
            disabled={!activeProject?.projectKey || projectActionPending === activeProject?.projectKey}
          >
            Lane
          </button>
          <button type="button" className="terminal-button" onClick={onOpenIntake}>
            Add
          </button>
          <button type="button" className="terminal-button" onClick={onManageProjects}>
            Manage
          </button>
        </div>
      </section>

      <section className="assembler-boxes-index__lookup">
        <label className="assembler-boxes-index__search" htmlFor="boxes-search">
          <span className="assembler-boxes-index__search-icon" aria-hidden="true">
            <WorkspaceGlyph kind="search" />
          </span>
          <input
            id="boxes-search"
            className="assembler-boxes-index__search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search boxes"
          />
        </label>

        <div className="assembler-boxes-index__scopes" role="tablist" aria-label="Box views">
          <ScopeButton
            active={scope === BOX_SCOPES.recent}
            label="Recent"
            onClick={() => setScope(BOX_SCOPES.recent)}
          />
          <ScopeButton
            active={scope === BOX_SCOPES.all}
            label="All Boxes"
            onClick={() => setScope(BOX_SCOPES.all)}
          />
          <ScopeButton
            active={scope === BOX_SCOPES.archived}
            label="Archived"
            onClick={() => setScope(BOX_SCOPES.archived)}
          />
        </div>
      </section>

      {scope !== BOX_SCOPES.archived && !normalizedQuery && pinnedBoxes.length ? (
        <section className="assembler-boxes-index__panel">
          <div className="assembler-boxes-index__panel-head">
            <span>Pinned</span>
            <span>{pinnedBoxes.length}</span>
          </div>

          <div className="assembler-boxes-index__list">
            {pinnedBoxes.map((project) => (
              <BoxRow
                key={`${project.projectKey}-pinned`}
                project={project}
                activeProjectKey={activeProjectKey}
                projectActionPending={projectActionPending}
                onOpenProjectHome={onOpenProjectHome}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="assembler-boxes-index__panel">
        <div className="assembler-boxes-index__panel-head">
          <span>
            {scope === BOX_SCOPES.archived
              ? "Archived boxes"
              : scope === BOX_SCOPES.all
                ? "All boxes"
                : "Recent boxes"}
          </span>
          <span>{scopeBoxes.length}</span>
        </div>

        <div className="assembler-boxes-index__list">
          {scopeBoxes.length ? (
            scopeBoxes.map((project) => (
              <BoxRow
                key={project.projectKey}
                project={project}
                activeProjectKey={activeProjectKey}
                projectActionPending={projectActionPending}
                onOpenProjectHome={onOpenProjectHome}
              />
            ))
          ) : (
            <p className="assembler-boxes-index__empty">
              {scope === BOX_SCOPES.archived
                ? "No archived boxes yet."
                : normalizedQuery
                  ? "No boxes match that search."
                  : "No boxes yet. Create one and start with a source."}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
