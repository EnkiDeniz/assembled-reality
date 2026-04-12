const MAX_ECHO_TEXT = 140;

export const SECTION_IDS = Object.freeze({
  mirror: "mirror",
  witness: "witness",
  operate: "operate",
  boxes: "boxes",
  dream: "dream",
  account: "account",
});

export const SHELL_ROUTES = Object.freeze({
  workspace: "workspace",
  dream: "dream",
  account: "account",
});

const ECHO_PRIORITY = Object.freeze(["decide", "tension", "survives", "change"]);

const ECHO_META = Object.freeze({
  change: { label: "Changed", tone: "grounded" },
  decide: { label: "Decide", tone: "brand" },
  tension: { label: "Tension", tone: "flagged" },
  survives: { label: "Survives", tone: "grounded" },
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

export function normalizeSectionId(value = "") {
  const normalized = normalizeText(value).toLowerCase();
  return Object.values(SECTION_IDS).includes(normalized) ? normalized : "";
}

export function normalizeShellRoute(value = "") {
  const normalized = normalizeText(value).toLowerCase();
  return Object.values(SHELL_ROUTES).includes(normalized) ? normalized : SHELL_ROUTES.workspace;
}

export function buildEchoPulseState({
  change = "",
  decide = "",
  tension = "",
  survives = "",
  updatedAt = "",
} = {}) {
  const normalized = {
    change: clipText(change),
    decide: clipText(decide),
    tension: clipText(tension),
    survives: clipText(survives),
    updatedAt: normalizeText(updatedAt),
  };

  const entries = ECHO_PRIORITY.filter((key) => normalized[key]).map((key) => ({
    key,
    text: normalized[key],
    label: ECHO_META[key].label,
    tone: ECHO_META[key].tone,
  }));

  return {
    ...normalized,
    entries,
    primary: entries[0] || null,
    secondary: entries[1] || null,
    dormant: entries.length === 0,
  };
}

export function buildEchoPulseStateFromRoomView(view = null) {
  const workingEcho = view?.workingEcho || null;
  const activePreview = view?.activePreview || null;
  const returnDelta = workingEcho?.returnDelta || null;
  const openTension = Array.isArray(workingEcho?.openTension) ? workingEcho.openTension : [];

  const previewChange =
    activePreview?.sections?.aim?.text ||
    activePreview?.segments?.[0]?.text ||
    activePreview?.summary ||
    "";
  const decidingSplit = workingEcho?.whatWouldDecideIt?.text || "";
  const liveTension = openTension[0]?.text || workingEcho?.uncertainty?.detail || "";
  const survivalRead =
    returnDelta?.summary ||
    returnDelta?.nextMoveShift?.text ||
    returnDelta?.changedRead?.[0]?.title ||
    returnDelta?.weakenedRead?.[0]?.title ||
    "";

  return buildEchoPulseState({
    change: previewChange,
    decide: decidingSplit,
    tension: liveTension,
    survives: survivalRead,
    updatedAt:
      activePreview?.updatedAt ||
      view?.session?.updatedAt ||
      view?.session?.createdAt ||
      "",
  });
}

export function buildDormantEchoPulseState() {
  return buildEchoPulseState();
}
