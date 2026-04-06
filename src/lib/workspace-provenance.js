import { detectHistoryWitnessKind } from "@/lib/history-normalization";

const TRANSFER_KINDS = new Set(["authored", "source", "history", "clipboard", "recast"]);
const CARRIERS = new Set(["human", "seven"]);

function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function getDocumentByKey(documentsOrMap, documentKey = "") {
  const key = cleanText(documentKey);
  if (!key) return null;

  if (documentsOrMap instanceof Map) {
    return documentsOrMap.get(key) || null;
  }

  return (Array.isArray(documentsOrMap) ? documentsOrMap : []).find(
    (document) => cleanText(document?.documentKey) === key,
  ) || null;
}

function getDocumentTitle(document = null) {
  return (
    cleanText(document?.title) ||
    cleanText(document?.subtitle) ||
    cleanText(document?.originalFilename) ||
    cleanText(document?.documentKey)
  );
}

export function normalizeWorkspaceBlockProvenance(input = null) {
  if (!input || typeof input !== "object") return null;

  const transferKind = cleanText(input.transferKind).toLowerCase();
  const carriedBy = cleanText(input.carriedBy).toLowerCase();
  const normalized = {
    transferKind: TRANSFER_KINDS.has(transferKind) ? transferKind : "",
    importedFromProjectKey: cleanText(input.importedFromProjectKey),
    importedFromDocumentKey: cleanText(input.importedFromDocumentKey),
    importedFromBlockId: cleanText(input.importedFromBlockId),
    importedFromTitle: cleanText(input.importedFromTitle),
    carriedAt: cleanText(input.carriedAt),
    carriedBy: CARRIERS.has(carriedBy) ? carriedBy : "",
  };

  if (!Object.values(normalized).some(Boolean)) {
    return null;
  }

  return normalized;
}

export function inferWorkspaceBlockTransferKind(block = null, documentsOrMap = null) {
  const existing = normalizeWorkspaceBlockProvenance(block?.provenance);
  if (existing?.transferKind) return existing.transferKind;

  const sourceDocument =
    getDocumentByKey(documentsOrMap, block?.sourceDocumentKey || block?.documentKey) || null;

  if (sourceDocument?.isAssembly || sourceDocument?.documentType === "assembly") {
    return "authored";
  }

  const historyKind = detectHistoryWitnessKind({
    historyKind: sourceDocument?.historyKind,
    title: sourceDocument?.title,
    originalFilename: sourceDocument?.originalFilename,
    relativePath: sourceDocument?.relativePath,
    rawText: String(sourceDocument?.rawMarkdown || "").slice(0, 400),
  });

  if (historyKind) return "history";
  return "source";
}

export function buildWorkspaceTransferredBlock(
  block = null,
  { documents = null, projectKey = "", carriedBy = "human", transferKind = "", carriedAt = "" } = {},
) {
  if (!block || typeof block !== "object") return block;

  const existing = normalizeWorkspaceBlockProvenance(block.provenance);
  if (existing) {
    return {
      ...block,
      provenance: {
        ...existing,
        importedFromProjectKey: existing.importedFromProjectKey || cleanText(projectKey),
        carriedAt: existing.carriedAt || cleanText(carriedAt) || new Date().toISOString(),
        carriedBy: existing.carriedBy || (CARRIERS.has(cleanText(carriedBy).toLowerCase()) ? cleanText(carriedBy).toLowerCase() : "human"),
      },
    };
  }

  const sourceDocumentKey = cleanText(block?.sourceDocumentKey || block?.documentKey);
  const sourceDocument = getDocumentByKey(documents, sourceDocumentKey);
  const resolvedTransferKind =
    cleanText(transferKind).toLowerCase() || inferWorkspaceBlockTransferKind(block, documents);

  return {
    ...block,
    provenance: {
      transferKind: TRANSFER_KINDS.has(resolvedTransferKind) ? resolvedTransferKind : "source",
      importedFromProjectKey: cleanText(projectKey),
      importedFromDocumentKey: sourceDocumentKey,
      importedFromBlockId: cleanText(block?.id),
      importedFromTitle:
        cleanText(block?.sourceTitle) ||
        getDocumentTitle(sourceDocument) ||
        sourceDocumentKey,
      carriedAt: cleanText(carriedAt) || new Date().toISOString(),
      carriedBy: CARRIERS.has(cleanText(carriedBy).toLowerCase())
        ? cleanText(carriedBy).toLowerCase()
        : "human",
    },
  };
}

export function buildWorkspaceBlockProvenanceView(block = null, documents = null) {
  if (!block || typeof block !== "object") {
    return {
      label: "Authored here",
      detail: "Drafted in this box.",
      compact: "Authored here",
    };
  }

  const provenance = normalizeWorkspaceBlockProvenance(block.provenance);
  const sourceDocument =
    getDocumentByKey(documents, provenance?.importedFromDocumentKey || block?.sourceDocumentKey || block?.documentKey) || null;
  const importedTitle =
    provenance?.importedFromTitle ||
    cleanText(block?.sourceTitle) ||
    getDocumentTitle(sourceDocument) ||
    cleanText(block?.sourceDocumentKey || block?.documentKey) ||
    "this box";
  const carriedBy = provenance?.carriedBy === "seven" ? "carried by Seven" : "";

  if (provenance?.transferKind === "history") {
    return {
      label: "History witness",
      detail: [importedTitle ? `carried from ${importedTitle}` : "", carriedBy].filter(Boolean).join(" · "),
      compact: importedTitle || "History witness",
    };
  }

  if (provenance?.transferKind === "source") {
    return {
      label: "Source witness",
      detail: [importedTitle ? `carried from ${importedTitle}` : "", carriedBy].filter(Boolean).join(" · "),
      compact: importedTitle || "Source witness",
    };
  }

  if (provenance?.transferKind === "clipboard") {
    return {
      label: "Carried from",
      detail: [importedTitle, carriedBy].filter(Boolean).join(" · "),
      compact: importedTitle || "Carried block",
    };
  }

  if (provenance?.transferKind === "recast") {
    return {
      label: "Recast from",
      detail: [importedTitle, carriedBy].filter(Boolean).join(" · "),
      compact: importedTitle || "Recast",
    };
  }

  if (provenance?.transferKind === "authored") {
    return {
      label: "Authored here",
      detail: importedTitle && importedTitle !== "this box" ? importedTitle : "Drafted in this box.",
      compact: "Authored here",
    };
  }

  if (block?.documentKey && block?.sourceDocumentKey && block.documentKey !== block.sourceDocumentKey) {
    return {
      label: "Source witness",
      detail: importedTitle,
      compact: importedTitle || "Source witness",
    };
  }

  return {
    label: "Authored here",
    detail: "Drafted in this box.",
    compact: "Authored here",
  };
}
