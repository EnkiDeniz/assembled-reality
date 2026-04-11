import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { ROOM_JOURNEY_FIXTURES } from "./fixtures/room-journeys/core-journeys.mjs";
import { runRoomJourney } from "./helpers/run-room-journey.mjs";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

function assertAuthorityContextConsistent(view, label = "view") {
  assert.ok(view?.authorityContext, `${label} should include authorityContext`);
  assert.equal(
    view.authorityContext?.project?.projectKey || "",
    view?.project?.projectKey || "",
    `${label} should keep authority project key aligned`,
  );
  assert.equal(
    view.authorityContext?.project?.title || "",
    view?.project?.title || "",
    `${label} should keep authority project title aligned`,
  );
  assert.equal(
    view.authorityContext?.session?.id || "",
    view?.session?.id || "",
    `${label} should keep authority session id aligned`,
  );
  assert.equal(
    view.authorityContext?.session?.title || "",
    view?.session?.title || "",
    `${label} should keep authority session title aligned`,
  );
  assert.equal(
    view.authorityContext?.canonSource?.documentKey || "",
    view?.roomDocument?.documentKey || "",
    `${label} should keep canon source aligned with room document`,
  );
  assert.deepEqual(
    view.authorityContext?.artifact || null,
    view?.roomSourceSummary || null,
    `${label} should keep artifact summary aligned`,
  );
  assert.equal(
    view.authorityContext?.runtime?.state || "",
    view?.fieldState?.key || "",
    `${label} should keep runtime state aligned with field state`,
  );
  assert.equal(
    Boolean(view.authorityContext?.runtime?.waiting),
    Boolean(view?.interaction?.paneContract?.waiting),
    `${label} should keep waiting state aligned`,
  );
  assert.deepEqual(
    view.authorityContext?.mirror || null,
    view?.mirror || null,
    `${label} should keep authority mirror aligned`,
  );
  assert.deepEqual(
    view.authorityContext?.sources || [],
    view?.recentSources || [],
    `${label} should keep recent sources aligned`,
  );
}

test("empty_box_aspiration stays conversational and non-canonical", async () => {
  const result = await runRoomJourney(ROOM_JOURNEY_FIXTURES.empty_box_aspiration);

  assert.equal(result.turnStage.stagePacket.classifiedTurnMode, "conversation");
  assert.equal(result.turnStage.flags.previewPresent, false);
  assert.equal(result.turnStage.gateResult, null);
  assert.equal(result.turnStage.viewAfterTurn.activePreview, null);
  assert.equal(result.turnStage.viewAfterTurn.messages.at(-1)?.previewStatus, "none");
  assert.equal(result.turnStage.viewAfterTurn.hasStructure, false);
  assert.equal(result.turnStage.viewAfterTurn.mirror.aim.text, "");
});

test("concrete_problem_emerges creates a lawful preview without mutating canon", async () => {
  const result = await runRoomJourney(ROOM_JOURNEY_FIXTURES.concrete_problem_emerges);

  assert.equal(result.turnStage.stagePacket.classifiedTurnMode, "proposal");
  assert.equal(result.turnStage.flags.previewPresent, true);
  assert.equal(result.turnStage.gateResult?.accepted, true);
  assert.equal(result.turnStage.flags.sourceMutated, false);
  assert.equal(result.turnStage.flags.runtimeMutated, false);
  assert.match(result.turnStage.viewAfterTurn.activePreview?.assistantText || "", /drop-off step/i);
  assert.equal(result.initialSnapshot.source, ROOM_JOURNEY_FIXTURES.concrete_problem_emerges.initialState.roomSource);
  assert.equal(result.turnStage.viewAfterTurn.mirror.aim.text, "");
});

test("invalid_ping_rejected blocks before canon changes", async () => {
  const result = await runRoomJourney(ROOM_JOURNEY_FIXTURES.invalid_ping_rejected);

  assert.equal(result.turnStage.stagePacket.classifiedTurnMode, "proposal");
  assert.equal(result.turnStage.gateResult?.accepted, false);
  assert.match(result.turnStage.gateResult?.reason || "", /ping_requires_test|compile_blocked/i);
  assert.equal(result.turnStage.flags.sourceMutated, false);
  assert.equal(result.turnStage.viewAfterTurn.activePreview, null);
  assert.equal(result.turnStage.viewAfterTurn.messages.at(-1)?.previewStatus, "blocked");
  assert.match(
    result.turnStage.gateResult?.diagnostics?.map((item) => item.message).join(" • ") || "",
    /move should declare an explicit test|Ping requires both MOV and TST clauses/i,
  );
});

