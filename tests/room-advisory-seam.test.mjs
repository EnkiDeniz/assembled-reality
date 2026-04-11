import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildRoomAdvisoryContext,
  createRoomAdvisoryAdapter,
  evaluateRoomAdvisory,
} from "../src/lib/room-advisory.js";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("sparse advisory context resolves to insufficient witness", () => {
  const outcome = evaluateRoomAdvisory({
    project: { projectKey: "box_alpha", title: "Alpha" },
    recentSources: [],
    recentReturns: [],
    roomSourceSummary: { clauseCount: 0 },
    fieldState: { key: "fog" },
  });

  assert.equal(outcome.kind, "insufficient_witness");
  assert.equal(outcome.nonCanonical, true);
  assert.match(outcome.question, /witness belongs in this box first/i);
});

test("starter-prior and personal-field adapters normalize into a stable non-canonical contract", () => {
  const contextInput = {
    project: { projectKey: "box_alpha", title: "Alpha" },
    recentSources: [{ documentKey: "doc_1" }],
    recentReturns: [],
    focusedWitness: { documentKey: "doc_1" },
    roomSourceSummary: { clauseCount: 2 },
    fieldState: { key: "awaiting" },
  };
  const originalCopy = JSON.parse(JSON.stringify(contextInput));
  const starterAdapter = createRoomAdvisoryAdapter({
    evaluate(context) {
      assert.equal(Object.isFrozen(context), true);
      return {
        kind: "starter_prior",
        source: "starter_library",
        mainGap: "The exact drop-off step is still unknown.",
        nextMove: "Pull the drop-off step from the logs.",
        receiptCondition: "One concrete failing step appears.",
        disconfirmationLine: "If no step clusters, this prior is wrong.",
      };
    },
  });
  const personalFieldAdapter = createRoomAdvisoryAdapter({
    evaluate() {
      return {
        kind: "personal_field",
        source: "box_local",
        mainGap: "The box has witness but not enough return.",
        nextMove: "Compare two recent beta sessions.",
        receiptCondition: "A repeated abandonment pattern shows up.",
        disconfirmationLine: "If the sessions diverge sharply, this read softens.",
      };
    },
  });

  const starterOutcome = evaluateRoomAdvisory(contextInput, { adapter: starterAdapter });
  const personalFieldOutcome = evaluateRoomAdvisory(contextInput, { adapter: personalFieldAdapter });

  assert.deepEqual(contextInput, originalCopy);
  assert.equal(starterOutcome.kind, "starter_prior");
  assert.equal(starterOutcome.nonCanonical, true);
  assert.match(starterOutcome.nextMove, /drop-off step/i);
  assert.equal(personalFieldOutcome.kind, "personal_field");
  assert.equal(personalFieldOutcome.nonCanonical, true);
  assert.match(personalFieldOutcome.receiptCondition, /pattern/i);
});

test("live room routes do not import the advisory seam yet", async () => {
  const roomServer = await read("src/lib/room-server.js");
  const roomRoute = await read("src/app/api/workspace/room/route.js");
  const roomTurnRoute = await read("src/app/api/workspace/room/turn/route.js");
  const roomApplyRoute = await read("src/app/api/workspace/room/apply/route.js");

  assert.doesNotMatch(roomServer, /room-advisory/);
  assert.doesNotMatch(roomRoute, /room-advisory/);
  assert.doesNotMatch(roomTurnRoute, /room-advisory/);
  assert.doesNotMatch(roomApplyRoute, /room-advisory/);
});

test("advisory context builder stays pure and exposes the future seam shape", () => {
  const context = buildRoomAdvisoryContext({
    project: { projectKey: "box_alpha", title: "Alpha" },
    recentSources: [{ documentKey: "doc_1" }, { documentKey: "doc_1" }, { documentKey: "doc_2" }],
    recentReturns: [{ id: "r1" }],
    focusedWitness: { documentKey: "doc_2" },
    roomSourceSummary: { clauseCount: 4 },
    fieldState: { key: "awaiting" },
  });

  assert.equal(Object.isFrozen(context), true);
  assert.equal(context.boxKey, "box_alpha");
  assert.equal(context.sourceCount, 2);
  assert.deepEqual(context.sourceDocumentKeys, ["doc_2", "doc_1"]);
  assert.equal(context.returnCount, 1);
  assert.equal(context.clauseCount, 4);
  assert.equal(context.fieldStateKey, "awaiting");
});
