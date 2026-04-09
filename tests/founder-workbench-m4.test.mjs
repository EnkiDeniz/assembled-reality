import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Desktop shell is now object-driven around box, witness, compare, language, and receipt", async () => {
  const workspaceShell = await read("src/components/WorkspaceShell.jsx");

  assert.match(workspaceShell, /const DESKTOP_SHELL_SELECTIONS = Object\.freeze\(\{/);
  assert.match(workspaceShell, /box:\s*"box"/);
  assert.match(workspaceShell, /witness:\s*"witness"/);
  assert.match(workspaceShell, /compare:\s*"compare"/);
  assert.match(workspaceShell, /language:\s*"language"/);
  assert.match(workspaceShell, /receipt:\s*"receipt"/);
  assert.match(workspaceShell, /showDesktopCapabilityShell/);
  assert.match(workspaceShell, /workspaceContent=\{founderCustomWorkspaceContent\}/);
  assert.match(workspaceShell, /rootActive=\{founderViewingBox\}/);
  assert.match(workspaceShell, /onSelectRoot=\{\(\) => openCurrentBoxHome\(activeProjectKey\)\}/);
});

test("Witness compile is explicit and compile metadata is persisted on the language file", async () => {
  const workspaceShell = await read("src/components/WorkspaceShell.jsx");
  const seedRoute = await read("src/app/api/workspace/seed/route.js");
  const seedModel = await read("src/lib/seed-model.js");

  assert.match(workspaceShell, /async function compileWitnessToLoegos/);
  assert.match(workspaceShell, /requestSeedOperation\("compile"/);
  assert.match(workspaceShell, /workspace-founder-compile-witness/);
  assert.match(workspaceShell, /Recompile to Lœgos/);

  assert.match(seedRoute, /if \(mode === "compile"\)/);
  assert.match(seedRoute, /compiledFromDocumentKey/);
  assert.match(seedRoute, /compiledFromUpdatedAt/);
  assert.match(seedRoute, /witnessAnchorReferences/);
  assert.match(seedModel, /compiledFromDocumentKey/);
  assert.match(seedModel, /compiledFromUpdatedAt/);
  assert.match(seedModel, /compiledFromTitle/);
});

test("Capability shell has distinct box, witness, and receipt object views", async () => {
  const workspaceShell = await read("src/components/WorkspaceShell.jsx");
  const founderShell = await read("src/components/founder/FounderShell.jsx");
  const founderInfoPanel = await read("src/components/founder/FounderInfoPanel.jsx");

  assert.match(workspaceShell, /workspace-box-view/);
  assert.match(workspaceShell, /workspace-witness-view/);
  assert.match(workspaceShell, /workspace-receipt-view/);
  assert.match(workspaceShell, /<ProjectHome/);
  assert.match(workspaceShell, /<WorkspaceDocumentWorkbench/);
  assert.match(workspaceShell, /<ReceiptSurface/);
  assert.match(workspaceShell, /<FounderInfoPanel/);
  assert.match(founderShell, /workspaceContent = null/);
  assert.match(founderShell, /sidePanel = null/);
  assert.match(founderInfoPanel, /export default function FounderInfoPanel/);
});

test("Language view keeps operate and compare inside the same workbench", async () => {
  const workspaceShell = await read("src/components/WorkspaceShell.jsx");

  assert.match(workspaceShell, /workspace-founder-run-operate/);
  assert.match(workspaceShell, /runSeedVisibleInlineOperate/);
  assert.match(workspaceShell, /workspace-founder-open-compare/);
  assert.match(workspaceShell, /workspace-founder-open-language/);
  assert.match(workspaceShell, /founderWitnessIsStale/);
  assert.match(workspaceShell, /The compiler could not infer a stable type for this line yet\./);
});

test("Receipt view stays inside the same shell and box home is the explicit return target", async () => {
  const workspaceShell = await read("src/components/WorkspaceShell.jsx");
  const founderShell = await read("src/components/founder/FounderShell.jsx");

  assert.match(workspaceShell, /workspace-founder-draft-receipt/);
  assert.match(workspaceShell, /workspace-founder-seal-latest/);
  assert.match(workspaceShell, /setDesktopShellSelection\(DESKTOP_SHELL_SELECTIONS\.box\)/);
  assert.match(workspaceShell, /workspace-founder-open-box/);
  assert.match(founderShell, /Open box/);
});
