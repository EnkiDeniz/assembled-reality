import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("phase2 shell uses design-system tokens instead of hardcoded palette", async () => {
  const shell = await read("LoegosCLI/UX/loegos-phase1-shell.jsx");

  assert.match(shell, /bg:\s*"var\(--loegos-ground\)"/);
  assert.match(shell, /card:\s*"var\(--loegos-surface-1\)"/);
  assert.match(shell, /accent:\s*"var\(--loegos-brand\)"/);
  assert.match(shell, /mono:\s*"var\(--font-code\)"/);
  assert.match(shell, /sans:\s*"var\(--font-ui\)"/);

  assert.doesNotMatch(shell, /#[0-9a-fA-F]{3,8}/);
  assert.doesNotMatch(shell, /SF Mono|Segoe UI|BlinkMacSystemFont/);
});
