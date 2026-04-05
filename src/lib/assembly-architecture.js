export const ASSEMBLY_PRIMARY_TAGS = Object.freeze({
  aim: "aim",
  evidence: "evidence",
  story: "story",
  unconfirmed: "unconfirmed",
});

export const ASSEMBLY_CONFIRMATION_STATUSES = Object.freeze({
  unconfirmed: "unconfirmed",
  confirmed: "confirmed",
  discarded: "discarded",
});

export const ASSEMBLY_DOMAINS = Object.freeze([
  { key: "vision", label: "Vision" },
  { key: "financial", label: "Financial" },
  { key: "legal", label: "Legal" },
  { key: "people", label: "People" },
  { key: "physical", label: "Physical" },
  { key: "technical", label: "Technical" },
  { key: "temporal", label: "Temporal" },
  { key: "relational", label: "Relational" },
  { key: "risk", label: "Risk" },
  { key: "completion", label: "Completion" },
]);

export const ASSEMBLY_STATE_ORDER = Object.freeze([
  { key: "declare-root", label: "Declare Root" },
  { key: "rooted", label: "Rooted" },
  { key: "fertilized", label: "Fertilized" },
  { key: "sprouted", label: "Sprouted" },
  { key: "growing", label: "Growing" },
  { key: "structured", label: "Structured" },
  { key: "assembled", label: "Assembled" },
  { key: "sealed", label: "Sealed" },
  { key: "released", label: "Released" },
]);

export const SEVEN_STAGE_ORDER = Object.freeze([
  { step: 1, label: "Promise" },
  { step: 2, label: "Pattern" },
  { step: 3, label: "Test" },
  { step: 4, label: "Turn" },
  { step: 5, label: "Proof" },
  { step: 6, label: "Seal" },
  { step: 7, label: "Release" },
]);

const PRIMARY_TAG_SYMBOLS = Object.freeze({
  [ASSEMBLY_PRIMARY_TAGS.aim]: "△",
  [ASSEMBLY_PRIMARY_TAGS.evidence]: "◻",
  [ASSEMBLY_PRIMARY_TAGS.story]: "○",
  [ASSEMBLY_PRIMARY_TAGS.unconfirmed]: "⊘",
});

const ASSEMBLY_STATE_COLOR_STEP_MAP = Object.freeze({
  "declare-root": 0,
  rooted: 0,
  fertilized: 1,
  sprouted: 2,
  growing: 3,
  structured: 4,
  assembled: 5,
  sealed: 6,
  released: 7,
});

const DOMAIN_KEYWORDS = Object.freeze({
  financial: ["budget", "cost", "price", "invoice", "fund", "revenue", "payment", "money", "salary"],
  legal: ["contract", "permit", "legal", "law", "regulation", "license", "deed", "filed", "compliance"],
  people: ["hire", "team", "architect", "lawyer", "advisor", "friend", "partner", "customer", "stakeholder", "client"],
  physical: ["land", "site", "building", "material", "foundation", "farmhouse", "room", "space", "hardware", "object"],
  technical: ["software", "engineer", "api", "system", "code", "deploy", "server", "model", "tooling", "technical"],
  temporal: ["timeline", "deadline", "week", "month", "quarter", "schedule", "phase", "date", "milestone", "time"],
  relational: ["trust", "alignment", "communication", "meeting", "conversation", "agreement", "relationship"],
  risk: ["risk", "blocker", "issue", "uncertain", "concern", "mitigate", "failure", "problem"],
  completion: ["complete", "done", "finish", "seal", "released", "launched", "shipped", "moved in", "delivered"],
  vision: ["want", "feel", "look", "vision", "dream", "north star", "aim", "should"],
});

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function hasKeywordMatch(text, keywords = []) {
  return keywords.some((keyword) => text.includes(keyword));
}

function unique(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];
}

function normalizeAssemblyColorStepValue(value = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(7, Math.round(numeric)));
}

export function getAssemblyPrimaryTagSymbol(tag = ASSEMBLY_PRIMARY_TAGS.unconfirmed) {
  return PRIMARY_TAG_SYMBOLS[normalizeAssemblyPrimaryTag(tag)] || PRIMARY_TAG_SYMBOLS.unconfirmed;
}

