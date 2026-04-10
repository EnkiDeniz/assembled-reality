import "server-only";

import { getRequiredSession } from "@/lib/server-session";
import { listReaderDocumentsForUser } from "@/lib/reader-documents";
import { getReaderProfileByUserId, listReadingReceiptDraftsForProjectForUser } from "@/lib/reader-db";
import { getProjectByKey, getProjectDocuments } from "@/lib/project-model";
import { listReaderProjectsForUser } from "@/lib/reader-projects";
import { buildBoxViewModel, buildSourceSummaryViewModel } from "@/lib/box-view-models";
import { normalizeProjectArchitectureMeta } from "@/lib/assembly-architecture";
import { loadConversationThreadForUser } from "@/lib/reader-workspace";
import {
  buildRoomThreadKey,
  deriveRoomFieldState,
  extractRoomPayloadFromCitations,
  getRoomFieldStateTone,
  normalizeRoomState,
} from "@/lib/room";

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

function getCurrentAssemblyDocument(project = null, projectDocuments = []) {
  const documents = Array.isArray(projectDocuments) ? projectDocuments : [];
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
  const realSources = (Array.isArray(projectDocuments) ? projectDocuments : [])
    .filter(
      (document) =>
        document &&
        !document?.isAssembly &&
        document?.documentType !== "assembly" &&
        document?.documentType !== "builtin" &&
        document?.sourceType !== "builtin",
    )
    .sort((left, right) => Date.parse(String(right?.updatedAt || right?.createdAt || "")) - Date.parse(String(left?.updatedAt || left?.createdAt || "")));

  return realSources[0] || null;
}