test("preview_then_apply changes canon only at apply", async () => {
  const result = await runRoomJourney(ROOM_JOURNEY_FIXTURES.preview_then_apply);

  assert.equal(result.turnStage.flags.previewPresent, true);
  assert.equal(result.turnStage.flags.sourceMutated, false);
  assert.ok(result.applyStage, "expected apply stage");
  assert.equal(result.applyStage.flags.sourceMutated, true);
  assert.equal(result.applyStage.viewAfterApply.activePreview, null);
  assert.match(result.applyStage.sourceAfterApply, /DIR aim "Name the exact drop-off step\."/);
  assert.match(result.applyStage.sourceAfterApply, /MOV move "Pull one beta trace\." via manual/);
  assert.match(result.applyStage.sourceAfterApply, /TST test "A concrete drop-off step appears\."/);
  assert.match(result.applyStage.viewAfterApply.mirror.aim.text, /Name the exact drop-off step/i);
  assert.equal(result.applyStage.viewAfterApply.messages.at(-1)?.previewStatus, "applied");
});

test("report_return mutates runtime only through lawful apply", async () => {
  const result = await runRoomJourney(ROOM_JOURNEY_FIXTURES.report_return);

  assert.equal(result.turnStage.flags.previewPresent, true);
  assert.ok(result.applyStage, "expected apply stage");
  assert.equal(result.applyStage.flags.sourceMutated, true);
  assert.equal(result.applyStage.flags.runtimeMutated, true);
  assert.match(result.applyStage.sourceAfterApply, /RTN observe "The trace shows a drop at permissions\." via user as text/);
  assert.ok(Array.isArray(result.applyStage.runtimeAfterApply.events));
  assert.ok(
    result.applyStage.runtimeAfterApply.events.some((event) => event.kind === "return_received"),
    "expected a return_received event after applying the return",
  );
  assert.ok(result.applyStage.viewAfterApply.recentReturns.length > 0);
});

test("same_box_new_conversation changes continuity without forking canon", async () => {
  const result = await runRoomJourney(ROOM_JOURNEY_FIXTURES.same_box_new_conversation);

  assert.equal(result.initialSnapshot.view.session.id, "session_alpha_2");
  assert.equal(result.turnStage.stagePacket.classifiedTurnMode, "conversation");
  assert.equal(result.turnStage.flags.previewPresent, false);
  assert.equal(result.turnStage.flags.sourceMutated, false);
  assert.match(result.initialSnapshot.source, /DIR aim "Locate the exact drop-off step\."/);
  assert.match(result.turnStage.viewAfterTurn.mirror.aim.text, /Locate the exact drop-off step/i);
  assert.equal(result.turnStage.viewAfterTurn.activePreview, null);
});

test("handoff_affects_prompt_not_canon changes prompt context without changing box truth", async () => {
  const fixture = ROOM_JOURNEY_FIXTURES.handoff_affects_prompt_not_canon;
  const result = await runRoomJourney(fixture);

  assert.equal(result.turnStage.stagePacket.classifiedTurnMode, "conversation");
  assert.equal(result.turnStage.stagePacket.promptContextSummary.handoffSummaryPresent, true);
  assert.match(
    result.turnStage.promptPacket.userPrompt,
    /Session handoff: Review permissions traces before proposing fixes\./,
  );
  assert.equal(result.turnStage.flags.previewPresent, false);
  assert.equal(result.turnStage.flags.sourceMutated, false);
  assert.equal(result.turnStage.flags.runtimeMutated, false);
  assert.equal(result.initialSnapshot.source, fixture.initialState.roomSource);
  assert.deepEqual(result.turnStage.viewAfterTurn.mirror, result.initialSnapshot.view.mirror);
  assert.equal(result.turnStage.viewAfterTurn.activePreview, null);
});

test("contradicting_return_blocks_seal keeps closure non-canonical until mediated", async () => {
  const result = await runRoomJourney(ROOM_JOURNEY_FIXTURES.contradicting_return_blocks_seal);

  assert.equal(result.turnStage.stagePacket.classifiedTurnMode, "proposal");
  assert.equal(result.turnStage.gateResult?.accepted, false);
  assert.match(result.turnStage.gateResult?.reason || "", /compile_blocked/i);
  assert.match(
    result.turnStage.gateResult?.diagnostics?.map((item) => item.message).join(" • ") || "",
    /contradiction must be mediated before seal/i,
  );
  assert.equal(result.turnStage.flags.previewPresent, false);
  assert.equal(result.turnStage.flags.sourceMutated, false);
  assert.equal(result.turnStage.viewAfterTurn.activePreview, null);
  assert.equal(result.turnStage.viewAfterTurn.messages.at(-1)?.previewStatus, "blocked");
  assert.equal(
    result.turnStage.viewAfterTurn.mirror.returns.at(-1)?.result || "",
    "contradicted",
  );
});

