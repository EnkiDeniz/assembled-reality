import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("/workspace/v1 uses the shared loader and the new reality-assembly shell", async () => {
  const workspacePage = await read("src/app/workspace/page.jsx");
  const workspaceV1Page = await read("src/app/workspace/v1/page.jsx");
  const shell = await read("src/components/reality-assembly/RealityAssemblyShell.jsx");

  assert.match(workspacePage, /loadWorkspacePageData/);
  assert.match(workspaceV1Page, /loadWorkspacePageData/);
  assert.match(workspaceV1Page, /RealityAssemblyShell/);
  assert.match(shell, /const VIEW_KEYS = Object\.freeze\(\{/);
  assert.match(shell, /box:\s*"box"/);
  assert.match(shell, /witness:\s*"witness"/);
  assert.match(shell, /compare:\s*"compare"/);
  assert.match(shell, /language:\s*"language"/);
  assert.match(shell, /receipt:\s*"receipt"/);
  assert.match(shell, /Reality assembly preview/);
});

test("Witness marking persists as block metadata instead of a new top-level object", async () => {
  const blocks = await read("src/lib/document-blocks.js");
  const documents = await read("src/lib/workspace-documents.js");
  const shell = await read("src/components/reality-assembly/RealityAssemblyShell.jsx");
  const workbench = await read("src/components/workspace/WorkspaceDocumentWorkbench.jsx");

  assert.match(blocks, /function normalizeAdvancementMark/);
  assert.match(blocks, /advancementMark: normalizeAdvancementMark/);
  assert.match(documents, /advancementMark: block\.advancementMark/);
  assert.match(shell, /kind: "advance"/);
  assert.match(shell, /Advanced blocks/);
  assert.match(shell, /selectionActionAddLabel="Advance"/);
  assert.match(workbench, /showSelectionActions = false/);
  assert.match(workbench, /selectionActionAddLabel = "Stage into weld"/);
});

test("Preview shell keeps listening and compile on the shared backend spine", async () => {
  const shell = await read("src/components/reality-assembly/RealityAssemblyShell.jsx");
  const seedModel = await read("src/lib/seed-model.js");

  assert.match(shell, /\/api\/reader\/listening-session/);
  assert.match(shell, /\/api\/workspace\/seed/);
  assert.match(shell, /Compile to Lœgos/);
  assert.match(shell, /witnessIsStale/);
  assert.match(shell, /playerSource === "language"/);
  assert.match(seedModel, /compiledFromDocumentKey/);
  assert.match(seedModel, /compiledFromUpdatedAt/);
  assert.match(seedModel, /witnessAnchorReferences/);
});
