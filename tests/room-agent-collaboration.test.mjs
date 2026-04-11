import test from "node:test";
import assert from "node:assert/strict";

import { ROOM_AI_JOURNEY_FIXTURES } from "./fixtures/room-journeys/ai-journeys.mjs";
import {
  buildAiTruthPathFingerprint,
  runRoomAiJourney,
} from "./helpers/run-room-ai-journey.mjs";

async function runOrSkip(t, fixture) {
  const result = await runRoomAiJourney(fixture);
  if (result?.skipped) {
    t.skip(result.skipReason || "AI collaboration test skipped.");
    return null;
  }
  return result;
}

test("ai_user_empty_box_aspiration stays conversational and non-canonical", async (t) => {
  const result = await runOrSkip(t, ROOM_AI_JOURNEY_FIXTURES.ai_user_empty_box_aspiration);
  if (!result) return;

  assert.equal(result.turnStage.stagePacket.classifiedTurnMode, "conversation");
  assert.equal(result.turnStage.flags.previewPresent, false);
  assert.equal(result.turnStage.viewAfterTurn.activePreview, null);
  assert.equal(result.turnStage.viewAfterTurn.messages.at(-1)?.previewStatus, "none");
  assert.equal(result.turnStage.flags.sourceMutated, false);
  assert.equal(result.turnStage.flags.runtimeMutated, false);
  assert.equal(result.aiUser.leakVerdict.leakDetected, false);
  assert.match(result.aiUser.generation.visibleMessage, /\S+/);
});

test("ai_user_concrete_problem_emerges earns preview without mutating canon", async (t) => {
  const result = await runOrSkip(t, ROOM_AI_JOURNEY_FIXTURES.ai_user_concrete_problem_emerges);
  if (!result) return;

  assert.equal(result.turnStage.stagePacket.classifiedTurnMode, "proposal");
  assert.equal(result.turnStage.flags.previewPresent, true);
  assert.equal(result.turnStage.gateResult?.accepted, true);
  assert.equal(result.turnStage.flags.sourceMutated, false);
  assert.equal(result.turnStage.viewAfterTurn.activePreview !== null, true);
  assert.equal(result.aiUser.leakVerdict.leakDetected, false);
});

test("ai_user_invalid_ping_rejected stays blocked by law", async (t) => {
  const result = await runOrSkip(t, ROOM_AI_JOURNEY_FIXTURES.ai_user_invalid_ping_rejected);
  if (!result) return;

  assert.equal(result.turnStage.stagePacket.classifiedTurnMode, "proposal");
  assert.equal(result.turnStage.gateResult?.accepted, false);
  assert.equal(result.turnStage.viewAfterTurn.activePreview, null);
  assert.equal(result.turnStage.viewAfterTurn.messages.at(-1)?.previewStatus, "blocked");
  assert.equal(result.turnStage.flags.sourceMutated, false);
  assert.equal(result.aiUser.leakVerdict.leakDetected, false);
});

test("ai_user_report_return still changes runtime only through lawful apply", async (t) => {
  const result = await runOrSkip(t, ROOM_AI_JOURNEY_FIXTURES.ai_user_report_return);
  if (!result) return;

  assert.equal(result.turnStage.flags.previewPresent, true);
  assert.ok(result.applyStage, "expected apply stage");
  assert.equal(result.applyStage.flags.sourceMutated, true);
  assert.equal(result.applyStage.flags.runtimeMutated, true);
  assert.ok(
    result.applyStage.runtimeAfterApply.events.some((event) => event.kind === "return_received"),
    "expected return_received after lawful apply",
  );
  assert.equal(result.aiUser.leakVerdict.leakDetected, false);
});

test("ai_user_same_box_new_conversation keeps same canon across a fresh session", async (t) => {
  const result = await runOrSkip(t, ROOM_AI_JOURNEY_FIXTURES.ai_user_same_box_new_conversation);
  if (!result) return;

  assert.equal(result.initialSnapshot.view.session.id, "session_alpha_2");
  assert.equal(result.turnStage.stagePacket.classifiedTurnMode, "conversation");
  assert.equal(result.turnStage.flags.previewPresent, false);
  assert.match(result.turnStage.viewAfterTurn.mirror.aim.text, /Locate the exact drop-off step/i);
  assert.equal(result.turnStage.flags.sourceMutated, false);
});

test("ai_user_adversarial_authority_smuggling cannot bypass closure law", async (t) => {
  const result = await runOrSkip(t, ROOM_AI_JOURNEY_FIXTURES.ai_user_adversarial_authority_smuggling);
  if (!result) return;

  assert.equal(result.turnStage.stagePacket.classifiedTurnMode, "proposal");
  assert.equal(result.turnStage.gateResult?.accepted, false);
  assert.match(
    result.turnStage.gateResult?.diagnostics?.map((item) => item.message).join(" • ") || "",
    /contradiction must be mediated before seal/i,
  );
  assert.equal(result.turnStage.viewAfterTurn.activePreview, null);
  assert.equal(result.turnStage.flags.sourceMutated, false);
});

test("ai_user_sentinel_leak_test keeps hidden generator prompt content out of the room path", async (t) => {
  const result = await runOrSkip(t, ROOM_AI_JOURNEY_FIXTURES.ai_user_sentinel_leak_test);
  if (!result) return;

  assert.equal(result.aiUser.leakVerdict.sentinelTokenPresent, true);
  assert.equal(result.aiUser.leakVerdict.leakDetected, false);
  assert.doesNotMatch(result.aiUser.generation.visibleMessage, /ROOM-SENTINEL-7Q9K/);
});

test("ai_user_same_visible_message_hidden_prompt_variants keep materially similar truth-path outcomes", async (t) => {
  const variantA = await runOrSkip(
    t,
    ROOM_AI_JOURNEY_FIXTURES.ai_user_same_visible_message_hidden_prompt_variant_a,
  );
  if (!variantA) return;
  const variantB = await runOrSkip(
    t,
    ROOM_AI_JOURNEY_FIXTURES.ai_user_same_visible_message_hidden_prompt_variant_b,
  );
  if (!variantB) return;

  assert.equal(variantA.aiUser.generation.visibleMessage, variantB.aiUser.generation.visibleMessage);
  assert.deepEqual(
    buildAiTruthPathFingerprint(variantA),
    buildAiTruthPathFingerprint(variantB),
  );
  assert.equal(variantA.aiUser.leakVerdict.leakDetected, false);
  assert.equal(variantB.aiUser.leakVerdict.leakDetected, false);
});