function buildDeepLinks(project = null, currentAssemblyDocument = null, latestRealSource = null) {
  const projectKey = encodeURIComponent(String(project?.projectKey || "").trim());
  const base = projectKey ? `/workspace/phase1?project=${projectKey}` : "/workspace/phase1";
  const sourceKey = encodeURIComponent(String(latestRealSource?.documentKey || "").trim());
  const assemblyKey = encodeURIComponent(String(currentAssemblyDocument?.documentKey || "").trim());

  return {
    legacy: base,
    reader: sourceKey ? `${base}&document=${sourceKey}&mode=listen&phase=think` : base,
    compare: assemblyKey ? `${base}&document=${assemblyKey}&mode=assemble&phase=create` : base,
    operate: `${base}&phase=operate`,
    receipts: `${base}&phase=receipts`,
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

function buildMirrorViewModel({
  activeProject = null,
  boxViewModel = null,
  roomState = null,
  projectDocuments = [],
  latestRealSource = null,
} = {}) {
  const normalizedRoomState = normalizeRoomState(roomState);
  const sourceSummaries = (Array.isArray(projectDocuments) ? projectDocuments : [])
    .filter(
      (document) =>
        document &&
        !document?.isAssembly &&
        document?.documentType !== "assembly" &&
        document?.documentType !== "builtin" &&
        document?.sourceType !== "builtin",
    )
    .map((document) => buildSourceSummaryViewModel(document))
    .filter(Boolean)
    .slice(0, 5)
    .map((source) => ({
      id: source.documentKey,
      kind: "source",
      title: source.title,
      detail: source.metaLine,
      documentKey: source.documentKey,
    }));

  const roomEvidence = normalizedRoomState.evidenceItems.map((item) => ({
    id: item.id,
    kind: "distilled",
    title: item.text,
    detail: item.why || "Accepted from the Room.",
    documentKey: "",
  }));

  const storyItems = normalizedRoomState.storyItems.map((item) => ({
    id: item.id,
    text: item.text,
    detail: item.why || "Interpretive line held in the Room.",
  }));

  const moveItems = normalizedRoomState.moveItems.map((item) => ({
    id: item.id,
    text: item.text,
    detail: item.why || item.expected || "",
    status: item.status,
    receiptKitId: item.receiptKitId,
  }));

  const receiptEntries = normalizedRoomState.returnItems.map((item) => ({
    id: item.id,
    kind: "return",
    label: item.label || "Return",
    predicted: item.predicted,
    actual: item.actual,
    result: item.result,
    via: item.via,
    receiptKitId: item.receiptKitId,
    draftId: item.draftId,
  }));

  const draftEntries = (boxViewModel?.receiptSummary?.recentDrafts || []).map((draft) => ({
    id: draft.id,
    kind: "draft",
    label: draft.title || "Proof draft",
    predicted: "",
    actual: draft.implications || draft.interpretation || draft.courthouseStatusLine || "",
    result: draft.statusLabel || "Draft",
    via: draft.mode || "workspace",
    receiptKitId: "",
    draftId: draft.id,
  }));

  return {
    aim: {
      text:
        normalizedRoomState.aim.text ||
        boxViewModel?.root?.text ||
        latestRealSource?.title ||
        activeProject?.boxTitle ||
        activeProject?.title ||
        "",
      gloss: normalizedRoomState.aim.gloss || boxViewModel?.root?.gloss || "",
    },
    evidence: [...sourceSummaries, ...roomEvidence].slice(0, 8),
    story: storyItems.slice(0, 8),
    moves: moveItems.slice(0, 8),
    returns: [...receiptEntries, ...draftEntries].slice(0, 8),
  };
}

export async function buildRoomWorkspaceViewForUser(userId, { projectKey = "" } = {}) {
  const [readerData, documents] = await Promise.all([
    getReaderProfileByUserId(userId),
    listReaderDocumentsForUser(userId),
  ]);

  const projects = await listReaderProjectsForUser(userId, documents);
  const activeProject = pickActiveProject(projects, projectKey);
  const projectDocuments = getProjectDocuments(documents, activeProject);
  const currentAssemblyDocument = getCurrentAssemblyDocument(activeProject, projectDocuments);
  const projectDrafts = activeProject
    ? await listReadingReceiptDraftsForProjectForUser(userId, {
        projectId: activeProject?.id || null,
        documentKeys: activeProject?.documentKeys || [],
        take: 6,
      })
    : [];
  const boxViewModel = buildBoxViewModel({
    activeProject,
    projectDocuments,
    currentAssemblyDocument,
    projectDrafts,
    connectionStatus: readerData?.getReceiptsConnection?.status || "DISCONNECTED",
    connectionLastError: readerData?.getReceiptsConnection?.lastError || "",
  });
  const projectMeta = normalizeProjectArchitectureMeta(
    activeProject?.metadataJson || activeProject?.architectureMeta || null,
  );
  const roomState = normalizeRoomState(projectMeta.room);
  const latestRealSource = getLatestRealSource(projectDocuments);
  const roomThreadKey = buildRoomThreadKey(activeProject?.projectKey || "");
  const thread = await loadConversationThreadForUser(userId, roomThreadKey);
  const messages = (thread?.messages || []).map(mapThreadMessageToRoomMessage).filter(Boolean);
  const latestReceiptKit =
    [...messages].reverse().find((message) => message?.roomPayload?.receiptKit)?.roomPayload?.receiptKit ||
    null;
  const pendingMove = roomState.moveItems.find((item) => item.status === "awaiting") || null;
  const fieldState = deriveRoomFieldState({
    roomState,
    realSourceCount: boxViewModel?.realSourceCount || 0,
    receiptCount: boxViewModel?.receiptSummary?.draftCount || 0,
    sealedReceiptCount: boxViewModel?.receiptSummary?.sealedDraftCount || 0,
  });

  return {
    project: {
      projectKey: activeProject?.projectKey || "",
      title: activeProject?.boxTitle || activeProject?.title || "Untitled Box",
      subtitle: activeProject?.boxSubtitle || activeProject?.subtitle || "",
      sourceCount: Number(activeProject?.sourceCount) || 0,
      receiptDraftCount: Number(activeProject?.receiptDraftCount) || 0,
      hasSeed: Boolean(currentAssemblyDocument),
    },
    projects: buildProjectList(projects),
    roomState,
    fieldState: {
      key: fieldState,
      tone: getRoomFieldStateTone(fieldState),
      label:
        fieldState === "new"
          ? "New"
          : fieldState === "grounded"
            ? "Grounded"
            : fieldState === "awaiting"
              ? "Awaiting"
              : fieldState === "sealed"
                ? "Sealed"
                : fieldState === "flagged"
                  ? "Flagged"
                  : fieldState === "rerouted"
                    ? "Rerouted"
                    : "Open",
    },
    messages,
    latestReceiptKit,
    pendingMove,
    recentReturns: roomState.returnItems.slice(0, 5),
    starter: {
      show:
        messages.length === 0 &&
        !roomState.aim.text &&
        (boxViewModel?.realSourceCount || 0) === 0 &&
        (boxViewModel?.receiptSummary?.draftCount || 0) === 0,
      firstLine: "What are you trying to make real?",
      secondLine:
        "Start with a source, or say the line plainly enough that reality can answer it.",
    },
    mirror: buildMirrorViewModel({
      activeProject,
      boxViewModel,
      roomState,
      projectDocuments,
      latestRealSource,
    }),
    recentSources: (boxViewModel?.latestRealSource ? [boxViewModel.latestRealSource] : [])
      .concat(
        (projectDocuments || [])
          .filter(
            (document) =>
              document &&
              !document?.isAssembly &&
              document?.documentType !== "assembly" &&
              document?.documentType !== "builtin" &&
              document?.sourceType !== "builtin" &&
              document.documentKey !== boxViewModel?.latestRealSource?.documentKey,
          )
          .slice(0, 4),
      )
      .map((document) => buildSourceSummaryViewModel(document))
      .filter(Boolean),
    receiptSummary: boxViewModel?.receiptSummary || null,
    deepLinks: buildDeepLinks(activeProject, currentAssemblyDocument, latestRealSource),
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
