import test from "node:test";
import assert from "node:assert/strict";

import { formatCompilerReadAsMarkdown } from "../src/lib/compiler-read-markdown.js";

test("compiler read markdown export includes version context, findings, claims, omitted material, and diagnostics", () => {
  const markdown = formatCompilerReadAsMarkdown({
    title: "Strategy Memo",
    versionLabel: "v2",
    versionCreatedAt: "2026-04-14T16:00:00.000Z",
    compilerRead: {
      verdict: {
        readDisposition: "mixed_needs_more_witness",
        primaryFinding: "The document has one clear proving path.",
      },
      documentSummary: {
        documentType: "mixed",
      },
      nextMoves: ["Test the proving path against one real artifact."],
      claimSet: [
        {
          id: "claim-1",
          text: "Ground the proving path in one artifact.",
          sourceExcerpt: "Ground the proving path in one artifact.",
          reason: "This recommendation is explicit in the memo.",
        },
        {
          id: "claim-2",
          text: "Do not widen yet.",
          reason: "The memo keeps the lane narrow.",
        },
      ],
      translatedSubsetResult: {
        omittedClaims: ["claim-2"],
      },
      rawDocumentResult: {
        diagnostics: [
          { code: "PH002", severity: "error", message: 'unknown head "**Status:**"', line: 2 },
          { code: "PH002", severity: "error", message: 'unknown head "December"', line: 8 },
        ],
      },
    },
  });

  assert.match(markdown, /^# Compiler Read/m);
  assert.match(markdown, /Strategy Memo/);
  assert.match(markdown, /Version: v2/);
  assert.match(markdown, /Primary finding: The document has one clear proving path\./);
  assert.match(markdown, /Ground the proving path in one artifact\./);
  assert.match(markdown, /Do not widen yet\./);
  assert.match(markdown, /Raw prose \/ formatting noise/);
  assert.match(markdown, /PH002 unknown head: 2 occurrences\./);
});
