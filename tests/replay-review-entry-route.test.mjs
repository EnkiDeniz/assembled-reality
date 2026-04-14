import test from "node:test";
import assert from "node:assert/strict";

import { createReplayReviewEntryHandler } from "../src/app/api/replay-review/entry/route.js";

function buildPatchRequest(body) {
  return new Request("http://localhost/api/replay-review/entry", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

test("replay review entry route rejects unauthorized requests", async () => {
  const PATCH = createReplayReviewEntryHandler({
    getSession: async () => null,
    upsertEntry: async () => ({}),
  });

  const response = await PATCH(buildPatchRequest({}));
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Unauthorized" });
});

test("replay review entry route upserts founder entry scoring", async () => {
  const PATCH = createReplayReviewEntryHandler({
    getSession: async () => ({ user: { id: "user_1" } }),
    upsertEntry: async (_userId, payload) => payload,
  });

  const response = await PATCH(
    buildPatchRequest({
      entryId: "docs/seven-operate-receipt-contract.md",
      packetKind: "present_day_packet",
      honestyScore: 3,
      understandabilityScore: 2,
      specificityScore: 2,
      actionabilityScore: 2,
      convergenceValueScore: 3,
      wouldUseAgainScore: 2,
      moveWouldTakeNow: "Pull one trace before changing the flow.",
      notes: "Strong and usable.",
    }),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    entry: {
      entryId: "docs/seven-operate-receipt-contract.md",
      packetKind: "present_day_packet",
      honestyScore: 3,
      understandabilityScore: 2,
      specificityScore: 2,
      actionabilityScore: 2,
      convergenceValueScore: 3,
      wouldUseAgainScore: 2,
      moveWouldTakeNow: "Pull one trace before changing the flow.",
      notes: "Strong and usable.",
    },
  });
});
