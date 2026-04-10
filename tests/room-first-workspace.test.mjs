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
  const roomServer = await read("src/lib/room-server.js");
  const roomDocuments = await read("src/lib/room-documents.js");

  assert.match(workspacePage, /RoomWorkspace/);
  assert.match(workspacePage, /loadRoomWorkspacePageData/);
  assert.match(roomRoute, /buildRoomWorkspaceViewForUser/);
  assert.match(roomTurnRoute, /runRoomProposalGate/);
  assert.match(roomTurnRoute, /gatePreview/);
  assert.match(roomTurnRoute, /classifyRoomTurnMode/);
  assert.match(roomTurnRoute, /applyRoomTurnGuardrails/);
  assert.match(roomTurnRoute, /buildSafeFallbackTurn/);
  assert.match(roomApplyRoute, /apply_proposal_preview/);
  assert.match(roomApplyRoute, /complete_receipt_kit/);
  assert.match(roomServer, /ensureRoomAssemblyDocumentForProject/);
  assert.match(roomDocuments, /hiddenFromProjectHome:\s*true/);
  assert.match(roomDocuments, /roomDocument:\s*true/);
});

test("room canonical pipeline uses gate, compiler/runtime helpers, and hidden assembly documents", async () => {
  const roomCanonical = await read("src/lib/room-canonical.js");
  const roomState = await read("src/lib/room.js");
  const roomUi = await read("src/components/room/RoomWorkspace.jsx");
  const seedModel = await read("src/lib/seed-model.js");

  assert.match(roomCanonical, /applySevenProposalGate/);
  assert.match(roomCanonical, /buildBoxSectionsFromArtifact/);
  assert.match(roomCanonical, /buildEchoFieldModel/);
  assert.match(roomCanonical, /derivePaneInteractionContract/);
  assert.match(roomCanonical, /createWindowState/);
  assert.match(roomCanonical, /buildProposalWakeViewModel/);
  assert.match(roomCanonical, /proposal_applied/);

  assert.match(roomState, /buildInitialRoomAssemblySource/);
  assert.match(roomState, /ROOM_LEGACY_SEED_MODE/);
  assert.match(roomState, /normalizeRoomTurnResult/);
  assert.match(roomState, /isRoomAssemblyDocument/);
  assert.match(roomState, /deriveMirrorRegionFromDomain/);

  assert.match(roomUi, /Structure Waking/);
  assert.match(roomUi, /Apply to Room/);
  assert.match(roomUi, /Inspect proposal/);
  assert.match(roomUi, /Inspect blocked proposal/);
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
  const roomState = await read("src/lib/room.js");
  const roomPolicy = await read("src/lib/room-turn-policy.mjs");

  assert.match(roomCanonical, /ping_requires_test/);
  assert.match(roomCanonical, /semantic_reject/);
  assert.match(roomTurnRoute, /never propose MOV without TST/i);
  assert.match(roomTurnRoute, /sharp friend/);
  assert.match(roomTurnRoute, /one short answer and then ask why it matters right now/);
  assert.match(roomTurnRoute, /exact excerpt from assistantText/);
  assert.match(roomTurnRoute, /Do not write numbered lists, bullet lists/);
  assert.match(roomTurnRoute, /Turn mode is conversation/);
  assert.match(roomTurnRoute, /Turn style hint:/);
  assert.match(roomTurnRoute, /mirrorRegion/);
  assert.match(roomTurnRoute, /aim\|evidence\|story\|moves\|returns/);
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
