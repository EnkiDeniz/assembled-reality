import test from "node:test";
import assert from "node:assert/strict";

import {
  createReplayReviewSessionPatchHandler,
  createReplayReviewSessionPostHandler,
} from "../src/app/api/replay-review/session/route.js";

function buildPatchRequest(body) {
  return new Request("http://localhost/api/replay-review/session", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

test("replay review session POST creates or resumes the current session", async () => {
  const payload = {
    reviewKey: "packet-a__packet-b",
    packetA: { packetId: "a", entries: [] },
    packetB: { packetId: "b", entries: [] },
    session: { id: "session_1", status: "in_progress", entries: [] },
  };
  const POST = createReplayReviewSessionPostHandler({
    getSession: async () => ({ user: { id: "user_1" } }),
    createOrResume: async () => payload,
  });

  const response = await POST();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, ...payload });
});

test("replay review session PATCH saves the overall decision", async () => {
  const PATCH = createReplayReviewSessionPatchHandler({
    getSession: async () => ({ user: { id: "user_1" } }),
    updateSession: async (_userId, body) => ({
      id: "session_1",
      status: body.status || "in_progress",
      overallDecision: body.overallDecision,
      overallSummary: body.overallSummary,
      entries: [],
    }),
  });

  const response = await PATCH(
    buildPatchRequest({
      overallDecision: "hold_replay_lane_fix_diagnostics_first",
      overallSummary: "Good pilot, repetitive diagnostics.",
      status: "completed",
    }),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    session: {
      id: "session_1",
      status: "completed",
      overallDecision: "hold_replay_lane_fix_diagnostics_first",
      overallSummary: "Good pilot, repetitive diagnostics.",
      entries: [],
    },
  });
});