test("preview_reload_without_apply preserves preview while canon stays unchanged", async () => {
  const result = await runRoomJourney(ROOM_JOURNEY_FIXTURES.preview_reload_without_apply);

  assert.equal(result.turnStage.flags.previewPresent, true);
  assert.ok(result.reloadedView, "expected a reloaded view snapshot");
  assert.equal(result.reloadedView.activePreview?.proposalId, result.turnStage.viewAfterTurn.activePreview?.proposalId);
  assert.equal(result.initialSnapshot.source, ROOM_JOURNEY_FIXTURES.preview_reload_without_apply.initialState.roomSource);
  assert.deepEqual(result.reloadedView.mirror, result.turnStage.viewAfterTurn.mirror);
  assert.equal(result.reloadedView.fieldState.key, result.turnStage.viewAfterTurn.fieldState.key);
});

test("proposal_superseded_by_later_turn keeps earlier preview non-canonical and superseded", async () => {
  const result = await runRoomJourney(ROOM_JOURNEY_FIXTURES.proposal_superseded_by_later_turn);
  const previousMessage = result.turnStage.viewAfterTurn.messages.find(
    (message) => message.id === "prior-assistant-1",
  );
  const currentMessage = result.turnStage.viewAfterTurn.messages.at(-1);

  assert.equal(result.initialSnapshot.view.activePreview?.proposalId, "proposal_prior_1");
  assert.equal(result.turnStage.stagePacket.classifiedTurnMode, "proposal");
  assert.equal(result.turnStage.flags.previewPresent, true);
  assert.equal(result.turnStage.flags.sourceMutated, false);
  assert.equal(previousMessage?.previewStatus, "superseded");
  assert.equal(currentMessage?.previewStatus, "active");
  assert.equal(
    result.turnStage.viewAfterTurn.activePreview?.assistantMessageId,
    currentMessage?.id,
  );
  assert.equal(result.initialSnapshot.source, ROOM_JOURNEY_FIXTURES.proposal_superseded_by_later_turn.initialState.roomSource);
  assert.equal(result.turnStage.viewAfterTurn.mirror.aim.text, "");
});

test("authority_context_consistency stays aligned across initial, turn, and apply stages", async () => {
  const result = await runRoomJourney(ROOM_JOURNEY_FIXTURES.authority_context_consistency);

  assertAuthorityContextConsistent(result.initialSnapshot.view, "initial snapshot");
  assertAuthorityContextConsistent(result.turnStage.viewAfterTurn, "view after turn");
  assert.ok(result.applyStage, "expected apply stage");
  assertAuthorityContextConsistent(result.applyStage.viewAfterApply, "view after apply");

  assert.equal(
    result.initialSnapshot.view.authorityContext?.focusedWitness?.documentKey,
    "doc_dropoff",
  );
  assert.equal(
    result.turnStage.viewAfterTurn.authorityContext?.adjacent?.operate?.available,
    true,
  );
  assert.equal(
    result.applyStage.viewAfterApply.authorityContext?.adjacent?.operate?.hasRun,
    true,
  );
  assert.match(
    result.applyStage.viewAfterApply.authorityContext?.runtime?.nextBestAction || "",
    /\S+/,
  );
});

test("shape_library_not_in_room_path keeps the room truth path independent", async () => {
  const roomTurnRoute = await read("src/app/api/workspace/room/turn/route.js");
  const roomApplyRoute = await read("src/app/api/workspace/room/apply/route.js");
  const roomTurnHandler = await read("src/lib/room-turn-route-handler.js");
  const roomApplyHandler = await read("src/lib/room-apply-route-handler.js");
  const roomServer = await read("src/lib/room-server.js");
  const roomTurnService = await read("src/lib/room-turn-service.js");

  assert.doesNotMatch(roomTurnRoute, /shapelibrary|starter_prior|personal_field|BAT/i);
  assert.doesNotMatch(roomApplyRoute, /shapelibrary|starter_prior|personal_field|BAT/i);
  assert.doesNotMatch(roomTurnHandler, /shapelibrary|starter_prior|personal_field|BAT/i);
  assert.doesNotMatch(roomApplyHandler, /shapelibrary|starter_prior|personal_field|BAT/i);
  assert.doesNotMatch(roomServer, /shapelibrary|starter_prior|personal_field|BAT/i);
  assert.doesNotMatch(roomTurnService, /shapelibrary|starter_prior|personal_field|BAT/i);
});
