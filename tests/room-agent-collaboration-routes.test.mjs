import test from "node:test";
import assert from "node:assert/strict";

import { ROOM_AI_JOURNEY_FIXTURES } from "./fixtures/room-journeys/ai-journeys.mjs";
import { runRoomAiRouteJourney } from "./helpers/run-room-ai-journey.mjs";

async function runOrSkip(t, fixture) {
  const result = await runRoomAiRouteJourney(fixture);
  if (result?.skipped) {
    t.skip(result.skipReason || "AI collaboration route test skipped.");
    return null;
  }
  return result;
}

test("route smoke: ai_user_concrete_problem_emerges still yields non-canonical preview", async (t) => {
  const result = await runOrSkip(t, ROOM_AI_JOURNEY_FIXTURES.ai_user_concrete_problem_emerges);
  if (!result) return;

  assert.equal(result.turnResult.status, 200);
  assert.equal(result.turnResult.body?.ok, true);
  assert.equal(result.turnResult.body?.view?.activePreview !== null, true);
  assert.equal(result.turnResult.body?.view?.mirror?.aim?.text || "", "");
  assert.equal(result.aiUser.leakVerdict.leakDetected, false);
});

test("route smoke: ai_user_report_return still reaches lawful runtime change path", async (t) => {
  const result = await runOrSkip(t, ROOM_AI_JOURNEY_FIXTURES.ai_user_report_return);
  if (!result) return;

  assert.equal(result.turnResult.status, 200);
  assert.ok(result.applyResult, "expected route apply result");
  assert.equal(result.applyResult.status, 200);
  assert.match(result.finalSource, /RTN observe "The trace shows a drop at permissions\." via user as text/);
  assert.ok(
    Array.isArray(result.finalSnapshot.runtimeWindow?.events) &&
      result.finalSnapshot.runtimeWindow.events.some((event) => event.kind === "return_received"),
    "expected return_received in route runtime state",
  );
});

test("route smoke: ai_user_adversarial_authority_smuggling still cannot bypass route law", async (t) => {
  const result = await runOrSkip(t, ROOM_AI_JOURNEY_FIXTURES.ai_user_adversarial_authority_smuggling);
  if (!result) return;

  assert.equal(result.turnResult.status, 200);
  assert.equal(result.turnResult.body?.view?.activePreview, null);
  assert.equal(result.turnResult.body?.view?.messages?.at(-1)?.previewStatus, "blocked");
  assert.match(
    result.turnResult.body?.turn?.gatePreview?.diagnostics?.map((item) => item.message).join(" • ") || "",
    /contradiction must be mediated before seal/i,
  );
});
