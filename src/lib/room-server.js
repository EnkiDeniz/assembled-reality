import "server-only";

import { getRequiredSession } from "@/lib/server-session";
import { listReaderDocumentsForUser } from "@/lib/reader-documents";
import { getReaderProfileByUserId, listReadingReceiptDraftsForProjectForUser } from "@/lib/reader-db";
import { getProjectByKey, getProjectDocuments } from "@/lib/project-model";
import { listReaderProjectsForUser } from "@/lib/reader-projects";
import { buildSourceSummaryViewModel } from "@/lib/box-view-models";
import { loadConversationThreadForUser } from "@/lib/reader-workspace";
import { buildRoomThreadKey, extractRoomPayloadFromCitations, isRoomAssemblyDocument } from "@/lib/room";
import {
  buildRoomCanonicalViewModel,
  compileRoomSource,
  createOrHydrateRoomRuntimeWindow,
} from "@/lib/room-canonical";
import {
  ensureRoomAssemblyDocumentForProject,
  getRoomAssemblySource,
} from "@/lib/room-documents";

function pickActiveProject(projects = [], requestedProjectKey = "") {
  const normalizedProjects = Array.isArray(projects) ? projects.filter(Boolean) : [];
  const requested = requestedProjectKey ? getProjectByKey(normalizedProjects, requestedProjectKey) : null;
  if (requested) return requested;

  const realProject = normalizedProjects.find(
    (project) => !project?.isSystemExample && Number(project?.documentCount || 0) > 0,
  );
  if (realProject) return realProject;

  const firstWithDocuments = normalizedProjects.find(
    (project) => Number(project?.documentCount || 0) > 0,
  );
  if (firstWithDocuments) return firstWithDocuments;

  return normalizedProjects[0] || null;
}

function isRealSourceDocument(document = null) {
  return Boolean(
    document &&
      !document?.isAssembly &&
      document?.documentType !== "assembly" &&
      document?.documentType !== "builtin" &&
      document?.sourceType !== "builtin",
  );
}

function getCurrentAssemblyDocument(project = null, projectDocuments = []) {
  const documents = (Array.isArray(projectDocuments) ? projectDocuments : []).filter(
    (document) => !isRoomAssemblyDocument(document),
  );
  return (
    documents.find(
      (document) =>
        document?.documentKey &&
        document.documentKey === String(project?.currentAssemblyDocumentKey || "").trim(),
    ) ||
    documents.find((document) => document?.isAssembly || document?.documentType === "assembly") ||
    null
  );
}

function getLatestRealSource(projectDocuments = []) {
  return (Array.isArray(projectDocuments) ? projectDocuments : [])
    .filter((document) => isRealSourceDocument(document))
    .sort(
      (left, right) =>
        Date.parse(String(right?.updatedAt || right?.createdAt || "")) -
        Date.parse(String(left?.updatedAt || left?.createdAt || "")),
    )[0] || null;
}

function buildDeepLinks(project = null, latestRealSource = null) {
  const projectKey = encodeURIComponent(String(project?.projectKey || "").trim());
  const roomBase = projectKey ? `/workspace?project=${projectKey}` : "/workspace";
  const sourceKey = encodeURIComponent(String(latestRealSource?.documentKey || "").trim());
  const readerBase = sourceKey
    ? `/read/${sourceKey}${projectKey ? `?project=${projectKey}` : ""}`
    : "";

  return {
    room: roomBase,
    reader: readerBase,
    compare: "",
    operate: "",
    receipts: "",
  };
}

function buildProjectList(projects = []) {
  return (Array.isArray(projects) ? projects : []).map((project) => ({
    projectKey: project?.projectKey || "",
    title: project?.boxTitle || project?.title || "Untitled Box",
    subtitle: project?.boxSubtitle || project?.subtitle || "",
    sourceCount: Number(project?.sourceCount) || 0,
    receiptDraftCount: Number(project?.receiptDraftCount) || 0,
    hasSeed: Boolean(project?.currentAssemblyDocumentKey),
    updatedAt: project?.updatedAt || project?.createdAt || null,
    isSystemExample: Boolean(project?.isSystemExample),
  }));
}

