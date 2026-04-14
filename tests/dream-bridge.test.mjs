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
    anchor: "block_1",
    excerpt: "Carry this passage into Room.",
    savedAt: "2026-04-13T15:00:00.000Z",
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
  assert.equal(result.anchor, null);
  assert.equal(result.excerpt, "Keep the excerpt.");
});
