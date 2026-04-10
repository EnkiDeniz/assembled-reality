function tokenToText(token) {
  if (!token) return "";
  return String(token.value || token.raw || "").trim();
}

function countClauses(clauses = [], head = "") {
  return clauses.filter((clause) => clause.head === head).length;
}

function toWord(value = "") {
  return String(value || "").trim().toLowerCase();
}

export function buildBoxSectionsFromArtifact(artifact = null) {
  const clauses = Array.isArray(artifact?.ast) ? artifact.ast : [];
  const aimClause = clauses.find((clause) => clause.head === "DIR" && clause.verb === "aim") || null;

  const evidence = clauses
    .filter((clause) => clause.head === "GND")
    .map((clause) => ({
      line: clause.span?.line || 0,
      text: `${clause.verb} ${clause.positional.map(tokenToText).join(" ")}`.trim(),
    }));

  const story = clauses
    .filter((clause) => clause.head === "INT")
    .map((clause) => ({
      line: clause.span?.line || 0,
      text: `${clause.verb} ${clause.positional.map(tokenToText).join(" ")}`.trim(),
    }));

  const actions = clauses
    .filter((clause) => ["MOV", "TST", "RTN", "CLS"].includes(clause.head))
    .map((clause) => ({
      line: clause.span?.line || 0,
      text: `${clause.head} ${clause.verb} ${clause.positional.map(tokenToText).join(" ")}`.trim(),
    }));

  return {
    aim: aimClause ? tokenToText(aimClause.positional[0]) : "",
    evidence,
    story,
    actions,
  };
}

export function splitDiagnostics(diagnostics = []) {
  const all = Array.isArray(diagnostics) ? diagnostics : [];
  return {
    errors: all.filter((diagnostic) => diagnostic.severity === "error"),
    warnings: all.filter((diagnostic) => diagnostic.severity === "warning"),
    infos: all.filter((diagnostic) => diagnostic.severity === "info"),
  };
}

export function buildEchoFieldModel(artifact = null, runtimeWindow = null) {
  const clauses = Array.isArray(artifact?.ast) ? artifact.ast : [];
  const returns = clauses.filter((clause) => clause.head === "RTN");
  const stories = clauses.filter((clause) => clause.head === "INT");
  const grounds = clauses.filter((clause) => clause.head === "GND");

  const lastMoveLine = clauses
    .filter((clause) => clause.head === "MOV")
    .map((clause) => Number(clause?.span?.line || 0))
    .reduce((max, line) => (line > max ? line : max), 0);
  const lastReturnLine = returns
    .map((clause) => Number(clause?.span?.line || 0))
    .reduce((max, line) => (line > max ? line : max), 0);

  const pingSent = countClauses(clauses, "MOV") > 0 && countClauses(clauses, "TST") > 0;
  const waiting = pingSent && lastMoveLine > lastReturnLine;

  const latestReturn = returns.at(-1) || null;
  const returnVia = toWord(tokenToText(latestReturn?.keywords?.via));
  const returnProvenance = returnVia
    ? returnVia
    : latestReturn
      ? "unlabeled"
      : "none";

  const echoCount = grounds.length + returns.length;
  const storyCount = stories.length;
  const ratioTotal = echoCount + storyCount;
  const echoRatio = ratioTotal > 0 ? echoCount / ratioTotal : 0;
  const fogRatio = 1 - echoRatio;

  let fogDensity = "thick";
  if (fogRatio <= 0.2) fogDensity = "clear";
  else if (fogRatio <= 0.4) fogDensity = "light";
  else if (fogRatio <= 0.65) fogDensity = "moderate";

  const mergedState = toWord(artifact?.mergedWindowState || runtimeWindow?.state || "open");
  let fieldState = "fog";
  if (mergedState === "shape_error" || mergedState === "flagged") {
    fieldState = "fractured";
  } else if (waiting) {
    fieldState = "awaiting";
  } else if (
    mergedState === "sealed" ||
    mergedState === "awaiting" ||
    (returns.length > 0 && mergedState !== "attested")
  ) {
    fieldState = "mapped";
  }

  return {
    fieldState,
    pingSent,
    waiting,
    returnProvenance,
    echoCount,
    storyCount,
    echoRatio,
    fogDensity,
  };
}

function countHead(artifact = null, head = "") {
  const clauses = Array.isArray(artifact?.ast) ? artifact.ast : [];
  return clauses.filter((clause) => clause.head === head).length;
}

function buildEdgeChainSummary(artifact = null) {
  const edges = Array.isArray(artifact?.assemblyGraph?.edges) ? artifact.assemblyGraph.edges : [];
  if (edges.length === 0) return "";
  return edges
    .slice(0, 3)
    .map((edge) => {
      if (edge.kind === "transform") {
        return `${edge.from} ${edge.op} ${edge.into}`;
      }
      if (edge.kind === "compare") {
        return `${edge.left} compare ${edge.right}`;
      }
      return edge.kind || "edge";
    })
    .join(" -> ");
}

