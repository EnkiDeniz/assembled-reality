import { parseSource } from "./parse.mjs";
import { runKindPass } from "./kind.mjs";
import { runShapePass } from "./shape.mjs";

function stableSortDiagnostics(diagnostics = []) {
  return [...diagnostics].sort((a, b) => {
    const lineA = Number(a?.span?.line || 0);
    const lineB = Number(b?.span?.line || 0);
    if (lineA !== lineB) return lineA - lineB;
    return String(a.code || "").localeCompare(String(b.code || ""));
  });
}

function deterministicId(source) {
  const input = String(source || "");
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash >>> 0).toString(16).padStart(16, "0").slice(0, 16);
}

function buildAssemblyGraph(clauses = []) {
  const nodes = [];
  const edges = [];

  clauses.forEach((clause, index) => {
    nodes.push({
      id: `line:${index + 1}`,
      head: clause.head,
      verb: clause.verb,
      line: clause.span.line,
    });

    if (clause.head === "XFM" && ["compile", "weld", "stage"].includes(clause.verb)) {
      const fromRef =
        clause.positional[0]?.type === "ref" ? `@${clause.positional[0].value}` : clause.positional[0]?.value;
      const intoRef =
        clause.keywords.into?.type === "ref"
          ? `@${clause.keywords.into.value}`
          : clause.keywords.into?.value || "";
      if (fromRef && intoRef) {
        edges.push({
          kind: "transform",
          op: clause.verb,
          from: fromRef,
          into: intoRef,
          line: clause.span.line,
        });
      }
    }

    if (clause.head === "XFM" && clause.verb === "compare") {
      const left =
        clause.positional[0]?.type === "ref" ? `@${clause.positional[0].value}` : clause.positional[0]?.value;
      const right =
        clause.keywords.against?.type === "ref"
          ? `@${clause.keywords.against.value}`
          : clause.keywords.against?.value || "";
      if (left && right) {
        edges.push({
          kind: "compare",
          left,
          right,
          line: clause.span.line,
        });
      }
    }
  });

  return { nodes, edges };
}

function closureStateFromVerb(verb) {
  if (verb === "seal") return "sealed";
  if (verb === "flag") return "flagged";
  if (verb === "stop") return "stopped";
  if (verb === "reroute") return "rerouted";
  if (verb === "attest") return "attested";
  return "open";
}

function deriveCompileState(hardErrorCount, warningCount) {
  if (hardErrorCount > 0) return "blocked";
  if (warningCount > 0) return "warning";
  return "clean";
}

function deriveRuntimeState(clauses = [], closureType = null) {
  if (closureType) return "closed";
  const hasReturn = clauses.some((clause) => clause.head === "RTN");
  const hasMoveAndTest =
    clauses.some((clause) => clause.head === "MOV") &&
    clauses.some((clause) => clause.head === "TST");
  if (hasReturn) return "returned";
  if (hasMoveAndTest) return "awaiting";
  return "open";
}

function deriveMergedWindowState({ compileState, runtimeState, closureType }) {
  if (compileState === "blocked") return "shape_error";
  if (closureType === "flag") return "flagged";
  if (runtimeState === "awaiting" || runtimeState === "returned") return "awaiting";
  if (closureType === "attest") return "attested";
  if (closureType === "reroute") return "rerouted";
  if (closureType === "stop") return "stopped";
  if (closureType === "seal") return "sealed";
  return "open";
}

export function compileSource({ source = "", filename = "" } = {}) {
  const parsed = parseSource(source);
  const kind = runKindPass(parsed.clauses);
  const shape = runShapePass(parsed.clauses, kind);
  const diagnostics = stableSortDiagnostics([
    ...parsed.diagnostics,
    ...kind.diagnostics,
    ...shape.diagnostics,
  ]);

  const hardErrorCount = diagnostics.filter((d) => d.severity === "error").length;
  const warningCount = diagnostics.filter((d) => d.severity === "warning").length;
  const compileState = deriveCompileState(hardErrorCount, warningCount);
  const compilationId = deterministicId(`${filename}:${source}`);
  const assemblyGraph = buildAssemblyGraph(parsed.clauses);

  const activeClosureVerb = shape.metadata.activeClosureVerb;
  const closureType = activeClosureVerb || null;
  const closureStateSuggestion = closureStateFromVerb(activeClosureVerb);
  const runtimeState = deriveRuntimeState(parsed.clauses, closureType);
  const mergedWindowState = deriveMergedWindowState({
    compileState,
    runtimeState,
    closureType,
  });

  return {
    artifactVersion: "0.5.0",
    compilationId,
    filename,
    tokenizedLines: parsed.tokenizedLines,
    ast: parsed.clauses,
    symbolTable: kind.symbolTable,
    assemblyGraph,
    diagnostics,
    compileState,
    runtimeState,
    closureType,
    mergedWindowState,
    stats: {
      lineCount: parsed.tokenizedLines.length,
      clauseCount: parsed.clauses.length,
      errorCount: hardErrorCount,
      warningCount,
      symbolCount: kind.symbolTable.length,
    },
    summary: {
      hardErrorCount,
      warningCount,
      ok: hardErrorCount === 0,
    },
    metadata: {
      activeClosureVerb,
      closureStateSuggestion,
      witnessInfo: kind.metadata.witnessInfo,
      importedReceiptRefs: kind.metadata.importedReceiptRefs,
    },
  };
}
