const MAX_ECHO_TEXT = 140;
const MAX_PULSE_TEXT = 72;

export const APP_MODES = Object.freeze({
  room: "room",
  dream: "dream",
});

export const CAPABILITY_ENTRY_FORMS = Object.freeze({
  card: "card",
  inline: "inline",
  sheet: "sheet",
  library: "library",
});

export const CONTEXT_CARD_KINDS = Object.freeze({
  changed: "changed",
  aim: "aim",
  decide: "decide",
  tension: "tension",
  witness: "witness",
  preview: "preview",
  receipt_kit: "receipt_kit",
  survives: "survives",
  blocked: "blocked",
});

export const CONTEXT_CARD_LIFECYCLES = Object.freeze({
  formed: "formed",
  active: "active",
  settled: "settled",
  archived: "archived",
});

export const SECTION_IDS = Object.freeze({
  context: "context",
  source: "source",
  create: "create",
  witness: "witness",
  operate: "operate",
  account: "account",
});

export const SHELL_ROUTES = Object.freeze({
  workspace: "workspace",
  dream: "dream",
  account: "account",
});

const FIELD_TONE_BY_KEY = Object.freeze({
  open: "brand",
  contested: "flagged",
  awaiting_return: "grounded",
});

const CARD_PRIORITY = Object.freeze([
  CONTEXT_CARD_KINDS.decide,
  CONTEXT_CARD_KINDS.changed,
  CONTEXT_CARD_KINDS.tension,
  CONTEXT_CARD_KINDS.aim,
  "next",
  CONTEXT_CARD_KINDS.witness,
  CONTEXT_CARD_KINDS.preview,
  CONTEXT_CARD_KINDS.receipt_kit,
  CONTEXT_CARD_KINDS.survives,
  CONTEXT_CARD_KINDS.blocked,
]);

const CARD_META = Object.freeze({
  [CONTEXT_CARD_KINDS.changed]: { label: "Changed", tone: "grounded" },
  [CONTEXT_CARD_KINDS.aim]: { label: "Aim", tone: "brand" },
  [CONTEXT_CARD_KINDS.decide]: { label: "Decide", tone: "brand" },
  [CONTEXT_CARD_KINDS.tension]: { label: "Tension", tone: "flagged" },
  [CONTEXT_CARD_KINDS.witness]: { label: "Witness", tone: "neutral" },
  [CONTEXT_CARD_KINDS.preview]: { label: "Preview", tone: "brand" },
  [CONTEXT_CARD_KINDS.receipt_kit]: { label: "Receipt", tone: "grounded" },
  [CONTEXT_CARD_KINDS.survives]: { label: "Survives", tone: "grounded" },
  [CONTEXT_CARD_KINDS.blocked]: { label: "Blocked", tone: "danger" },
});