export function deriveDistantEchoSignal(previousArtifact = null, nextArtifact = null) {
  if (!previousArtifact || !nextArtifact) return null;
  const previousModel = buildEchoFieldModel(previousArtifact, null);
  const nextModel = buildEchoFieldModel(nextArtifact, null);

  const previousReturnCount = countHead(previousArtifact, "RTN");
  const nextReturnCount = countHead(nextArtifact, "RTN");
  const previousPingCount = countHead(previousArtifact, "MOV") + countHead(previousArtifact, "TST");
  const nextPingCount = countHead(nextArtifact, "MOV") + countHead(nextArtifact, "TST");

  const returnDelta = nextReturnCount - previousReturnCount;
  const pingDelta = nextPingCount - previousPingCount;
  const becameMapped =
    previousModel.fieldState !== "mapped" &&
    nextModel.fieldState === "mapped";

  if (!(becameMapped && returnDelta > 0 && pingDelta <= 0)) {
    return null;
  }

  return {
    previousFieldState: previousModel.fieldState,
    nextFieldState: nextModel.fieldState,
    returnProvenance: nextModel.returnProvenance,
    returnDelta,
    pingDelta,
    chainSummary: buildEdgeChainSummary(nextArtifact),
  };
}

export function extractClausesByHead(artifact = null, head = "") {
  const clauses = Array.isArray(artifact?.ast) ? artifact.ast : [];
  return clauses.filter((clause) => clause.head === head);
}

export function clauseSummary(clause = null) {
  if (!clause) return "";
  const head = String(clause?.head || "").trim();
  const verb = String(clause?.verb || "").trim();
  const positional = Array.isArray(clause?.positional) ? clause.positional : [];
  const text = positional
    .map((token) => String(token?.value || token?.raw || "").trim())
    .join(" ")
    .trim();
  return `${head} ${verb} ${text}`.trim();
}

export function getClauseKeyword(clause = null, key = "") {
  return String(clause?.keywords?.[key]?.value || clause?.keywords?.[key]?.raw || "").trim();
}

export function getLastReturnClause(artifact = null) {
  const returns = extractClausesByHead(artifact, "RTN");
  return returns.length ? returns[returns.length - 1] : null;
}

export function deriveLatestQualifiedReturnAt(runtimeRecord = null) {
  const events = Array.isArray(runtimeRecord?.events) ? runtimeRecord.events : [];
  const matched = events
    .filter((event) => event?.kind === "return_received")
    .map((event) => event?.createdAt)
    .filter(Boolean)
    .pop();
  return String(matched || "").trim();
}

export function deriveFreshnessState(updatedAt = "") {
  const timestamp = Date.parse(String(updatedAt || "").trim());
  if (!Number.isFinite(timestamp)) return "unknown";
  const ageMs = Date.now() - timestamp;
  if (ageMs <= 5 * 60 * 1000) return "fresh";
  if (ageMs <= 60 * 60 * 1000) return "aging";
  return "stale";
}

export function formatAgeLabel(timestamp = "") {
  const value = Date.parse(String(timestamp || "").trim());
  if (!Number.isFinite(value)) return "not_returned";
  const deltaSeconds = Math.max(0, Math.floor((Date.now() - value) / 1000));
  if (deltaSeconds < 60) return `${deltaSeconds}s`;
  const deltaMinutes = Math.floor(deltaSeconds / 60);
  if (deltaMinutes < 60) return `${deltaMinutes}m`;
  const deltaHours = Math.floor(deltaMinutes / 60);
  return `${deltaHours}h`;
}

export function mapMergedStateForField(mergedState = "") {
  const normalized = String(mergedState || "").trim().toLowerCase();
  if (normalized === "shape_error" || normalized === "flagged") return "fractured";
  if (normalized === "attested") return "fog";
  if (normalized === "awaiting") return "awaiting";
  if (normalized === "sealed") return "mapped";
  return "fog";
}

