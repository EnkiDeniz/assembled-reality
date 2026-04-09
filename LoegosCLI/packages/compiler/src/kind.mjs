import {
  ADAPTERS,
  CHANNELS,
  RESERVED_VERBS,
  SCALAR_KINDS,
  signatureFor,
} from "./constants.mjs";

function makeDiagnostic({ code, message, clause, severity = "error" }) {
  return {
    code,
    severity,
    phase: "kind",
    message,
    span: clause?.span || { line: 1, startCol: 1, endCol: 1 },
  };
}

function keyFor(clause) {
  return `${clause.head}:${clause.verb}`;
}

function readRef(token) {
  return token?.type === "ref" ? token.value : "";
}

function bindSymbol(symbols, name, kind, clause, diagnostics, metadata = {}) {
  if (!name) return;
  const current = symbols.get(name);
  if (!current) {
    symbols.set(name, { kind, ...metadata });
    return;
  }
  if (current.kind !== kind) {
    diagnostics.push(
      makeDiagnostic({
        code: "KH004",
        message: `reference @${name} changed kind from ${current.kind} to ${kind}`,
        clause,
      }),
    );
    return;
  }
  symbols.set(name, { ...current, ...metadata });
}

function expectRefKind(symbols, token, expectedKinds, clause, diagnostics) {
  const refName = readRef(token);
  if (!refName) return;
  const symbol = symbols.get(refName);
  if (!symbol) {
    diagnostics.push(
      makeDiagnostic({
        code: "KH001",
        message: `reference @${refName} used before binding`,
        clause,
      }),
    );
    return;
  }
  if (!expectedKinds.includes(symbol.kind)) {
    diagnostics.push(
      makeDiagnostic({
        code: "KH002",
        message: `reference @${refName} expected kind ${expectedKinds.join("|")}, got ${symbol.kind}`,
        clause,
      }),
    );
  }
}

function checkSignature(clause, diagnostics) {
  const signature = signatureFor(clause.head, clause.verb);
  if (!signature) {
    diagnostics.push(
      makeDiagnostic({
        code: "KH000",
        message: `unknown verb "${clause.verb}" for head "${clause.head}"`,
        clause,
      }),
    );
    return null;
  }

  const count = clause.positional.length;
  if (count < signature.minPositional || count > signature.maxPositional) {
    diagnostics.push(
      makeDiagnostic({
        code: "KH007",
        message: `invalid positional count for ${keyFor(clause)}: got ${count}`,
        clause,
      }),
    );
  }

  Object.keys(clause.keywords).forEach((keyword) => {
    if (!signature.allowedKeywords.includes(keyword)) {
      diagnostics.push(
        makeDiagnostic({
          code: "KH008",
          message: `keyword "${keyword}" not allowed for ${keyFor(clause)}`,
          clause,
        }),
      );
    }
  });

  signature.requiredKeywords.forEach((keyword) => {
    if (!clause.keywords[keyword]) {
      diagnostics.push(
        makeDiagnostic({
          code: "KH009",
          message: `keyword "${keyword}" required for ${keyFor(clause)}`,
          clause,
        }),
      );
    }
  });

  return signature;
}

