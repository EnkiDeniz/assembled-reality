export const PRIMARY_WORKSPACE_DOCUMENT_KEY = "assembled-reality-v07-final";
export const DEFAULT_PROJECT_KEY = "default-project";

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
  const { sources, assemblies } = groupDocuments(normalizedDocuments);
  const builtinSource =
    sources.find((document) => document.documentType === "builtin") || sources[0] || null;
  const currentAssembly = getMostRecentDocument(assemblies);
  const latestTouchedDocument = getMostRecentDocument(normalizedDocuments);

  return {
    projectKey: DEFAULT_PROJECT_KEY,
    title: "Main Project",
    subtitle: currentAssembly
      ? `Current assembly: ${currentAssembly.title}`
      : "Start from a source and build toward a working assembly.",
    href: "/workspace",
    isDefault: true,
    sourceCount: sources.length,
    assemblyCount: assemblies.length,
    documentCount: normalizedDocuments.length,
    documentKeys: normalizedDocuments.map((document) => document.documentKey).filter(Boolean),
    sourceDocumentKeys: sources.map((document) => document.documentKey).filter(Boolean),
    assemblyDocumentKeys: assemblies.map((document) => document.documentKey).filter(Boolean),
    builtInSourceDocumentKey: builtinSource?.documentKey || PRIMARY_WORKSPACE_DOCUMENT_KEY,
    currentAssemblyDocumentKey: currentAssembly?.documentKey || null,
    defaultDocumentKey:
      currentAssembly?.documentKey ||
      builtinSource?.documentKey ||
      normalizedDocuments[0]?.documentKey ||
      PRIMARY_WORKSPACE_DOCUMENT_KEY,
    createdAt: builtinSource?.createdAt || normalizedDocuments[0]?.createdAt || null,
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
  if (!project?.documentKeys?.length) {
    return Array.isArray(documents) ? documents : [];
  }

  const allowedKeys = new Set(project.documentKeys);
  return (Array.isArray(documents) ? documents : []).filter((document) =>
    allowedKeys.has(document.documentKey),
  );
}

export function getProjectEntryDocumentKey(project = null) {
  return (
    project?.currentAssemblyDocumentKey ||
    project?.defaultDocumentKey ||
    project?.builtInSourceDocumentKey ||
    PRIMARY_WORKSPACE_DOCUMENT_KEY
  );
}
