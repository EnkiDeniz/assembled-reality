import { cleanDisplayTitle } from "@/lib/document-blocks";
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
  detectHistoryWitnessKind,
  normalizeHistoryExportEntries,
} from "@/lib/history-normalization";
import {
  ASSEMBLY_DOMAINS,
  ASSEMBLY_CONFIRMATION_STATUSES,
  buildAssemblyStateSummary,
  getAssemblyColorTokens,
  getAssemblyStateColorStep,
  getGradientColorStep,
  listConfirmationQueueItems,
  normalizeProjectArchitectureMeta,
} from "@/lib/assembly-architecture";
import {
  annotateWordLayerWithLakinMoments,
  buildBoxWordLayerViewModel,
} from "@/lib/word-layer";

export const BOX_PHASES = Object.freeze({
  lane: "lane",
  think: "think",
  create: "create",
  operate: "operate",
  receipts: "receipts",
});

export const LANE_STAGE_LABELS = Object.freeze({
  selected: "Selected",
  staged: "Staged",
  advanced: "Advanced",
  sealed: "Sealed",
});

export const LANE_PROOF_LABELS = Object.freeze({
  open: "Open",
  witness: "Witness",
  supported: "Supported",
  sealed: "Sealed",
});

export const LANE_KIND_LABELS = Object.freeze({
  root: "Root",
  source: "Source",
  "derived-source": "Derived source",
  "history-export": "History export",
  move: "Assembly move",
  seed: "Seed",
  receipt: "Receipt",
});

export const LANE_GROUP_LABELS = Object.freeze({
  origin: "Origin",
  assembly: "Assembly",
  proof: "Proof",
});

const LANE_GROUP_ORDER = Object.freeze({
  origin: 0,
  assembly: 1,
  proof: 2,
});

const LANE_ROLE_ORDER = Object.freeze({
  root: 0,
  source: 1,
  "derived-source": 2,
  "history-export": 3,
  move: 4,
  seed: 5,
  receipt: 6,
});

const LANE_SOFT_STAGE_LABELS = Object.freeze({
  root: {
    selected: "Present",
    staged: "Declared",
    advanced: "Declared",
    sealed: "Sealed",
  },
  source: {
    selected: "Present",
    staged: "Linked",
    advanced: "Carried",
    sealed: "Sealed",
  },
  "derived-source": {
    selected: "Present",
    staged: "Linked",
    advanced: "Carried",
    sealed: "Sealed",
  },
  "history-export": {
    selected: "Present",
    staged: "Imported",
    advanced: "Linked",
    sealed: "Sealed",
  },
  move: {
    selected: "Present",
    staged: "Moved",
    advanced: "Moved",
    sealed: "Sealed",
  },
  seed: {
    selected: "Live edge",
    staged: "Live edge",
    advanced: "Live edge",
    sealed: "Sealed",
  },
  receipt: {
    selected: "Drafted",
    staged: "Drafted",
    advanced: "Drafted",
    sealed: "Sealed",
  },
});

