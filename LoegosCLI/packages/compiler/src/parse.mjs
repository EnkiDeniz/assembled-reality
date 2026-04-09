import { HEADS, KEYWORDS } from "./constants.mjs";

function tokenize(line) {
  const tokens = [];
  const pattern = /"[^"]*"|[^\s]+/g;
  let match;
  while ((match = pattern.exec(line)) !== null) {
    const text = match[0];
    tokens.push({
      text,
      startCol: match.index + 1,
      endCol: match.index + text.length,
    });
  }
  return tokens;
}

function parseToken(token) {
  const text = typeof token === "string" ? token : token.text;
  if (text.startsWith("@")) {
    return { type: "ref", value: text.slice(1), raw: text };
  }
  if (text.startsWith('"') && text.endsWith('"')) {
    return { type: "string", value: text.slice(1, -1), raw: text };
  }
  return { type: "identifier", value: text, raw: text };
}

function tokenCategory(tokenText, index = 0) {
  if (index === 0 && HEADS.has(tokenText)) return "head";
  if (index === 1) return "verb";
  if (KEYWORDS.has(tokenText)) return "keyword";
  if (tokenText.startsWith("@")) return "ref";
  if (tokenText.startsWith('"') && tokenText.endsWith('"')) return "string";
  return "identifier";
}

function tokenizeLineForOutput(rawLine, lineNumber) {
  const line = String(rawLine || "");
  const trimmed = line.trim();
  if (!trimmed) {
    return { line: lineNumber, raw: line, type: "blank", head: null, verb: null, tokens: [] };
  }
  if (trimmed.startsWith("#")) {
    return {
      line: lineNumber,
      raw: line,
      type: "comment",
      head: null,
      verb: null,
      tokens: [
        {
          text: line,
          category: "comment",
          span: { line: lineNumber, startCol: 1, endCol: Math.max(1, line.length) },
        },
      ],
    };
  }
  const rawTokens = tokenize(line);
  const tokens = rawTokens.map((token, index) => ({
    text: token.text,
    category: tokenCategory(token.text, index),
    span: { line: lineNumber, startCol: token.startCol, endCol: token.endCol },
  }));
  const head = tokens[0]?.category === "head" ? tokens[0].text : null;
  const verb = tokens[1]?.text || null;
  return {
    line: lineNumber,
    raw: line,
    type: head ? "clause" : "unknown",
    head,
    verb,
    tokens,
  };
}

function parseLine(rawLine, lineNumber) {
  const line = String(rawLine || "");
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return { clause: null, diagnostics: [] };

  const tokens = tokenize(line);
  const diagnostics = [];

  if (tokens.length < 2) {
    diagnostics.push({
      code: "PH001",
      severity: "error",
      phase: "parse",
      message: "clause requires at least head and verb",
      span: { line: lineNumber, startCol: 1, endCol: line.length || 1 },
    });
    return { clause: null, diagnostics };
  }

  const head = tokens[0].text;
  const verb = tokens[1].text;

  if (!HEADS.has(head)) {
    diagnostics.push({
      code: "PH002",
      severity: "error",
      phase: "parse",
      message: `unknown head "${head}"`,
      span: { line: lineNumber, startCol: 1, endCol: head.length },
    });
    return { clause: null, diagnostics };
  }

  const positional = [];
  const keywords = {};
  let inKeywordRegion = false;

  for (let i = 2; i < tokens.length; i += 1) {
    const token = tokens[i].text;

    if (KEYWORDS.has(token)) {
      inKeywordRegion = true;
      if (keywords[token]) {
        diagnostics.push({
          code: "PH003",
          severity: "error",
          phase: "parse",
          message: `keyword "${token}" repeated`,
          span: { line: lineNumber, startCol: 1, endCol: line.length || 1 },
        });
        continue;
      }
      const next = tokens[i + 1]?.text;
      if (!next || KEYWORDS.has(next)) {
        diagnostics.push({
          code: "PH004",
          severity: "error",
          phase: "parse",
          message: `keyword "${token}" missing value`,
          span: { line: lineNumber, startCol: 1, endCol: line.length || 1 },
        });
        continue;
      }
      keywords[token] = parseToken(next);
      i += 1;
      continue;
    }

    if (inKeywordRegion) {
      diagnostics.push({
        code: "PH005",
        severity: "error",
        phase: "parse",
        message: "positional arguments must appear before keyword parts",
        span: { line: lineNumber, startCol: 1, endCol: line.length || 1 },
      });
      continue;
    }

    positional.push(parseToken(token));
  }

  if (
    head === "CLS" &&
    verb === "attest" &&
    (!keywords.if || !String(keywords.if?.value || "").trim())
  ) {
    diagnostics.push({
      code: "PH006",
      severity: "error",
      phase: "parse",
      message: "CLS attest requires a non-empty rationale via \"if\"",
      span: { line: lineNumber, startCol: 1, endCol: line.length || 1 },
    });
  }

  return {
    clause: {
      head,
      verb,
      positional,
      keywords,
      source: line,
      span: {
        line: lineNumber,
        startCol: 1,
        endCol: line.length || 1,
      },
    },
    diagnostics,
  };
}

export function parseSource(sourceText = "") {
  const lines = String(sourceText || "").replace(/\r\n/g, "\n").split("\n");
  const clauses = [];
  const tokenizedLines = [];
  const diagnostics = [];

  lines.forEach((line, index) => {
    tokenizedLines.push(tokenizeLineForOutput(line, index + 1));
    const result = parseLine(line, index + 1);
    diagnostics.push(...result.diagnostics);
    if (result.clause) clauses.push(result.clause);
  });

  diagnostics.sort((a, b) => {
    if (a.span.line !== b.span.line) return a.span.line - b.span.line;
    return String(a.code).localeCompare(String(b.code));
  });

  return { clauses, diagnostics, tokenizedLines };
}
