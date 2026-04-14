import test from "node:test";
import assert from "node:assert/strict";

import { loadReplayReviewArtifacts } from "../src/lib/replay-review.js";

test("replay review artifacts load packet A and packet B from the benchmark outputs", () => {
  const artifacts = loadReplayReviewArtifacts();

  assert.equal(artifacts.packetA.packetKind, "present_day_packet");
  assert.equal(artifacts.packetB.packetKind, "historical_replay_packet");
  assert.ok(artifacts.packetA.entries.length > 0);
  assert.ok(artifacts.packetB.entries.length > 0);
  assert.match(artifacts.reviewKey, /present_day_packet|historical_replay_packet|__/i);
});

test("replay review artifacts preserve the current-snapshot exception in packet B", () => {
  const artifacts = loadReplayReviewArtifacts();

  assert.ok(Array.isArray(artifacts.packetB.currentSnapshotExceptions));
  assert.ok(artifacts.packetB.currentSnapshotExceptions.length >= 1);
  assert.match(
    artifacts.packetB.currentSnapshotExceptions[0]?.reason || "",
    /no reachable git introduction commit/i,
  );
});
