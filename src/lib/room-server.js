import "server-only";

import { getRequiredSession } from "@/lib/server-session";
import {
  getReaderDocumentDataForUser,
  listReaderDocumentsForUser,
} from "@/lib/reader-documents";
import { getReaderProfileByUserId, listReadingReceiptDraftsForProjectForUser } from "@/lib/reader-db";
import { getProjectByKey, getProjectDocuments } from "@/lib/project-model";
import { listReaderProjectsForUser } from "@/lib/reader-projects";
import { buildSourceSummaryViewModel } from "@/lib/box-view-models";
import { loadConversationThreadForUser } from "@/lib/reader-workspace";
import { getLatestReaderOperateRunForUser } from "@/lib/reader-operate";
import { extractRoomPayloadFromCitations, isRoomAssemblyDocument } from "@/lib/room";
import {
  buildRoomCanonicalViewModel,
  compileRoomSource,
  createOrHydrateRoomRuntimeWindow,
} from "@/lib/room-canonical";
import { listOperateIncludedDocuments } from "@/lib/operate";
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

function normalizeOverlayIntent(value = "") {
  const normalized = normalizeText(value).toLowerCase();
  return ["instrument", "source", "boxes", "create", "witness", "operate"].includes(normalized)
    ? normalized
    : "";
}

