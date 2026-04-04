import { DEFAULT_PROJECT_KEY, DEFAULT_PROJECT_TITLE } from "@/lib/project-model";

export const SEED_TEMPLATE_VERSION = 1;

export const SEED_SECTIONS = Object.freeze({
  aim: "Aim",
  whatsHere: "What's here",
  gap: "The gap",
  sealed: "Sealed",
});

export function normalizeSeedMeta(seedMeta = null) {
  const nextSeedMeta =
    seedMeta && typeof seedMeta === "object" ? seedMeta : {};

  return {
    isSeed: Boolean(nextSeedMeta.isSeed),
    templateVersion:
      Number.isFinite(Number(nextSeedMeta.templateVersion))
        ? Number(nextSeedMeta.templateVersion)
        : SEED_TEMPLATE_VERSION,
    status: String(nextSeedMeta.status || "live").trim().toLowerCase() || "live",
    updatedAt: String(nextSeedMeta.updatedAt || "").trim() || null,
    suggestionPending: Boolean(nextSeedMeta.suggestionPending),
    autoTitled: Boolean(nextSeedMeta.autoTitled),
    sourceFingerprint: String(nextSeedMeta.sourceFingerprint || "").trim() || "",
    lastSuggestedFingerprint:
      String(nextSeedMeta.lastSuggestedFingerprint || "").trim() || "",
  };
}

function parseSeedSection(markdown = "", heading = "") {
  const normalizedHeading = String(heading || "").trim();
  if (!normalizedHeading) return "";

  const escapedHeading = normalizedHeading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const expression = new RegExp(
    `^##\\s+${escapedHeading}\\s*$([\\s\\S]*?)(?=^##\\s+|\\Z)`,
    "im",
  );
  const match = expression.exec(String(markdown || ""));
  return match?.[1]?.trim() || "";
}

export function getSeedSectionsFromMarkdown(markdown = "") {
  return {
    aim: parseSeedSection(markdown, SEED_SECTIONS.aim),
    whatsHere: parseSeedSection(markdown, SEED_SECTIONS.whatsHere),
    gap: parseSeedSection(markdown, SEED_SECTIONS.gap),
    sealed: parseSeedSection(markdown, SEED_SECTIONS.sealed),
  };
}

export function getSeedSectionsFromDocument(document = null) {
  return getSeedSectionsFromMarkdown(document?.rawMarkdown || "");
}

export function buildSeedMarkdown({
  aim = "",
  whatsHere = "",
  gap = "",
  sealed = "",
} = {}) {
  return [
    `## ${SEED_SECTIONS.aim}`,
    String(aim || "").trim() || "Name what this box is trying to make real.",
    "",
    `## ${SEED_SECTIONS.whatsHere}`,
    String(whatsHere || "").trim() || "List the strongest signals that are actually inside the box.",
    "",
    `## ${SEED_SECTIONS.gap}`,
    String(gap || "").trim() || "State where intention and evidence still do not meet.",
    "",
    `## ${SEED_SECTIONS.sealed}`,
    String(sealed || "").trim() || "No receipts sealed yet.",
    "",
  ].join("\n");
}

export function isSeedDocument(document = null, project = null) {
  if (!document) return false;
  if (normalizeSeedMeta(document.seedMeta).isSeed) return true;

  const currentAssemblyKey = String(project?.currentAssemblyDocumentKey || "").trim();
  return Boolean(
    (document.isAssembly || document.documentType === "assembly") &&
      currentAssemblyKey &&
      document.documentKey === currentAssemblyKey,
  );
}

export function getSeedDocument(project = null, documents = [], preferredDocumentKey = "") {
  const normalizedDocuments = Array.isArray(documents) ? documents.filter(Boolean) : [];
  const preferredKey = String(preferredDocumentKey || "").trim();

  if (preferredKey) {
    const preferredSeed = normalizedDocuments.find(
      (document) =>
        document.documentKey === preferredKey && isSeedDocument(document, project),
    );
    if (preferredSeed) return preferredSeed;
  }

  const currentAssemblyKey = String(project?.currentAssemblyDocumentKey || "").trim();
  if (currentAssemblyKey) {
    const currentAssembly = normalizedDocuments.find(
      (document) => document.documentKey === currentAssemblyKey,
    );
    if (currentAssembly && (currentAssembly.isAssembly || currentAssembly.documentType === "assembly")) {
      return currentAssembly;
    }
  }

  return (
    normalizedDocuments.find((document) => normalizeSeedMeta(document.seedMeta).isSeed) ||
    normalizedDocuments.find(
      (document) => document.isAssembly || document.documentType === "assembly",
    ) ||
    null
  );
}

export function isRealSourceDocument(document = null) {
  if (!document) return false;
  if (document.isAssembly || document.documentType === "assembly") return false;
  if (document.documentType === "builtin" || document.sourceType === "builtin") return false;
  return true;
}

export function listRealSourceDocuments(documents = []) {
  return (Array.isArray(documents) ? documents : []).filter((document) =>
    isRealSourceDocument(document),
  );
}

export function isGuideOnlyBox(projectDocuments = []) {
  return listRealSourceDocuments(projectDocuments).length === 0;
}

export function shouldAutoRenameBox(project = null) {
  const title = String(project?.boxTitle || project?.title || "").trim();
  return (
    !title ||
    title === DEFAULT_PROJECT_TITLE ||
    (project?.projectKey || DEFAULT_PROJECT_KEY) === DEFAULT_PROJECT_KEY
  );
}

export function buildSeedFingerprint({
  realSourceDocuments = [],
  receiptCount = 0,
  latestOperateAt = "",
} = {}) {
  const sourceFingerprint = (Array.isArray(realSourceDocuments) ? realSourceDocuments : [])
    .map((document) => `${document.documentKey}:${document.updatedAt || document.createdAt || ""}`)
    .sort()
    .join("|");

  return `${sourceFingerprint}::receipts:${Number(receiptCount) || 0}::operate:${String(
    latestOperateAt || "",
  ).trim()}`;
}

export function buildVisualizationState({
  realSourceCount = 0,
  hasSeed = false,
  localReceiptCount = 0,
  remoteReceiptCount = 0,
  hasGapSignal = false,
  suggestionPending = false,
} = {}) {
  const sources = Math.max(0, Number(realSourceCount) || 0);
  const localReceipts = Math.max(0, Number(localReceiptCount) || 0);
  const remoteReceipts = Math.max(0, Number(remoteReceiptCount) || 0);
  const receiptWeight = Math.min(1, localReceipts * 0.18 + remoteReceipts * 0.34);
  const sourceWeight = Math.min(1, sources * 0.24);
  const seedWeight = hasSeed ? 0.18 : 0;
  const fill = Math.min(1, 0.08 + sourceWeight + seedWeight + receiptWeight);

  let stage = "dormant";
  if (sources > 0) stage = "wireframe";
  if (hasSeed) stage = "growing";
  if (localReceipts > 0 || remoteReceipts > 0) stage = "solid";
  if (hasGapSignal && stage !== "dormant") stage = "tension";

  return {
    stage,
    fill,
    sourceWeight,
    receiptWeight,
    suggestionPending: Boolean(suggestionPending),
    hasSeed: Boolean(hasSeed),
    hasGapSignal: Boolean(hasGapSignal),
  };
}

