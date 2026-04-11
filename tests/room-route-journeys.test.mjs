import test from "node:test";
import assert from "node:assert/strict";

import { ROOM_JOURNEY_FIXTURES } from "./fixtures/room-journeys/core-journeys.mjs";
import { createRoomRouteHarness, runRoomRouteJourney } from "./helpers/run-room-route-journey.mjs";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildResponsesPayload(roomTurn) {
  return {
    output: [
      {
        content: [
          {
            type: "output_text",
            text: typeof roomTurn === "string" ? roomTurn : JSON.stringify(roomTurn),
          },
        ],
      },
    ],
  };
}

test("turn route exposes preview without mutating canon", async () => {
  const fixture = ROOM_JOURNEY_FIXTURES.concrete_problem_emerges;
  const result = await runRoomRouteJourney(fixture);

  assert.equal(result.turnResult.status, 200);
  assert.equal(result.turnResult.body?.ok, true);
  assert.equal(result.turnResult.body?.provider, "openai");
  assert.match(result.turnResult.body?.turn?.assistantText || "", /drop-off step/i);
  assert.ok(result.turnResult.body?.view?.activePreview, "expected an active preview in the route response");
  assert.equal(result.turnResult.body?.view?.mirror?.aim?.text || "", "");
  assert.equal(
    result.turnResult.body?.view?.fieldState?.key || "",
    result.initialTurnSnapshot.view?.fieldState?.key || "",
  );
  assert.equal(result.finalSource, fixture.initialState.roomSource);
});

test("turn route keeps invalid ping blocked and non-canonical", async () => {
  const result = await runRoomRouteJourney(ROOM_JOURNEY_FIXTURES.invalid_ping_rejected);
  const lastMessage = result.turnResult.body?.view?.messages?.at(-1);

  assert.equal(result.turnResult.status, 200);
  assert.equal(result.turnResult.body?.ok, true);
  assert.equal(result.turnResult.body?.view?.activePreview, null);
  assert.equal(lastMessage?.previewStatus, "blocked");
  assert.equal(result.finalSnapshot.view?.mirror?.aim?.text || "", "Locate the exact drop-off step.");
});

test("apply route is the canonical mutation boundary", async () => {
  const result = await runRoomRouteJourney(ROOM_JOURNEY_FIXTURES.preview_then_apply);

  assert.equal(result.turnResult.status, 200);
  assert.equal(result.turnResult.body?.view?.mirror?.aim?.text || "", "");
  assert.ok(result.applyResult, "expected apply result");
  assert.equal(result.applyResult.status, 200);
  assert.equal(result.applyResult.body?.ok, true);
  assert.equal(result.applyResult.body?.view?.activePreview, null);
  assert.match(result.applyResult.body?.view?.mirror?.aim?.text || "", /exact drop-off step/i);
});

test("turn route passes handoff into prompt context without mutating canon", async () => {
  const result = await runRoomRouteJourney(ROOM_JOURNEY_FIXTURES.handoff_affects_prompt_not_canon);
  const fetchBody = JSON.parse(result.fetchCalls[0]?.options?.body || "{}");
  const userPrompt = fetchBody?.input?.[1]?.content?.[0]?.text || "";

  assert.equal(result.turnResult.status, 200);
  assert.match(userPrompt, /Session handoff: Review permissions traces before proposing fixes\./);
  assert.equal(result.turnResult.body?.view?.activePreview, null);
  assert.equal(result.turnResult.body?.view?.mirror?.aim?.text || "", "Locate the exact drop-off step.");
});

