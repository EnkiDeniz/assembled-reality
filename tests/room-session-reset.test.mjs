import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("compiler-first reset and explicit room sessions are encoded in the workspace layer", async () => {
  const roomSessions = await read("src/lib/room-sessions.js");
  const roomWorkspace = await read("src/components/room/RoomWorkspace.jsx");
  const roomCss = await read("src/components/room/RoomWorkspace.module.css");

  assert.match(roomSessions, /compilerFirstWorkspaceResetAt/);
  assert.match(roomSessions, /readerProject\.deleteMany/);
  assert.match(roomSessions, /readerDocument\.deleteMany/);
  assert.match(roomSessions, /createRoomSessionForProject/);
  assert.match(roomSessions, /activateRoomSessionForProject/);
  assert.match(roomSessions, /archiveRoomSessionForProject/);

  assert.match(roomWorkspace, /New Conversation/);
  assert.match(roomWorkspace, /handleCreateSession/);
  assert.match(roomWorkspace, /handleActivateSession/);
  assert.match(roomWorkspace, /handleArchiveSession/);
  assert.match(roomWorkspace, /sessionId/);

  assert.match(roomCss, /sessionRowButton/);
  assert.match(roomCss, /ghostButton/);
});
