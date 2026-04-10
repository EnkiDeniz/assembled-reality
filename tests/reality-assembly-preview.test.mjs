import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("frozen workspace forks redirect into launch shell", async () => {
  const workspacePage = await read("src/app/workspace/page.jsx");

  assert.match(workspacePage, /redirect\(query \? `\/workspace\/phase1\?\$\{query\}` : "\/workspace\/phase1"\)/);
  assert.match(workspacePage, /deprecated/);
  assert.doesNotMatch(workspacePage, /WorkspaceShell/);
});

test("launch shell page emits migration notice context", async () => {
  const phase1Page = await read("src/app/workspace/phase1/page.jsx");
  assert.match(phase1Page, /function buildMigrationNotice/);
  assert.match(phase1Page, /legacy-workspace/);
  assert.doesNotMatch(phase1Page, /workspace-v1/);
  assert.match(phase1Page, /normalizedConnected === "getreceipts"/);
});

test("launch shell still exposes protected intake and player adapters", async () => {
  const shell = await read("LoegosCLI/UX/loegos-phase1-shell.jsx");
  const intakeAdapter = await read("LoegosCLI/UX/lib/intake-adapter.mjs");
  const voiceAdapter = await read("LoegosCLI/UX/lib/voice-player-adapter.mjs");
  const artifactViewModel = await read("LoegosCLI/UX/lib/artifact-view-model.mjs");

  assert.match(shell, /<IntakePanel/);
  assert.match(shell, /<VoicePlayerPanel/);
  assert.match(shell, /<EchoLegibilityPanel/);
  assert.match(shell, /deriveDistantEchoSignal/);
  assert.match(shell, /distant_echo_arrived/);
  assert.match(shell, /data-testid="phase2-distant-echo-event"/);
  assert.match(shell, /data-testid="phase2-echo-legibility"/);
  assert.match(shell, /data-testid="phase2-field-state"/);
  assert.match(shell, /data-testid="phase2-return-provenance"/);
  assert.match(shell, /data-testid="phase2-shell-root"/);
  assert.match(shell, /data-testid="phase2-editor-field-state"/);
  assert.match(artifactViewModel, /export function buildEchoFieldModel/);
  assert.match(artifactViewModel, /export function deriveDistantEchoSignal/);
  assert.match(artifactViewModel, /fieldState/);
  assert.match(intakeAdapter, /\/api\/workspace\/folder/);
  assert.match(intakeAdapter, /\/api\/workspace\/paste/);
  assert.match(intakeAdapter, /\/api\/workspace\/link/);
  assert.match(voiceAdapter, /\/api\/seven\/audio/);
  assert.match(voiceAdapter, /\/api\/reader\/listening-session/);
});
