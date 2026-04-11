import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("workspace route and room api surface are wired for canonical room-first entry", async () => {
  const workspacePage = await read("src/app/workspace/page.jsx");
  const roomRoute = await read("src/app/api/workspace/room/route.js");
  const roomTurnRoute = await read("src/app/api/workspace/room/turn/route.js");
  const roomApplyRoute = await read("src/app/api/workspace/room/apply/route.js");
  const roomTurnHandler = await read("src/lib/room-turn-route-handler.js");
  const roomApplyHandler = await read("src/lib/room-apply-route-handler.js");
  const roomSessionsRoute = await read("src/app/api/workspace/room/sessions/route.js");
  const roomServer = await read("src/lib/room-server.js");
  const roomDocuments = await read("src/lib/room-documents.js");
  const roomSessions = await read("src/lib/room-sessions.js");
  const roomTurnService = await read("src/lib/room-turn-service.js");
  const roomJourneyHarness = await read("tests/helpers/run-room-journey.mjs");
  const schema = await read("prisma/schema.prisma");

  assert.match(workspacePage, /RoomWorkspace/);
  assert.match(workspacePage, /loadRoomWorkspacePageData/);
  assert.match(roomRoute, /buildRoomWorkspaceViewForUser/);
  assert.match(roomTurnRoute, /handleRoomTurnPost/);
  assert.match(roomApplyRoute, /handleRoomApplyPost/);
  assert.match(roomTurnHandler, /runRoomProposalGate/);
  assert.match(roomTurnHandler, /gatePreview/);
  assert.match(roomTurnHandler, /classifyRoomTurnMode/);
  assert.match(roomTurnHandler, /applyRoomTurnGuardrails/);
  assert.match(roomTurnHandler, /buildSafeFallbackTurn/);
  assert.match(roomTurnHandler, /buildRoomPromptPacket/);
  assert.match(roomTurnHandler, /parseRoomResponsesPayload/);
  assert.match(roomApplyHandler, /apply_proposal_preview/);
  assert.match(roomApplyHandler, /complete_receipt_kit/);
  assert.match(roomSessionsRoute, /createRoomSessionForProject/);
  assert.match(roomSessionsRoute, /activateRoomSessionForProject/);
  assert.match(roomSessionsRoute, /archiveRoomSessionForProject/);
  assert.match(roomServer, /ensureRoomAssemblyDocumentForProject/);
  assert.match(roomServer, /ensureRoomSessionForProject/);
  assert.match(roomServer, /authorityContext/);
  assert.match(roomServer, /buildWorkingEcho/);
  assert.match(roomServer, /activePreview/);
  assert.match(roomServer, /workingEcho/);
  assert.match(roomServer, /focusedWitness/);
  assert.match(roomServer, /roomIdentity/);
  assert.match(roomServer, /adjacent/);
  assert.match(roomDocuments, /hiddenFromProjectHome:\s*true/);
  assert.match(roomDocuments, /roomDocument:\s*true/);
  assert.match(roomSessions, /ensureCompilerFirstWorkspaceResetForUser/);
  assert.match(roomTurnService, /buildRoomSystemPrompt/);
  assert.match(roomTurnService, /buildRoomUserPrompt/);
  assert.match(roomJourneyHarness, /buildWorkingEcho/);
  assert.match(roomJourneyHarness, /workingEcho,/);
  assert.match(schema, /model ReaderRoomSession/);
});

