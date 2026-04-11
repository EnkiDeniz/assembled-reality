import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("landing/auth shell styling ownership is in loegos-system.css", async () => {
  const globals = await read("src/app/globals.css");
  const loegosSystem = await read("src/app/styles/loegos-system.css");

  assert.doesNotMatch(globals, /\.auth-shell__panel\b/);
  assert.doesNotMatch(globals, /\.intro-auth__note\b/);
  assert.doesNotMatch(globals, /\.intro-proposal-link\b/);

  assert.match(loegosSystem, /\.auth-shell__panel\b/);
  assert.match(loegosSystem, /\.intro-auth__note\b/);
  assert.match(loegosSystem, /\.intro-proposal-link\b/);
  assert.match(loegosSystem, /\.auth-shell \.terminal-actions\b/);
  assert.match(loegosSystem, /\.intro-auth \.terminal-actions\b/);
});
