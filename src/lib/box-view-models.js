import {
  buildBoxSource,
  buildOperateSourceSummary,
  getBoxSourceBadge,
  getBoxSourceMetaLine,
} from "@/lib/source-model";

export const BOX_PHASES = Object.freeze({
  think: "think",
  create: "create",
  receipts: "receipts",
});

function getTimestamp(value = null) {
  const parsed = Date.parse(String(value || ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getMostRecentItem(items = []) {
  return [...items].sort((left, right) => {
    const rightTimestamp = getTimestamp(right?.updatedAt || right?.createdAt);
    const leftTimestamp = getTimestamp(left?.updatedAt || left?.createdAt);
    return rightTimestamp - leftTimestamp;
  })[0] || null;
}

function formatReceiptStatus(status = "") {
  const normalized = String(status || "").trim().toUpperCase();
  if (normalized === "REMOTE_DRAFT") return "Pushed to GetReceipts";
  if (normalized === "SEALED") return "Sealed";
  if (normalized === "ERROR") return "Needs review";
  return "Local only";
}

function formatConnectionStatus(status = "") {
  const normalized = String(status || "").trim().toUpperCase();
  if (normalized === "CONNECTED") return "Connected";
  if (normalized === "EXPIRED") return "Reconnect needed";
  if (normalized === "ERROR") return "Connection problem";
  return "Not connected";
}

export function normalizeBoxPhase(value, fallback = BOX_PHASES.think) {
  return Object.values(BOX_PHASES).includes(value) ? value : fallback;
}

export function buildSourceSummaryViewModel(document = null) {
  const source = buildBoxSource(document);
  if (!source) return null;

  return {
    ...source,
    badge: getBoxSourceBadge(source),
    metaLine: getBoxSourceMetaLine(source),
    operateSummary: buildOperateSourceSummary(source),
  };
}

export function buildReceiptSummaryViewModel(
  projectDrafts = [],
  {
    connectionStatus = "DISCONNECTED",
    connectionLastError = "",
  } = {},
) {
  const drafts = Array.isArray(projectDrafts) ? projectDrafts.filter(Boolean) : [];
  const latestDraft = drafts[0] || null;
  const latestRemoteError =
    String(latestDraft?.payload?.remoteError || connectionLastError || "").trim() || "";
  const latestDraftStatus = String(latestDraft?.status || "").trim().toUpperCase();
  const latestDraftMode = String(latestDraft?.payload?.mode || "").trim().toLowerCase();
  const latestDraftSummary =
    String(
      latestDraft?.payload?.decision ||
        latestDraft?.payload?.learned ||
        latestDraft?.implications ||
        latestDraft?.interpretation ||
        "",
    ).trim() || "";
  const normalizedConnectionStatus = String(connectionStatus || "DISCONNECTED")
    .trim()
    .toUpperCase();

  let syncLine = "Draft a local receipt when the box is ready.";
  if (normalizedConnectionStatus !== "CONNECTED") {
    syncLine = "Local proof still works. Connect GetReceipts when you want remote proof.";
  } else if (latestRemoteError) {
    syncLine = "The last push failed, but the local draft was preserved.";
  } else if (latestDraftStatus === "REMOTE_DRAFT") {
    syncLine = "The latest proof was pushed to GetReceipts.";
  } else if (drafts.length > 0) {
    syncLine = "The latest proof is local only until you push it.";
  }

  return {
    draftCount: drafts.length,
    latestDraft,
    latestDraftTitle: latestDraft?.title || "",
    latestDraftStatus: latestDraftStatus,
    latestDraftStatusLabel: formatReceiptStatus(latestDraftStatus),
    latestDraftMode,
    latestDraftSummary,
    latestRemoteError,
    connectionStatus: normalizedConnectionStatus,
    connectionStatusLabel: formatConnectionStatus(normalizedConnectionStatus),
    syncLine,
    recentDrafts: drafts.slice(0, 4).map((draft) => ({
      ...draft,
      statusLabel: formatReceiptStatus(draft?.status),
      mode: String(draft?.payload?.mode || "").trim().toLowerCase(),
    })),
    hasReceipts: drafts.length > 0,
  };
}

export function buildOperateViewModel(operateState = {}, activeProject = null) {
  return {
    canRunOperate: Boolean(operateState?.canOperate),
    includedSourceCount: Number(operateState?.includedSourceCount) || 0,
    includesAssembly: Boolean(operateState?.includesAssembly),
    title: activeProject?.boxTitle || activeProject?.title || "Untitled Box",
  };
}

export function buildBoxViewModel({
  activeProject = null,
  projectDocuments = [],
  currentAssemblyDocument = null,
  projectDrafts = [],
  resumeSessionSummary = null,
  connectionStatus = "DISCONNECTED",
  connectionLastError = "",
} = {}) {
  const documents = Array.isArray(projectDocuments) ? projectDocuments.filter(Boolean) : [];
  const sourceSummaries = documents
    .filter((document) => !document?.isAssembly && document?.documentType !== "assembly")
    .map((document) => buildSourceSummaryViewModel(document))
    .filter(Boolean);
  const guideSource = sourceSummaries.find((source) => source.isBuiltIn) || null;
  const realSources = sourceSummaries.filter((source) => !source.isBuiltIn);
  const latestRealSource = getMostRecentItem(realSources);
  const latestTouchedSource = getMostRecentItem(sourceSummaries);
  const receiptSummary = buildReceiptSummaryViewModel(projectDrafts, {
    connectionStatus,
    connectionLastError,
  });
  const sevenDiagnostic = receiptSummary.draftCount > 0
    ? "Seven can compare sources, assembly, and proof from this box."
    : realSources.length >= 2
      ? "Seven can start reading the pattern across the sources in this box."
      : "Seven needs more in the box to read the pattern.";
  const strongestNextMove = currentAssemblyDocument
    ? {
        label: "Continue Assembly",
        detail: currentAssemblyDocument.title || "Open the current assembly",
        supportingDetail: `${currentAssemblyDocument.sectionCount || currentAssemblyDocument.blocks?.length || 0} block${(currentAssemblyDocument.sectionCount || currentAssemblyDocument.blocks?.length || 0) === 1 ? "" : "s"}`,
      }
    : latestRealSource
      ? {
          label: "Open latest source",
          detail: latestRealSource.title,
          supportingDetail: latestRealSource.metaLine,
        }
      : {
          label: "Add source",
          detail: "Bring in a supported 1.0 source.",
          supportingDetail: "PDF, DOCX, Markdown/TXT, paste, link, or Speak note",
        };

  const resumeTarget = resumeSessionSummary
    ? {
        title: resumeSessionSummary.title || "Resume the last session",
        detail:
          typeof resumeSessionSummary.blockPosition === "number" &&
          typeof resumeSessionSummary.totalBlocks === "number" &&
          resumeSessionSummary.totalBlocks > 0
            ? `Block ${resumeSessionSummary.blockPosition} of ${resumeSessionSummary.totalBlocks}`
            : "Resume where you left off",
      }
    : currentAssemblyDocument
      ? {
          title: currentAssemblyDocument.title || "Current assembly",
          detail: "Assembly is the current working position of this box.",
        }
      : latestTouchedSource
        ? {
            title: latestTouchedSource.title,
            detail: `${latestTouchedSource.metaLine} · Latest touched source`,
          }
        : {
            title: guideSource?.title || "Add the first real source",
            detail: "The built-in guide stays available, but real work starts with a source.",
          };

  return {
    boxTitle: activeProject?.boxTitle || activeProject?.title || "Untitled Box",
    boxSubtitle: activeProject?.boxSubtitle || activeProject?.subtitle || "",
    isDefaultBox: Boolean(activeProject?.isDefaultBox),
    sourceCount: sourceSummaries.length,
    realSourceCount: realSources.length,
    assemblyCount: documents.filter(
      (document) => document?.isAssembly || document?.documentType === "assembly",
    ).length,
    receiptCount: receiptSummary.draftCount,
    guideSource,
    latestRealSource,
    latestTouchedSource,
    currentAssemblyDocument,
    receiptSummary,
    sevenDiagnostic,
    strongestNextMove,
    resumeTarget,
  };
}

export function buildThinkViewModel({
  activeProject = null,
  activeDocument = null,
  projectDocuments = [],
  guideDocument = null,
} = {}) {
  const sourceSummaries = projectDocuments
    .filter((document) => !document?.isAssembly && document?.documentType !== "assembly")
    .map((document) => buildSourceSummaryViewModel(document))
    .filter(Boolean);
  const activeSource = buildSourceSummaryViewModel(activeDocument);
  const nonGuideSourceCount = sourceSummaries.filter((source) => !source.isBuiltIn).length;

  return {
    boxTitle: activeProject?.boxTitle || activeProject?.title || "Untitled Box",
    activeSource,
    guideSource: buildSourceSummaryViewModel(guideDocument),
    sourceSummaries,
    nonGuideSourceCount,
  };
}

export function buildCreateViewModel({
  activeProject = null,
  currentAssemblyDocument = null,
  clipboard = [],
  stagedAiBlocks = [],
} = {}) {
  return {
    boxTitle: activeProject?.boxTitle || activeProject?.title || "Untitled Box",
    assemblyTitle: currentAssemblyDocument?.title || "Assembly",
    hasAssembly: Boolean(currentAssemblyDocument),
    selectedBlockCount: Array.isArray(clipboard) ? clipboard.length : 0,
    stagedReplyCount: Array.isArray(stagedAiBlocks) ? stagedAiBlocks.length : 0,
  };
}
