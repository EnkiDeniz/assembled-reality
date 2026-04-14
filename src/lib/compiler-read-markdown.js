import { buildCompilerReadDiagnosticsView } from "./compiler-read-diagnostics.js";

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function sentenceCase(value = "") {
  const normalized = normalizeText(value).replace(/_/g, " ");
  if (!normalized) return "";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatBulletList(values = []) {
  return values.filter(Boolean).map((value) => `- ${value}`).join("\n");
}

function formatDiagnosticGroups(compilerRead = null) {
  const diagnosticsView = buildCompilerReadDiagnosticsView({
    rawDocumentResult: compilerRead?.rawDocumentResult || null,
    translatedSubsetResult: compilerRead?.translatedSubsetResult || null,
    embeddedExecutableResult: compilerRead?.embeddedExecutableResult || null,
  });

  return diagnosticsView.buckets
    .map((bucket) => {
      const body = bucket.groups
        .map((group) => {
          const samples = group.sampleTokens.length
            ? ` Samples: ${group.sampleTokens.join(", ")}.`
            : "";
          const messages = !group.sampleTokens.length && group.sampleMessages.length
            ? ` Example: ${group.sampleMessages[0]}.`
            : "";
          return `- ${group.code} ${group.family}: ${group.count} occurrence${group.count === 1 ? "" : "s"}.${samples}${messages}`;
        })
        .join("\n");
      return `### ${bucket.title}\n${body}`;
    })
    .join("\n\n");
}

export function formatCompilerReadAsMarkdown({
  title = "",
  versionLabel = "",
  versionCreatedAt = "",
  compilerRead = null,
} = {}) {
  if (!compilerRead) {
    return "";
  }

  const claimSet = Array.isArray(compilerRead?.claimSet) ? compilerRead.claimSet : [];
  const nextMoves = Array.isArray(compilerRead?.nextMoves) ? compilerRead.nextMoves : [];
  const omittedIds = Array.isArray(compilerRead?.translatedSubsetResult?.omittedClaims)
    ? compilerRead.translatedSubsetResult.omittedClaims
    : [];
  const omittedClaims = omittedIds
    .map((claimId) => claimSet.find((claim) => claim.id === claimId))
    .filter(Boolean);

  const sections = [
    `# Compiler Read`,
    title ? `## Document\n- ${title}` : "",
    versionLabel || versionCreatedAt
      ? `## Version\n${formatBulletList([
          versionLabel ? `Version: ${versionLabel}` : "",
          versionCreatedAt ? `Created: ${versionCreatedAt}` : "",
        ])}`
      : "",
    `## Summary\n${formatBulletList([
      compilerRead?.verdict?.readDisposition ? `Disposition: ${sentenceCase(compilerRead.verdict.readDisposition)}` : "",
      compilerRead?.verdict?.primaryFinding ? `Primary finding: ${compilerRead.verdict.primaryFinding}` : "",
      compilerRead?.documentSummary?.documentType ? `Document type: ${sentenceCase(compilerRead.documentSummary.documentType)}` : "",
    ])}`,
    nextMoves.length ? `## Next Moves\n${formatBulletList(nextMoves)}` : "",
    claimSet.length
      ? `## Grounded Claims\n${claimSet
          .map((claim) =>
            formatBulletList([
              claim?.text || "Untitled claim",
              claim?.sourceExcerpt ? `Excerpt: ${claim.sourceExcerpt}` : "",
              claim?.reason ? `Reason: ${claim.reason}` : "",
            ]),
          )
          .join("\n")}`
      : "",
    omittedClaims.length
      ? `## Omitted Material\n${omittedClaims
          .map((claim) =>
            formatBulletList([
              claim?.text || "Untitled claim",
              claim?.reason || "This claim could not travel cleanly in the current subset.",
            ]),
          )
          .join("\n")}`
      : "",
    `## Diagnostics\n${formatDiagnosticGroups(compilerRead) || "- No diagnostics recorded."}`,
  ].filter(Boolean);

  return `${sections.join("\n\n")}\n`;
}