function normalizeText(value = "") {
  return String(value || "")
    .replace(/\\n/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clipText(value = "", max = MAX_ECHO_TEXT) {
  const normalized = normalizeText(value);
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function isKnownValue(candidate, table) {
  return Object.values(table).includes(candidate);
}

export function normalizeSectionId(value = "") {
  const normalized = normalizeText(value).toLowerCase();
  return isKnownValue(normalized, SECTION_IDS) ? normalized : "";
}

export function normalizeShellRoute(value = "") {
  const normalized = normalizeText(value).toLowerCase();
  return isKnownValue(normalized, SHELL_ROUTES) ? normalized : SHELL_ROUTES.workspace;
}

export function normalizeAppMode(value = "") {
  const normalized = normalizeText(value).toLowerCase();
  return isKnownValue(normalized, APP_MODES) ? normalized : APP_MODES.room;
}

export function normalizeContextCardKind(value = "") {
  const normalized = normalizeText(value).toLowerCase();
  return isKnownValue(normalized, CONTEXT_CARD_KINDS) ? normalized : CONTEXT_CARD_KINDS.changed;
}

export function normalizeContextCardLifecycle(value = "") {
  const normalized = normalizeText(value).toLowerCase();
  return isKnownValue(normalized, CONTEXT_CARD_LIFECYCLES)
    ? normalized
    : CONTEXT_CARD_LIFECYCLES.active;
}

export function buildContextCard(card = {}, index = 0) {
  const kind = normalizeContextCardKind(card.kind || card.key || CONTEXT_CARD_KINDS.changed);
  const lifecycle = normalizeContextCardLifecycle(card.lifecycle);
  const meta = CARD_META[kind] || CARD_META[CONTEXT_CARD_KINDS.changed];
  const title = clipText(card.title || card.text || "");
  const verdict = clipText(card.verdict || card.text || title);
  const detail = clipText(card.detail || card.supportingText || "", 220);

  return {
    id: normalizeText(card.id || `${kind}-${index + 1}`),
    kind,
    lifecycle,
    label: normalizeText(card.label || meta.label) || meta.label,
    tone: normalizeText(card.tone || meta.tone) || meta.tone,
    title: title || meta.label,
    verdict,
    detail,
    createdAt: normalizeText(card.createdAt || card.updatedAt || ""),
    updatedAt: normalizeText(card.updatedAt || card.createdAt || ""),
    href: normalizeText(card.href || ""),
    meta: Array.isArray(card.meta) ? card.meta.filter(Boolean).map((value) => clipText(value, 64)) : [],
    actions: Array.isArray(card.actions) ? card.actions.filter(Boolean) : [],
  };
}

export function sortContextCards(cards = []) {
  return [...cards].sort((left, right) => {
    const leftPriority = CARD_PRIORITY.indexOf(left.kind);
    const rightPriority = CARD_PRIORITY.indexOf(right.kind);
    const leftIndex = leftPriority === -1 ? CARD_PRIORITY.length : leftPriority;
    const rightIndex = rightPriority === -1 ? CARD_PRIORITY.length : rightPriority;
    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }

    const leftUpdated = Date.parse(left.updatedAt || left.createdAt || "") || 0;
    const rightUpdated = Date.parse(right.updatedAt || right.createdAt || "") || 0;
    return rightUpdated - leftUpdated;
  });
}

export function buildPulseStripState(cards = []) {
  const activeCards = sortContextCards(
    cards
      .map((card, index) => buildContextCard(card, index))
      .filter((card) => card.lifecycle === CONTEXT_CARD_LIFECYCLES.active),
  );

  const primary = activeCards[0] || null;
  const secondaryCards = activeCards.slice(1, 3);
  const visibleCardIds = activeCards.slice(0, 3).map((card) => card.id);

  return {
    primaryCardId: primary?.id || "",
    visibleCardIds,
    overflowCount: Math.max(0, activeCards.length - visibleCardIds.length),
    primary,
    secondaryCards,
    cards: activeCards,
    dormant: activeCards.length === 0,
  };
}

export function buildEchoPulseState({
  change = "",
  decide = "",
  tension = "",
  survives = "",
  updatedAt = "",
} = {}) {
  const cards = [
    change
      ? {
          id: "echo-changed",
          kind: CONTEXT_CARD_KINDS.changed,
          verdict: change,
          lifecycle: CONTEXT_CARD_LIFECYCLES.active,
          updatedAt,
        }
      : null,
    decide
      ? {
          id: "echo-decide",
          kind: CONTEXT_CARD_KINDS.decide,
          verdict: decide,
          lifecycle: CONTEXT_CARD_LIFECYCLES.active,
          updatedAt,
        }
      : null,
    tension
      ? {
          id: "echo-tension",
          kind: CONTEXT_CARD_KINDS.tension,
          verdict: tension,
          lifecycle: CONTEXT_CARD_LIFECYCLES.active,
          updatedAt,
        }
      : null,
    survives
      ? {
          id: "echo-survives",
          kind: CONTEXT_CARD_KINDS.survives,
          verdict: survives,
          lifecycle: CONTEXT_CARD_LIFECYCLES.active,
          updatedAt,
        }
      : null,
  ].filter(Boolean);

  const pulse = buildPulseStripState(cards);
  const entries = pulse.cards.map((card) => ({
    key: card.kind,
    text: card.verdict,
    label: card.label,
    tone: card.tone,
  }));

  return {
    change: clipText(change),
    decide: clipText(decide),
    tension: clipText(tension),
    survives: clipText(survives),
    updatedAt: normalizeText(updatedAt),
    entries,
    primary: entries[0] || null,
    secondary: entries[1] || null,
    dormant: entries.length === 0,
    pulse,
  };
}

export function buildContextCardsFromRoomView(view = null) {
  const workingEcho = view?.workingEcho || null;
  const activePreview = view?.activePreview || null;
  const latestReceiptKit = view?.latestReceiptKit || null;
  const returnDelta = workingEcho?.returnDelta || null;
  const openTension = Array.isArray(workingEcho?.openTension) ? workingEcho.openTension : [];
  const focusedWitness = view?.focusedWitness || null;
  const previewStatus = normalizeText(activePreview?.status).toLowerCase();

  const cards = [
    activePreview
      ? {
          id: "room-preview",
          kind:
            previewStatus === "blocked"
              ? CONTEXT_CARD_KINDS.blocked
              : CONTEXT_CARD_KINDS.changed,
          title: activePreview?.summary || "Preview formed",
          verdict:
            activePreview?.sections?.aim?.text ||
            activePreview?.segments?.[0]?.text ||
            activePreview?.summary ||
            "Preview formed",
          detail: activePreview?.statusNote || "",
          updatedAt: activePreview?.updatedAt || view?.session?.updatedAt || "",
        }
      : null,
    workingEcho?.whatWouldDecideIt?.text
      ? {
          id: "room-decide",
          kind: CONTEXT_CARD_KINDS.decide,
          title: "What would decide it",
          verdict: workingEcho.whatWouldDecideIt.text,
          detail: workingEcho.candidateMove?.text || "",
          updatedAt: view?.session?.updatedAt || "",
        }
      : null,
    workingEcho?.openTension?.[0]?.text || workingEcho?.uncertainty?.detail
      ? {
          id: "room-tension",
          kind: CONTEXT_CARD_KINDS.tension,
          title: "Open tension",
          verdict: openTension[0]?.text || workingEcho?.uncertainty?.detail || "",
          detail: workingEcho?.whatSeemsReal?.text || "",
          updatedAt: view?.session?.updatedAt || "",
        }
      : null,
    workingEcho?.aim?.text
      ? {
          id: "room-aim",
          kind: CONTEXT_CARD_KINDS.aim,
          title: "Aim",
          verdict: workingEcho.aim.text,
          updatedAt: view?.session?.updatedAt || "",
        }
      : null,
    focusedWitness?.title
      ? {
          id: "room-witness",
          kind: CONTEXT_CARD_KINDS.witness,
          title: focusedWitness.title,
          verdict:
            focusedWitness.summary ||
            focusedWitness.excerpt ||
            focusedWitness.title,
          detail: focusedWitness.sourceTitle || "",
          href: normalizeText(focusedWitness.openHref || view?.deepLinks?.reader || ""),
          updatedAt: focusedWitness.updatedAt || view?.session?.updatedAt || "",
        }
      : null,
    latestReceiptKit?.title || latestReceiptKit?.prompt
      ? {
          id: "room-receipt-kit",
          kind: CONTEXT_CARD_KINDS.receipt_kit,
          title: latestReceiptKit?.title || "Receipt kit ready",
          verdict: latestReceiptKit?.prompt || latestReceiptKit?.title || "Receipt kit ready",
          detail: latestReceiptKit?.artifactLabel || "",
          updatedAt: latestReceiptKit?.updatedAt || "",
        }
      : null,
    returnDelta?.summary || returnDelta?.nextMoveShift?.text
      ? {
          id: "room-survives",
          kind: CONTEXT_CARD_KINDS.survives,
          title: "Return delta",
          verdict: returnDelta?.summary || returnDelta?.nextMoveShift?.text || "",
          detail: returnDelta?.changedRead?.[0]?.title || "",
          updatedAt: view?.session?.updatedAt || "",
        }
      : null,
  ].filter(Boolean);

  return sortContextCards(cards.map((card, index) => buildContextCard(card, index)));
}

export function buildEchoPulseStateFromRoomView(view = null) {
  const cards = buildContextCardsFromRoomView(view);
  const pulse = buildPulseStripState(cards);
  const entries = pulse.cards.map((card) => ({
    key: card.kind,
    text: card.verdict,
    label: card.label,
    tone: card.tone,
  }));

  return {
    change: entries.find((entry) => entry.key === CONTEXT_CARD_KINDS.changed)?.text || "",
    decide: entries.find((entry) => entry.key === CONTEXT_CARD_KINDS.decide)?.text || "",
    tension: entries.find((entry) => entry.key === CONTEXT_CARD_KINDS.tension)?.text || "",
    survives: entries.find((entry) => entry.key === CONTEXT_CARD_KINDS.survives)?.text || "",
    updatedAt: normalizeText(view?.session?.updatedAt || view?.session?.createdAt || ""),
    entries,
    primary: entries[0] || null,
    secondary: entries[1] || null,
    dormant: entries.length === 0,
    pulse,
  };
}

export function buildDormantEchoPulseState() {
  return buildEchoPulseState();
}

export function clipPulseVerdict(value = "") {
  return clipText(value, MAX_PULSE_TEXT);
}

function normalizeFieldStateKey(value = "") {
  return normalizeText(value)
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function formatFieldStateLabel(fieldState = null) {
  const explicitLabel = clipText(fieldState?.label || "", 32);
  if (explicitLabel) return explicitLabel;

  const key = normalizeFieldStateKey(fieldState?.key || "open");
  if (key === "awaiting_return") return "Awaiting return";
  if (key === "contested") return "Contested";
  return "Open";
}

export function buildWorkingEchoStripStateFromRoomView(view = null) {
  const workingEcho = view?.workingEcho || null;
  const fieldState = view?.fieldState || null;
  const fieldKey = normalizeFieldStateKey(fieldState?.key || "open");
  const fieldTone = FIELD_TONE_BY_KEY[fieldKey] || "neutral";
  const seemsReal =
    clipPulseVerdict(
      workingEcho?.whatSeemsReal?.text ||
        workingEcho?.aim?.text ||
        view?.starter?.prompt ||
        "",
    ) || "";
  const conflicts =
    clipPulseVerdict(
      workingEcho?.openTension?.[0]?.text ||
        workingEcho?.uncertainty?.detail ||
        "",
    ) || "";
  const decidingSplit = clipPulseVerdict(workingEcho?.whatWouldDecideIt?.text || "");
  const returnShift = clipPulseVerdict(
    workingEcho?.returnDelta?.summary || workingEcho?.returnDelta?.nextMoveShift?.text || "",
  );
  const nextMove = clipPulseVerdict(workingEcho?.candidateMove?.text || "");

  const cards = [
    seemsReal
      ? {
          id: "working-echo-seems-real",
          kind: CONTEXT_CARD_KINDS.changed,
          label: "Seems Real",
          tone: fieldTone,
          verdict: seemsReal,
          lifecycle: CONTEXT_CARD_LIFECYCLES.active,
          updatedAt: view?.session?.updatedAt || view?.session?.createdAt || "",
        }
      : null,
    conflicts
      ? {
          id: "working-echo-conflicts",
          kind: CONTEXT_CARD_KINDS.tension,
          label: "Conflicts",
          tone: "flagged",
          verdict: conflicts,
          lifecycle: CONTEXT_CARD_LIFECYCLES.active,
          updatedAt: view?.session?.updatedAt || view?.session?.createdAt || "",
        }
      : null,
    decidingSplit
      ? {
          id: "working-echo-decide",
          kind: CONTEXT_CARD_KINDS.decide,
          label: "Would Decide",
          tone: "brand",
          verdict: decidingSplit,
          lifecycle: CONTEXT_CARD_LIFECYCLES.active,
          updatedAt: view?.session?.updatedAt || view?.session?.createdAt || "",
        }
      : null,
    returnShift
      ? {
          id: "working-echo-return",
          kind: CONTEXT_CARD_KINDS.survives,
          label: "Return Shift",
          tone: "grounded",
          verdict: returnShift,
          lifecycle: CONTEXT_CARD_LIFECYCLES.active,
          updatedAt: view?.session?.updatedAt || view?.session?.createdAt || "",
        }
      : null,
    !returnShift && nextMove
      ? {
          id: "working-echo-next",
          kind: CONTEXT_CARD_KINDS.survives,
          label: "Next Move",
          tone: "grounded",
          verdict: nextMove,
          lifecycle: CONTEXT_CARD_LIFECYCLES.active,
          updatedAt: view?.session?.updatedAt || view?.session?.createdAt || "",
        }
      : null,
  ].filter(Boolean);

  const pulse = buildPulseStripState(cards);

  return {
    field: {
      key: fieldKey || "open",
      label: formatFieldStateLabel(fieldState),
      tone: fieldTone,
    },
    primaryCardId: pulse.primaryCardId,
    visibleCardIds: pulse.visibleCardIds,
    overflowCount: pulse.overflowCount,
    primary: pulse.primary || null,
    secondaryCards: pulse.secondaryCards || [],
    cards: pulse.cards || [],
    dormant: pulse.dormant,
  };
}
