function makeShapeDiagnostic({ code, message, severity = "error", line = 1 }) {
  return {
    code,
    severity,
    phase: "shape",
    message,
    span: { line, startCol: 1, endCol: 1 },
  };
}

function activeClosureIndex(clauses) {
  for (let i = clauses.length - 1; i >= 0; i -= 1) {
    if (clauses[i].head === "CLS") return i;
  }
  return null;
}

function activePath(clauses) {
  const index = activeClosureIndex(clauses);
  if (index === null) return clauses;
  return clauses.slice(0, index + 1);
}

function hasClauseBefore(clauses, index, predicate) {
  for (let i = 0; i < index; i += 1) {
    if (predicate(clauses[i])) return true;
  }
  return false;
}

export function runShapePass(clauses = [], kindResult = { metadata: {} }) {
  const diagnostics = [];
  const active = activePath(clauses);
  const closureAttempt = active.some((clause) => clause.head === "CLS");
  const hasAim = active.some((clause) => clause.head === "DIR" && clause.verb === "aim");
  const hasGround = active.some(
    (clause) =>
      clause.head === "GND" &&
      ["witness", "constraint", "measure", "require"].includes(clause.verb),
  );
  const returns = active.filter((clause) => clause.head === "RTN");
  const moves = active.filter((clause) => clause.head === "MOV");
  const tests = active.filter((clause) => clause.head === "TST");
  const hasMoveAndTest = moves.length > 0 && tests.length > 0;
  const stories = active.filter((clause) => clause.head === "INT" && clause.verb === "story");
  const seals = active.filter((clause) => clause.head === "CLS" && clause.verb === "seal");
  const contradictions = active.filter((clause) => clause.head === "RTN" && clause.verb === "contradict");
  const importedReceiptRefs = new Set(kindResult?.metadata?.importedReceiptRefs || []);

  if (!hasAim) {
    diagnostics.push(
      makeShapeDiagnostic({
        code: "SH001",
        message: "program has no declared aim",
        line: 1,
      }),
    );
  }

  for (let i = 0; i < active.length; i += 1) {
    const clause = active[i];
    if (clause.head === "CLS" && clause.verb === "seal") {
      const hasPriorReturn = hasClauseBefore(active, i, (c) => c.head === "RTN");
      if (!hasPriorReturn) {
        diagnostics.push(
          makeShapeDiagnostic({
            code: "SH002",
            message: "seal requires at least one prior return",
            line: clause.span.line,
          }),
        );
      }
    }
  }

  for (const clause of returns) {
    const returnRef = clause.positional[0]?.type === "ref" ? clause.positional[0].value : "";
    const importedOrigin = returnRef && importedReceiptRefs.has(returnRef);
    if (!hasMoveAndTest && !importedOrigin) {
      diagnostics.push(
        makeShapeDiagnostic({
          code: "SH003",
          message: "return requires prior move/test or explicit imported receipt origin",
          line: clause.span.line,
        }),
      );
    }
  }

  if (seals.length > 0 && stories.length > 0 && !hasGround) {
    diagnostics.push(
      makeShapeDiagnostic({
        code: "SH004",
        message: "story cannot support seal without ground",
        line: seals[0].span.line,
      }),
    );
  }

  if ((kindResult?.diagnostics || []).some((d) => d.code === "KH004")) {
    diagnostics.push(
      makeShapeDiagnostic({
        code: "SH005",
        message: "reference kind changed without lawful transformation",
        line: 1,
      }),
    );
  }

  const witnessInfo = kindResult?.metadata?.witnessInfo || [];
  const hasUnanchoredWitness = witnessInfo.some((witness) => !witness.identity);
  if (closureAttempt && hasUnanchoredWitness) {
    diagnostics.push(
      makeShapeDiagnostic({
        code: "SH006",
        message: "closure attempt requires anchored witness identity on the active path",
        line: 1,
      }),
    );
  }

  const hasProvenancelessReturn = returns.some((clause) => !String(clause.keywords.via?.value || "").trim());
  if (closureAttempt && hasProvenancelessReturn) {
    diagnostics.push(
      makeShapeDiagnostic({
        code: "SH007",
        message: "closure attempt requires provenance-bearing return on the active path",
        line: 1,
      }),
    );
  }

  for (const contradiction of contradictions) {
    const contradictionLine = contradiction.span.line;
    const laterSeal = seals.find((seal) => seal.span.line > contradictionLine);
    if (!laterSeal) continue;
    const mediated = active.some(
      (clause) =>
        clause.span.line > contradictionLine &&
        clause.span.line < laterSeal.span.line &&
        clause.head === "CLS" &&
        ["flag", "reroute", "stop"].includes(clause.verb),
    );
    if (!mediated) {
      diagnostics.push(
        makeShapeDiagnostic({
          code: "SH008",
          message: "contradiction must be mediated before seal",
          line: laterSeal.span.line,
        }),
      );
    }
  }

  if (moves.length > 0 && tests.length === 0) {
    diagnostics.push(
      makeShapeDiagnostic({
        code: "SW001",
        severity: "warning",
        message: "move should declare an explicit test",
        line: moves[0].span.line,
      }),
    );
  }

  const interpretations = active.filter((clause) => clause.head === "INT");
  if (interpretations.length > 0 && !hasGround) {
    diagnostics.push(
      makeShapeDiagnostic({
        code: "SW002",
        severity: "warning",
        message: "interpretation dominates with weak or absent ground",
        line: interpretations[0].span.line,
      }),
    );
  }

  if (hasGround && moves.length === 0) {
    diagnostics.push(
      makeShapeDiagnostic({
        code: "SW003",
        severity: "warning",
        message: "ground exists but no move forces contact",
        line: 1,
      }),
    );
  }

  const flags = active.filter((clause) => clause.head === "CLS" && clause.verb === "flag");
  for (const flag of flags) {
    const hasResolution = active.some(
      (clause) =>
        clause.span.line > flag.span.line &&
        clause.head === "CLS" &&
        ["reroute", "stop"].includes(clause.verb),
    );
    if (!hasResolution) {
      diagnostics.push(
        makeShapeDiagnostic({
          code: "SW004",
          severity: "warning",
          message: "flagging repeats without resolution path",
          line: flag.span.line,
        }),
      );
    }
  }

  diagnostics.sort((a, b) => {
    if (a.span.line !== b.span.line) return a.span.line - b.span.line;
    return a.code.localeCompare(b.code);
  });

  return {
    diagnostics,
    metadata: {
      activeClosureIndex: activeClosureIndex(clauses),
      activeClosureVerb:
        activeClosureIndex(clauses) === null ? null : clauses[activeClosureIndex(clauses)].verb,
      hasMoveAndTest,
      hasAim,
      hasGround,
    },
  };
}
