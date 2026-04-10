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
