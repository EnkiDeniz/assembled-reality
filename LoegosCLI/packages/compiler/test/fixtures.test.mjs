import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compileSource } from "../src/index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_DIR = join(__dirname, "../../fixtures");

async function compileFixture(name) {
  const filePath = join(FIXTURES_DIR, name);
  const source = await readFile(filePath, "utf8");
  return compileSource({ source, filename: filePath });
}

test("lawful fixture passes hard checks", async () => {
  const result = await compileFixture("lawful-minimal.loe");
  assert.equal(result.summary.hardErrorCount, 0);
});

test("self sealing story triggers SH002 and SH004", async () => {
  const result = await compileFixture("self-sealing-story.loe");
  const codes = new Set(result.diagnostics.map((d) => d.code));
  assert.equal(codes.has("SH002"), true);
  assert.equal(codes.has("SH004"), true);
});

test("move without test emits SW001 warning", async () => {
  const result = await compileFixture("move-without-test.loe");
  const codes = new Set(result.diagnostics.map((d) => d.code));
  assert.equal(codes.has("SW001"), true);
});

test("provenance-less closure emits SH007 and SH008", async () => {
  const result = await compileFixture("provenance-less-closure.loe");
  const codes = new Set(result.diagnostics.map((d) => d.code));
  assert.equal(codes.has("SH007"), true);
  assert.equal(codes.has("SH008"), true);
});

test("imported receipt origin can pass SH003", async () => {
  const result = await compileFixture("imported-receipt-origin.loe");
  const codes = new Set(result.diagnostics.map((d) => d.code));
  assert.equal(codes.has("SH003"), false);
});

test("attest with rationale compiles and yields attested merged state", async () => {
  const result = await compileFixture("attest-with-rationale.loe");
  const codes = new Set(result.diagnostics.map((d) => d.code));
  assert.equal(codes.has("PH006"), false);
  assert.equal(result.closureType, "attest");
  assert.equal(result.runtimeState, "closed");
  assert.equal(result.mergedWindowState, "attested");
});

test("attest without rationale fails parse with PH006", async () => {
  const result = await compileFixture("attest-missing-rationale.loe");
  const codes = new Set(result.diagnostics.map((d) => d.code));
  assert.equal(codes.has("PH006"), true);
  assert.equal(result.compileState, "blocked");
  assert.equal(result.mergedWindowState, "shape_error");
});

test("artifact contract fields are present and version locked", async () => {
  const result = await compileFixture("lawful-minimal.loe");
  assert.equal(result.artifactVersion, "0.5.0");
  assert.ok(Array.isArray(result.tokenizedLines));
  assert.equal(typeof result.compileState, "string");
  assert.equal(typeof result.runtimeState, "string");
  assert.equal(typeof result.mergedWindowState, "string");
  assert.equal(typeof result.stats.lineCount, "number");
});
