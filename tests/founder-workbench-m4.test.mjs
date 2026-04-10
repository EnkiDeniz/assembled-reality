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

test("phase1 page redirects to the room", async () => {
  const phase1Page = await read("src/app/workspace/phase1/page.jsx");

  assert.match(phase1Page, /redirect\(query \? `\/workspace\?/);
  assert.doesNotMatch(phase1Page, /LoegosPhase1Shell/);
});

test("auth and read/library routes target the room", async () => {
  const introLanding = await read("src/components/IntroLanding.jsx");
  const authTerminal = await read("src/components/AuthTerminal.jsx");
  const readPage = await read("src/app/read/page.jsx");
  const libraryPage = await read("src/app/library/page.jsx");

  assert.match(introLanding, /callbackUrl: "\/workspace"/);
  assert.match(authTerminal, /callbackUrl: "\/workspace"/);
  assert.match(readPage, /redirect\("\/workspace"\)/);
  assert.match(libraryPage, /redirect\("\/workspace"\)/);
});

test("integration callback lands on the room", async () => {
  const connectRoute = await read("src/app/connect/getreceipts/route.js");
  const callbackRoute = await read("src/app/api/integrations/getreceipts/callback/route.js");

  assert.match(connectRoute, /new URL\("\/workspace", origin\)/);
  assert.match(callbackRoute, /new URL\("\/workspace", origin\)/);
  assert.match(callbackRoute, /url\.searchParams\.set\("connected", "getreceipts"\)/);
});

test("account shell exposes the shared top-bar control menu", async () => {
  const accountShell = await read("src/components/AccountShell.jsx");
  const controlMenu = await read("src/components/GlobalControlMenu.jsx");

  assert.match(accountShell, /<GlobalControlMenu/);
  assert.match(controlMenu, /href: "\/workspace"/);
  assert.match(controlMenu, /href: "\/account"/);
  assert.match(controlMenu, /href: "\/intro"/);
  assert.match(controlMenu, /signOut\(\{ callbackUrl: "\/" \}\)/);
});
