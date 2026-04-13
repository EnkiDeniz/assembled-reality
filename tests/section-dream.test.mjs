import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDreamChunkMap,
  buildDreamDocumentRecord,
  findDreamPositionByElapsedMs,
  getDreamElapsedMs,
  getDreamQueueDurationMs,
  normalizeDreamMarkdown,
  normalizeDreamSession,
} from "../src/lib/dream.js";

test("section dream markdown normalization strips syntax but keeps listening structure", () => {
  const normalized = normalizeDreamMarkdown(`
# North Star

We **ship** [clear listening](https://example.com) for readers.

- First move
- Second move

> Keep the signal.

\`\`\`js
const hidden = true;
\`\`\`
`);

  assert.match(normalized, /Section\. North Star\./);
  assert.match(normalized, /We ship clear listening for readers\./);
  assert.match(normalized, /First move/);
  assert.match(normalized, /Second move/);
  assert.match(normalized, /Keep the signal\./);
  assert.match(normalized, /Code sample omitted\./);
  assert.doesNotMatch(normalized, /https:\/\/example\.com/);
  assert.doesNotMatch(normalized, /\*\*|```|^#/m);
});

test("section dream chunking stays under the synthesis limit and preserves order", () => {
  const normalized = normalizeDreamMarkdown(`
# Orbit

Alpha sentence opens the lane. Beta sentence keeps the lane coherent. Gamma sentence gives the listener enough room to stay oriented.

Delta sentence extends the proof. Epsilon sentence extends it again. Zeta sentence closes with a clear return.
`);
  const chunks = buildDreamChunkMap(normalized, 120);

  assert.ok(chunks.length >= 2);
  assert.ok(chunks.every((chunk) => chunk.text.length <= 120));
  assert.equal(chunks[0].index, 0);
  assert.equal(chunks[chunks.length - 1].index, chunks.length - 1);
  assert.match(chunks[0].text, /Section\. Orbit\./);
  assert.match(chunks[chunks.length - 1].text, /clear return/);
});

test("section dream queue math finds the right chunk and elapsed position across boundaries", () => {
  const chunks = [
    { id: "chunk-a", text: "A", estimatedDurationMs: 1_000 },
    { id: "chunk-b", text: "B", estimatedDurationMs: 2_000 },
    { id: "chunk-c", text: "C", estimatedDurationMs: 3_000 },
  ];

  assert.equal(getDreamQueueDurationMs(chunks), 6_000);
  assert.equal(getDreamElapsedMs(chunks, 1, 650), 1_650);
  assert.deepEqual(findDreamPositionByElapsedMs(chunks, 2_600), {
    index: 1,
    chunkOffsetMs: 1_600,
    globalOffsetMs: 2_600,
  });
});

test("section dream document records and sessions stay stable for local restore", async () => {
  const rawMarkdown = "# Dream\n\nResume exactly here.";
  const document = await buildDreamDocumentRecord({
    filename: "resume.md",
    rawMarkdown,
    sourceKind: "upload",
  });
  const session = normalizeDreamSession(
    {
      documentId: document.id,
      provider: "elevenlabs",
      voiceId: "seven",
      rate: 1.15,
      status: "paused",
      activeChunkIndex: 12,
      chunkOffsetMs: 4_500,
      globalOffsetMs: 7_200,
    },
    {
      documentId: document.id,
      provider: "elevenlabs",
      voiceId: "seven",
      rate: 1,
      chunkCount: document.chunkMap.length,
    },
  );

  assert.match(document.id, /^[a-f0-9]{64}$/);
  assert.equal(document.filename, "resume.md");
  assert.equal(document.chunkMap[0].id.startsWith(`${document.id}:`), true);
  assert.equal(document.wordCount > 0, true);
  assert.equal(document.totalDurationMs > 0, true);
  assert.equal(document.progressMs, 0);
  assert.equal(session.documentId, document.id);
  assert.equal(session.provider, "elevenlabs");
  assert.equal(session.status, "paused");
  assert.equal(session.activeChunkIndex, document.chunkMap.length - 1);
});