function mapThreadMessageToRoomMessage(message = null) {
  if (!message) return null;
  const roomPayload = extractRoomPayloadFromCitations(message.citations);

  return {
    id: message.id,
    role: String(message.role || "").toLowerCase(),
    content: message.content || "",
    createdAt: message.createdAt,
    roomPayload,
  };
}

function buildRecentSources(projectDocuments = [], latestRealSource = null) {
  return (latestRealSource ? [latestRealSource] : [])
    .concat(
      (projectDocuments || [])
        .filter(
          (document) =>
            isRealSourceDocument(document) &&
            document.documentKey !== latestRealSource?.documentKey,
        )
        .slice(0, 4),
    )
    .map((document) => buildSourceSummaryViewModel(document))
    .filter(Boolean);
}

export async function buildRoomWorkspaceViewForUser(userId, { projectKey = "" } = {}) {
  const [readerData, documents] = await Promise.all([
    getReaderProfileByUserId(userId),
    listReaderDocumentsForUser(userId),
  ]);

  const projects = await listReaderProjectsForUser(userId, documents);
  const activeProject = pickActiveProject(projects, projectKey);
  if (!activeProject?.projectKey) {
    throw new Error("No box available.");
  }

  const roomDocument = await ensureRoomAssemblyDocumentForProject(userId, activeProject.projectKey);
  const refreshedDocuments = roomDocument
    ? [roomDocument, ...documents.filter((document) => document.documentKey !== roomDocument.documentKey)]
    : documents;
  const projectDocuments = [
    ...getProjectDocuments(refreshedDocuments, activeProject),
    ...(roomDocument &&
    !getProjectDocuments(refreshedDocuments, activeProject).some(
      (document) => document.documentKey === roomDocument.documentKey,
    )
      ? [roomDocument]
      : []),
  ];
  const currentAssemblyDocument = getCurrentAssemblyDocument(activeProject, projectDocuments);
  const latestRealSource = getLatestRealSource(projectDocuments);
  const projectDrafts = activeProject
    ? await listReadingReceiptDraftsForProjectForUser(userId, {
        projectId: activeProject?.id || null,
        documentKeys: activeProject?.documentKeys || [],
        take: 6,
      })
    : [];
  const roomThreadKey = buildRoomThreadKey(activeProject.projectKey);
  const thread = await loadConversationThreadForUser(userId, roomThreadKey);
  const messages = (thread?.messages || []).map(mapThreadMessageToRoomMessage).filter(Boolean);
  const latestReceiptKit =
    [...messages].reverse().find((message) => message?.roomPayload?.receiptKit)?.roomPayload?.receiptKit ||
    null;
  const roomSource = getRoomAssemblySource(roomDocument);
  const artifact = compileRoomSource({
    source: roomSource,
    filename: `${roomDocument?.documentKey || "room"}.loe`,
  });
  const runtimeWindow = createOrHydrateRoomRuntimeWindow(roomDocument, artifact);
  const deepLinks = buildDeepLinks(activeProject, latestRealSource);
  const recentSources = buildRecentSources(projectDocuments, latestRealSource);
  const canonicalView = buildRoomCanonicalViewModel({
    project: activeProject,
    roomDocument,
    artifact,
    runtimeWindow,
    messages,
    recentSources,
    receiptDrafts: projectDrafts,
    deepLinks,
    latestReceiptKit,
  });

  return {
    project: {
      projectKey: activeProject?.projectKey || "",
      title: activeProject?.boxTitle || activeProject?.title || "Untitled Box",
      subtitle: activeProject?.boxSubtitle || activeProject?.subtitle || "",
      sourceCount: Number(activeProject?.sourceCount) || 0,
      receiptDraftCount: Number(activeProject?.receiptDraftCount) || 0,
      hasSeed: Boolean(currentAssemblyDocument),
      connectionStatus: readerData?.getReceiptsConnection?.status || "DISCONNECTED",
    },
    projects: buildProjectList(projects),
    messages,
    ...canonicalView,
  };
}

export async function loadRoomWorkspacePageData({ searchParams } = {}) {
  const session = await getRequiredSession();
  if (!session?.user?.id) {
    return null;
  }

  const resolvedSearchParams = await searchParams;
  const projectKey = String(resolvedSearchParams?.project || "").trim();
  return buildRoomWorkspaceViewForUser(session.user.id, { projectKey });
}
