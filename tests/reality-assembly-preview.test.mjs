import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("workspace entry now renders the room-first shell while phase1 stays available", async () => {
  const workspacePage = await read("src/app/workspace/page.jsx");

  assert.match(workspacePage, /RoomWorkspace/);
  assert.match(workspacePage, /loadRoomWorkspacePageData/);
  assert.doesNotMatch(workspacePage, /deprecated/);
  assert.doesNotMatch(workspacePage, /redirect\(query \? `\/workspace\/phase1/);
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
  assert.match(shell, /data-testid="phase2-ripple-toggle"/);
  assert.match(shell, /data-testid="phase2-product-law"/);
  assert.match(shell, /Only returned evidence clears fog; mapped regions can become stale without renewed echoes\./);
  assert.match(shell, /data-testid="phase2-four-pane-instrument"/);
  assert.match(shell, /testId="phase2-pane-ping"/);
  assert.match(shell, /testId="phase2-pane-listen"/);
  assert.match(shell, /testId="phase2-pane-echoes"/);
  assert.match(shell, /testId="phase2-pane-field"/);
  assert.match(shell, /data-testid="phase2-range-switch"/);
  assert.match(shell, /data-testid="phase2-range-label"/);
  assert.match(shell, /Level 1 - Single Box/);
  assert.match(shell, /Level 4 - Shared Field/);
  assert.match(shell, /data-testid="phase2-range-track"/);
  assert.match(shell, /data-testid="phase2-range-hotkeys-hint"/);
  assert.match(shell, /Hotkeys: 1=box, 2=domain, 3=full field, 4=shared field\./);
  assert.match(shell, /getRangeStorageKey/);
  assert.match(shell, /shared_signals:/);
  assert.match(shell, /Did I ping\?/);
  assert.match(shell, /Am I waiting\?/);
  assert.match(shell, /What came back, from where\?/);
  assert.match(shell, /How clear is this region\?/);
  assert.match(shell, /data-testid="phase2-echo-legibility"/);
  assert.match(shell, /data-testid="phase2-field-state"/);
  assert.match(shell, /data-testid="phase2-return-provenance"/);
  assert.match(shell, /data-testid="phase2-shell-root"/);
  assert.match(shell, /data-testid="phase2-room-surface"/);
  assert.match(shell, /What is still unknown\?/);
  assert.match(shell, /What is next lawful move\?/);
  assert.match(shell, /data-testid="phase2-seven-segment"/);
  assert.match(shell, /data-testid="phase2-seven-segment-clause"/);
  assert.match(shell, /data-testid="phase2-receipt-kit"/);
  assert.match(shell, /data-testid="phase2-receipt-paste-input"/);
  assert.match(shell, /data-testid="phase2-receipt-paste-submit"/);
  assert.match(shell, /data-testid="phase2-receipt-result"/);
  assert.match(shell, /data-testid="phase2-box-collapse-toggle"/);
  assert.match(shell, /data-testid="phase2-evidence-story-ratio"/);
  assert.match(shell, /data-testid="phase2-settings-panel"/);
  assert.match(shell, /data-testid="phase2-tab-settings"/);
  assert.match(shell, /data-testid="phase2-tab-profile"/);
  assert.match(shell, /data-testid="phase2-tab-help"/);
  assert.match(shell, /data-testid="phase2-settings-content"/);
  assert.match(shell, /data-testid="phase2-profile-content"/);
  assert.match(shell, /data-testid="phase2-help-content"/);
  assert.match(shell, /data-testid="phase2-compass-lock"/);
  assert.match(shell, /data-testid="phase2-compass-enable"/);
  assert.match(shell, /data-testid="phase2-instrument-drawer"/);
  assert.match(shell, /data-testid="phase2-instrument-toggle"/);
  assert.match(shell, /data-testid="phase2-attest-submit"/);
  assert.match(shell, /Manual attest override/);
  assert.match(shell, /derivePaneInteractionContract/);
  assert.match(shell, /data-testid="phase2-editor-field-state"/);
  assert.match(artifactViewModel, /export function buildEchoFieldModel/);
  assert.match(artifactViewModel, /export function deriveDistantEchoSignal/);
  assert.match(artifactViewModel, /export function derivePaneInteractionContract/);
  assert.match(artifactViewModel, /nextBestAction/);
  assert.match(artifactViewModel, /fieldState/);
  assert.match(intakeAdapter, /\/api\/workspace\/folder/);
  assert.match(intakeAdapter, /\/api\/workspace\/paste/);
  assert.match(intakeAdapter, /\/api\/workspace\/link/);
  assert.match(voiceAdapter, /\/api\/seven\/audio/);
  assert.match(voiceAdapter, /\/api\/reader\/listening-session/);
});
