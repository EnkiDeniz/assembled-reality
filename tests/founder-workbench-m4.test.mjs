import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Founder workbench keeps compare active through operate and receipts", async () => {
  const workspaceShell = await read("src/components/WorkspaceShell.jsx");

  assert.match(
    workspaceShell,
    /boxPhase === BOX_PHASES\.create \|\|\s*boxPhase === BOX_PHASES\.operate \|\|\s*boxPhase === BOX_PHASES\.receipts/,
  );
  assert.match(workspaceShell, /Operate reads the active structure while the witness stays fixed beside it\./);
  assert.match(workspaceShell, /The language stays central while receipt drafts and seals close the move\./);
});

test("Founder player supports explicit witness versus language playback", async () => {
  const workspaceShell = await read("src/components/WorkspaceShell.jsx");

  assert.match(workspaceShell, /const \[founderPlaybackSurface, setFounderPlaybackSurface\] = useState\("language"\)/);
  assert.match(workspaceShell, /sourceOptions = \[\]/);
  assert.match(workspaceShell, /selectedSourceKey = ""/);
  assert.match(workspaceShell, /onSelectSource/);
  assert.match(workspaceShell, /handleFounderPlaybackSourceSelect/);
  assert.match(workspaceShell, /label: "Language"/);
  assert.match(workspaceShell, /label: "Witness"/);
  assert.match(workspaceShell, /Playback stopped so the workbench can switch sources\./);
  assert.match(workspaceShell, /resolvePlaybackContext/);
});

test("Founder tree items are interactive for witnesses, language files, and receipts", async () => {
  const founderTree = await read("src/components/founder/FounderWorkbenchTree.jsx");
  const workspaceShell = await read("src/components/WorkspaceShell.jsx");
  const css = await read("src/app/globals.css");

  assert.match(founderTree, /typeof item\?\.onClick === "function"/);
  assert.match(founderTree, /founder-tree__item-button/);
  assert.match(workspaceShell, /key: "witnesses"/);
  assert.match(workspaceShell, /key: "language"/);
  assert.match(workspaceShell, /key: "receipts"/);
  assert.match(css, /\.founder-tree__item-button/);
});

test("Founder grammar distinguishes attested, stale, and contradicted exception states", async () => {
  const founderRenderer = await read("src/lib/founder-renderer.js");
  const css = await read("src/app/globals.css");

  assert.match(founderRenderer, /marker: "ATT"/);
  assert.match(founderRenderer, /marker: "STL"/);
  assert.match(founderRenderer, /label: "Stale override"/);
  assert.match(founderRenderer, /label: Array\.isArray\(evidence\) && evidence\.length \? "Contradicted" : "Unsupported"/);
  assert.match(founderRenderer, /attested override.*no longer match the current text\./s);
  assert.match(css, /\.loegos-block__exception--stale/);
  assert.match(css, /\.loegos-block__exception--contradicted/);
});

test("Founder primary actions cover operate, draft receipt, and seal latest", async () => {
  const workspaceShell = await read("src/components/WorkspaceShell.jsx");

  assert.match(workspaceShell, /testId: "workspace-seed-next-run-operate"/);
  assert.match(workspaceShell, /testId: "workspace-founder-next-draft-receipt"/);
  assert.match(workspaceShell, /testId: "workspace-founder-draft-receipt"/);
  assert.match(workspaceShell, /testId: "workspace-founder-seal-latest"/);
  assert.match(workspaceShell, /label: "Back to Operate"/);
  assert.match(workspaceShell, /label: "Open receipts"/);
});
