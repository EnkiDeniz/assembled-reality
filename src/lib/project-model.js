export const PRIMARY_WORKSPACE_DOCUMENT_KEY = "assembled-reality-v07-final";
export const DEFAULT_PROJECT_KEY = "default-project";
export const DEFAULT_PROJECT_TITLE = "Untitled Box";
export const DEFAULT_PROJECT_SUBTITLE = "Start with a source and shape the seed.";

const LEGACY_DEFAULT_PROJECT_TITLE = "Main Project";
const LEGACY_DEFAULT_PROJECT_SUBTITLE = "Start from a source and build toward a working assembly.";
const LEGACY_CURRENT_ASSEMBLY_PREFIX = "Current assembly:";

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

function normalizeProjectDisplayTitle(title = "", projectKey = DEFAULT_PROJECT_KEY) {
  const trimmedTitle = String(title || "").trim();
  const isLegacyDefaultTitle =
    projectKey === DEFAULT_PROJECT_KEY &&
    (!trimmedTitle ||
      trimmedTitle === LEGACY_DEFAULT_PROJECT_TITLE ||
      trimmedTitle === DEFAULT_PROJECT_TITLE);

  if (isLegacyDefaultTitle) {
    return DEFAULT_PROJECT_TITLE;
  }

  return trimmedTitle || DEFAULT_PROJECT_TITLE;
}

function normalizeProjectDisplaySubtitle(
  subtitle = "",
  {
    currentAssemblyTitle = "",
  } = {},
) {
  const trimmedSubtitle = String(subtitle || "").trim();

  if (currentAssemblyTitle) {
    return `Seed: ${currentAssemblyTitle}`;
  }

  if (!trimmedSubtitle || trimmedSubtitle === LEGACY_DEFAULT_PROJECT_SUBTITLE) {
    return DEFAULT_PROJECT_SUBTITLE;
  }

  if (trimmedSubtitle.startsWith(LEGACY_CURRENT_ASSEMBLY_PREFIX)) {
    const assemblyTitle = trimmedSubtitle
      .slice(LEGACY_CURRENT_ASSEMBLY_PREFIX.length)
      .trim();
    return assemblyTitle ? `Seed: ${assemblyTitle}` : DEFAULT_PROJECT_SUBTITLE;
  }

  return trimmedSubtitle;
}

function getProjectSystemMeta(project = null) {
  const system =
    project?.metadataJson?.system && typeof project.metadataJson.system === "object"
      ? project.metadataJson.system
      : project?.architectureMeta?.system && typeof project.architectureMeta.system === "object"
        ? project.architectureMeta.system
        : {};
  return system;
}

export function getProjectDisplayTitle(project = null) {
  return normalizeProjectDisplayTitle(
    project?.boxTitle || project?.title || "",
    project?.projectKey || DEFAULT_PROJECT_KEY,
  );
}

