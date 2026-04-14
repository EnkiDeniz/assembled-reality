import test from "node:test";
import assert from "node:assert/strict";

import { buildCompilerReadDelta } from "../src/lib/compiler-read-delta.js";

test("compiler read delta reports claim, finding, and grounding changes between versions", () => {
  const previousRead = {
    claimSet: [
      { id: "claim-a", text: "Alpha", supportStatus: "grounded" },
      { id: "claim-b", text: "Beta", supportStatus: "unsupported" },
    ],
    groundingRejectedClaimCount: 3,
    verdict: {
      primaryFinding: "The document needs a clearer split.",
    },
    nextMoves: ["Separate the framing from the protocol."],
  };

  const currentRead = {
    claimSet: [
      { id: "claim-a", text: "Alpha", supportStatus: "grounded" },
      { id: "claim-c", text: "Gamma", supportStatus: "grounded" },
    ],
    groundingRejectedClaimCount: 1,
    verdict: {
      primaryFinding: "The protocol is more specific now.",
    },
    nextMoves: ["Test the new split against a real memo."],
  };

  const delta = buildCompilerReadDelta(currentRead, previousRead);

  assert.deepEqual(delta.claimsAdded, ["claim-c"]);
  assert.deepEqual(delta.claimsRemoved, ["claim-b"]);
  assert.equal(delta.previousRejected, 3);
  assert.equal(delta.currentRejected, 1);
  assert.equal(delta.primaryFindingChanged, true);
  assert.equal(delta.nextMoveChanged, true);
  assert.match(delta.trajectoryLine, /Grounded claim count improved|Grounding rejection count fell|Primary finding changed/);
});

test("compiler read delta returns null without both reads", () => {
  assert.equal(buildCompilerReadDelta(null, {}), null);
  assert.equal(buildCompilerReadDelta({}, null), null);
});