export function getAssemblyPrimaryTagLabel(tag = ASSEMBLY_PRIMARY_TAGS.unconfirmed) {
  const normalized = normalizeAssemblyPrimaryTag(tag);
  if (normalized === ASSEMBLY_PRIMARY_TAGS.aim) return "Aim";
  if (normalized === ASSEMBLY_PRIMARY_TAGS.evidence) return "Evidence";
  if (normalized === ASSEMBLY_PRIMARY_TAGS.story) return "Story";
  return "Unconfirmed";
}

export function getAssemblyStateLabel(stateKey = "declare-root") {
  return (
    ASSEMBLY_STATE_ORDER.find((state) => state.key === stateKey)?.label ||
    ASSEMBLY_STATE_ORDER[0].label
  );
}

export function getSevenStageLabel(stage = null) {
  const normalized = normalizeAssemblyColorStepValue(stage);
  return SEVEN_STAGE_ORDER.find((entry) => entry.step === normalized)?.label || "";
}

export function getAssemblyStateColorStep(stateKey = "declare-root") {
  return ASSEMBLY_STATE_COLOR_STEP_MAP[String(stateKey || "").trim().toLowerCase()] ?? 0;
}

export function getGradientColorStep(gradient = null) {
  const numeric = Number(gradient);
  if (!Number.isFinite(numeric) || numeric < 1 || numeric > 7) {
    return { step: 0, isUnknown: true };
  }
  return { step: normalizeAssemblyColorStepValue(numeric), isUnknown: false };
}

export function getSevenStageColorStep(stage = null) {
  const numeric = Number(stage);
  if (!Number.isFinite(numeric) || numeric < 1 || numeric > 7) {
    return { step: 0, isUnknown: true };
  }
  return { step: normalizeAssemblyColorStepValue(numeric), isUnknown: false };
}

export function getAssemblyColorTokens(stepLike = 0) {
  const step =
    stepLike && typeof stepLike === "object" && "step" in stepLike
      ? normalizeAssemblyColorStepValue(stepLike.step)
      : normalizeAssemblyColorStepValue(stepLike);

  return {
    step,
    fill: `var(--assembly-step-${step})`,
    solid: `var(--assembly-step-${step})`,
    soft: `var(--assembly-step-${step}-soft)`,
    border: `var(--assembly-step-${step}-border)`,
    glow: `var(--assembly-step-${step}-glow)`,
    text: `var(--assembly-step-${step}-text)`,
  };
}

export function normalizeAssemblyPrimaryTag(value = "") {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === "△" || normalized === "aim") return ASSEMBLY_PRIMARY_TAGS.aim;
  if (normalized === "◻" || normalized === "evidence") return ASSEMBLY_PRIMARY_TAGS.evidence;
  if (normalized === "○" || normalized === "story") return ASSEMBLY_PRIMARY_TAGS.story;
  return ASSEMBLY_PRIMARY_TAGS.unconfirmed;
}

export function normalizeAssemblyConfirmationStatus(value = "") {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === ASSEMBLY_CONFIRMATION_STATUSES.confirmed) {
    return ASSEMBLY_CONFIRMATION_STATUSES.confirmed;
  }
  if (normalized === ASSEMBLY_CONFIRMATION_STATUSES.discarded) {
    return ASSEMBLY_CONFIRMATION_STATUSES.discarded;
  }
  return ASSEMBLY_CONFIRMATION_STATUSES.unconfirmed;
}

export function normalizeAssemblyDomain(value = "") {
  const normalized = normalizeText(value).toLowerCase();
  return ASSEMBLY_DOMAINS.find((domain) => domain.key === normalized)?.key || "";
}

export function validateRootText(value = "") {
  const normalized = normalizeText(value);
  if (!normalized) return "Root text is required.";
  if (normalized.split(" ").filter(Boolean).length > 7) {
    return "Keep the root to seven words or fewer.";
  }
  return "";
}