test("room canonical pipeline uses gate, compiler/runtime helpers, and hidden assembly documents", async () => {
  const roomCanonical = await read("src/lib/room-canonical.js");
  const roomState = await read("src/lib/room.js");
  const roomUi = await read("src/components/room/RoomWorkspace.jsx");
  const seedModel = await read("src/lib/seed-model.js");
  const roomTurnService = await read("src/lib/room-turn-service.js");

  assert.match(roomCanonical, /applySevenProposalGate/);
  assert.match(roomCanonical, /buildBoxSectionsFromArtifact/);
  assert.match(roomCanonical, /buildEchoFieldModel/);
  assert.match(roomCanonical, /derivePaneInteractionContract/);
  assert.match(roomCanonical, /createWindowState/);
  assert.match(roomCanonical, /buildRoomPreviewState/);
  assert.match(roomCanonical, /proposal_applied/);

  assert.match(roomState, /buildInitialRoomAssemblySource/);
  assert.match(roomState, /ROOM_LEGACY_SEED_MODE/);
  assert.match(roomState, /normalizeRoomTurnResult/);
  assert.match(roomState, /isRoomAssemblyDocument/);
  assert.match(roomState, /deriveMirrorRegionFromDomain/);
  assert.match(roomTurnService, /extractRoomMessageText/);
  assert.match(roomTurnService, /parseRoomJsonObject/);

  assert.match(roomUi, /Preview/);
  assert.match(roomUi, /WorkingEchoPanel/);
  assert.match(roomUi, /What Seems Real/);
  assert.match(roomUi, /What Conflicts/);
  assert.match(roomUi, /What Would Decide It/);
  assert.match(roomUi, /What Changed After Return/);
  assert.match(roomUi, /Weakens The Popular Read/);
  assert.match(roomUi, /Apply to Room/);
  assert.match(roomUi, /previewStatus/);
  assert.match(roomUi, /AuthorityPanel/);
  assert.match(roomUi, /Box canon unchanged/);
  assert.match(roomUi, /Session-scoped\. Not canon\./);
  assert.match(roomUi, /FocusedWitnessPanel/);
  assert.match(roomUi, /OperatePanel/);
  assert.match(roomUi, /Ask Seven to audit/);
  assert.match(roomUi, /Witness/);
  assert.doesNotMatch(roomUi, /Inspect proposal/);
  assert.doesNotMatch(roomUi, /Structure Waking/);
  assert.match(roomUi, /apply_proposal_preview/);
  assert.match(roomUi, /complete_receipt_kit/);
  assert.match(roomUi, /mirrorRegion/);
  assert.match(roomUi, /What's on your mind\?/);
  assert.match(roomUi, /Start talking\.\.\./);
  assert.match(roomUi, /href="\/account"/);
  assert.match(roomUi, /signOut\(\{ callbackUrl: "\/" \}\)/);

  assert.match(seedModel, /isRoomAssemblyDocument/);
});

test("strict ping rule, mirror regions, and receipt artifact support remain encoded in the room layer", async () => {
  const roomCanonical = await read("src/lib/room-canonical.js");
  const roomTurnRoute = await read("src/app/api/workspace/room/turn/route.js");
  const roomTurnHandler = await read("src/lib/room-turn-route-handler.js");
  const roomState = await read("src/lib/room.js");
  const roomPolicy = await read("src/lib/room-turn-policy.mjs");
  const roomApplyRoute = await read("src/app/api/workspace/room/apply/route.js");
  const roomApplyHandler = await read("src/lib/room-apply-route-handler.js");
  const projectRoute = await read("src/app/api/workspace/project/route.js");
  const roomServer = await read("src/lib/room-server.js");
  const readerPage = await read("src/app/read/[documentKey]/page.jsx");
  const roomTurnService = await read("src/lib/room-turn-service.js");

  assert.match(roomCanonical, /ping_requires_test/);
  assert.match(roomCanonical, /semantic_reject/);
  assert.match(roomTurnService, /never propose MOV without TST/i);
  assert.match(roomTurnService, /sharp friend/);
  assert.match(roomTurnService, /7x7/);
  assert.match(roomTurnService, /at most 7 sentences, at most 7 words each/);
  assert.match(roomTurnService, /one short answer and then ask why it matters right now/);
  assert.match(roomTurnService, /exact excerpt from assistantText/);
  assert.match(roomTurnService, /Do not write numbered lists, bullet lists/);
  assert.match(roomTurnService, /Turn mode is conversation/);
  assert.match(roomTurnService, /Turn style hint:/);
  assert.match(roomTurnRoute, /ROOM_TURN_RESPONSE_SCHEMA/);
  assert.match(roomTurnHandler, /json_schema/);
  assert.match(roomTurnHandler, /ROOM_TURN_RESPONSE_SCHEMA/);
  assert.match(roomTurnHandler, /sessionId/);
  assert.match(roomTurnHandler, /mirrorRegion/);
  assert.match(roomTurnHandler, /ROOM_MIRROR_REGION_VALUES = \["aim", "evidence", "story", "moves", "returns"\]/);
  assert.match(roomApplyHandler, /sessionView\.session\.threadDocumentKey/);
  assert.match(projectRoute, /includeDefaultSource:\s*false/);
  assert.match(roomServer, /ensureDefault:\s*false/);
  assert.match(readerPage, /adjacent", "witness"/);
  assert.match(roomPolicy, /classifyRoomTurnMode/);
  assert.match(roomPolicy, /filterSegmentsToAssistantText/);
  assert.match(roomPolicy, /normalizeAssistantTextForRoom/);
  assert.match(roomPolicy, /Conversation-only clarification is not a lawful move or test/);
  assert.match(roomState, /"upload"/);
  assert.match(roomState, /"paste"/);
  assert.match(roomState, /"link"/);
  assert.match(roomState, /"draft_message"/);
  assert.match(roomState, /"checklist"/);
  assert.match(roomState, /"compare"/);
});
