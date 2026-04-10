import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("room workspace carries focused witness and adjacent operate as non-canonical side lanes", async () => {
  const roomServer = await read("src/lib/room-server.js");
  const roomRoute = await read("src/app/api/workspace/room/route.js");
  const roomTurnRoute = await read("src/app/api/workspace/room/turn/route.js");
  const roomApplyRoute = await read("src/app/api/workspace/room/apply/route.js");
  const roomSessionsRoute = await read("src/app/api/workspace/room/sessions/route.js");
  const operateRoute = await read("src/app/api/workspace/operate/route.js");
  const roomUi = await read("src/components/room/RoomWorkspace.jsx");

  assert.match(roomServer, /focusedWitness/);
  assert.match(roomServer, /roomIdentity/);
  assert.match(roomServer, /adjacent:\s*\{/);
  assert.match(roomRoute, /documentKey/);
  assert.match(roomTurnRoute, /documentKey/);
  assert.match(roomApplyRoute, /documentKey/);
  assert.match(roomSessionsRoute, /documentKey/);

  assert.match(operateRoute, /createSummaryResponse/);
  assert.match(operateRoute, /mode:\s*"summary"/);
  assert.match(operateRoute, /getLatestReaderOperateRunForUser/);

  assert.match(roomUi, /handleOpenWitness/);
  assert.match(roomUi, /handleOpenOperate/);
  assert.match(roomUi, /loadOperateSummary/);
  assert.match(roomUi, /Canon source/);
  assert.match(roomUi, /Focused witness/);
  assert.match(roomUi, /Adjacent advisory/);
});