export function normalizeRootDraft(root = null) {
  const nextRoot = root && typeof root === "object" ? root : {};
  const text = normalizeText(nextRoot.text);
  const gloss = normalizeText(nextRoot.gloss);
  const createdAt = normalizeText(nextRoot.createdAt) || null;
  const locked = Boolean(nextRoot.locked && text);

  return {
    text,
    gloss,
    createdAt,
    locked,
  };
}

function getSuggestedDomainsFromText(text = "") {
  const normalized = normalizeText(text).toLowerCase();
  if (!normalized) return [];

  return ASSEMBLY_DOMAINS.filter((domain) =>
    hasKeywordMatch(normalized, DOMAIN_KEYWORDS[domain.key] || []),
  ).map((domain) => domain.key);
}

export function suggestApplicableDomains(rootText = "", rootGloss = "") {
  const candidates = unique([
    ...getSuggestedDomainsFromText(rootText),
    ...getSuggestedDomainsFromText(rootGloss),
    "vision",
    "temporal",
  ]);

  const nextDomains = [...candidates];
  const preferredDefaults = ["people", "financial", "risk", "completion", "technical", "physical"];

  preferredDefaults.forEach((domainKey) => {
    if (nextDomains.length >= 4) return;
    if (!nextDomains.includes(domainKey)) {
      nextDomains.push(domainKey);
    }
  });

  return nextDomains.slice(0, Math.max(4, nextDomains.length)).filter(Boolean);
}

export function suggestBlockTag(text = "") {
  const normalized = normalizeText(text).toLowerCase();
  if (!normalized) return ASSEMBLY_PRIMARY_TAGS.unconfirmed;

  if (
    /^i\b|^we\b|^want\b|^need\b|^plan\b|^trying\b|^aim\b|^build\b|^launch\b|^record\b|^marry\b/.test(
      normalized,
    )
  ) {
    return ASSEMBLY_PRIMARY_TAGS.aim;
  }

  if (
    /\d/.test(normalized) ||
    /(signed|confirmed|invoice|budget|cost|price|contract|recorded|met with|purchased|inspection|report|exists|filed|deed|permit|shipment|delivery|hired)/.test(
      normalized,
    )
  ) {
    return ASSEMBLY_PRIMARY_TAGS.evidence;
  }

  return ASSEMBLY_PRIMARY_TAGS.story;
}

export function suggestBlockDomain(text = "", root = null) {
  const normalized = normalizeText(text).toLowerCase();
  const rootDomains = root?.suggestedDomains || root?.applicableDomains || [];
  const directMatch = ASSEMBLY_DOMAINS.find((domain) =>
    hasKeywordMatch(normalized, DOMAIN_KEYWORDS[domain.key] || []),
  );
  if (directMatch) return directMatch.key;
  return rootDomains[0] || "vision";
}

export function normalizeAssemblyBlockFields(block = {}, options = {}) {
  const isAssemblyBlock = Boolean(block?.isAssemblyBlock || options.defaultIsAssemblyBlock);
  const defaultStatus = isAssemblyBlock
    ? ASSEMBLY_CONFIRMATION_STATUSES.confirmed
    : options.defaultConfirmationStatus || ASSEMBLY_CONFIRMATION_STATUSES.unconfirmed;
  const confirmationStatus = normalizeAssemblyConfirmationStatus(
    block?.confirmationStatus || defaultStatus,
  );
  const suggestedPrimaryTag = normalizeAssemblyPrimaryTag(
    block?.suggestedPrimaryTag || suggestBlockTag(block?.plainText || block?.text || ""),
  );
  const primaryTag =
    confirmationStatus === ASSEMBLY_CONFIRMATION_STATUSES.unconfirmed
      ? normalizeAssemblyPrimaryTag(block?.primaryTag || ASSEMBLY_PRIMARY_TAGS.unconfirmed)
      : normalizeAssemblyPrimaryTag(block?.primaryTag || suggestedPrimaryTag);
  const suggestedDomain =
    normalizeAssemblyDomain(
      block?.suggestedDomain ||
        suggestBlockDomain(block?.plainText || block?.text || "", options.root),
    ) || "vision";
  const domain =
    normalizeAssemblyDomain(block?.domain) ||
    (confirmationStatus === ASSEMBLY_CONFIRMATION_STATUSES.confirmed ? suggestedDomain : "");

  return {
    primaryTag,
    secondaryTag: normalizeAssemblyPrimaryTag(block?.secondaryTag),
    domain,
    confirmationStatus,
    suggestedPrimaryTag,
    suggestedDomain,
    extractionPassId:
      normalizeText(block?.extractionPassId) ||
      normalizeText(options.defaultExtractionPassId) ||
      null,
    sevenStage: Number.isFinite(Number(block?.sevenStage))
      ? Number(block.sevenStage)
      : Number.isFinite(Number(options.defaultSevenStage))
        ? Number(options.defaultSevenStage)
        : null,
    sourceType: normalizeText(block?.sourceType || options.defaultSourceType).toLowerCase() || "",
    supersededBy: normalizeText(block?.supersededBy) || null,
    resolvedAt: normalizeText(block?.resolvedAt) || null,
    discardedAt: normalizeText(block?.discardedAt) || null,
  };
}

