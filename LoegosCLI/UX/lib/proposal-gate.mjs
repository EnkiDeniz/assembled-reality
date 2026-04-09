import { compileSource } from "../../packages/compiler/src/index.mjs";

function normalizeClauseText(value = "") {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function applySevenProposalGate({
  currentSource = "",
  proposal = null,
  filename = "mirror.loe",
} = {}) {
  const segments = Array.isArray(proposal?.segments) ? proposal.segments : [];
  const suggestedClauses = segments
    .flatMap((segment) => normalizeClauseText(segment?.suggestedClause || segment?.loe || ""))
    .filter(Boolean);

  if (!suggestedClauses.length) {
    return {
      accepted: false,
      reason: "empty_proposal",
      diagnostics: [],
      nextSource: currentSource,
      artifact: compileSource({ source: currentSource, filename }),
    };
  }

  const sourcePrefix = String(currentSource || "").trim();
  const nextSource = `${sourcePrefix}${sourcePrefix ? "\n" : ""}${suggestedClauses.join("\n")}\n`;
  const artifact = compileSource({ source: nextSource, filename });

  if (artifact.summary.hardErrorCount > 0) {
    return {
      accepted: false,
      reason: "compile_blocked",
      diagnostics: artifact.diagnostics,
      nextSource: currentSource,
      artifact,
    };
  }

  return {
    accepted: true,
    reason: "",
    diagnostics: artifact.diagnostics,
    nextSource,
    artifact,
  };
}