export function deriveDomainKeyForEntry(entry = null) {
  const sections = buildBoxSectionsFromArtifact(entry?.artifact);
  const aimKey = String(sections.aim || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
  if (aimKey) {
    const tokens = aimKey.split("_").filter(Boolean);
    return tokens.slice(0, 2).join("_") || aimKey;
  }
  const filename = String(entry?.filename || "").trim().toLowerCase();
  const fileKey = filename
    .replace(/\.loe$/, "")
    .split(/[-_]/)
    .slice(0, 2)
    .join("_");
  return fileKey
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

export function deriveEntrySignalProfile(entry = null) {
  const sourceDocuments = Array.isArray(entry?.sourceDocuments) ? entry.sourceDocuments : [];
  const events = Array.isArray(entry?.runtimeWindow?.events) ? entry.runtimeWindow.events : [];
  const importedEvents = events.filter((event) => event?.kind === "intake_imported");
  const linkedImports = importedEvents.filter(
    (event) => String(event?.metadata?.kind || "").trim() === "link",
  ).length;
  const externalEvidenceSignals = sourceDocuments.length + linkedImports;
  return {
    domainKey: deriveDomainKeyForEntry(entry),
    importedEventsCount: importedEvents.length,
    sourceDocumentsCount: sourceDocuments.length,
    externalEvidenceSignals,
    sharedCandidate: externalEvidenceSignals > 0,
  };
}

export function buildScopedEntries({ files = {}, activeFile = "", levelKey = "box" }) {
  const entries = Object.entries(files || {}).map(([filename, entry]) => ({ filename, ...entry }));
  if (levelKey === "box") {
    return entries.filter((entry) => entry.filename === activeFile);
  }
  if (levelKey === "domain") {
    const activeEntry = entries.find((entry) => entry.filename === activeFile) || null;
    const domainKey = deriveDomainKeyForEntry(activeEntry);
    if (!domainKey) return activeEntry ? [activeEntry] : [];
    const domainEntries = entries.filter((entry) => deriveDomainKeyForEntry(entry) === domainKey);
    return domainEntries.length ? domainEntries : activeEntry ? [activeEntry] : [];
  }
  if (levelKey === "shared") {
    return entries.filter((entry) => deriveEntrySignalProfile(entry).sharedCandidate);
  }
  return entries;
}

function toDisplayChipLabel(state = "") {
  const value = String(state || "").trim().toLowerCase();
  if (!value) return "open";
  return value;
}

export function deriveStateChipModel(artifact = null, runtimeWindow = null) {
  const mergedState = toDisplayChipLabel(artifact?.mergedWindowState || runtimeWindow?.state || "open");
  const diagnostics = Array.isArray(artifact?.diagnostics) ? artifact.diagnostics : [];
  const hardErrors = diagnostics.filter((entry) => entry?.severity === "error").length;
  const model = buildEchoFieldModel(artifact, runtimeWindow);
  const stateLabel =
    hardErrors > 0 && mergedState !== "shape_error"
      ? "shape_error"
      : mergedState;
  return {
    stateLabel,
    mergedState,
    hardErrors,
    fieldState: model.fieldState,
    waiting: model.waiting,
    pingSent: model.pingSent,
  };
}

function derivePaneContracts(chipModel, artifact = null) {
  const returns = extractClausesByHead(artifact, "RTN");
  const pingReady = chipModel.pingSent;
  const hasReturn = returns.length > 0;
  const waiting = chipModel.waiting;
  const fractured = chipModel.fieldState === "fractured";
  const mapped = chipModel.fieldState === "mapped";

  return {
    ping: {
      requiredAction: pingReady ? "Refine the active test probe." : "Send one ping (MOV + TST).",
      proofCondition: "A MOV and TST clause are both present.",
    },
    listen: {
      requiredAction: waiting ? "Wait for one return with provenance." : "No active wait. Keep listening ambient.",
      proofCondition: "Last move is matched by an RTN or no ping is outstanding.",
    },
    echoes: {
      requiredAction: hasReturn ? "Review the latest returned evidence." : "Collect one return-backed signal (RTN via ...).",
      proofCondition: "At least one RTN clause is present with provenance.",
    },
    field: {
      requiredAction: fractured
        ? "Resolve structural break before closure."
        : mapped
          ? "Decide lawful close: seal or attest with rationale."
          : "Reduce fog with returned evidence.",
      proofCondition: "Mapped/sealed only when return evidence exists and no hard shape error blocks.",
    },
  };
}

export function derivePaneInteractionContract(artifact = null, runtimeWindow = null) {
  const chipModel = deriveStateChipModel(artifact, runtimeWindow);
  const paneContract = derivePaneContracts(chipModel, artifact);
  const nextBestAction =
    chipModel.stateLabel === "shape_error" || chipModel.stateLabel === "flagged"
      ? "Fix shape violations first, then retry the loop."
      : !chipModel.pingSent
        ? "Send a lawful ping: add MOV and TST."
        : chipModel.waiting
          ? "Capture one return with provenance to clear awaiting."
          : chipModel.fieldState !== "mapped"
            ? "Gather return-backed evidence to map the field."
            : "Choose closure deliberately: CLS seal, or CLS attest with rationale.";
  return {
    stateChip: chipModel,
    paneContract,
    nextBestAction,
  };
}