export function listApplicableDomains(meta = null) {
  const nextMeta = normalizeProjectArchitectureMeta(meta);
  return nextMeta.applicableDomains;
}

export function normalizeProjectArchitectureMeta(meta = null) {
  const nextMeta = meta && typeof meta === "object" ? meta : {};
  const root = normalizeRootDraft(nextMeta.root);
  const suggestedDomains = suggestApplicableDomains(root.text, root.gloss);
  const applicableDomains = unique(
    (Array.isArray(nextMeta.applicableDomains) ? nextMeta.applicableDomains : [])
      .map((domain) => normalizeAssemblyDomain(domain))
      .filter(Boolean),
  );
  const stateHistory = Array.isArray(nextMeta.stateHistory)
    ? nextMeta.stateHistory
        .filter(Boolean)
        .map((entry) => ({
          state: String(entry?.state || "").trim().toLowerCase(),
          at: normalizeText(entry?.at) || null,
          reason: normalizeText(entry?.reason) || "",
          receiptId: normalizeText(entry?.receiptId) || "",
        }))
        .filter((entry) => entry.state)
    : [];
  const assemblyState = nextMeta.assemblyState && typeof nextMeta.assemblyState === "object"
    ? {
        current: String(nextMeta.assemblyState.current || "").trim().toLowerCase() || "",
        updatedAt: normalizeText(nextMeta.assemblyState.updatedAt) || null,
        nextRequirement: normalizeText(nextMeta.assemblyState.nextRequirement) || "",
        coverageRatio: Number(nextMeta.assemblyState.coverageRatio) || 0,
        unconfirmedCount: Number(nextMeta.assemblyState.unconfirmedCount) || 0,
        confirmedEvidenceDomains: Number(nextMeta.assemblyState.confirmedEvidenceDomains) || 0,
        manualState: normalizeText(nextMeta.assemblyState.manualState).toLowerCase() || "",
      }
    : {
        current: "",
        updatedAt: null,
        nextRequirement: "",
        coverageRatio: 0,
        unconfirmedCount: 0,
        confirmedEvidenceDomains: 0,
        manualState: "",
      };
  const assemblyIndexMeta =
    nextMeta.assemblyIndexMeta && typeof nextMeta.assemblyIndexMeta === "object"
      ? {
          version: Number(nextMeta.assemblyIndexMeta.version) || 1,
          status: normalizeText(nextMeta.assemblyIndexMeta.status).toLowerCase() || "collecting",
          lastUpdatedAt: normalizeText(nextMeta.assemblyIndexMeta.lastUpdatedAt) || null,
          events: Array.isArray(nextMeta.assemblyIndexMeta.events)
            ? nextMeta.assemblyIndexMeta.events.filter(Boolean).slice(-120)
            : [],
        }
      : {
          version: 1,
          status: "collecting",
          lastUpdatedAt: null,
          events: [],
        };

  return {
    root,
    suggestedDomains,
    applicableDomains: applicableDomains.length ? applicableDomains : suggestedDomains,
    domainRationales:
      nextMeta.domainRationales && typeof nextMeta.domainRationales === "object"
        ? nextMeta.domainRationales
        : {},
    assemblyState,
    stateHistory,
    assemblyIndexMeta,
  };
}