export function runKindPass(clauses = []) {
  const diagnostics = [];
  const symbols = new Map();
  const witnessInfo = [];
  const importedReceiptRefs = new Set();

  for (const clause of clauses) {
    if (!RESERVED_VERBS[clause.head]?.has(clause.verb)) {
      diagnostics.push(
        makeDiagnostic({
          code: "KH000",
          message: `unknown verb "${clause.verb}" for head "${clause.head}"`,
          clause,
        }),
      );
      continue;
    }

    const signature = checkSignature(clause, diagnostics);
    if (!signature) continue;

    if (clause.head === "DIR" && clause.verb === "aim") {
      const refName = readRef(clause.positional[0]);
      if (refName) bindSymbol(symbols, refName, "aim", clause, diagnostics);
    }

    if (clause.head === "GND" && clause.verb === "box") {
      const refName = readRef(clause.positional[0]);
      if (refName) bindSymbol(symbols, refName, "box", clause, diagnostics);
    }

    if (clause.head === "GND" && clause.verb === "witness") {
      const refName = readRef(clause.positional[0]);
      if (refName) {
        bindSymbol(symbols, refName, "witness", clause, diagnostics, {
          identity: clause.keywords.with?.value || null,
          source: clause.keywords.from?.value || null,
        });
        witnessInfo.push({
          ref: refName,
          identity: clause.keywords.with?.value || null,
          clause,
        });
      }
    }

    if (clause.head === "GND" && clause.verb === "measure") {
      const scalarKind = clause.keywords.as?.value || "";
      if (scalarKind && !SCALAR_KINDS.has(scalarKind)) {
        diagnostics.push(
          makeDiagnostic({
            code: "KH005",
            message: `invalid scalar kind "${scalarKind}"`,
            clause,
          }),
        );
      }
      const refName = readRef(clause.positional[0]);
      if (refName) bindSymbol(symbols, refName, "measure", clause, diagnostics);
    }

    if (clause.head === "XFM" && ["compile", "weld", "stage"].includes(clause.verb)) {
      expectRefKind(symbols, clause.positional[0], ["witness", "block", "structure"], clause, diagnostics);
      const targetRef = readRef(clause.keywords.into);
      if (!targetRef) {
        diagnostics.push(
          makeDiagnostic({
            code: "KH003",
            message: `${keyFor(clause)} requires "into @structure"`,
            clause,
          }),
        );
      } else {
        bindSymbol(symbols, targetRef, "structure", clause, diagnostics);
      }
    }

    if (clause.head === "XFM" && clause.verb === "use") {
      const refName = readRef(clause.positional[0]);
      if (refName) {
        const kind = refName.includes("receipt") ? "receipt" : "structure";
        bindSymbol(symbols, refName, kind, clause, diagnostics, { imported: true });
        if (kind === "receipt") importedReceiptRefs.add(refName);
      }
    }

    if (clause.head === "MOV") {
      const adapter = clause.keywords.via?.value || "";
      if (!ADAPTERS.has(adapter)) {
        diagnostics.push(
          makeDiagnostic({
            code: "KH006",
            message: `invalid runtime adapter "${adapter}"`,
            clause,
          }),
        );
      }
      const refName = readRef(clause.positional[0]);
      if (refName) bindSymbol(symbols, refName, "move", clause, diagnostics);
    }

    if (clause.head === "TST") {
      const refName = readRef(clause.positional[0]);
      if (refName) bindSymbol(symbols, refName, "test", clause, diagnostics);
    }

    if (clause.head === "RTN") {
      const refName = readRef(clause.positional[0]);
      if (refName) bindSymbol(symbols, refName, "receipt", clause, diagnostics);
      const channel = clause.keywords.via?.value || "";
      if (channel && !CHANNELS.has(channel)) {
        diagnostics.push(
          makeDiagnostic({
            code: "KH006",
            message: `invalid return channel "${channel}"`,
            clause,
          }),
        );
      }
      const scalarKind = clause.keywords.as?.value || "";
      if (scalarKind && !SCALAR_KINDS.has(scalarKind)) {
        diagnostics.push(
          makeDiagnostic({
            code: "KH005",
            message: `invalid scalar kind "${scalarKind}"`,
            clause,
          }),
        );
      }
    }
  }

  const symbolTable = [...symbols.entries()]
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => a.name.localeCompare(b.name));

  diagnostics.sort((a, b) => {
    if (a.span.line !== b.span.line) return a.span.line - b.span.line;
    return a.code.localeCompare(b.code);
  });

  return {
    symbolTable,
    diagnostics,
    metadata: {
      witnessInfo: witnessInfo.map((item) => ({
        ref: item.ref,
        identity: item.identity,
        line: item.clause.span.line,
      })),
      importedReceiptRefs: [...importedReceiptRefs].sort(),
    },
  };
}