function clipText(value = "", max = 220) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function buildWorkspaceHref(projectKey = "", { sessionId = "", documentKey = "", adjacent = "" } = {}) {
  const params = new URLSearchParams();
  const normalizedProjectKey = normalizeText(projectKey);
  const normalizedSessionId = normalizeText(sessionId);
  const normalizedDocumentKey = normalizeText(documentKey);
  const normalizedAdjacent = normalizeOverlayIntent(adjacent);

  if (normalizedProjectKey) params.set("project", normalizedProjectKey);
  if (normalizedSessionId) params.set("sessionId", normalizedSessionId);
  if (normalizedDocumentKey) params.set("document", normalizedDocumentKey);
  if (normalizedAdjacent) params.set("adjacent", normalizedAdjacent);

  const query = params.toString();
  return `/workspace${query ? `?${query}` : ""}`;
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

function buildDeepLinks(project = null, latestRealSource = null, { sessionId = "", documentKey = "" } = {}) {
  const normalizedProjectKey = normalizeText(project?.projectKey);
  const focusKey = normalizeText(documentKey) || normalizeText(latestRealSource?.documentKey);
  const roomBase = buildWorkspaceHref(normalizedProjectKey, { sessionId });
  const witnessBase = focusKey
    ? buildWorkspaceHref(normalizedProjectKey, {
        sessionId,
        documentKey: focusKey,
        adjacent: "witness",
      })
    : "";

  return {
    room: roomBase,
    reader: witnessBase,
    compare: "",
    operate: buildWorkspaceHref(normalizedProjectKey, {
      sessionId,
      ...(normalizeText(documentKey) ? { documentKey } : {}),
      adjacent: "operate",
    }),
    receipts: "",
  };
}

function isFocusableWitnessDocument(document = null) {
  return isRealSourceDocument(document);
}

function buildWitnessExcerptBlocks(document = null, maxBlocks = 4) {
  const blocks = (Array.isArray(document?.blocks) ? document.blocks : [])
    .map((block, index) => ({
      id: normalizeText(block?.id) || `block-${index + 1}`,
      kind: normalizeText(block?.kind).toLowerCase() || "paragraph",
      text: clipText(block?.plainText || block?.text || "", 220),
    }))
    .filter((block) => block.text);

  if (blocks.length) {
    return blocks.slice(0, maxBlocks);
  }

  const fallbackExcerpt = clipText(document?.excerpt || "", 220);
  return fallbackExcerpt
    ? [{ id: "excerpt", kind: "paragraph", text: fallbackExcerpt }]
    : [];
}

async function buildFocusedWitness({
  userId,
  activeProject = null,
  projectDocuments = [],
  documentKey = "",
  sessionId = "",
} = {}) {
  const normalizedDocumentKey = normalizeText(documentKey);
  if (!normalizedDocumentKey || !activeProject?.projectKey) {
    return null;
  }

  const matchingDocument = (Array.isArray(projectDocuments) ? projectDocuments : []).find(
    (document) =>
      normalizeText(document?.documentKey) === normalizedDocumentKey && isFocusableWitnessDocument(document),
  );
  if (!matchingDocument) {
    return null;
  }

  const fullDocument = await getReaderDocumentDataForUser(userId, normalizedDocumentKey);
  if (!fullDocument) {
    return null;
  }

  const sourceView = buildSourceSummaryViewModel(fullDocument);

  return {
    documentKey: normalizedDocumentKey,
    title: normalizeText(fullDocument?.title) || normalizeText(matchingDocument?.title) || "Focused witness",
    sourceSummary: normalizeText(sourceView?.metaLine) || normalizeText(sourceView?.operateSummary),
    provenanceLabel:
      normalizeText(sourceView?.operateSummary) ||
      normalizeText(sourceView?.trustProfile?.summary) ||
      normalizeText(sourceView?.originLabel),
    excerptBlocks: buildWitnessExcerptBlocks(fullDocument),
    openHref: buildWorkspaceHref(activeProject.projectKey, {
      sessionId,
      documentKey: normalizedDocumentKey,
      adjacent: "witness",
    }),
  };
}

function getOperateAnchorDocumentKey(activeProject = null, projectDocuments = []) {
  const operateState = listOperateIncludedDocuments(activeProject, projectDocuments, {
    includeAssembly: true,
    includeGuide: false,
  });
  return normalizeText(
    operateState?.currentAssemblyDocument?.documentKey || operateState?.includedDocuments?.[0]?.documentKey,
  );
}

async function buildAdjacentOperate({
  userId,
  activeProject = null,
  projectDocuments = [],
  sessionId = "",
  focusedDocumentKey = "",
} = {}) {
  if (!activeProject?.id || !activeProject?.projectKey) {
    return {
      operate: {
        available: false,
        hasRun: false,
        lastRunAt: "",
        nextMove: "",
        includedSourceCount: 0,
        openHref: "",
      },
    };
  }

  const operateState = listOperateIncludedDocuments(activeProject, projectDocuments, {
    includeAssembly: true,
    includeGuide: false,
  });
  const documentKey = getOperateAnchorDocumentKey(activeProject, projectDocuments);
  const latestRun =
    documentKey && operateState.canOperate
      ? await getLatestReaderOperateRunForUser(userId, {
          projectId: activeProject.id,
          documentKey,
          mode: "summary",
        })
      : null;
  const summaryResult =
    latestRun?.payloadJson && typeof latestRun.payloadJson === "object"
      ? latestRun.payloadJson.result || null
      : null;

  return {
    operate: {
      available: Boolean(operateState.canOperate),
      hasRun: Boolean(summaryResult),
      lastRunAt: normalizeText(latestRun?.createdAt),
      nextMove: normalizeText(summaryResult?.nextMove),
      includedSourceCount: Number(operateState.includedSourceCount) || 0,
      documentKey,
      openHref: buildWorkspaceHref(activeProject.projectKey, {
        sessionId,
        ...(normalizeText(focusedDocumentKey) ? { documentKey: focusedDocumentKey } : {}),
        adjacent: "operate",
      }),
    },
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
    roomIdentity: {
      boxTitle: "",
      conversationTitle: "",
      canonScopeLabel: "Canon stays box-level across conversations.",
    },
    session: null,
    sessions: [],
    messages: [],
    focusedWitness: null,
    adjacent: {
      operate: {
        available: false,
        hasRun: false,
        lastRunAt: "",
        nextMove: "",
        includedSourceCount: 0,
        openHref: "",
      },
    },
    overlayIntent: "",
    authorityContext: {
      project: null,
      session: null,
      canonSource: null,
      sources: [],
      assembly: null,
      focusedWitness: null,
      adjacent: {
        operate: null,
      },
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
  focusedWitness = null,
  adjacent = null,
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
    canonSource: roomDocument
      ? {
          documentKey: roomDocument.documentKey,
          title: roomDocument.title,
        }
      : null,
    sources: Array.isArray(recentSources) ? recentSources : [],
    assembly: roomDocument
      ? {
          documentKey: roomDocument.documentKey,
          title: roomDocument.title,
        }
      : null,
    focusedWitness: focusedWitness || null,
    adjacent: adjacent && typeof adjacent === "object" ? adjacent : { operate: null },
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

export async function buildRoomWorkspaceViewForUser(
  userId,
  { projectKey = "", sessionId = "", documentKey = "", adjacent = "" } = {},
) {
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
  const recentSources = buildRecentSources(projectDocuments, latestRealSource);
  const focusedWitness = await buildFocusedWitness({
    userId,
    activeProject,
    projectDocuments,
    documentKey,
    sessionId: activeSession?.id || "",
  });
  const adjacentState = await buildAdjacentOperate({
    userId,
    activeProject,
    projectDocuments,
    sessionId: activeSession?.id || "",
    focusedDocumentKey: focusedWitness?.documentKey || "",
  });
  const deepLinks = buildDeepLinks(activeProject, latestRealSource, {
    sessionId: activeSession?.id || "",
    documentKey: focusedWitness?.documentKey || "",
  });
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
    focusedWitness,
    adjacent: adjacentState,
    resetAt: resetState.resetAt,
  });
  const overlayIntent = normalizeOverlayIntent(adjacent) || (focusedWitness ? "witness" : "");

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
    roomIdentity: {
      boxTitle: activeProject?.boxTitle || activeProject?.title || "Untitled Box",
      conversationTitle: resolvedSession?.title || "Conversation",
      canonScopeLabel: "Canon stays box-level across conversations.",
    },
    session: resolvedSession,
    sessions: resolvedSessions,
    messages: canonicalView?.messages || messages,
    focusedWitness,
    adjacent: adjacentState,
    overlayIntent,
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
  const documentKey =
    String(resolvedSearchParams?.document || resolvedSearchParams?.documentKey || "").trim();
  const adjacent = String(resolvedSearchParams?.adjacent || "").trim();
  return buildRoomWorkspaceViewForUser(session.user.id, { projectKey, sessionId, documentKey, adjacent });
}
