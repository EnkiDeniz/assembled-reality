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
  assert.match(dreamPage, /Dream Library/);
  assert.match(dreamPage, /getRequiredSession/);
  assert.match(dreamPage, /redirect\("\/"\)/);
  assert.match(dreamPage, /includeDevice:\s*false/);

  assert.match(dreamScreen, /LoegosShell/);
  assert.match(dreamScreen, /Dream Library/);
  assert.match(dreamScreen, /dream-library-toggle/);
  assert.match(shell, /shell-mode-room/);
  assert.match(shell, /shell-mode-dream/);
  assert.match(shell, /Account/);
  assert.match(shell, /signOut\(\{ callbackUrl: "\/" \}\)/);
  assert.match(roomWorkspace, /room-open-context/);
  assert.match(roomWorkspace, /Dream Library passage/);

  assert.doesNotMatch(publicSite, /\/dream/);
  assert.doesNotMatch(roomServer, /\/dream/);
});
