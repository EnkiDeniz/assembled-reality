import test from "node:test";
import assert from "node:assert/strict";

import { normalizeDreamBridgePayload } from "../src/lib/dream-bridge.js";

test("normalizeDreamBridgePayload keeps the MVP bridge contract stable", () => {
  const result = normalizeDreamBridgePayload({
    kind: "witness",
    documentId: "dream_doc_1",
    documentTitle: "Field Notes",
    anchor: "block_1",
    excerpt: "Carry this passage into Room.",
    savedAt: "2026-04-13T15:00:00.000Z",
  });

  assert.deepEqual(result, {
    kind: "witness",
    state: "pending",
    documentId: "dream_doc_1",
    documentTitle: "Field Notes",
    sourceLabel: "Field Notes",
    provenanceLabel: "From Library",
    versionId: null,
    versionLabel: null,
    anchor: "block_1",
    excerpt: "Carry this passage into Room.",
    savedAt: "2026-04-13T15:00:00.000Z",
    readSummary: null,
    receiptStatus: null,
  });
});

test("normalizeDreamBridgePayload accepts read summary bridge payloads", () => {
  const result = normalizeDreamBridgePayload({
    kind: "read_summary",
    state: "armed",
    documentId: "dream_doc_4",
    documentTitle: "Field Notes",
    anchor: "block_2",
    excerpt: "This read stays provisional.",
    readSummary: {
      primaryFinding: "The document is not direct source.",
      nextMove: "Discuss the provisional read in Room.",
      readDisposition: "informative_only",
    },
  });

  assert.deepEqual(result, {
    kind: "read_summary",
    state: "armed",
    documentId: "dream_doc_4",
    documentTitle: "Field Notes",
    sourceLabel: "Field Notes",
    provenanceLabel: "From Library",
    versionId: null,
    versionLabel: null,
    anchor: "block_2",
    excerpt: "This read stays provisional.",
    savedAt: result.savedAt,
    readSummary: {
      primaryFinding: "The document is not direct source.",
      nextMove: "Discuss the provisional read in Room.",
      readDisposition: "informative_only",
    },
    receiptStatus: null,
  });
});

test("normalizeDreamBridgePayload rejects incomplete bridge payloads and falls back to passage", () => {
  assert.equal(
    normalizeDreamBridgePayload({
      documentId: "dream_doc_2",
      documentTitle: "Field Notes",
      anchor: "",
      excerpt: "",
    }),
    null,
  );

  const result = normalizeDreamBridgePayload({
    kind: "unknown-shape",
    documentId: "dream_doc_3",
    sourceLabel: "Fallback Title",
    excerpt: "Keep the excerpt.",
  });

  assert.equal(result.kind, "passage");
  assert.equal(result.state, "pending");
  assert.equal(result.documentTitle, "Fallback Title");
  assert.equal(result.sourceLabel, "Fallback Title");
  assert.equal(result.provenanceLabel, "From Library");
  assert.equal(result.versionId, null);
  assert.equal(result.versionLabel, null);
  assert.equal(result.anchor, null);
  assert.equal(result.excerpt, "Keep the excerpt.");
  assert.equal(result.readSummary, null);
  assert.equal(result.receiptStatus, null);
});

test("normalizeDreamBridgePayload preserves version provenance when present", () => {
  const result = normalizeDreamBridgePayload({
    kind: "read_summary",
    documentId: "dream_doc_7",
    documentTitle: "Memo",
    versionId: "version_3",
    versionLabel: "v3",
    excerpt: "Carry the revised read.",
  });

  assert.equal(result.versionId, "version_3");
  assert.equal(result.versionLabel, "v3");
});

test("normalizeDreamBridgePayload keeps dismissed bridge payloads recoverable", () => {
  const result = normalizeDreamBridgePayload({
    kind: "passage",
    state: "dismissed",
    documentId: "dream_doc_8",
    documentTitle: "Memo",
    versionId: "version_4",
    versionLabel: "v4",
    excerpt: "Keep this passage recoverable.",
  });

  assert.equal(result.state, "dismissed");
  assert.equal(result.versionId, "version_4");
  assert.equal(result.versionLabel, "v4");
  assert.equal(result.excerpt, "Keep this passage recoverable.");
});