export function mergeProjectArchitectureMeta(currentMeta = null, patch = {}) {
  const current = normalizeProjectArchitectureMeta(currentMeta);
  const nextRoot =
    patch.root === undefined
      ? current.root
      : normalizeRootDraft({
          ...current.root,
          ...patch.root,
        });
  const nextSuggestedDomains = suggestApplicableDomains(nextRoot.text, nextRoot.gloss);
  const nextApplicableDomains = unique(
    (
      patch.applicableDomains === undefined
        ? current.applicableDomains
        : patch.applicableDomains
    )
      .map((domain) => normalizeAssemblyDomain(domain))
      .filter(Boolean),
  );
  const nextEvents = Array.isArray(patch.events)
    ? [...current.assemblyIndexMeta.events, ...patch.events].slice(-120)
    : current.assemblyIndexMeta.events;

  return {
    root: nextRoot,
    suggestedDomains: nextSuggestedDomains,
    applicableDomains: nextApplicableDomains.length ? nextApplicableDomains : nextSuggestedDomains,
    domainRationales:
      patch.domainRationales === undefined
        ? current.domainRationales
        : patch.domainRationales,
    assemblyState: {
      ...current.assemblyState,
      ...(patch.assemblyState || {}),
    },
    stateHistory:
      patch.stateHistory === undefined
        ? current.stateHistory
        : patch.stateHistory,
    assemblyIndexMeta: {
      ...current.assemblyIndexMeta,
      ...(patch.assemblyIndexMeta || {}),
      events: nextEvents,
      lastUpdatedAt:
        patch.assemblyIndexMeta?.lastUpdatedAt ||
        (Array.isArray(patch.events) && patch.events.length
          ? patch.events[patch.events.length - 1].at
          : current.assemblyIndexMeta.lastUpdatedAt),
    },
  };
}

function listRelevantBlocks(documents = []) {
  return (Array.isArray(documents) ? documents : [])
    .filter(
      (document) =>
        document &&
        !document.isAssembly &&
        document.documentType !== "assembly" &&
        document.documentType !== "builtin" &&
        document.sourceType !== "builtin",
    )
    .flatMap((document) =>
      (Array.isArray(document.blocks) ? document.blocks : []).map((block) => ({
        ...block,
        sourceDocumentKey: block.sourceDocumentKey || document.documentKey,
      })),
    );
}

export function countUnconfirmedBlocks(documents = []) {
  return listRelevantBlocks(documents).filter(
    (block) =>
      normalizeAssemblyConfirmationStatus(block.confirmationStatus) ===
      ASSEMBLY_CONFIRMATION_STATUSES.unconfirmed,
  ).length;
}

export function listConfirmationQueueItems(documents = [], root = null) {
  return listRelevantBlocks(documents)
    .filter(
      (block) =>
        normalizeAssemblyConfirmationStatus(block.confirmationStatus) ===
        ASSEMBLY_CONFIRMATION_STATUSES.unconfirmed,
    )
    .map((block) => {
      const fields = normalizeAssemblyBlockFields(block, { root });
      const stageTone = getSevenStageColorStep(fields.sevenStage);
      return {
        ...block,
        ...fields,
        suggestedPrimaryTagLabel: `${getAssemblyPrimaryTagSymbol(fields.suggestedPrimaryTag)} ${getAssemblyPrimaryTagLabel(fields.suggestedPrimaryTag)}`,
        suggestedDomainLabel:
          ASSEMBLY_DOMAINS.find((domain) => domain.key === fields.suggestedDomain)?.label ||
          "Vision",
        confirmationColorStep: stageTone.step,
        confirmationColorLabel: getSevenStageLabel(fields.sevenStage) || "Unconfirmed",
        confirmationColorUnknown: stageTone.isUnknown,
        confirmationColorTokens: getAssemblyColorTokens(stageTone),
      };
    });
}

function listConfirmedEvidenceBlocks(documents = []) {
  return listRelevantBlocks(documents).filter((block) => {
    const fields = normalizeAssemblyBlockFields(block);
    return (
      fields.confirmationStatus === ASSEMBLY_CONFIRMATION_STATUSES.confirmed &&
      fields.primaryTag === ASSEMBLY_PRIMARY_TAGS.evidence
    );
  });
}

