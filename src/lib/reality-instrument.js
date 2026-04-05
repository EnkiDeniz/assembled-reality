function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export const REALITY_INSTRUMENT_SEVERITIES = Object.freeze({
  orientation: "orientation",
  constraint: "constraint",
  warning: "warning",
  blocked: "blocked",
  recovery: "recovery",
});

const SEVERITY_PRIORITY = Object.freeze({
  blocked: 90,
  warning: 70,
  recovery: 60,
  constraint: 50,
  orientation: 10,
});

const SURFACE_LABELS = Object.freeze({
  root: "Root",
  think: "Think",
  listen: "Listen",
  seed: "Seed",
  operate: "Operate",
  receipts: "Receipts",
  voice: "Speak",
  workspace: "Workspace",
});

function normalizeSeverity(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  return Object.values(REALITY_INSTRUMENT_SEVERITIES).includes(normalized)
    ? normalized
    : REALITY_INSTRUMENT_SEVERITIES.orientation;
}

function normalizeEvidence(evidence = []) {
  return (Array.isArray(evidence) ? evidence : [])
    .map((entry) => ({
      label: normalizeText(entry?.label),
      value: normalizeText(entry?.value),
    }))
    .filter((entry) => entry.label && entry.value);
}

function normalizeMove(move = {}, index = 0) {
  const label = normalizeText(move?.label);
  if (!label) return null;

  return {
    key: normalizeText(move?.key) || `move-${index}`,
    label,
    kind: index === 0 ? "primary" : "secondary",
    tone: normalizeText(move?.tone || ""),
    disabled: Boolean(move?.disabled),
  };
}

export function getRealityInstrumentTone(severity = REALITY_INSTRUMENT_SEVERITIES.orientation) {
  const normalized = normalizeSeverity(severity);

  if (normalized === REALITY_INSTRUMENT_SEVERITIES.constraint) {
    return {
      fill: "rgba(245, 196, 112, 0.22)",
      soft: "rgba(245, 196, 112, 0.12)",
      border: "rgba(245, 196, 112, 0.38)",
      glow: "rgba(245, 196, 112, 0.24)",
      text: "rgba(255, 230, 184, 0.96)",
    };
  }

  if (normalized === REALITY_INSTRUMENT_SEVERITIES.warning) {
    return {
      fill: "rgba(235, 183, 86, 0.24)",
      soft: "rgba(235, 183, 86, 0.14)",
      border: "rgba(235, 183, 86, 0.44)",
      glow: "rgba(235, 183, 86, 0.26)",
      text: "rgba(255, 232, 189, 0.96)",
    };
  }

  if (normalized === REALITY_INSTRUMENT_SEVERITIES.blocked) {
    return {
      fill: "rgba(225, 95, 95, 0.22)",
      soft: "rgba(225, 95, 95, 0.12)",
      border: "rgba(225, 95, 95, 0.4)",
      glow: "rgba(225, 95, 95, 0.28)",
      text: "rgba(255, 211, 211, 0.96)",
    };
  }

  if (normalized === REALITY_INSTRUMENT_SEVERITIES.recovery) {
    return {
      fill: "rgba(90, 164, 224, 0.2)",
      soft: "rgba(90, 164, 224, 0.12)",
      border: "rgba(90, 164, 224, 0.36)",
      glow: "rgba(90, 164, 224, 0.22)",
      text: "rgba(215, 234, 255, 0.96)",
    };
  }

  return {
    fill: "rgba(122, 138, 156, 0.18)",
    soft: "rgba(122, 138, 156, 0.08)",
    border: "rgba(122, 138, 156, 0.24)",
    glow: "rgba(122, 138, 156, 0.14)",
    text: "rgba(224, 231, 240, 0.94)",
  };
}

export function buildRealityInstrumentIssue(issue = {}) {
  const severity = normalizeSeverity(issue?.severity);
  const moveSpace = (Array.isArray(issue?.moveSpace) ? issue.moveSpace : [])
    .map((entry, index) => normalizeMove(entry, index))
    .filter(Boolean)
    .slice(0, 4);

  return {
    key: normalizeText(issue?.key) || `issue-${severity}`,
    surfaceKey: normalizeText(issue?.surfaceKey),
    severity,
    priority:
      Number.isFinite(Number(issue?.priority)) ? Number(issue.priority) : SEVERITY_PRIORITY[severity],
    label: normalizeText(issue?.label) || SURFACE_LABELS[issue?.surfaceKey] || "Reality",
    headline: normalizeText(issue?.headline),
    summary: normalizeText(issue?.summary),
    compactSummary: normalizeText(issue?.compactSummary) || normalizeText(issue?.summary),
    evidence: normalizeEvidence(issue?.evidence),
    moveSpace,
    sevenAssist: issue?.sevenAssist || null,
  };
}

export function buildRealityInstrumentViewModel({
  surfaceKey = "",
  boxTitle = "",
  documentTitle = "",
  stateSummary = null,
  defaultSummary = "",
  defaultMoveSpace = [],
  issues = [],
} = {}) {
  const normalizedIssues = (Array.isArray(issues) ? issues : [])
    .map((entry) => buildRealityInstrumentIssue(entry))
    .filter((entry) => entry.headline || entry.summary || entry.moveSpace.length > 0)
    .sort((left, right) => right.priority - left.priority);
  const activeIssue = normalizedIssues[0] || null;
  const severity = activeIssue?.severity || REALITY_INSTRUMENT_SEVERITIES.orientation;
  const tone = getRealityInstrumentTone(severity);
  const positionLabel = [
    SURFACE_LABELS[surfaceKey] || normalizeText(surfaceKey) || "Workspace",
    normalizeText(documentTitle) || normalizeText(boxTitle),
  ]
    .filter(Boolean)
    .join(" · ");
  const moveSpace = (
    activeIssue?.moveSpace?.length ? activeIssue.moveSpace : defaultMoveSpace
  )
    .map((entry, index) => normalizeMove(entry, index))
    .filter(Boolean)
    .slice(0, 4);

  return {
    surfaceKey: normalizeText(surfaceKey),
    severity,
    tone,
    positionLabel,
    stateSummary,
    stateChipLabel:
      normalizeText(stateSummary?.chipLabel) ||
      normalizeText(stateSummary?.label) ||
      "",
    headline:
      activeIssue?.headline ||
      normalizeText(documentTitle) ||
      normalizeText(boxTitle) ||
      "Reality",
    summary: activeIssue?.summary || normalizeText(defaultSummary),
    compactSummary:
      activeIssue?.compactSummary ||
      activeIssue?.summary ||
      normalizeText(defaultSummary) ||
      "Position is clear.",
    evidence: activeIssue?.evidence || [],
    moveSpace,
    primaryMove: moveSpace[0] || null,
    activeIssue,
    hasIssue: Boolean(activeIssue),
    panelTitle: activeIssue?.label || SURFACE_LABELS[surfaceKey] || "Reality",
  };
}
