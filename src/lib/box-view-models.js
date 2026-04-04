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

export function buildReceiptSummaryViewModel(projectDrafts = []) {
  const drafts = Array.isArray(projectDrafts) ? projectDrafts.filter(Boolean) : [];
  const latestDraft = drafts[0] || null;

  return {
    draftCount: drafts.length,
    latestDraftTitle: latestDraft?.title || "",
    latestDraftStatus: latestDraft?.status || "",
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
