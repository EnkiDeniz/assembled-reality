import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("section dream is a signed-in utility route wired into signed-in navigation only", async () => {
  const dreamPage = await read("src/app/dream/page.jsx");
  const dreamScreen = await read("src/components/dream/SectionDreamScreen.jsx");
  const compilerPanel = await read("src/components/dream/CompilerReadPanel.jsx");
  const shell = await read("src/components/shell/LoegosShell.jsx");
  const roomWorkspace = await read("src/components/room/RoomWorkspace.jsx");
  const publicSite = await read("src/lib/public-site.js");
  const roomServer = await read("src/lib/room-server.js");

  assert.match(dreamPage, /SectionDreamScreen/);
  assert.match(dreamPage, /title: "Library"/);
  assert.match(dreamPage, /getRequiredSession/);
  assert.match(dreamPage, /redirect\("\/"\)/);
  assert.match(dreamPage, /includeDevice:\s*false/);

  assert.match(dreamScreen, /LoegosShell/);
  assert.match(dreamScreen, /<Kicker tone="brand">Library<\/Kicker>/);
  assert.match(dreamScreen, /dream-library-toggle/);
  assert.match(dreamScreen, /dream-compiler-read/);
  assert.match(dreamScreen, /CompilerReadPanel/);
  assert.doesNotMatch(dreamScreen, /ReplayReviewPanel/);
  assert.match(compilerPanel, /useSyncExternalStore/);
  assert.match(compilerPanel, /claim\.text \|\| "Untitled claim"/);
  assert.match(compilerPanel, /claim\.reason \|\| "This claim could not travel cleanly in the current subset\."/);
  assert.doesNotMatch(compilerPanel, /claim\.claimText/);
  assert.doesNotMatch(compilerPanel, /claim\.omissionReason/);
  assert.match(shell, /shell-mode-room/);
  assert.match(shell, /shell-mode-dream/);
  assert.doesNotMatch(shell, /shell-mobile-account/);
  assert.match(shell, /Account/);
  assert.match(shell, /signOut\(\{ callbackUrl: "\/" \}\)/);
  assert.match(shell, /event\.key !== "Tab"/);
  assert.match(roomWorkspace, /room-open-context/);
  assert.match(roomWorkspace, /function WorkingEchoStrip/);
  assert.match(roomWorkspace, /buildWorkingEchoStripStateFromRoomView/);
  assert.match(roomWorkspace, /dream-bridge-return/);
  assert.match(roomWorkspace, /dream-bridge-use/);
  assert.match(roomWorkspace, /dream-bridge-dismiss/);
  assert.match(roomWorkspace, /pendingDreamBridgePayload\?\.state === "armed"/);
  assert.match(roomWorkspace, /setPendingStarterAction\(normalizeText\(nextAction\)\.toLowerCase\(\)\)/);
  assert.match(roomWorkspace, /starterAction: pendingStarterAction/);
  assert.doesNotMatch(roomWorkspace, /setComposerText\(\(current\) => current \|\| incomingPayload\.excerpt/);
  assert.doesNotMatch(roomWorkspace, /const bridgePayload = pendingDreamBridgePayload;/);
  assert.match(dreamScreen, /hasUnsavedPasteChanges \? null : compilerRead/);
  assert.match(dreamScreen, /showCompilerReadSheet && !hasUnsavedPasteChanges/);

  assert.doesNotMatch(publicSite, /\/dream/);
  assert.doesNotMatch(roomServer, /\/dream/);
});
