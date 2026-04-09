function tokenToText(token) {
  if (!token) return "";
  return String(token.value || token.raw || "").trim();
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
