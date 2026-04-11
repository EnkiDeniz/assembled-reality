import test from "node:test";
import assert from "node:assert/strict";

import { END_TO_END_APP_JOURNEY } from "./fixtures/room-benchmarks/end-to-end-app-journey.mjs";
import {
  buildComparisonVerdict,
  runRoomComparisonBenchmark,
} from "./helpers/run-room-comparison-benchmark.mjs";

test("Loegos benchmark preserves truth boundaries better than plain chat and schema-only", async () => {
  const result = await runRoomComparisonBenchmark(END_TO_END_APP_JOURNEY);
  const verdict = buildComparisonVerdict(result);

  assert.equal(verdict.loegosPreservesBoundaries, true);
  assert.equal(verdict.loegosBlocksContradictorySeal, true);
  assert.equal(verdict.schemaOnlyBlocksContradictorySeal, false);
  assert.equal(verdict.plainChatBlocksContradictorySeal, false);
  assert.equal(verdict.loegosWinsAgainstPlainChat, true);
  assert.equal(verdict.loegosWinsAgainstSchemaOnly, true);

  assert.equal(result.modes.loegos.metrics.proposalRequiresApply, true);
  assert.equal(result.modes.schema_only.metrics.proposalRequiresApply, true);
  assert.equal(result.modes.plain_chat.metrics.proposalRequiresApply, false);

  assert.equal(result.modes.loegos.metrics.returnRequiresApply, true);
  assert.equal(result.modes.schema_only.metrics.returnRequiresApply, true);
  assert.equal(result.modes.plain_chat.metrics.returnRequiresApply, false);

  assert.equal(result.modes.loegos.metrics.freshSessionSeesCanonNotDraft, true);
  assert.equal(result.modes.schema_only.metrics.freshSessionSeesCanonNotDraft, false);
  assert.equal(result.modes.plain_chat.metrics.freshSessionSeesCanonNotDraft, false);
});
