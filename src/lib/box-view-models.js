import {
  buildBoxSource,
  buildOperateSourceSummary,
  getBoxSourceBadge,
  getBoxSourceMetaLine,
} from "@/lib/source-model";
import {
  buildVisualizationState,
  getSeedSectionsFromDocument,
  listRealSourceDocuments,
} from "@/lib/seed-model";
import {
  ASSEMBLY_DOMAINS,
  buildAssemblyStateSummary,
  getAssemblyColorTokens,
  getAssemblyStateColorStep,
  getGradientColorStep,
  listConfirmationQueueItems,
  normalizeProjectArchitectureMeta,
} from "@/lib/assembly-architecture";

export const BOX_PHASES = Object.freeze({
  think: "think",
  create: "create",
  operate: "operate",
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

function buildRootViewModel(activeProject = null) {
  const meta = normalizeProjectArchitectureMeta(
    activeProject?.metadataJson || activeProject?.architectureMeta || null,
  );

  return {
    ...meta.root,
    hasRoot: Boolean(meta.root.text),
    suggestedDomains: meta.suggestedDomains,
    applicableDomains: meta.applicableDomains,
    applicableDomainLabels: meta.applicableDomains.map(
      (domainKey) =>
        ASSEMBLY_DOMAINS.find((domain) => domain.key === domainKey)?.label || domainKey,
    ),
    domainRationales: meta.domainRationales,
  };
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
    remoteDraftCount: drafts.filter((draft) => String(draft?.status || "").trim().toUpperCase() === "REMOTE_DRAFT").length,
    sealedDraftCount: drafts.filter((draft) => String(draft?.status || "").trim().toUpperCase() === "SEALED").length,
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
  const gradientTone = getGradientColorStep(operateState?.gradient);

  return {
    canRunOperate: Boolean(operateState?.canOperate),
    includedSourceCount: Number(operateState?.includedSourceCount) || 0,
    includesAssembly: Boolean(operateState?.includesAssembly),
    title: activeProject?.boxTitle || activeProject?.title || "Untitled Box",
    gradientColorStep: gradientTone.step,
    gradientColorUnknown: gradientTone.isUnknown,
    gradientColorTokens: getAssemblyColorTokens(gradientTone),
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
  const realSourceDocuments = listRealSourceDocuments(documents);
  const sourceSummaries = documents
    .filter((document) => !document?.isAssembly && document?.documentType !== "assembly")
    .map((document) => buildSourceSummaryViewModel(document))
    .filter(Boolean);
  const guideSource = sourceSummaries.find((source) => source.isBuiltIn) || null;
  const realSources = sourceSummaries.filter((source) => !source.isBuiltIn);
  const seedDocument = currentAssemblyDocument || null;
  const latestRealSource = getMostRecentItem(realSources);
  const latestTouchedSource = getMostRecentItem(sourceSummaries);
  const receiptSummary = buildReceiptSummaryViewModel(projectDrafts, {
    connectionStatus,
    connectionLastError,
  });
  const rootViewModel = buildRootViewModel(activeProject);
  const confirmationQueue = listConfirmationQueueItems(projectDocuments, rootViewModel);
  const stateSummary = buildAssemblyStateSummary({
    project: activeProject,
    projectDocuments,
    projectDrafts,
  });
  const sevenDiagnostic = receiptSummary.draftCount > 0
    ? "Seven can compare sources, seed, and proof from this box."
    : realSources.length >= 2
      ? "Seven can start reading the pattern across the sources in this box."
      : "Seven needs more in the box to read the pattern.";
  const visualizationState = buildVisualizationState({
    realSourceCount: realSourceDocuments.length,
    hasSeed: Boolean(seedDocument),
    localReceiptCount: receiptSummary.draftCount,
    remoteReceiptCount: receiptSummary.remoteDraftCount + receiptSummary.sealedDraftCount,
    hasGapSignal: Boolean(seedDocument && !receiptSummary.draftCount),
    suggestionPending: Boolean(seedDocument?.seedMeta?.suggestionPending),
  });
  const coloredVisualizationState = {
    ...visualizationState,
    colorStep: stateSummary.colorStep,
    colorTokens: stateSummary.colorTokens,
  };
  const strongestNextMove = seedDocument
    ? {
        label: "Open Seed",
        detail: seedDocument.title || "Open the current seed",
        supportingDetail: `${seedDocument.sectionCount || seedDocument.blocks?.length || 0} block${(seedDocument.sectionCount || seedDocument.blocks?.length || 0) === 1 ? "" : "s"}`,
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
        kind: "resume",
        actionLabel: "Resume",
        documentKey: resumeSessionSummary.documentKey || "",
        mode: "listen",
        phase: BOX_PHASES.think,
        title: resumeSessionSummary.title || "Resume the last session",
        detail:
          typeof resumeSessionSummary.blockPosition === "number" &&
          typeof resumeSessionSummary.totalBlocks === "number" &&
          resumeSessionSummary.totalBlocks > 0
            ? `Block ${resumeSessionSummary.blockPosition} of ${resumeSessionSummary.totalBlocks}`
            : "Resume where you left off",
      }
      : seedDocument
      ? {
          kind: "seed",
          actionLabel: "Open seed",
          documentKey: seedDocument.documentKey || "",
          mode: "assemble",
          phase: BOX_PHASES.create,
          title: seedDocument.title || "Current seed",
          detail: "Seed is the current working position of this box.",
        }
      : latestTouchedSource
        ? {
            kind: "source",
            actionLabel: "Open source",
            documentKey: latestTouchedSource.documentKey || "",
            mode: "listen",
            phase: BOX_PHASES.think,
            title: latestTouchedSource.title,
            detail: `${latestTouchedSource.metaLine} · Latest touched source`,
          }
        : {
            kind: "empty",
            actionLabel: "Add source",
            documentKey: "",
            mode: "listen",
            phase: BOX_PHASES.think,
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
    hasSeed: Boolean(seedDocument),
    seedDocument,
    seedTitle: seedDocument?.title || "Seed",
    receiptCount: receiptSummary.draftCount,
    guideSource,
    latestRealSource,
    latestTouchedSource,
    currentAssemblyDocument: seedDocument,
    visualizationState: coloredVisualizationState,
    receiptSummary,
    root: rootViewModel,
    stateSummary,
    confirmationQueue,
    confirmationCount: confirmationQueue.length,
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
    confirmationCount: listConfirmationQueueItems(projectDocuments, buildRootViewModel(activeProject)).length,
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
    seedTitle: currentAssemblyDocument?.title || "Seed",
    hasSeed: Boolean(currentAssemblyDocument),
    selectedBlockCount: Array.isArray(clipboard) ? clipboard.length : 0,
    stagedReplyCount: Array.isArray(stagedAiBlocks) ? stagedAiBlocks.length : 0,
    root: buildRootViewModel(activeProject),
  };
}

export function buildSeedViewModel({
  activeProject = null,
  currentAssemblyDocument = null,
  projectDocuments = [],
  projectDrafts = [],
  pendingSuggestion = null,
} = {}) {
  const seedDocument = currentAssemblyDocument || null;
  const receiptSummary = buildReceiptSummaryViewModel(projectDrafts);
  const realSourceCount = listRealSourceDocuments(projectDocuments).length;
  const sections = getSeedSectionsFromDocument(seedDocument);
  const rootViewModel = buildRootViewModel(activeProject);
  const stateSummary = buildAssemblyStateSummary({
    project: activeProject,
    projectDocuments,
    projectDrafts,
  });
  const confirmationQueue = listConfirmationQueueItems(projectDocuments, rootViewModel);
  const visualizationState = buildVisualizationState({
    realSourceCount,
    hasSeed: Boolean(seedDocument),
    localReceiptCount: receiptSummary.draftCount,
    remoteReceiptCount: receiptSummary.remoteDraftCount + receiptSummary.sealedDraftCount,
    hasGapSignal: Boolean(seedDocument && !receiptSummary.draftCount),
    suggestionPending: Boolean(pendingSuggestion),
  });
  const coloredVisualizationState = {
    ...visualizationState,
    colorStep: stateSummary.colorStep,
    colorTokens: stateSummary.colorTokens,
  };

  return {
    boxTitle: activeProject?.boxTitle || activeProject?.title || "Untitled Box",
    seedDocument,
    seedTitle: seedDocument?.title || "Seed",
    sections,
    receiptSummary,
    visualizationState: coloredVisualizationState,
    pendingSuggestion,
    root: rootViewModel,
    stateSummary,
    confirmationQueue,
    confirmationCount: confirmationQueue.length,
  };
}

export function buildEntryStateViewModel({
  projects = [],
  activeProject = null,
  projectDocuments = [],
  allDocuments = [],
  projectDrafts = [],
  currentAssemblyDocument = null,
  resumeSessionSummary = null,
} = {}) {
  const normalizedProjects = Array.isArray(projects) ? projects.filter(Boolean) : [];
  const normalizedDocuments = Array.isArray(allDocuments) ? allDocuments.filter(Boolean) : [];
  const realSourceCount = listRealSourceDocuments(normalizedDocuments).length;
  const currentBoxRealSources = listRealSourceDocuments(projectDocuments);
  const latestProjectSource = getMostRecentItem(currentBoxRealSources);
  const seedCount = normalizedDocuments.filter(
    (document) => document?.isAssembly || document?.documentType === "assembly",
  ).length;
  const receiptCount = Array.isArray(projectDrafts) ? projectDrafts.length : 0;
  const currentBoxRealSourceCount = currentBoxRealSources.length;
  const isFirstTime = realSourceCount === 0 && seedCount === 0 && receiptCount === 0;
  const isPowerUser =
    !isFirstTime &&
    (normalizedProjects.length >= 2 || currentBoxRealSourceCount >= 5 || receiptCount >= 3);
  const resumeDocumentKey =
    String(resumeSessionSummary?.documentKey || "").trim() ||
    String(latestProjectSource?.documentKey || "").trim() ||
    "";
  const resumeSeedKey = String(currentAssemblyDocument?.documentKey || "").trim();

  return {
    isFirstTime,
    isReturning: !isFirstTime,
    isPowerUser,
    mode: isFirstTime ? "first-time" : isPowerUser ? "power" : "returning",
    activeBoxTitle: activeProject?.boxTitle || activeProject?.title || "Untitled Box",
    resumeDocumentKey,
    resumeSeedKey,
    desktopInitialSurface: isFirstTime ? "first-time" : "home",
    mobileInitialSurface: resumeDocumentKey ? "listen" : "home",
  };
}

export function buildControlSurfaceViewModel({
  activeProject = null,
  currentAssemblyDocument = null,
  projectDocuments = [],
  projectDrafts = [],
  boxPhase = BOX_PHASES.think,
  canRunOperate = false,
  aiOpen = false,
  clipboardCount = 0,
  stagedCount = 0,
} = {}) {
  const currentBoxTitle = activeProject?.boxTitle || activeProject?.title || "Untitled Box";
  const currentSeedTitle = currentAssemblyDocument?.title || currentBoxTitle;
  const stageCount = Math.max(0, Number(clipboardCount) || 0) + Math.max(0, Number(stagedCount) || 0);
  const rootViewModel = buildRootViewModel(activeProject);
  const confirmationCount = listConfirmationQueueItems(projectDocuments, rootViewModel).length;
  const stateSummary = buildAssemblyStateSummary({
    project: activeProject,
    projectDocuments,
    projectDrafts,
  });
  const stateColorStep = getAssemblyStateColorStep(stateSummary.current);

  return {
    currentBoxTitle,
    currentSeedTitle,
    boxPhase,
    canRunOperate: Boolean(canRunOperate),
    aiOpen: Boolean(aiOpen),
    stageCount,
    rootText: rootViewModel.text,
    hasRoot: rootViewModel.hasRoot,
    stateSummary,
    stateColorStep,
    stateColorTokens: stateSummary.colorTokens || getAssemblyColorTokens(stateColorStep),
    confirmationCount,
    isLooping: Boolean(stateSummary.isLooping),
    primaryActionLabel:
      boxPhase === BOX_PHASES.create
        ? stageCount > 0
          ? `Stage ${stageCount}`
          : "Add source"
        : boxPhase === BOX_PHASES.operate
          ? "Operate"
          : boxPhase === BOX_PHASES.receipts
            ? "Draft receipt"
            : "Add source",
  };
}