export function buildAssemblyStateSummary({
  project = null,
  projectDocuments = [],
  projectDrafts = [],
} = {}) {
  const meta = normalizeProjectArchitectureMeta(project?.metadataJson || project?.architectureMeta || null);
  const hasRoot = Boolean(meta.root.text);
  const realSourceCount = (Array.isArray(projectDocuments) ? projectDocuments : []).filter(
    (document) =>
      document &&
      !document.isAssembly &&
      document.documentType !== "assembly" &&
      document.documentType !== "builtin" &&
      document.sourceType !== "builtin",
  ).length;
  const unconfirmedCount = countUnconfirmedBlocks(projectDocuments);
  const confirmedEvidenceBlocks = listConfirmedEvidenceBlocks(projectDocuments);
  const confirmedEvidenceDomains = unique(
    confirmedEvidenceBlocks.map((block) => normalizeAssemblyDomain(block.domain)).filter(Boolean),
  );
  const applicableDomains = meta.applicableDomains.length
    ? meta.applicableDomains
    : suggestApplicableDomains(meta.root.text, meta.root.gloss);
  const coverageRatio =
    applicableDomains.length > 0
      ? confirmedEvidenceDomains.length / applicableDomains.length
      : 0;
  const sealedDraftCount = (Array.isArray(projectDrafts) ? projectDrafts : []).filter(
    (draft) => String(draft?.status || "").trim().toUpperCase() === "SEALED",
  ).length;

  let currentState = "declare-root";
  let nextRequirement = "Declare the root so the box has a fixed origin.";

  if (hasRoot) {
    currentState = "rooted";
    nextRequirement = "Add the first real source to fertilize the box.";
  }
  if (hasRoot && realSourceCount > 0) {
    currentState = "fertilized";
    nextRequirement = "Confirm the incoming blocks and seal the first receipt.";
  }
  if (hasRoot && sealedDraftCount >= 1) {
    currentState = "sprouted";
    nextRequirement = "Seal more receipts across at least two applicable domains.";
  }
  if (hasRoot && sealedDraftCount >= 3 && confirmedEvidenceDomains.length >= 2) {
    currentState = "growing";
    nextRequirement = "Increase confirmed evidence coverage across the applicable domains.";
  }
  if (
    hasRoot &&
    applicableDomains.length >= 4 &&
    confirmedEvidenceDomains.length >= 4 &&
    coverageRatio >= 0.7
  ) {
    currentState = "structured";
    nextRequirement = "Seal a receipt that proves the object exists in reality.";
  }
  if (meta.assemblyState.manualState === "assembled") {
    currentState = "assembled";
    nextRequirement = "Review completion evidence and seal the box.";
  }
  if (meta.assemblyState.manualState === "sealed") {
    currentState = "sealed";
    nextRequirement = "Release the box when the record is ready to travel.";
  }
  if (meta.assemblyState.manualState === "released") {
    currentState = "released";
    nextRequirement = "Assembly Index is ready.";
  }

  const missingDomains = applicableDomains.filter(
    (domain) => !confirmedEvidenceDomains.includes(domain),
  );
  const colorStep = getAssemblyStateColorStep(currentState);

  return {
    hasRoot,
    root: meta.root,
    current: currentState,
    label: getAssemblyStateLabel(currentState),
    colorStep,
    colorLabel: getAssemblyStateLabel(currentState),
    colorTokens: getAssemblyColorTokens(colorStep),
    nextRequirement,
    unconfirmedCount,
    sealedDraftCount,
    confirmedEvidenceDomains,
    applicableDomains,
    missingDomains,
    coverageRatio,
    coveragePercent: Math.round(coverageRatio * 100),
  };
}

export function buildAssemblyIndexEvent(type = "", detail = {}) {
  const normalizedType = normalizeText(type).toLowerCase() || "event";
  return {
    type: normalizedType,
    at: new Date().toISOString(),
    detail: detail && typeof detail === "object" ? detail : {},
  };
}