test("turn route blocks seal when contradiction is unmediated", async () => {
  const result = await runRoomRouteJourney(ROOM_JOURNEY_FIXTURES.contradicting_return_blocks_seal);
  const lastMessage = result.turnResult.body?.view?.messages?.at(-1);

  assert.equal(result.turnResult.status, 200);
  assert.equal(result.turnResult.body?.ok, true);
  assert.equal(result.turnResult.body?.view?.activePreview, null);
  assert.equal(lastMessage?.previewStatus, "blocked");
  assert.match(
    result.turnResult.body?.turn?.gatePreview?.diagnostics?.map((item) => item.message).join(" • ") || "",
    /contradiction must be mediated before seal/i,
  );
  assert.equal(
    result.turnResult.body?.view?.mirror?.returns?.at(-1)?.result || "",
    "contradicted",
  );
});

test("turn route falls back safely when the model payload is malformed", async () => {
  const fixture = clone(ROOM_JOURNEY_FIXTURES.empty_box_aspiration);
  fixture.id = "malformed_model_payload_falls_back";
  fixture.description = "Malformed model output should fall back to a safe conversational turn.";
  fixture.turn.rawModelPayload = buildResponsesPayload("not valid room json");

  const result = await runRoomRouteJourney(fixture);

  assert.equal(result.turnResult.status, 200);
  assert.equal(result.turnResult.body?.ok, true);
  assert.equal(result.turnResult.body?.provider, "fallback");
  assert.equal(result.turnResult.body?.turn?.turnMode, "conversation");
  assert.equal(result.turnResult.body?.view?.activePreview, null);
  assert.equal(result.turnResult.body?.view?.messages?.at(-1)?.previewStatus, "none");
  assert.equal(result.finalSource, fixture.initialState.roomSource);
});

test("turn route strips illegal proposal structure when the requested mode is conversation", async () => {
  const fixture = clone(ROOM_JOURNEY_FIXTURES.empty_box_aspiration);
  fixture.id = "conversation_mode_strips_illegal_segments";
  fixture.description = "Conversation-mode turns should not carry canonical proposal structure.";
  fixture.turn.rawModelPayload = buildResponsesPayload({
    assistantText: "Name the app. Pull one beta trace. Learn the exact step.",
    turnMode: "proposal",
    segments: [
      {
        text: "Name the app.",
        domain: "aim",
        mirrorRegion: "aim",
        suggestedClause: 'DIR aim "Name the app."',
        intent: "declare",
      },
      {
        text: "Pull one beta trace.",
        domain: "move",
        mirrorRegion: "moves",
        suggestedClause: 'MOV move "Pull one beta trace." via manual',
        intent: "move",
      },
      {
        text: "Learn the exact step.",
        domain: "test",
        mirrorRegion: "moves",
        suggestedClause: 'TST test "Learn the exact step."',
        intent: "test",
      },
    ],
    receiptKit: null,
  });

  const result = await runRoomRouteJourney(fixture);

  assert.equal(result.turnResult.status, 200);
  assert.equal(result.turnResult.body?.ok, true);
  assert.equal(result.turnResult.body?.turn?.turnMode, "conversation");
  assert.deepEqual(result.turnResult.body?.turn?.segments || [], []);
  assert.equal(result.turnResult.body?.view?.activePreview, null);
  assert.equal(result.turnResult.body?.view?.messages?.at(-1)?.previewStatus, "none");
  assert.equal(result.finalSource, fixture.initialState.roomSource);
});

test("blocked apply route does not mutate canon", async () => {
  const harness = createRoomRouteHarness(ROOM_JOURNEY_FIXTURES.invalid_ping_rejected);
  const initialSnapshot = harness.snapshot();
  const turn = await harness.turn();
  const apply = await harness.applyPreview({
    assistantMessageId: turn.response.body?.messageId || "",
  });
  const finalSnapshot = harness.snapshot();

  assert.equal(turn.response.status, 200);
  assert.equal(apply.response.status, 400);
  assert.match(apply.response.body?.error || "", /no longer lawful to apply/i);
  assert.equal(harness.getState().roomSource, ROOM_JOURNEY_FIXTURES.invalid_ping_rejected.initialState.roomSource);
  assert.deepEqual(finalSnapshot.view?.mirror, initialSnapshot.view?.mirror);
});

