import test from "node:test";
import assert from "node:assert/strict";

import { createReplayReviewCurrentHandler } from "../src/app/api/replay-review/current/route.js";

test("replay review current route rejects unauthorized requests", async () => {
  const GET = createReplayReviewCurrentHandler({
    getSession: async () => null,
    loadCurrent: async () => ({}),
  });

  const response = await GET();
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Unauthorized" });
});

test("replay review current route returns packet state and saved session", async () => {
  const payload = {
    reviewKey: "packet-a__packet-b",
    packetA: { packetId: "a", packetKind: "present_day_packet", entries: [] },
    packetB: { packetId: "b", packetKind: "historical_replay_packet", entries: [] },
    session: { id: "session_1", status: "in_progress", entries: [] },
  };

  const GET = createReplayReviewCurrentHandler({
    getSession: async () => ({ user: { id: "user_1" } }),
    loadCurrent: async () => payload,
  });

  const response = await GET();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, ...payload });
});
