import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

async function main() {
  const [
    workspacePage,
    workspacePhase1Page,
    launchShell,
    intakeAdapter,
    voiceAdapter,
    authTerminal,
    introLanding,
    readPage,
    libraryPage,
    connectRoute,
    callbackRoute,
    shapeLibraryPage,
    shapeLibraryApiRoute,
    packageJson,
  ] = await Promise.all([
    read("src/app/workspace/page.jsx"),
    read("src/app/workspace/phase1/page.jsx"),
    read("LoegosCLI/UX/loegos-phase1-shell.jsx"),
    read("LoegosCLI/UX/lib/intake-adapter.mjs"),
    read("LoegosCLI/UX/lib/voice-player-adapter.mjs"),
    read("src/components/AuthTerminal.jsx"),
    read("src/components/IntroLanding.jsx"),
    read("src/app/read/page.jsx"),
    read("src/app/library/page.jsx"),
    read("src/app/connect/getreceipts/route.js"),
    read("src/app/api/integrations/getreceipts/callback/route.js"),
    read("src/app/shapelibrary/page.jsx"),
    read("src/app/api/shapelibrary/analyze/route.js"),
    read("package.json"),
  ]);

  assert.match(workspacePage, /deprecated/);
  assert.match(workspacePage, /redirect\(query \? `\/workspace\/phase1\?\$\{query\}` : "\/workspace\/phase1"\)/);
  assert.match(workspacePhase1Page, /buildMigrationNotice/);
  assert.match(workspacePhase1Page, /migrationNotice/);
  assert.doesNotMatch(workspacePhase1Page, /workspace-v1/);

  assert.match(launchShell, /Loegos Phase 2/);
  assert.match(launchShell, /<MirrorView/);
  assert.match(launchShell, /<EditorView/);
  assert.match(launchShell, /migrationNotice/);

  assert.match(intakeAdapter, /\/api\/workspace\/folder/);
  assert.match(intakeAdapter, /\/api\/workspace\/paste/);
  assert.match(intakeAdapter, /\/api\/workspace\/link/);
  assert.match(voiceAdapter, /\/api\/seven\/audio/);
  assert.match(voiceAdapter, /\/api\/reader\/listening-session/);

  assert.match(authTerminal, /\/workspace\/phase1\?mode=listen/);
  assert.match(introLanding, /\/workspace\/phase1\?mode=listen/);
  assert.match(readPage, /redirect\("\/workspace\/phase1"\)/);
  assert.match(libraryPage, /redirect\("\/workspace\/phase1"\)/);
  assert.match(connectRoute, /new URL\("\/workspace\/phase1", origin\)/);
  assert.match(callbackRoute, /new URL\("\/workspace\/phase1", origin\)/);
  assert.match(callbackRoute, /connected", "getreceipts"/);

  assert.match(shapeLibraryPage, /shapelibrary/i);
  assert.match(shapeLibraryApiRoute, /NextResponse\.json/);

  assert.match(packageJson, /"test:e2e": "npm run test:e2e:local"/);
  assert.match(packageJson, /"test:e2e:local": "node scripts\/run-phase1-e2e-local\.mjs"/);
  assert.match(packageJson, /"test:e2e:ci": "playwright test --config=playwright.ci.config.mjs"/);

  console.log("phase1-smoke-check: ok");
}

main().catch((error) => {
  console.error("phase1-smoke-check: failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