test("complete_receipt_kit route records return through the real apply path", async () => {
  const fixture = {
    id: "receipt_kit_completion_via_route",
    description: "Receipt Kit completion should mutate canon and runtime through the real apply route.",
    initialState: clone(ROOM_JOURNEY_FIXTURES.report_return.initialState),
    receiptAction: {
      receiptKit: {
        id: "kit_permissions_return",
        need: "Capture the actual return.",
        why: "One concrete return should update the field.",
        fastestPath: "Paste the observed step from the trace.",
        enough: "One concrete trace is enough.",
        artifact: {
          type: "paste",
          config: {},
        },
        prediction: {
          expected: "The trace drops at permissions.",
          direction: "narrows",
          timebound: "today",
          surprise: "The drop happens somewhere else.",
        },
      },
      completion: {
        mode: "return",
        actual: "The trace drops at permissions.",
        result: "matched",
      },
    },
  };

  const result = await runRoomRouteJourney(fixture);

  assert.ok(result.receiptResult, "expected a receipt route result");
  assert.equal(result.receiptResult.status, 200);
  assert.equal(result.receiptResult.body?.ok, true);
  assert.match(result.finalSource, /RTN observe "The trace drops at permissions\." via user as text/);
  assert.ok(
    Array.isArray(result.finalSnapshot.runtimeWindow?.receipts) &&
      result.finalSnapshot.runtimeWindow.receipts.length > 0,
    "expected a runtime receipt entry after receipt completion",
  );
  assert.ok(
    (result.receiptResult.body?.view?.recentReturns || []).some((item) =>
      /trace drops at permissions/i.test(item?.actual || ""),
    ),
    "expected the completed return to appear in recent returns",
  );
});

test("concurrent session previews do not fork canon and stale apply is rejected", async () => {
  const fixture = clone(ROOM_JOURNEY_FIXTURES.concrete_problem_emerges);
  fixture.id = "concurrent_session_preview_apply";
  fixture.initialState.session = {
    id: "session_alpha_a",
    title: "Conversation A",
    handoffSummary: "",
    threadDocumentKey: "thread_session_alpha_a",
    isActive: true,
    isArchived: false,
  };
  fixture.initialState.sessions = [
    {
      id: "session_alpha_a",
      title: "Conversation A",
      handoffSummary: "",
      threadDocumentKey: "thread_session_alpha_a",
      isActive: true,
      isArchived: false,
      messageCount: 0,
      updatedAt: "2026-04-11T00:00:00.000Z",
    },
    {
      id: "session_alpha_b",
      title: "Conversation B",
      handoffSummary: "",
      threadDocumentKey: "thread_session_alpha_b",
      isActive: false,
      isArchived: false,
      messageCount: 0,
      updatedAt: "2026-04-11T00:01:00.000Z",
    },
  ];

  const harness = createRoomRouteHarness(fixture);
  const turnA = await harness.turn({ sessionId: "session_alpha_a" });
  const turnB = await harness.turn({ sessionId: "session_alpha_b" });
  const applyB = await harness.applyPreview({
    sessionId: "session_alpha_b",
    assistantMessageId: turnB.response.body?.messageId || "",
  });
  const staleApplyA = await harness.applyPreview({
    sessionId: "session_alpha_a",
    assistantMessageId: turnA.response.body?.messageId || "",
  });

  assert.equal(turnA.response.status, 200);
  assert.equal(turnB.response.status, 200);
  assert.equal(applyB.response.status, 200);
  assert.equal(staleApplyA.response.status, 400);
  assert.match(staleApplyA.response.body?.error || "", /no longer lawful to apply/i);
  assert.match(
    staleApplyA.response.body?.gatePreview?.diagnostics?.map((item) => item.message).join(" • ") || "",
    /proposal already exists in canon/i,
  );
  assert.equal(
    (harness.getState().roomSource.match(/DIR aim "Name the exact drop-off step\."/g) || []).length,
    1,
  );
});
