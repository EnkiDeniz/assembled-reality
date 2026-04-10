import "server-only";

import { getRequiredSession } from "@/lib/server-session";
import { listReaderDocumentsForUser } from "@/lib/reader-documents";
import { getReaderProfileByUserId, listReadingReceiptDraftsForProjectForUser } from "@/lib/reader-db";
import { getProjectByKey, getProjectDocuments } from "@/lib/project-model";
import { listReaderProjectsForUser } from "@/lib/reader-projects";
import { buildSourceSummaryViewModel } from "@/lib/box-view-models";
import { loadConversationThreadForUser } from "@/lib/reader-workspace";
import { extractRoomPayloadFromCitations, isRoomAssemblyDocument } from "@/lib/room";
import {
  buildRoomCanonicalViewModel,
  compileRoomSource,
  createOrHydrateRoomRuntimeWindow,
} from "@/lib/room-canonical";
import {
  ensureRoomAssemblyDocumentForProject,
  getRoomAssemblySource,
} from "@/lib/room-documents";
import {
  ensureCompilerFirstWorkspaceResetForUser,
  ensureRoomSessionForProject,
  listRoomSessionsForProjectForUser,
  updateRoomSessionHandoffSummaryForUser,
} from "@/lib/room-sessions";

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

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

function buildEmptyRoomView({ readerData: _readerData = null, projects = [], resetAt = null } = {}) {
  return {
    project: null,
    projects: buildProjectList(projects),
    session: null,
    sessions: [],
    messages: [],
    authorityContext: {
      project: null,
      session: null,
      sources: [],
      assembly: null,
      artifact: {
        clauseCount: 0,
        compileState: "pristine",
        runtimeState: "open",
        mergedWindowState: "open",
      },
      runtime: {
        state: "open",
        waiting: false,
      },
      mirror: null,
      diagnostics: [],
      resetAt,
    },
    roomDocument: null,
    roomSourceSummary: {
      clauseCount: 0,
      compileState: "pristine",
      runtimeState: "open",
      mergedWindowState: "open",
    },
    hasStructure: false,
    fieldState: null,
    interaction: {
      stateChip: null,
      paneContract: null,
      nextBestAction: "",
    },
    mirror: {
      aim: { text: "", gloss: "" },
      evidence: [],
      story: [],
      moves: [],
      returns: [],
    },
    pendingMove: null,
    activePreview: null,
    recentReturns: [],
    recentSources: [],
    receiptSummary: {
      draftCount: 0,
      recentDrafts: [],
    },
    latestReceiptKit: null,
    deepLinks: {
      room: "/workspace",
      reader: "",
      compare: "",
      operate: "",
      receipts: "",
    },
    starter: {
      show: true,
      firstLine: "What's on your mind?",
      secondLine: "Create a box when you're ready. The Room will start fresh.",
    },
    diagnostics: [],
    resetAt,
  };
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

function buildRoomSessionHandoffSummary({ project = null, canonicalView = null } = {}) {
  const bits = [];
  const aim = normalizeText(canonicalView?.mirror?.aim?.text);
  const fieldLabel = normalizeText(canonicalView?.fieldState?.label);
  const latestReturn = normalizeText(canonicalView?.recentReturns?.[0]?.actual);

  if (aim) bits.push(`Aim: ${aim}`);
  if (fieldLabel) bits.push(`State: ${fieldLabel}`);
  if (latestReturn) bits.push(`Latest return: ${latestReturn}`);

  if (bits.length) {
    return bits.join(" • ");
  }

  return `Fresh conversation in ${normalizeText(project?.boxTitle || project?.title) || "Untitled Box"}.`;
}

function buildRoomAuthorityContext({
  project = null,
  session = null,
  roomDocument = null,
  recentSources = [],
  canonicalView = null,
  resetAt = null,
} = {}) {
  return {
    project: project
      ? {
          projectKey: project.projectKey,
          title: project.boxTitle || project.title || "Untitled Box",
          subtitle: project.boxSubtitle || project.subtitle || "",
        }
      : null,
    session: session
      ? {
          id: session.id,
          title: session.title,
          handoffSummary: session.handoffSummary || "",
          isArchived: Boolean(session.isArchived),
          isActive: Boolean(session.isActive),
        }
      : null,
    sources: Array.isArray(recentSources) ? recentSources : [],
    assembly: roomDocument
      ? {
          documentKey: roomDocument.documentKey,
          title: roomDocument.title,
        }
      : null,
    artifact: canonicalView?.roomSourceSummary || {
      clauseCount: 0,
      compileState: "unknown",
      runtimeState: "open",
      mergedWindowState: "open",
    },
    runtime: {
      state: normalizeText(canonicalView?.fieldState?.key).toLowerCase() || "open",
      waiting: Boolean(canonicalView?.interaction?.paneContract?.waiting),
      nextBestAction: normalizeText(canonicalView?.interaction?.nextBestAction),
    },
    mirror: canonicalView?.mirror || null,
    diagnostics: Array.isArray(canonicalView?.diagnostics) ? canonicalView.diagnostics : [],
    resetAt,
  };
}

export async function buildRoomWorkspaceViewForUser(userId, { projectKey = "", sessionId = "" } = {}) {
  const resetState = await ensureCompilerFirstWorkspaceResetForUser(userId);
  const [readerData, documents] = await Promise.all([
    getReaderProfileByUserId(userId),
    listReaderDocumentsForUser(userId),
  ]);

  const projects = await listReaderProjectsForUser(userId, documents, { ensureDefault: false });
  const activeProject = pickActiveProject(projects, projectKey);
  if (!activeProject?.projectKey) {
    return buildEmptyRoomView({
      readerData,
      projects,
      resetAt: resetState.resetAt,
    });
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
  const activeSession = await ensureRoomSessionForProject(userId, activeProject, { sessionId });
  const sessions = await listRoomSessionsForProjectForUser(userId, {
    projectId: activeProject.id,
  });
  const thread = activeSession?.threadDocumentKey
    ? await loadConversationThreadForUser(userId, activeSession.threadDocumentKey)
    : { messages: [] };
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
  const handoffSummary = buildRoomSessionHandoffSummary({
    project: activeProject,
    canonicalView,
  });
  const resolvedSession =
    activeSession?.id && handoffSummary !== String(activeSession.handoffSummary || "").trim()
      ? await updateRoomSessionHandoffSummaryForUser(userId, activeSession.id, handoffSummary)
      : activeSession;
  const resolvedSessions = (Array.isArray(sessions) ? sessions : []).map((sessionEntry) =>
    sessionEntry?.id === resolvedSession?.id
      ? {
          ...sessionEntry,
          handoffSummary: resolvedSession?.handoffSummary || sessionEntry?.handoffSummary || "",
          isActive: true,
        }
      : sessionEntry,
  );
  const authorityContext = buildRoomAuthorityContext({
    project: activeProject,
    session: resolvedSession,
    roomDocument,
    recentSources,
    canonicalView,
    resetAt: resetState.resetAt,
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
    session: resolvedSession,
    sessions: resolvedSessions,
    messages: canonicalView?.messages || messages,
    authorityContext,
    resetAt: resetState.resetAt,
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
  const sessionId =
    String(resolvedSearchParams?.sessionId || resolvedSearchParams?.session || "").trim();
  return buildRoomWorkspaceViewForUser(session.user.id, { projectKey, sessionId });
}
