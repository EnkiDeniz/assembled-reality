function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

const SEVERITY_RANK = {
  error: 0,
  warning: 1,
  info: 2,
  debug: 3,
};

function severityRank(severity = "") {
  const normalized = normalizeText(severity).toLowerCase();
  return Object.hasOwn(SEVERITY_RANK, normalized) ? SEVERITY_RANK[normalized] : 4;
}

function extractUnknownHeadToken(message = "") {
  const match = normalizeText(message).match(/unknown head\s+["“]?([^"”]+)["”]?/i);
  return normalizeText(match?.[1]);
}

function buildDiagnosticEntry(layer = "", diagnostic = {}, index = 0) {
  const code = normalizeText(diagnostic?.code) || "diag";
  const severity = normalizeText(diagnostic?.severity).toLowerCase() || "info";
  const message = normalizeText(diagnostic?.message);
  const line = Number.isFinite(Number(diagnostic?.line)) ? Number(diagnostic.line) : null;
  const unknownHeadToken = code === "PH002" ? extractUnknownHeadToken(message) : "";
  const family =
    code === "PH002" && unknownHeadToken
      ? "unknown head"
      : message || "Diagnostic";

  return {
    key: `${layer}:${code}:${line ?? "na"}:${index}`,
    layer,
    code,
    severity,
    message,
    line,
    family,
    unknownHeadToken,
    text: `${severity} ${code}: ${message}`.trim(),
  };
}

function buildLayerEntries(layer = "", result = null) {
  const diagnostics = Array.isArray(result?.diagnostics) ? result.diagnostics : [];
  return diagnostics.map((diagnostic, index) => buildDiagnosticEntry(layer, diagnostic, index));
}

function getRawSourceNoiseKind(entry = null) {
  if (!entry || entry.layer !== "Raw source") return "";
  if (entry.code === "PH002" && entry.family === "unknown head") {
    return "noise";
  }
  if (
    entry.code === "PH001" &&
    normalizeText(entry.message).toLowerCase() === "clause requires at least head and verb"
  ) {
    return "noise";
  }
  return "blocker";
}

function getGroupKey(entry = null) {
  if (!entry) return "";
  if (entry.layer === "Raw source") {
    return `${entry.layer}:${entry.code}:${normalizeText(entry.family).toLowerCase()}`;
  }
  return `${entry.layer}:${entry.code}:${normalizeText(entry.message).toLowerCase()}`;
}

function buildGroupedDiagnostics(entries = []) {
  const groups = new Map();

  entries.forEach((entry) => {
    const key = getGroupKey(entry);
    if (!key) return;
    const current = groups.get(key);
    if (!current) {
      groups.set(key, {
        key,
        layer: entry.layer,
        code: entry.code,
        family: entry.family,
        severity: entry.severity,
        count: 1,
        kind: getRawSourceNoiseKind(entry) || (entry.layer === "Raw source" ? "blocker" : "detail"),
        sampleTokens: entry.unknownHeadToken ? [entry.unknownHeadToken] : [],
        sampleMessages: entry.message ? [entry.message] : [],
        entries: [entry],
      });
      return;
    }

    current.count += 1;
    current.entries.push(entry);
    if (entry.unknownHeadToken && !current.sampleTokens.includes(entry.unknownHeadToken)) {
      current.sampleTokens.push(entry.unknownHeadToken);
    }
    if (entry.message && !current.sampleMessages.includes(entry.message)) {
      current.sampleMessages.push(entry.message);
    }
    if (severityRank(entry.severity) < severityRank(current.severity)) {
      current.severity = entry.severity;
    }
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    sampleTokens: group.sampleTokens.slice(0, 5),
    sampleMessages: group.sampleMessages.slice(0, 5),
  }));
}

function sortGroups(groups = []) {
  return [...groups].sort((left, right) => {
    if (left.count !== right.count) return right.count - left.count;
    const severityDelta = severityRank(left.severity) - severityRank(right.severity);
    if (severityDelta !== 0) return severityDelta;
    return `${left.code}:${left.family}`.localeCompare(`${right.code}:${right.family}`);
  });
}

export function buildCompilerReadDiagnosticsView({
  rawDocumentResult = null,
  translatedSubsetResult = null,
  embeddedExecutableResult = null,
} = {}) {
  const rawEntries = buildLayerEntries("Raw source", rawDocumentResult);
  const translatedEntries = buildLayerEntries("Translated subset", translatedSubsetResult);
  const embeddedEntries = buildLayerEntries("Embedded program", embeddedExecutableResult);

  const rawGroups = buildGroupedDiagnostics(rawEntries);
  const translatedGroups = buildGroupedDiagnostics(translatedEntries);
  const embeddedGroups = buildGroupedDiagnostics(embeddedEntries);

  const buckets = [
    {
      id: "blockers",
      title: "Structural blockers",
      groups: sortGroups(
        rawGroups.filter((group) => group.kind === "blocker" || (group.kind === "noise" && group.count < 2)),
      ),
    },
    {
      id: "noise",
      title: "Raw prose / formatting noise",
      groups: sortGroups(
        rawGroups.filter((group) => group.kind === "noise" && group.count > 1),
      ),
    },
    {
      id: "translated",
      title: "Translated subset diagnostics",
      groups: sortGroups(translatedGroups),
    },
    {
      id: "embedded",
      title: "Embedded program diagnostics",
      groups: sortGroups(embeddedGroups),
    },
  ].filter((bucket) => bucket.groups.length);

  const flatEntries = [...rawEntries, ...translatedEntries, ...embeddedEntries];
  const hasAggregation = buckets.some((bucket) => bucket.groups.some((group) => group.count > 1));

  return {
    buckets,
    flatEntries,
    hasAggregation,
  };
}
