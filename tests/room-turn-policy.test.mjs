import test from "node:test";
import assert from "node:assert/strict";

import {
  applyRoomTurnGuardrails,
  auditRoomProposalSemantics,
  buildRoomSemanticContext,
  buildSafeFallbackTurn,
  classifyRoomTurnMode,
  normalizeAssistantTextForRoom,
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
  assert.equal(
    classifyRoomTurnMode({
      message: "I want to understand what a monolith is",
      view: { hasStructure: false },
    }),
    "conversation",
  );
});

test("classifier keeps general questions conversational even after structure exists", () => {
  assert.equal(
    classifyRoomTurnMode({
      message: "What is a monolith?",
      view: { hasStructure: true },
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

test("guardrails drop structure entirely when the requested turn mode is conversation", () => {
  const guarded = applyRoomTurnGuardrails(
    {
      assistantText: "A monolith is one big application. Why does that matter to you right now?",
      turnMode: "proposal",
      segments: [
        {
          text: "A monolith is one big application.",
          domain: "witness",
          suggestedClause: 'GND witness @term from "user_stated" with v_turn_1',
        },
      ],
      receiptKit: {
        id: "kit_1",
        need: "Proof",
        artifact: { type: "paste", config: {} },
      },
    },
    { requestedTurnMode: "conversation" },
  );

  assert.equal(guarded.turnMode, "conversation");
  assert.deepEqual(guarded.segments, []);
  assert.equal(guarded.receiptKit, null);
});

test("guardrails keep only segment text that is an exact assistantText excerpt", () => {
  const guarded = applyRoomTurnGuardrails(
    {
      assistantText:
        "That's a direction, not a decision yet. What's the actual number you're working with?",
      turnMode: "proposal",
      segments: [
        {
          text: "That's a direction, not a decision yet.",
          domain: "story",
          suggestedClause: 'INT story "Direction is still broad."',
        },
        {
          text: "Internal planning note that never appeared in the reply.",
          domain: "aim",
          suggestedClause: 'DIR aim "Hidden note"',
        },
      ],
    },
    { requestedTurnMode: "proposal" },
  );

  assert.equal(guarded.turnMode, "proposal");
  assert.equal(guarded.segments.length, 1);
  assert.equal(guarded.segments[0].text, "That's a direction, not a decision yet.");
});

test("assistant text normalization trims list-heavy answers into brief prose", () => {
  const normalized = normalizeAssistantTextForRoom(`1. A monolith is one big app.
2. It keeps everything together.
3. It can be simpler at the start.
4. It gets harder to change later.
5. Why does that matter to you right now?
6. What stack are you using?`);

  assert.equal(normalized.includes("1."), false);
  assert.equal(normalized.includes("2."), false);
  assert.match(normalized, /^A monolith is one big app\./);
  assert.equal((normalized.match(/\?/g) || []).length, 1);
});

test("assistant text normalization enforces seven-by-seven sentence compression", () => {
  const normalized = normalizeAssistantTextForRoom(
    "This answer definitely has more than seven words. Another sentence also runs well past the limit. Third sentence stays compact. Fourth sentence keeps moving. Fifth sentence still fits okay. Sixth sentence is also brief. Seventh sentence closes the loop. Eighth sentence should disappear.",
  );

  const sentences = normalized.match(/[^.!?]+(?:[.!?]+|$)/g)?.map((sentence) => sentence.trim()).filter(Boolean) || [];
  assert.equal(sentences.length, 7);
  assert.ok(sentences.every((sentence) => sentence.split(/\s+/).filter(Boolean).length <= 7));
});
