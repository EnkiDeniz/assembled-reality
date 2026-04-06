import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

async function main() {
  const [
    schema,
    operateRoute,
    operateOverridesRoute,
    receiptRoute,
    workspaceAiRoute,
    workspaceShell,
  ] = await Promise.all([
    read("prisma/schema.prisma"),
    read("src/app/api/workspace/operate/route.js"),
    read("src/app/api/workspace/operate/overrides/route.js"),
    read("src/app/api/workspace/receipt/route.js"),
    read("src/app/api/workspace/ai/route.js"),
    read("src/components/WorkspaceShell.jsx"),
  ]);

  assert.match(schema, /model\s+ReaderOperateRun\s+\{/);
  assert.match(schema, /model\s+ReaderAttestedOverride\s+\{/);
  assert.match(schema, /sourceFingerprint\s+String/);
  assert.match(schema, /excerptSnapshot\s+String/);

  assert.match(operateRoute, /mode:\s*"overlay"/);
  assert.match(operateRoute, /createReaderOperateRunForUser/);
  assert.match(operateRoute, /buildOperateSourceFingerprint/);
  assert.match(operateRoute, /findings:/);

  assert.match(operateOverridesRoute, /upsertReaderAttestedOverrideForUser/);
  assert.match(operateOverridesRoute, /deleteReaderAttestedOverrideForUser/);

  assert.match(receiptRoute, /overrideAcknowledged/);
  assert.match(receiptRoute, /requiresOverrideAcknowledgement/);
  assert.match(receiptRoute, /operateRunId/);

  assert.match(workspaceAiRoute, /unavailable:\s*true/);
  assert.doesNotMatch(workspaceAiRoute, /fallbackBlocks/);

  assert.match(workspaceShell, /mode:\s*"overlay"/);
  assert.match(workspaceShell, /receiptSealOverrideAcknowledged/);
  assert.match(workspaceShell, /createAttestedOverride/);

  console.log("phase1-smoke-check: ok");
}

main().catch((error) => {
  console.error("phase1-smoke-check: failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
