import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("workspace entry route loads the room-first shell", async () => {
  const workspacePage = await read("src/app/workspace/page.jsx");

  assert.match(workspacePage, /RoomWorkspace/);
  assert.match(workspacePage, /loadRoomWorkspacePageData/);
  assert.doesNotMatch(workspacePage, /redirect\(query \? `\/workspace\/phase1/);
});

test("phase1 page loads launch shell and bootstraps migration context", async () => {
  const phase1Page = await read("src/app/workspace/phase1/page.jsx");

  assert.match(phase1Page, /buildMigrationNotice/);
  assert.match(phase1Page, /migrationNotice/);
  assert.match(phase1Page, /<LoegosPhase1Shell bootstrap=\{bootstrap\} \/>/);
});

test("auth and read/library routes target launch shell semantics", async () => {
  const introLanding = await read("src/components/IntroLanding.jsx");
  const authTerminal = await read("src/components/AuthTerminal.jsx");
  const readPage = await read("src/app/read/page.jsx");
  const libraryPage = await read("src/app/library/page.jsx");

  assert.match(introLanding, /\/workspace\/phase1/);
  assert.match(authTerminal, /\/workspace\/phase1/);
  assert.match(readPage, /redirect\("\/workspace\/phase1"\)/);
  assert.match(libraryPage, /redirect\("\/workspace\/phase1"\)/);
});

test("integration callback lands on launch shell", async () => {
  const connectRoute = await read("src/app/connect/getreceipts/route.js");
  const callbackRoute = await read("src/app/api/integrations/getreceipts/callback/route.js");

  assert.match(connectRoute, /new URL\("\/workspace\/phase1", origin\)/);
  assert.match(callbackRoute, /new URL\("\/workspace\/phase1", origin\)/);
  assert.match(callbackRoute, /url\.searchParams\.set\("connected", "getreceipts"\)/);
});
