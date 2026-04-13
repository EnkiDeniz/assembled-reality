import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("section dream is a signed-in utility route wired into signed-in navigation only", async () => {
  const dreamPage = await read("src/app/dream/page.jsx");
  const dreamScreen = await read("src/components/dream/SectionDreamScreen.jsx");
  const shell = await read("src/components/shell/LoegosShell.jsx");
  const roomWorkspace = await read("src/components/room/RoomWorkspace.jsx");
  const publicSite = await read("src/lib/public-site.js");
  const roomServer = await read("src/lib/room-server.js");

  assert.match(dreamPage, /SectionDreamScreen/);
  assert.match(dreamPage, /title: "Dream"/);
  assert.match(dreamPage, /getRequiredSession/);
  assert.match(dreamPage, /redirect\("\/"\)/);
  assert.match(dreamPage, /includeDevice:\s*false/);

  assert.match(dreamScreen, /LoegosShell/);
  assert.match(dreamScreen, /<Kicker tone="brand">Dream<\/Kicker>/);
  assert.match(dreamScreen, /dream-library-toggle/);
  assert.match(dreamScreen, /dream-compiler-read/);
  assert.match(dreamScreen, /CompilerReadPanel/);
  assert.match(shell, /shell-mode-room/);
  assert.match(shell, /shell-mode-dream/);
  assert.match(shell, /Account/);
  assert.match(shell, /signOut\(\{ callbackUrl: "\/" \}\)/);
  assert.match(shell, /event\.key !== "Tab"/);
  assert.match(roomWorkspace, /room-open-context/);
  assert.match(roomWorkspace, /function WorkingEchoStrip/);
  assert.match(roomWorkspace, /buildWorkingEchoStripStateFromRoomView/);
  assert.match(roomWorkspace, /dream-bridge-return/);
  assert.match(roomWorkspace, /dream-bridge-use/);
  assert.doesNotMatch(roomWorkspace, /setComposerText\(\(current\) => current \|\| incomingPayload\.excerpt/);

  assert.doesNotMatch(publicSite, /\/dream/);
  assert.doesNotMatch(roomServer, /\/dream/);
});
