import test from "node:test";
import assert from "node:assert/strict";

import {
  auditRoomProposalSemantics,
  buildRoomSemanticContext,
  buildSafeFallbackTurn,
  classifyRoomTurnMode,
} from "../src/lib/room-turn-policy.mjs";

test("safe fallback returns plain conversation only", () => {
  const fallback = buildSafeFallbackTurn();

  assert.equal(fallback.turnMode, "conversation");
  assert.deepEqual(fallback.segments, []);
  assert.equal(fallback.receiptKit, null);
  assert.equal(fallback.gatePreview, null);
  assert.match(fallback.assistantText, /lost the thread/i);
});

test("classifier keeps early aspiration and low-signal turns in conversation mode", () => {
  assert.equal(
    classifyRoomTurnMode({
      message: "I want to build Loegos",
      view: { hasStructure: false },
    }),
    "conversation",
  );
  assert.equal(
    classifyRoomTurnMode({
      message: "I'm not sure what this is yet",
      view: { hasStructure: false },
    }),
    "conversation",
  );
  assert.equal(
    classifyRoomTurnMode({
      message: "blorp maybe idk",
      view: { hasStructure: false },
    }),
    "conversation",
  );
});

test("classifier allows concrete observations and explicit structure requests into proposal mode", () => {
  assert.equal(
    classifyRoomTurnMode({
      message: "The lender said $780k.",
      view: { hasStructure: false },
    }),
    "proposal",
  );
  assert.equal(
    classifyRoomTurnMode({
      message: "Give me the next step and turn this into a box move.",
      view: { hasStructure: false },
    }),
    "proposal",
  );
});

test("semantic audit rejects conversational MOV/TST disguised as a real-world move", () => {
  const audit = auditRoomProposalSemantics({
    proposal: {
      segments: [
        {
          text: "Tell me more about what you mean.",
          domain: "move",
          suggestedClause: 'MOV move "Tell me more about what you mean." via manual',
        },
        {
          text: "The user answers my question in chat.",
          domain: "test",
          suggestedClause: 'TST test "The user answers my question in chat."',
        },
      ],
    },
    context: buildRoomSemanticContext({ latestUserMessage: "I want to build Loegos" }),
  });

  assert.equal(audit.accepted, false);
  assert.match(audit.reason, /semantic_reject/);
  assert.ok(audit.diagnostics.some((diagnostic) => /not a lawful move or test/i.test(diagnostic.message)));
});

test("semantic audit rejects screenshot references that are not present in room context", () => {
  const audit = auditRoomProposalSemantics({
    proposal: {
      segments: [
        {
          text: "Rerun it with the screenshot labeled static.",
          domain: "move",
          suggestedClause:
            'MOV move "Rerun it with the screenshot labeled static." via manual',
        },
        {
          text: "The output changes when the screenshot is labeled static.",
          domain: "test",
          suggestedClause:
            'TST test "The output changes when the screenshot is labeled static."',
        },
      ],
    },
    context: buildRoomSemanticContext({
      latestUserMessage: "I want to build Loegos",
      recentSources: [],
    }),
  });

  assert.equal(audit.accepted, false);
  assert.ok(
    audit.diagnostics.some((diagnostic) =>
      /screenshot context that is not present/i.test(diagnostic.message),
    ),
  );
});

test("semantic audit allows observational user-stated witness but marks it as weak provenance", () => {
  const audit = auditRoomProposalSemantics({
    proposal: {
      segments: [
        {
          text: "The lender said $780k.",
          domain: "witness",
          suggestedClause: 'GND witness @lender_offer from "user_stated" with v_turn_1',
        },
      ],
    },
    context: buildRoomSemanticContext({ latestUserMessage: "The lender said $780k." }),
  });

  assert.equal(audit.accepted, true);
  assert.ok(
    audit.diagnostics.some((diagnostic) =>
      /reported signal, not externally verified evidence/i.test(diagnostic.message),
    ),
  );
});