const LANE_SOFT_PROOF_LABELS = Object.freeze({
  root: {
    open: "Open",
    witness: "Linked",
    supported: "Linked",
    sealed: "Sealed",
  },
  source: {
    open: "Open",
    witness: "Linked",
    supported: "Linked",
    sealed: "Sealed",
  },
  "derived-source": {
    open: "Open",
    witness: "Linked",
    supported: "Linked",
    sealed: "Sealed",
  },
  "history-export": {
    open: "Open",
    witness: "Linked",
    supported: "Linked",
    sealed: "Sealed",
  },
  move: {
    open: "Open",
    witness: "Linked",
    supported: "Linked",
    sealed: "Sealed",
  },
  seed: {
    open: "Open",
    witness: "Linked proof",
    supported: "Linked proof",
    sealed: "Sealed",
  },
  receipt: {
    open: "Draft",
    witness: "Draft",
    supported: "Draft",
    sealed: "Sealed",
  },
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

function isAssemblyDocument(document = null) {
  return Boolean(document?.isAssembly || document?.documentType === "assembly");
}

function isGuideDocument(document = null) {
  return Boolean(document?.documentType === "builtin" || document?.sourceType === "builtin");
}

function isRealSourceDocument(document = null) {
  return Boolean(document && !isAssemblyDocument(document) && !isGuideDocument(document));
}

function formatLaneMoment(value = "", fallback = "Order inferred") {
  const parsed = getTimestamp(value);
  if (!parsed) return fallback;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(parsed));
}

function getLaneGroupId(kind = "") {
  if (kind === "receipt") return "proof";
  if (kind === "move" || kind === "seed") return "assembly";
  return "origin";
}

function getLaneRoleWeight(kind = "") {
  return LANE_ROLE_ORDER[kind] ?? 999;
}

function getProtocolPosition({ hasLiveSeed = false, draftCount = 0 } = {}) {
  if (draftCount > 0) return "proving";
  if (hasLiveSeed) return "shaping";
  return "collecting";
}

function buildLaneContextualAction({
  realSourceCount = 0,
  hasLiveSeed = false,
  latestDraft = null,
  draftCount = 0,
} = {}) {
  if (realSourceCount <= 0) return null;

  if (!hasLiveSeed) {
    return {
      kind: "open-create",
      label: "Shape seed",
    };
  }

  const latestDraftStatus = String(latestDraft?.status || "").trim().toUpperCase();
  if (latestDraft?.id && latestDraftStatus && latestDraftStatus !== "SEALED") {
    return {
      kind: "open-seal",
      label: "Seal",
      draftId: String(latestDraft.id),
    };
  }

  if (hasLiveSeed && draftCount === 0) {
    return {
      kind: "run-operate",
      label: "Run Operate",
    };
  }

  return null;
}

export function getLaneStageStatusLabel(stageStatus = "selected", certaintyKind = "inferred", kind = "source") {
  if (stageStatus === "sealed") {
    return LANE_STAGE_LABELS.sealed;
  }

  if (certaintyKind === "event_backed") {
    return LANE_STAGE_LABELS[stageStatus] || LANE_STAGE_LABELS.selected;
  }

  return (
    LANE_SOFT_STAGE_LABELS[kind]?.[stageStatus] ||
    LANE_SOFT_STAGE_LABELS.source[stageStatus] ||
    LANE_STAGE_LABELS[stageStatus] ||
    LANE_STAGE_LABELS.selected
  );
}

export function getLaneProofStatusLabel(proofStatus = "open", certaintyKind = "inferred", kind = "source") {
  if (proofStatus === "sealed") {
    return LANE_PROOF_LABELS.sealed;
  }

  if (certaintyKind === "event_backed") {
    return LANE_PROOF_LABELS[proofStatus] || LANE_PROOF_LABELS.open;
  }

  return (
    LANE_SOFT_PROOF_LABELS[kind]?.[proofStatus] ||
    LANE_SOFT_PROOF_LABELS.source[proofStatus] ||
    LANE_PROOF_LABELS[proofStatus] ||
    LANE_PROOF_LABELS.open
  );
}

function getLaneActionLabel(entry = null) {
  if (entry?.nextAction?.label) return entry.nextAction.label;
  if (entry?.actionLabel) return entry.actionLabel;
  return entry?.canInspectEvidence ? "Inspect evidence" : "Open";
}

export function finalizeLaneEntry(entry = null) {
  if (!entry) return null;

  const kind = entry.kind || "source";
  const certaintyKind = entry.certaintyKind === "event_backed" ? "event_backed" : "inferred";
  const groupId = entry.groupId || getLaneGroupId(kind);
  const stageStatus = entry.stageStatus || "selected";
  const proofStatus = entry.proofStatus || "open";

  return {
    ...entry,
    kind,
    certaintyKind,
    groupId,
    groupLabel: entry.groupLabel || LANE_GROUP_LABELS[groupId] || "Assembly",
    stageStatus,
    proofStatus,
    stageStatusLabel:
      entry.stageStatusLabel ||
      getLaneStageStatusLabel(stageStatus, certaintyKind, kind),
    proofStatusLabel:
      entry.proofStatusLabel ||
      getLaneProofStatusLabel(proofStatus, certaintyKind, kind),
    occurredAtLabel:
      entry.occurredAtLabel ||
      formatLaneMoment(
        entry.occurredAt,
        entry.orderKind === "explicit" ? "Undated" : "Order inferred",
      ),
    actionLabel: getLaneActionLabel(entry),
    linkedEntryIds: Array.isArray(entry.linkedEntryIds)
      ? [...new Set(entry.linkedEntryIds.filter(Boolean))]
      : [],
    linkedSourceKeys: Array.isArray(entry.linkedSourceKeys)
      ? [...new Set(entry.linkedSourceKeys.filter(Boolean))]
      : [],
    sourceRefs: Array.isArray(entry.sourceRefs) ? entry.sourceRefs : [],
    canInspectEvidence: Boolean(entry.canInspectEvidence),
    isLakinMoment: Boolean(entry.isLakinMoment && kind === "move"),
    pivotPair: kind === "move" ? String(entry.pivotPair || "").trim() : "",
    fromTerm: kind === "move" ? String(entry.fromTerm || "").trim() : "",
    toTerm: kind === "move" ? String(entry.toTerm || "").trim() : "",
    lakinSummary: kind === "move" ? String(entry.lakinSummary || "").trim() : "",
    lakinSource:
      kind === "move" && String(entry.lakinSource || "").trim().toLowerCase() === "curated"
        ? "curated"
        : kind === "move" && entry.lakinSource
          ? "derived"
          : "",
  };
}

function getEventContext(event = null) {
  return event?.detail?.context && typeof event.detail.context === "object"
    ? event.detail.context
    : {};
}

function pushToMapArray(map, key, value) {
  if (!key) return;
  const list = map.get(key) || [];
  list.push(value);
  map.set(key, list);
}

function buildAssemblyEventIndex(events = []) {
  const byType = new Map();
  const byDocumentKey = new Map();
  const byReceiptId = new Map();

  (Array.isArray(events) ? events : []).forEach((event) => {
    const type = String(event?.type || "").trim().toLowerCase();
    if (!type) return;

    pushToMapArray(byType, type, event);

    const context = getEventContext(event);
    const keys = [
      context.documentKey,
      context.primaryDocumentKey,
      ...(Array.isArray(context.relatedSourceDocumentKeys) ? context.relatedSourceDocumentKeys : []),
      ...(Array.isArray(context.evidenceSourceDocumentKeys) ? context.evidenceSourceDocumentKeys : []),
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean);

    [...new Set(keys)].forEach((key) => {
      pushToMapArray(byDocumentKey, key, event);
    });

    [context.receiptId, context.draftId]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .forEach((receiptId) => {
        pushToMapArray(byReceiptId, receiptId, event);
      });
  });

  return {
    byType,
    byDocumentKey,
    byReceiptId,
  };
}

function buildDocumentPlainText(document = null) {
  if (!document) return "";
  const blockText = Array.isArray(document?.blocks)
    ? document.blocks.map((block) => block?.text || block?.plainText || "").join("\n\n")
    : "";

  return [
    document?.contentMarkdown || "",
    document?.rawMarkdown || "",
    blockText,
    document?.excerpt || "",
  ]
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function getConfirmationCounts(document = null) {
  const blocks = Array.isArray(document?.blocks) ? document.blocks : [];
  return blocks.reduce(
    (accumulator, block) => {
      const status = String(block?.confirmationStatus || "").trim().toLowerCase();
      if (status === ASSEMBLY_CONFIRMATION_STATUSES.confirmed) {
        accumulator.confirmed += 1;
      }
      if (status === ASSEMBLY_CONFIRMATION_STATUSES.discarded) {
        accumulator.discarded += 1;
      }
      return accumulator;
    },
    { confirmed: 0, discarded: 0 },
  );
}

function getSeedSourceDocumentKeys(seedDocument = null) {
  const keys = new Set();
  (Array.isArray(seedDocument?.blocks) ? seedDocument.blocks : []).forEach((block) => {
    const key = String(block?.sourceDocumentKey || "").trim();
    if (key) keys.add(key);
  });
  return keys;
}

function buildHistoryWitnessSummary(document = null) {
  const historyKind = detectHistoryWitnessKind({
    historyKind: document?.historyKind,
    title: document?.title,
    originalFilename: document?.originalFilename,
    relativePath: document?.relativePath,
    rawText: buildDocumentPlainText(document),
  });

  if (!historyKind) return null;

  const normalized = normalizeHistoryExportEntries({
    historyKind,
    rawText: buildDocumentPlainText(document),
  });

  return {
    historyKind,
    platform: normalized.platform || "",
    entryCount: Array.isArray(normalized.entries) ? normalized.entries.length : 0,
    definition: normalized.definition,
  };
}

function getLaneEvidenceBasis(document = null, historyWitness = null) {
  if (historyWitness) {
    return {
      value: "corroborating-history",
      label: "Corroborating history",
    };
  }

  if (document?.derivationKind || (Array.isArray(document?.sourceAssets) && document.sourceAssets.length)) {
    return {
      value: "derived-witness",
      label: "Derived witness",
    };
  }

  return {
    value: "direct-evidence",
    label: "Direct evidence",
  };
}

function buildLaneSourceRefs(document = null) {
  if (!document?.documentKey) return [];
  return [
    {
      documentKey: document.documentKey,
      title: cleanDisplayTitle(document.title),
    },
  ];
}

function buildLaneStageStatus({
  historyWitness = null,
  advancedBlockCount = 0,
  confirmedBlockCount = 0,
  sealed = false,
} = {}) {
  if (sealed) return "sealed";
  if (advancedBlockCount > 0) return "advanced";
  if (confirmedBlockCount > 0 || historyWitness) return "staged";
  return "selected";
}

function buildLaneProofStatus({ stageStatus = "selected", confirmedBlockCount = 0, sealed = false } = {}) {
  if (sealed) return "sealed";
  if (stageStatus === "advanced" || confirmedBlockCount > 0) return "supported";
  if (stageStatus === "staged") return "witness";
  return "open";
}

function buildLaneEventEntry(event = null, index = 0, documentsByKey = new Map()) {
  const type = String(event?.type || "").trim().toLowerCase();
  if (!type) return null;

  const context = getEventContext(event);
  const documentKey = String(context?.documentKey || context?.primaryDocumentKey || "").trim();
  const relatedSourceDocumentKeys = [
    ...new Set(
      (Array.isArray(context?.relatedSourceDocumentKeys) ? context.relatedSourceDocumentKeys : [])
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  ];
  const relatedDocument = documentKey ? documentsByKey.get(documentKey) : null;
  const receiptId = String(context?.receiptId || context?.draftId || "").trim();
  const nextState = String(context?.to || "").trim().toLowerCase();

  const base = {
    id: `event-${type}-${event?.at || index}`,
    kind: "move",
    kindLabel: LANE_KIND_LABELS.move,
    title: "Assembly move",
    detail:
      event?.detail?.move ||
      event?.detail?.return ||
      event?.detail?.echo ||
      "The box recorded an assembly event.",
    occurredAt: event?.at || null,
    orderKind: getTimestamp(event?.at) ? "explicit" : "inferred",
    stageStatus: "selected",
    proofStatus: "open",
    evidenceBasis: "assembly-event",
    evidenceBasisLabel: "Assembly event",
    trustSummary: event?.detail?.return || "",
    linkedReceiptId: receiptId,
    linkedSourceKeys: relatedSourceDocumentKeys,
    linkedSeedDocumentKey: "",
    sourceRefs: documentKey && relatedDocument
      ? [
          {
            documentKey,
            title: cleanDisplayTitle(relatedDocument.title),
          },
        ]
      : [],
    isLeadingEdge: false,
    documentKey,
    actionKind: documentKey
      ? relatedDocument && isAssemblyDocument(relatedDocument)
        ? "seed"
        : "source"
      : receiptId
        ? "receipt"
        : "",
    certaintyKind: "event_backed",
    canInspectEvidence: false,
    nextAction: documentKey
      ? {
          kind: "open-related",
          label: relatedDocument && isAssemblyDocument(relatedDocument) ? "Open seed" : "Open source",
        }
      : receiptId
        ? {
            kind: "open-receipt",
            label: "Open receipts",
          }
        : null,
  };

  if (type === "source_added") {
    return finalizeLaneEntry({
      ...base,
      groupId: "origin",
      title: relatedDocument?.title ? `Source added · ${relatedDocument.title}` : "Source added",
    });
  }

  if (type === "source_derived") {
    return finalizeLaneEntry({
      ...base,
      groupId: "origin",
      title: relatedDocument?.title ? `Source derived · ${relatedDocument.title}` : "Source derived",
    });
  }

  if (type === "history_export_imported") {
    return finalizeLaneEntry({
      ...base,
      groupId: "origin",
      title: relatedDocument?.title ? `History imported · ${relatedDocument.title}` : "History imported",
      stageStatus: "staged",
      proofStatus: "witness",
      actionKind: "history",
      nextAction: {
        kind: "open-history",
        label: "Open witness",
      },
    });
  }

  if (type === "assembly_move") {
    const pivotFrom = String(context?.pivotFrom || "").trim().toLowerCase();
    const pivotTo = String(context?.pivotTo || "").trim().toLowerCase();
    const pivotPair =
      pivotFrom && pivotTo ? `${pivotFrom} -> ${pivotTo}` : String(context?.pivotPair || "").trim();

    return finalizeLaneEntry({
      ...base,
      groupId: String(context?.groupId || "assembly").trim().toLowerCase() || "assembly",
      title: String(context?.title || event?.detail?.move || "Assembly move").trim(),
      detail: event?.detail?.move || base.detail,
      stageStatus: String(context?.stageStatus || "advanced").trim().toLowerCase() || "advanced",
      proofStatus: String(context?.proofStatus || "open").trim().toLowerCase() || "open",
      linkedSeedDocumentKey:
        String(context?.linkedSeedDocumentKey || "").trim() || base.linkedSeedDocumentKey,
      actionKind: documentKey
        ? relatedDocument && isAssemblyDocument(relatedDocument)
          ? "seed"
          : "source"
        : receiptId
          ? "receipt"
          : base.actionKind,
      nextAction: documentKey
        ? {
            kind: relatedDocument && isAssemblyDocument(relatedDocument) ? "open-seed" : "open-source",
            label: relatedDocument && isAssemblyDocument(relatedDocument) ? "Open seed" : "Open source",
          }
        : receiptId
          ? {
              kind: "open-receipt",
              label: "Open receipts",
            }
          : base.nextAction,
      isLakinMoment: Boolean(context?.isLakinMoment),
      pivotPair,
      fromTerm: pivotFrom,
      toTerm: pivotTo,
      lakinSummary: String(context?.lakinSummary || "").trim(),
      lakinSource: context?.isLakinMoment ? "curated" : "",
    });
  }

  if (type === "seed_created" || type === "seed_updated") {
    return finalizeLaneEntry({
      ...base,
      groupId: "assembly",
      title: type === "seed_created" ? "Seed created" : "Seed updated",
      stageStatus: "advanced",
      linkedSeedDocumentKey: documentKey,
      nextAction: {
        kind: "open-seed",
        label: "Open seed",
      },
      actionKind: "seed",
    });
  }

  if (type === "operate_ran") {
    return finalizeLaneEntry({
      ...base,
      groupId: "assembly",
      title: "Operate ran",
      stageStatus: "advanced",
      proofStatus: "witness",
      detail: event?.detail?.return || base.detail,
      actionKind: documentKey
        ? relatedDocument && isAssemblyDocument(relatedDocument)
          ? "seed"
          : "source"
        : base.actionKind,
      nextAction: documentKey
        ? {
            kind: relatedDocument && isAssemblyDocument(relatedDocument) ? "open-seed" : "open-source",
            label: relatedDocument && isAssemblyDocument(relatedDocument) ? "Open seed" : "Open source",
          }
        : base.nextAction,
    });
  }

  if (type === "block_confirmed" || type === "block_discarded") {
    return finalizeLaneEntry({
      ...base,
      groupId: "assembly",
      title: type === "block_confirmed" ? "Block confirmed" : "Block discarded",
      stageStatus: "staged",
      proofStatus: "witness",
      canInspectEvidence: documentKey ? true : false,
      nextAction: documentKey
        ? {
            kind: "inspect-evidence",
            label: "Inspect evidence",
          }
        : base.nextAction,
    });
  }

  if (type === "receipt_drafted") {
    return finalizeLaneEntry({
      ...base,
      groupId: "proof",
      title: "Receipt drafted",
      stageStatus: "advanced",
      proofStatus: "witness",
      actionKind: "receipt",
      nextAction: {
        kind: "open-receipts",
        label: "Open receipts",
      },
    });
  }

  if (type === "receipt_sealed") {
    return finalizeLaneEntry({
      ...base,
      groupId: "proof",
      title: "Receipt sealed",
      stageStatus: "sealed",
      proofStatus: "sealed",
      actionKind: "receipt",
      nextAction: {
        kind: "open-receipts",
        label: "Open receipts",
      },
    });
  }

  if (type === "state_advanced") {
    return finalizeLaneEntry({
      ...base,
      groupId: "assembly",
      title: nextState ? `Assembly moved to ${nextState}` : "Assembly moved",
      stageStatus:
        nextState === "sealed" || nextState === "released" ? "sealed" : "advanced",
      proofStatus:
        nextState === "sealed" || nextState === "released" ? "sealed" : "witness",
    });
  }

  return null;
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

function normalizeRemoteSealStatus(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (
    normalized === "pending_create" ||
    normalized === "pending_seal" ||
    normalized === "sealed" ||
    normalized === "failed"
  ) {
    return normalized;
  }
  return "";
}

function formatRemoteSealLevel(value = "") {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return normalized.toLowerCase().startsWith("l") ? normalized.toUpperCase() : `L${normalized}`;
}

function getDraftRemoteSeal(draft = null) {
  return draft?.payload?.remoteSeal && typeof draft.payload.remoteSeal === "object"
    ? draft.payload.remoteSeal
    : null;
}

function buildCourthouseStatusViewModel(
  draft = null,
  connectionStatus = "DISCONNECTED",
  connectionLastError = "",
) {
  const normalizedConnectionStatus = String(connectionStatus || "DISCONNECTED")
    .trim()
    .toUpperCase();
  const remoteSeal = getDraftRemoteSeal(draft);
  const remoteStatus = normalizeRemoteSealStatus(remoteSeal?.status);
  const remoteLevel = formatRemoteSealLevel(remoteSeal?.level);
  const verifyUrl = String(remoteSeal?.verifyUrl || "").trim();
  const errorMessage =
    String(remoteSeal?.lastError || draft?.payload?.remoteError || connectionLastError || "").trim() ||
    "";
  const isSealed = String(draft?.status || "").trim().toUpperCase() === "SEALED";
  const hasRemoteDraft = Boolean(
    draft?.getReceiptsReceiptId || draft?.payload?.remoteReceipt?.id || remoteSeal?.receiptId,
  );

  if (remoteStatus === "sealed") {
    return {
      line: `Verified${remoteLevel ? ` · ${remoteLevel}` : ""}`,
      detail: verifyUrl
        ? "Courthouse seal is live."
        : "Courthouse seal is live.",
      tone: "success",
      action: verifyUrl
        ? {
            kind: "verify",
            label: "Verify",
            href: verifyUrl,
          }
        : null,
      remoteStatus,
      verifyUrl,
      remoteLevel,
      canRetry: false,
      isPending: false,
      hasError: false,
    };
  }

  if (isSealed) {
    if (remoteStatus === "failed" || errorMessage) {
      return {
        line: "Courthouse failed · Retry",
        detail: "Local seal held. Retry the courthouse step.",
        tone: "error",
        action:
          normalizedConnectionStatus === "CONNECTED"
            ? { kind: "retry", label: "Retry sync" }
            : { kind: "connect", label: "Reconnect" },
        remoteStatus: remoteStatus || "failed",
        verifyUrl: "",
        remoteLevel: "",
        canRetry: normalizedConnectionStatus === "CONNECTED",
        isPending: false,
        hasError: true,
      };
    }

    if (
      remoteStatus === "pending_create" ||
      remoteStatus === "pending_seal" ||
      (normalizedConnectionStatus === "CONNECTED" && hasRemoteDraft)
    ) {
      return {
        line: "Pending courthouse",
        detail:
          normalizedConnectionStatus === "CONNECTED"
            ? "Local seal held. Courthouse step is waiting."
            : "Reconnect to finish the courthouse step.",
        tone: "warning",
        action:
          normalizedConnectionStatus === "CONNECTED"
            ? { kind: "retry", label: "Retry sync" }
            : { kind: "connect", label: "Connect GetReceipts" },
        remoteStatus: remoteStatus || "pending_seal",
        verifyUrl: "",
        remoteLevel: "",
        canRetry: normalizedConnectionStatus === "CONNECTED",
        isPending: true,
        hasError: false,
      };
    }

    return {
      line: "Local only",
      detail:
        normalizedConnectionStatus === "CONNECTED"
          ? "Local seal held. Retry for courthouse proof."
          : "Local proof holds here.",
      tone: "",
      action:
        normalizedConnectionStatus === "CONNECTED"
          ? { kind: "retry", label: "Retry sync" }
          : { kind: "connect", label: "Connect GetReceipts" },
      remoteStatus: "",
      verifyUrl: "",
      remoteLevel: "",
      canRetry: normalizedConnectionStatus === "CONNECTED",
      isPending: false,
      hasError: false,
    };
  }

  if (errorMessage) {
    return {
      line: "Courthouse failed · Retry",
      detail: "Local draft held. Retry the courthouse step.",
      tone: "error",
      action:
        normalizedConnectionStatus === "CONNECTED"
          ? { kind: "retry", label: "Retry sync" }
          : { kind: "connect", label: "Reconnect" },
      remoteStatus: remoteStatus || "failed",
      verifyUrl: "",
      remoteLevel: "",
      canRetry: normalizedConnectionStatus === "CONNECTED",
      isPending: false,
      hasError: true,
    };
  }

  if (normalizedConnectionStatus === "CONNECTED") {
    return {
      line: "GetReceipts connected",
      detail: "Courthouse ready.",
      tone: "",
      action: null,
      remoteStatus,
      verifyUrl,
      remoteLevel,
      canRetry: false,
      isPending: false,
      hasError: false,
    };
  }

  return {
    line: "Local only",
    detail: "Local proof holds here.",
    tone: "",
    action: { kind: "connect", label: "Connect GetReceipts" },
    remoteStatus,
    verifyUrl,
    remoteLevel,
    canRetry: false,
    isPending: false,
    hasError: false,
  };
}

export function buildRootViewModel(activeProject = null) {
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

export function normalizeBoxPhase(value, fallback = BOX_PHASES.lane) {
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
  const courthouseStatus = buildCourthouseStatusViewModel(
    latestDraft,
    normalizedConnectionStatus,
    connectionLastError,
  );

  let syncLine = "Local proof. Portable when sealed.";
  if (courthouseStatus?.detail) {
    syncLine = courthouseStatus.detail;
  } else if (normalizedConnectionStatus !== "CONNECTED") {
    syncLine = "Local proof. Connect when ready.";
  } else if (latestRemoteError) {
    syncLine = "Local seal held. Courthouse failed.";
  } else if (latestDraftStatus === "REMOTE_DRAFT") {
    syncLine = "Courthouse draft ready.";
  } else if (drafts.length > 0) {
    syncLine = "Local proof. Pending courthouse.";
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
    courthouseStatusLine: courthouseStatus.line,
    courthouseStatusDetail: courthouseStatus.detail,
    courthouseStatusTone: courthouseStatus.tone,
    courthouseAction: courthouseStatus.action,
    latestVerifyUrl: courthouseStatus.verifyUrl,
    latestRemoteLevel: courthouseStatus.remoteLevel,
    latestRemoteSealStatus: courthouseStatus.remoteStatus,
    latestCanRetryRemoteSync: courthouseStatus.canRetry,
    connectionStatus: normalizedConnectionStatus,
    connectionStatusLabel: formatConnectionStatus(normalizedConnectionStatus),
    syncLine,
    recentDrafts: drafts.slice(0, 4).map((draft) => {
      const draftCourthouseStatus = buildCourthouseStatusViewModel(
        draft,
        normalizedConnectionStatus,
        connectionLastError,
      );

      return {
        ...draft,
        statusLabel: formatReceiptStatus(draft?.status),
        mode: String(draft?.payload?.mode || "").trim().toLowerCase(),
        courthouseStatusLine: draftCourthouseStatus.line,
        courthouseStatusTone: draftCourthouseStatus.tone,
        courthouseAction: draftCourthouseStatus.action,
        verifyUrl: draftCourthouseStatus.verifyUrl,
        remoteLevel: draftCourthouseStatus.remoteLevel,
        remoteSealStatus: draftCourthouseStatus.remoteStatus,
        canRetryRemoteSync: draftCourthouseStatus.canRetry,
      };
    }),
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
          detail: "Current working position.",
        }
      : latestTouchedSource
        ? {
            kind: "source",
            actionLabel: "Open source",
            documentKey: latestTouchedSource.documentKey || "",
            mode: "listen",
            phase: BOX_PHASES.think,
            title: latestTouchedSource.title,
            detail: `${latestTouchedSource.metaLine} · Latest source`,
          }
        : {
            kind: "empty",
            actionLabel: "Add source",
            documentKey: "",
            mode: "listen",
            phase: BOX_PHASES.think,
            title: guideSource?.title || "Add the first real source",
            detail: "Add a source. Shape the seed.",
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

export function buildBoxAssemblyLaneViewModel({
  activeProject = null,
  projectDocuments = [],
  currentAssemblyDocument = null,
  projectDrafts = [],
  resumeSessionSummary = null,
  connectionStatus = "DISCONNECTED",
  connectionLastError = "",
} = {}) {
  const documents = Array.isArray(projectDocuments) ? projectDocuments.filter(Boolean) : [];
  const documentsByKey = new Map(
    documents.map((document) => [document.documentKey, document]),
  );
  const realSourceDocuments = documents.filter(isRealSourceDocument);
  const seedDocument = currentAssemblyDocument || getMostRecentItem(documents.filter(isAssemblyDocument));
  const seedSections = getSeedSectionsFromDocument(seedDocument);
  const seedSourceDocumentKeys = getSeedSourceDocumentKeys(seedDocument);
  const earliestDocument =
    [...documents]
      .sort(
        (left, right) =>
          getTimestamp(left?.createdAt || left?.updatedAt) -
          getTimestamp(right?.createdAt || right?.updatedAt),
      )[0] || null;
  const receiptSummary = buildReceiptSummaryViewModel(projectDrafts, {
    connectionStatus,
    connectionLastError,
  });
  const root = buildRootViewModel(activeProject);
  const baseWordLayer = buildBoxWordLayerViewModel({
    activeProject,
    projectDocuments: documents,
    currentAssemblyDocument: seedDocument,
    projectDrafts,
  });
  const stateSummary = buildAssemblyStateSummary({
    project: activeProject,
    projectDocuments: documents,
    projectDrafts,
  });
  const protocolPosition = getProtocolPosition({
    hasLiveSeed: Boolean(seedDocument?.documentKey),
    draftCount: receiptSummary.draftCount,
  });
  const contextualAction = buildLaneContextualAction({
    realSourceCount: realSourceDocuments.length,
    hasLiveSeed: Boolean(seedDocument?.documentKey),
    latestDraft: receiptSummary.latestDraft,
    draftCount: receiptSummary.draftCount,
  });
  const meta = normalizeProjectArchitectureMeta(
    activeProject?.metadataJson || activeProject?.architectureMeta || null,
  );
  const confirmationQueue = listConfirmationQueueItems(documents, root);
  const confirmationQueueByDocumentKey = confirmationQueue.reduce((accumulator, item) => {
    const documentKey = String(item?.documentKey || "").trim();
    if (!documentKey) return accumulator;
    const queue = accumulator.get(documentKey) || [];
    queue.push(item);
    accumulator.set(documentKey, queue);
    return accumulator;
  }, new Map());
  const eventIndex = buildAssemblyEventIndex(meta.assemblyIndexMeta.events);
  const rootDeclaredEvent = (eventIndex.byType.get("root_declared") || []).slice(-1)[0] || null;

  const rootEntry = root?.hasRoot
    ? finalizeLaneEntry({
        id: "lane-root",
        kind: "root",
        kindLabel: LANE_KIND_LABELS.root,
        title: root.text || "Root declared",
        detail: root.gloss || "The box has a declared line to return to.",
        occurredAt:
          rootDeclaredEvent?.at ||
          root.createdAt ||
          earliestDocument?.createdAt ||
          earliestDocument?.updatedAt ||
          activeProject?.createdAt ||
          meta.assemblyState?.updatedAt ||
          null,
        orderKind: getTimestamp(
          root.createdAt ||
            earliestDocument?.createdAt ||
            earliestDocument?.updatedAt ||
            activeProject?.createdAt ||
            meta.assemblyState?.updatedAt,
        )
          ? "explicit"
          : "inferred",
        stageStatus: "staged",
        proofStatus: "witness",
        evidenceBasis: "declared-origin",
        evidenceBasisLabel: "Declared origin",
        trustSummary: root.gloss || "Declared by the operator.",
        linkedReceiptId: "",
        linkedEntryIds: [],
        linkedSourceKeys: [],
        linkedSeedDocumentKey: "",
        sourceRefs: [],
        isLeadingEdge: false,
        documentKey: "",
        actionKind: "root",
        certaintyKind: rootDeclaredEvent ? "event_backed" : "inferred",
        nextAction: {
          kind: "open-root",
          label: "Open root",
        },
      })
    : null;

  const receiptEntries = (receiptSummary?.recentDrafts || []).map((draft) => {
    const sealed = String(draft?.status || "").trim().toUpperCase() === "SEALED";
    const receiptEvents = eventIndex.byReceiptId.get(String(draft?.id || "").trim()) || [];
    const certaintyKind = receiptEvents.length > 0 ? "event_backed" : "inferred";
    const linkedSourceKeys = [
      ...new Set(
        [
          ...(Array.isArray(draft?.sourceSections) ? draft.sourceSections : []),
          ...(Array.isArray(draft?.payload?.evidenceSnapshot?.sourceDocumentKeys)
            ? draft.payload.evidenceSnapshot.sourceDocumentKeys
            : []),
        ]
          .map((value) => String(value || "").trim())
          .filter(Boolean),
      ),
    ];
    const detail =
      draft?.courthouseStatusLine ||
      draft?.courthouseStatusDetail ||
      draft?.statusLabel ||
      "Receipt draft held locally.";

    return finalizeLaneEntry({
      id: `lane-receipt-${draft.id || draft.documentKey || detail}`,
      kind: "receipt",
      kindLabel: LANE_KIND_LABELS.receipt,
      title: draft?.title || "Receipt draft",
      detail,
      occurredAt: draft?.updatedAt || draft?.createdAt || null,
      orderKind: getTimestamp(draft?.updatedAt || draft?.createdAt) ? "explicit" : "inferred",
      stageStatus: sealed ? "sealed" : "advanced",
      proofStatus: sealed ? "sealed" : certaintyKind === "event_backed" ? "witness" : "open",
      evidenceBasis: sealed ? "proof-closure" : "proof-draft",
      evidenceBasisLabel: sealed ? "Proof closure" : "Proof draft",
      trustSummary: draft?.verifyUrl ? "Courthouse verification is attached." : "Proof is held in the box.",
      linkedReceiptId: String(draft?.id || "").trim(),
      linkedSourceKeys,
      linkedSeedDocumentKey:
        seedDocument?.documentKey && draft?.documentKey === seedDocument.documentKey
          ? seedDocument.documentKey
          : "",
      sourceRefs: draft?.documentKey
        ? [
            {
              documentKey: draft.documentKey,
              title: draft.title || "Receipt document",
            },
          ]
        : [],
      isLeadingEdge: false,
      documentKey: String(draft?.documentKey || "").trim(),
      actionKind: "receipt",
      certaintyKind,
      nextAction: {
        kind: "open-receipts",
        label: "Open receipts",
      },
    });
  });

  const sourceEntries = realSourceDocuments.map((document) => {
    const sourceSummary = buildSourceSummaryViewModel(document);
    const historyWitness = buildHistoryWitnessSummary(document);
    const documentEvents = eventIndex.byDocumentKey.get(document.documentKey) || [];
    const confirmationCounts = getConfirmationCounts(document);
    const advancedBlockCount = seedSourceDocumentKeys.has(document.documentKey)
      ? (Array.isArray(seedDocument?.blocks) ? seedDocument.blocks : []).filter(
          (block) => block?.sourceDocumentKey === document.documentKey,
        ).length
      : 0;
    const certaintyKind = documentEvents.some((event) =>
      ["source_added", "source_derived", "history_export_imported", "block_confirmed", "block_discarded"].includes(
        String(event?.type || "").trim().toLowerCase(),
      ),
    )
      ? "event_backed"
      : "inferred";
    const stageStatus = buildLaneStageStatus({
      historyWitness,
      advancedBlockCount,
      confirmedBlockCount: confirmationCounts.confirmed,
    });
    const proofStatus = buildLaneProofStatus({
      stageStatus,
      confirmedBlockCount: confirmationCounts.confirmed,
    });
    const evidenceBasis = getLaneEvidenceBasis(document, historyWitness);
    const kind =
      historyWitness
        ? "history-export"
        : document?.derivationKind || (Array.isArray(document?.sourceAssets) && document.sourceAssets.length)
          ? "derived-source"
          : "source";
    const detail = historyWitness
      ? historyWitness.entryCount > 0
        ? `${historyWitness.entryCount} normalized ${
            historyWitness.entryCount === 1 ? "entry" : "entries"
          } support chronology for this box.`
        : "Imported chronology witness ready for normalization."
      : sourceSummary?.metaLine ||
        `${document.sectionCount || document.blocks?.length || 0} block${
          (document.sectionCount || document.blocks?.length || 0) === 1 ? "" : "s"
        }`;

    return finalizeLaneEntry({
      id: `lane-source-${document.documentKey}`,
      kind,
      kindLabel: LANE_KIND_LABELS[kind] || LANE_KIND_LABELS.source,
      title: cleanDisplayTitle(document.title),
      detail,
      occurredAt: document.createdAt || document.updatedAt || null,
      orderKind: getTimestamp(document.createdAt || document.updatedAt) ? "explicit" : "inferred",
      stageStatus,
      proofStatus,
      evidenceBasis: evidenceBasis.value,
      evidenceBasisLabel: evidenceBasis.label,
      trustSummary:
        sourceSummary?.trustProfile?.summary ||
        sourceSummary?.provenance?.sourceLabel ||
        historyWitness?.definition?.description ||
        "",
      linkedReceiptId: "",
      linkedEntryIds: [],
      linkedSourceKeys: [document.documentKey],
      linkedSeedDocumentKey: seedSourceDocumentKeys.has(document.documentKey)
        ? seedDocument?.documentKey || ""
        : "",
      sourceRefs: buildLaneSourceRefs(document),
      isLeadingEdge: false,
      documentKey: document.documentKey,
      actionKind: historyWitness ? "history" : "source",
      certaintyKind,
      canInspectEvidence: (confirmationQueueByDocumentKey.get(document.documentKey) || []).length > 0,
      nextAction:
        (confirmationQueueByDocumentKey.get(document.documentKey) || []).length > 0
          ? {
              kind: "inspect-evidence",
              label: "Inspect evidence",
            }
          : {
              kind: historyWitness ? "open-witness" : "open-source",
              label: historyWitness ? "Open witness" : "Open source",
            },
      historyEntryCount: historyWitness?.entryCount || 0,
    });
  });

  const moveEntries = meta.assemblyIndexMeta.events
    .map((event, index) => buildLaneEventEntry(event, index, documentsByKey))
    .filter(Boolean);

  const seedEvents = seedDocument?.documentKey
    ? eventIndex.byDocumentKey.get(seedDocument.documentKey) || []
    : [];
  const linkedSeedReceipt =
    receiptEntries.find((entry) => entry.documentKey === seedDocument?.documentKey) || null;
  const seedEntry = seedDocument
    ? finalizeLaneEntry({
        id: `lane-seed-${seedDocument.documentKey}`,
        kind: "seed",
        kindLabel: LANE_KIND_LABELS.seed,
        title: seedDocument.title || "Current seed",
        detail:
          seedSections.length > 0
            ? `${seedSections.length} seed section${seedSections.length === 1 ? "" : "s"} shape the current live edge.`
            : "Current live assembly shape.",
        occurredAt: seedDocument.updatedAt || seedDocument.createdAt || null,
        orderKind: getTimestamp(seedDocument.updatedAt || seedDocument.createdAt) ? "explicit" : "inferred",
        stageStatus: "advanced",
        proofStatus:
          String(linkedSeedReceipt?.stageStatus || "").trim().toLowerCase() === "sealed"
            ? "supported"
            : seedSourceDocumentKeys.size > 0
              ? "witness"
              : "open",
        evidenceBasis: "live-assembly",
        evidenceBasisLabel: "Live assembly",
        trustSummary:
          `${seedSourceDocumentKeys.size} source${
            seedSourceDocumentKeys.size === 1 ? "" : "s"
          } are currently carried by the seed.`,
        linkedReceiptId: linkedSeedReceipt?.linkedReceiptId || "",
        linkedEntryIds: [],
        linkedSourceKeys: [...seedSourceDocumentKeys],
        linkedSeedDocumentKey: seedDocument.documentKey,
        sourceRefs: [
          {
            documentKey: seedDocument.documentKey,
            title: seedDocument.title || "Current seed",
          },
        ],
        isLeadingEdge: true,
        documentKey: seedDocument.documentKey,
        actionKind: "seed",
        certaintyKind: seedEvents.some((event) =>
          ["seed_created", "seed_updated"].includes(String(event?.type || "").trim().toLowerCase()),
        )
          ? "event_backed"
          : "inferred",
        nextAction: {
          kind: "open-seed",
          label: "Open seed",
        },
      })
    : null;

  const rawEntries = [rootEntry, ...sourceEntries, ...moveEntries, seedEntry, ...receiptEntries]
    .filter(Boolean);

  const entryIdByDocumentKey = new Map();
  rawEntries.forEach((entry) => {
    if (!entry?.documentKey) return;
    const current = entryIdByDocumentKey.get(entry.documentKey) || [];
    current.push(entry.id);
    entryIdByDocumentKey.set(entry.documentKey, current);
  });
  const entryIdByReceiptId = new Map(
    receiptEntries
      .filter((entry) => entry?.linkedReceiptId)
      .map((entry) => [entry.linkedReceiptId, entry.id]),
  );

  const sortedEntries = rawEntries
    .map((entry) =>
      finalizeLaneEntry({
        ...entry,
        linkedEntryIds: [
          ...(Array.isArray(entry?.linkedEntryIds) ? entry.linkedEntryIds : []),
          ...(entry?.linkedSeedDocumentKey
            ? entryIdByDocumentKey.get(entry.linkedSeedDocumentKey) || []
            : []),
          ...(Array.isArray(entry?.linkedSourceKeys)
            ? entry.linkedSourceKeys.flatMap((key) => entryIdByDocumentKey.get(key) || [])
            : []),
          ...(entry?.linkedReceiptId && entryIdByReceiptId.has(entry.linkedReceiptId)
            ? [entryIdByReceiptId.get(entry.linkedReceiptId)]
            : []),
          ...(entry?.documentKey && entry.kind === "move"
            ? entryIdByDocumentKey.get(entry.documentKey) || []
            : []),
        ].filter((linkedEntryId) => linkedEntryId && linkedEntryId !== entry.id),
      }),
    )
    .map((entry, index) => ({
      ...entry,
      sortTimestamp: getTimestamp(entry.occurredAt),
      sortHasTimestamp: Boolean(getTimestamp(entry.occurredAt)),
      sortGroupWeight: LANE_GROUP_ORDER[entry.groupId] ?? 999,
      sortRoleWeight: getLaneRoleWeight(entry.kind),
      sortIndex: index,
    }))
    .sort((left, right) => {
      if (left.sortGroupWeight !== right.sortGroupWeight) {
        return left.sortGroupWeight - right.sortGroupWeight;
      }
      if (left.sortHasTimestamp && right.sortHasTimestamp && left.sortTimestamp !== right.sortTimestamp) {
        return left.sortTimestamp - right.sortTimestamp;
      }
      if (left.sortRoleWeight !== right.sortRoleWeight) {
        return left.sortRoleWeight - right.sortRoleWeight;
      }
      if (left.sortHasTimestamp !== right.sortHasTimestamp) {
        return left.sortHasTimestamp ? -1 : 1;
      }
      if (left.sortHasTimestamp && right.sortHasTimestamp && left.sortTimestamp !== right.sortTimestamp) {
        return left.sortTimestamp - right.sortTimestamp;
      }
      return left.sortIndex - right.sortIndex;
    })
    .map(
      ({
        sortTimestamp: _sortTimestamp,
        sortHasTimestamp: _sortHasTimestamp,
        sortGroupWeight: _sortGroupWeight,
        sortRoleWeight: _sortRoleWeight,
        sortIndex: _sortIndex,
        ...entry
      }) => entry,
    );

  const lakinAnnotation = annotateWordLayerWithLakinMoments({
    wordLayer: baseWordLayer,
    laneEntries: sortedEntries,
  });
  const entries = Array.isArray(lakinAnnotation?.laneEntries)
    ? lakinAnnotation.laneEntries
    : sortedEntries;
  const wordLayer = lakinAnnotation?.wordLayer || baseWordLayer;

  const moveGroups = ["origin", "assembly", "proof"]
    .map((groupId) => ({
      id: groupId,
      label: LANE_GROUP_LABELS[groupId],
      entries: entries.filter((entry) => entry.groupId === groupId),
    }))
    .filter((group) => group.entries.length > 0);

  const liveEdge =
    (seedEntry && entries.find((entry) => entry.id === seedEntry.id)) ||
    entries[entries.length - 1] ||
    null;
  const recentWitnessCount = sourceEntries.filter((entry) => entry.kind === "history-export").length;
  const resumeTarget =
    resumeSessionSummary?.documentKey || liveEdge?.documentKey
      ? {
          documentKey: resumeSessionSummary?.documentKey || liveEdge?.documentKey || "",
          mode: resumeSessionSummary?.documentKey ? "listen" : liveEdge?.kind === "seed" ? "assemble" : "assemble",
          phase: resumeSessionSummary?.documentKey
            ? BOX_PHASES.think
            : liveEdge?.kind === "seed"
              ? BOX_PHASES.create
              : BOX_PHASES.think,
          label: resumeSessionSummary?.documentKey ? "Resume" : liveEdge?.actionLabel || "Open",
          title: resumeSessionSummary?.title || liveEdge?.title || "Current position",
          detail: resumeSessionSummary?.blockPosition && resumeSessionSummary?.totalBlocks
            ? `Block ${resumeSessionSummary.blockPosition} of ${resumeSessionSummary.totalBlocks}`
            : liveEdge?.detail || "Current box position.",
        }
      : null;

  return {
    boxTitle: activeProject?.boxTitle || activeProject?.title || "Untitled Box",
    boxSubtitle: activeProject?.boxSubtitle || activeProject?.subtitle || "",
    introLine: String(meta?.system?.introLine || "").trim(),
    wordLayerDefaultExpanded: Boolean(activeProject?.isSystemExample),
    entryCount: entries.length,
    realSourceCount: realSourceDocuments.length,
    recentWitnessCount,
    confirmationCount: confirmationQueue.length,
    root,
    stateSummary,
    protocolPosition,
    protocolStateLabel: stateSummary?.chipLabel || "",
    contextualAction,
    receiptSummary,
    liveEdge,
    resumeTarget,
    confirmationQueue,
    entries,
    moveGroups,
    wordLayer,
    proofSummary: {
      line: receiptSummary?.courthouseStatusLine || "Local proof only",
      detail:
        receiptSummary?.courthouseStatusDetail ||
        receiptSummary?.syncLine ||
        "Proof closes moves when the box can carry it.",
      sealedCount: receiptSummary?.sealedDraftCount || 0,
    },
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
    desktopInitialSurface: isFirstTime ? "first-time" : "lane",
    mobileInitialSurface: resumeDocumentKey ? "listen" : "lane",
  };
}

export function buildControlSurfaceViewModel({
  activeProject = null,
  currentAssemblyDocument = null,
  projectDocuments = [],
  projectDrafts = [],
  boxPhase = BOX_PHASES.lane,
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
    currentSurfaceLabel:
      boxPhase === BOX_PHASES.lane
        ? "Assembly lane"
        : boxPhase === BOX_PHASES.create
          ? "Seed"
          : boxPhase === BOX_PHASES.operate
            ? "Operate"
            : boxPhase === BOX_PHASES.receipts
              ? "Receipts"
              : "Source",
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
      boxPhase === BOX_PHASES.lane
        ? "Add source"
        : boxPhase === BOX_PHASES.create
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
