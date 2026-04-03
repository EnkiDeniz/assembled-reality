export const PRIMARY_WORKSPACE_DOCUMENT_KEY = "assembled-reality-v07-final";
export const DEFAULT_PROJECT_KEY = "default-project";

function buildProjectHref(projectKey = DEFAULT_PROJECT_KEY) {
  if (!projectKey || projectKey === DEFAULT_PROJECT_KEY) {
    return "/workspace";
  }

  return `/workspace?project=${encodeURIComponent(projectKey)}`;
}

export function isProjectDocumentVisible(document = null) {
  return !document?.hiddenFromProjectHome;
}

function getDocumentTimestamp(document) {
  const parsed = Date.parse(document?.updatedAt || document?.createdAt || "");
  return Number.isNaN(parsed) ? 0 : parsed;
}

function groupDocuments(documents = []) {
  return {
    sources: documents.filter(
      (document) =>
        document?.documentType === "builtin" ||
        (!document?.isAssembly && document?.documentType !== "assembly"),
    ),
    assemblies: documents.filter(
      (document) => document?.isAssembly || document?.documentType === "assembly",
    ),
  };
}

function getMostRecentDocument(documents = []) {
  return [...documents].sort((left, right) => getDocumentTimestamp(right) - getDocumentTimestamp(left))[0] || null;
}

export function buildDefaultProjectFromDocuments(documents = []) {
  const normalizedDocuments = Array.isArray(documents) ? documents.filter(Boolean) : [];
  const visibleDocuments = normalizedDocuments.filter((document) => isProjectDocumentVisible(document));
  const { sources, assemblies } = groupDocuments(visibleDocuments);
  const builtinSource =
    sources.find((document) => document.documentType === "builtin") || sources[0] || null;
  const currentAssembly = getMostRecentDocument(assemblies);
  const latestTouchedDocument = getMostRecentDocument(visibleDocuments);

  return {
    id: null,
    projectKey: DEFAULT_PROJECT_KEY,
    title: "Main Project",
    subtitle: currentAssembly
      ? `Current assembly: ${currentAssembly.title}`
      : "Start from a source and build toward a working assembly.",
    href: buildProjectHref(DEFAULT_PROJECT_KEY),
    isDefault: true,
    sourceCount: sources.length,
    assemblyCount: assemblies.length,
    documentCount: visibleDocuments.length,
    documentKeys: normalizedDocuments.map((document) => document.documentKey).filter(Boolean),
    sourceDocumentKeys: sources.map((document) => document.documentKey).filter(Boolean),
    assemblyDocumentKeys: assemblies.map((document) => document.documentKey).filter(Boolean),
    builtInSourceDocumentKey: builtinSource?.documentKey || PRIMARY_WORKSPACE_DOCUMENT_KEY,
    currentAssemblyDocumentKey: currentAssembly?.documentKey || null,
    defaultDocumentKey:
      currentAssembly?.documentKey ||
      builtinSource?.documentKey ||
      visibleDocuments[0]?.documentKey ||
      PRIMARY_WORKSPACE_DOCUMENT_KEY,
    createdAt: builtinSource?.createdAt || visibleDocuments[0]?.createdAt || null,
    updatedAt: latestTouchedDocument?.updatedAt || latestTouchedDocument?.createdAt || null,
  };
}

export function buildProjectsFromDocuments(documents = []) {
  return [buildDefaultProjectFromDocuments(documents)];
}

export function getProjectByKey(projects = [], projectKey = DEFAULT_PROJECT_KEY) {
  if (!Array.isArray(projects) || projects.length === 0) return null;

  return (
    projects.find((project) => project.projectKey === projectKey) ||
    projects[0] ||
    null
  );
}

export function getProjectDocuments(documents = [], project = null) {
  if (!project) {
    return Array.isArray(documents) ? documents : [];
  }

  if (!Array.isArray(project.documentKeys) || project.documentKeys.length === 0) {
    return [];
  }

  const allowedKeys = new Set(project.documentKeys);
  return (Array.isArray(documents) ? documents : []).filter((document) =>
    allowedKeys.has(document.documentKey),
  );
}

export function hydrateProjectWithDocuments(project = null, documents = []) {
  if (!project) return null;

  const projectDocuments = getProjectDocuments(documents, project);
  const fallbackProject = buildDefaultProjectFromDocuments(projectDocuments);
  const documentKeys = Array.isArray(project.documentKeys)
    ? project.documentKeys
    : fallbackProject.documentKeys;
  const sourceDocumentKeys = Array.isArray(project.sourceDocumentKeys)
    ? project.sourceDocumentKeys
    : fallbackProject.sourceDocumentKeys;
  const assemblyDocumentKeys = Array.isArray(project.assemblyDocumentKeys)
    ? project.assemblyDocumentKeys
    : fallbackProject.assemblyDocumentKeys;

  return {
    ...fallbackProject,
    ...project,
    href: buildProjectHref(project.projectKey || fallbackProject.projectKey || DEFAULT_PROJECT_KEY),
    documentKeys,
    sourceDocumentKeys,
    assemblyDocumentKeys,
    sourceCount: fallbackProject.sourceCount,
    assemblyCount: fallbackProject.assemblyCount,
    documentCount: fallbackProject.documentCount,
    builtInSourceDocumentKey:
      project.builtInSourceDocumentKey || fallbackProject.builtInSourceDocumentKey,
    currentAssemblyDocumentKey:
      project.currentAssemblyDocumentKey ?? fallbackProject.currentAssemblyDocumentKey ?? null,
    defaultDocumentKey:
      project.currentAssemblyDocumentKey ||
      project.defaultDocumentKey ||
      fallbackProject.defaultDocumentKey,
    subtitle: project.subtitle || fallbackProject.subtitle,
  };
}

export function hydrateProjectsWithDocuments(projects = [], documents = []) {
  if (!Array.isArray(projects) || projects.length === 0) {
    return buildProjectsFromDocuments(documents);
  }

  return projects
    .map((project) => hydrateProjectWithDocuments(project, documents))
    .filter(Boolean);
}

export function getProjectEntryDocumentKey(project = null) {
  return (
    project?.currentAssemblyDocumentKey ||
    project?.defaultDocumentKey ||
    project?.builtInSourceDocumentKey ||
    PRIMARY_WORKSPACE_DOCUMENT_KEY
  );
}
