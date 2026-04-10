import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("workspace route and room api surface are wired for room-first entry", async () => {
  const workspacePage = await read("src/app/workspace/page.jsx");
  const roomRoute = await read("src/app/api/workspace/room/route.js");
  const roomTurnRoute = await read("src/app/api/workspace/room/turn/route.js");
  const roomApplyRoute = await read("src/app/api/workspace/room/apply/route.js");

  assert.match(workspacePage, /RoomWorkspace/);
  assert.match(workspacePage, /loadRoomWorkspacePageData/);
  assert.match(roomRoute, /buildRoomWorkspaceViewForUser/);
  assert.match(roomTurnRoute, /appendConversationExchangeForUser/);
  assert.match(roomTurnRoute, /No silent mutation/);
  assert.match(roomApplyRoute, /apply_mirror_draft/);
  assert.match(roomApplyRoute, /complete_receipt_kit/);
});

test("room shell keeps source intake, receipt kits, and deep links inside the new client surface", async () => {
  const roomShell = await read("src/components/room/RoomWorkspace.jsx");
  const roomState = await read("src/lib/room.js");

  assert.match(roomShell, /\/api\/workspace\/room\/turn/);
  assert.match(roomShell, /\/api\/workspace\/room\/apply/);
  assert.match(roomShell, /\/api\/workspace\/paste/);
  assert.match(roomShell, /\/api\/workspace\/link/);
  assert.match(roomShell, /\/api\/documents/);
  assert.match(roomShell, /ReceiptKitCard/);
  assert.match(roomShell, /MirrorPanel/);
  assert.match(roomShell, /ToolLinks/);

  assert.match(roomState, /"upload"/);
  assert.match(roomState, /"paste"/);
  assert.match(roomState, /"link"/);
  assert.match(roomState, /"draft_message"/);
  assert.match(roomState, /"checklist"/);
  assert.match(roomState, /"compare"/);
  assert.match(roomState, /"awaiting"/);
  assert.match(roomState, /"sealed"/);
  assert.match(roomState, /commitReceiptKitToRoomState/);
});