export function getProjectDisplaySubtitle(project = null) {
  return normalizeProjectDisplaySubtitle(project?.boxSubtitle || project?.subtitle || "", {
    currentAssemblyTitle: project?.currentAssembly?.title || "",
  });
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
    title: DEFAULT_PROJECT_TITLE,
    subtitle: currentAssembly
      ? `Seed: ${currentAssembly.title}`
      : DEFAULT_PROJECT_SUBTITLE,
    href: buildProjectHref(DEFAULT_PROJECT_KEY),
    boxHref: buildProjectHref(DEFAULT_PROJECT_KEY),
    isDefault: true,
    isDefaultBox: true,
    isPinned: false,
    isArchived: false,
    boxTitle: DEFAULT_PROJECT_TITLE,
    boxSubtitle: currentAssembly
      ? `Seed: ${currentAssembly.title}`
      : DEFAULT_PROJECT_SUBTITLE,
    sourceCount: sources.length,
    assemblyCount: assemblies.length,
    documentCount: visibleDocuments.length,
    documentKeys: normalizedDocuments.map((document) => document.documentKey).filter(Boolean),
    sourceDocumentKeys: sources.map((document) => document.documentKey).filter(Boolean),
    assemblyDocumentKeys: assemblies.map((document) => document.documentKey).filter(Boolean),
    boxDocuments: visibleDocuments,
    builtInSourceDocumentKey: builtinSource?.documentKey || PRIMARY_WORKSPACE_DOCUMENT_KEY,
    currentAssemblyDocumentKey: currentAssembly?.documentKey || null,
    seedDocumentKey: currentAssembly?.documentKey || null,
    defaultDocumentKey:
      currentAssembly?.documentKey ||
      builtinSource?.documentKey ||
      visibleDocuments[0]?.documentKey ||
      PRIMARY_WORKSPACE_DOCUMENT_KEY,
    createdAt: builtinSource?.createdAt || visibleDocuments[0]?.createdAt || null,
    updatedAt: latestTouchedDocument?.updatedAt || latestTouchedDocument?.createdAt || null,
    receiptDraftCount: 0,
    latestReceiptUpdatedAt: null,
    metadataJson: null,
    architectureMeta: null,
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
  const currentAssemblyDocument =
    projectDocuments.find(
      (document) => document.documentKey === (project.currentAssemblyDocumentKey ?? fallbackProject.currentAssemblyDocumentKey),
    ) ||
    null;
  const boxTitle = normalizeProjectDisplayTitle(
    project.title || fallbackProject.title,
    project.projectKey || fallbackProject.projectKey || DEFAULT_PROJECT_KEY,
  );
  const boxSubtitle = normalizeProjectDisplaySubtitle(
    project.subtitle || fallbackProject.subtitle,
    {
      currentAssemblyTitle: currentAssemblyDocument?.title || "",
    },
  );
  const systemMeta = getProjectSystemMeta(project);
  const isSystemExample = Boolean(systemMeta?.templateId);

  return {
    ...fallbackProject,
    ...project,
    href: buildProjectHref(project.projectKey || fallbackProject.projectKey || DEFAULT_PROJECT_KEY),
    boxHref: buildProjectHref(project.projectKey || fallbackProject.projectKey || DEFAULT_PROJECT_KEY),
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
    boxTitle,
    boxSubtitle,
    boxDocuments: projectDocuments.filter((document) => isProjectDocumentVisible(document)),
    isDefaultBox:
      (project.projectKey || fallbackProject.projectKey || DEFAULT_PROJECT_KEY) === DEFAULT_PROJECT_KEY,
    isPinned: Boolean(project.isPinned),
    isArchived: Boolean(project.isArchived),
    currentAssembly: currentAssemblyDocument,
    currentSeed: currentAssemblyDocument,
    seedDocumentKey:
      project.currentAssemblyDocumentKey ?? fallbackProject.currentAssemblyDocumentKey ?? null,
    receiptDraftCount: Number(project.receiptDraftCount) || 0,
    latestReceiptUpdatedAt: project.latestReceiptUpdatedAt || null,
    metadataJson: project.metadataJson || null,
    architectureMeta: project.architectureMeta || project.metadataJson || null,
    isSystemExample,
    systemTemplateId: String(systemMeta?.templateId || "").trim(),
    systemTemplateVersion: Number(systemMeta?.templateVersion) || 0,
    systemExampleLabel: isSystemExample
      ? String(systemMeta?.exampleLabel || "Example").trim() || "Example"
      : "",
    systemSortPriority: Number(systemMeta?.sortPriority) || 0,
    boxIntroLine: String(systemMeta?.introLine || "").trim(),
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

export function getProjectListenDocumentKey(project = null, documents = []) {
  const projectDocuments = getProjectDocuments(documents, project);
  const visibleDocuments = projectDocuments.filter((document) => isProjectDocumentVisible(document));
  const { sources } = groupDocuments(visibleDocuments);
  const userSources = sources.filter(
    (document) =>
      document?.documentType !== "builtin" && document?.sourceType !== "builtin",
  );
  const recentUserSource = getMostRecentDocument(userSources);
  const recentSource = getMostRecentDocument(sources);
  const recentVisibleDocument = getMostRecentDocument(visibleDocuments);

  return (
    recentUserSource?.documentKey ||
    recentSource?.documentKey ||
    recentVisibleDocument?.documentKey ||
    project?.builtInSourceDocumentKey ||
    getProjectEntryDocumentKey(project)
  );
}
