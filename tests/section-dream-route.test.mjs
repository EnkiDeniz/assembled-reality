import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("section dream is a signed-in utility route wired into signed-in navigation only", async () => {
  const dreamPage = await read("src/app/dream/page.jsx");
  const globalMenu = await read("src/components/GlobalControlMenu.jsx");
  const roomWorkspace = await read("src/components/room/RoomWorkspace.jsx");
  const publicSite = await read("src/lib/public-site.js");
  const roomServer = await read("src/lib/room-server.js");

  assert.match(dreamPage, /SectionDreamScreen/);
  assert.match(dreamPage, /getRequiredSession/);
  assert.match(dreamPage, /redirect\("\/"\)/);
  assert.match(dreamPage, /includeDevice:\s*false/);

  assert.match(globalMenu, /href:\s*"\/dream"/);
  assert.match(globalMenu, /Section Dream/);
  assert.match(roomWorkspace, /href="\/dream"/);
  assert.match(roomWorkspace, /Section Dream/);

  assert.doesNotMatch(publicSite, /\/dream/);
  assert.doesNotMatch(roomServer, /\/dream/);
});
