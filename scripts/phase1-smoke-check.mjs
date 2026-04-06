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
    operateOverlay,
    overlayRail,
    receiptSealController,
    operateOverlayController,
    workbench,
    packageJson,
    localE2eRunner,
    playwrightConfig,
    playwrightCiConfig,
    e2eSmoke,
    receiptSealDialog,
    diagnosticsRail,
  ] = await Promise.all([
    read("prisma/schema.prisma"),
    read("src/app/api/workspace/operate/route.js"),
    read("src/app/api/workspace/operate/overrides/route.js"),
    read("src/app/api/workspace/receipt/route.js"),
    read("src/app/api/workspace/ai/route.js"),
    read("src/components/WorkspaceShell.jsx"),
    read("src/lib/operate-overlay.js"),
    read("src/components/WorkspaceOperateOverlayRail.jsx"),
    read("src/components/workspace/useReceiptSealController.js"),
    read("src/components/workspace/useOperateOverlayController.js"),
    read("src/components/workspace/WorkspaceDocumentWorkbench.jsx"),
    read("package.json"),
    read("scripts/run-phase1-e2e-local.mjs"),
    read("playwright.config.mjs"),
    read("playwright.ci.config.mjs"),
    read("tests/e2e/phase1-inline-operate.spec.mjs"),
    read("src/components/ReceiptSealDialog.jsx"),
    read("src/components/WorkspaceDiagnosticsRail.jsx"),
  ]);

  assert.match(schema, /model\s+ReaderOperateRun\s+\{/);
  assert.match(schema, /model\s+ReaderAttestedOverride\s+\{/);
  assert.match(schema, /sourceFingerprint\s+String/);
  assert.match(schema, /excerptSnapshot\s+String/);

  assert.match(operateRoute, /mode:\s*"overlay"/);
  assert.match(operateRoute, /createReaderOperateRunForUser/);
  assert.match(operateRoute, /buildOperateSourceFingerprint/);
  assert.match(operateRoute, /findings:/);
  assert.match(operateRoute, /coverage:/);

  assert.match(operateOverridesRoute, /upsertReaderAttestedOverrideForUser/);
  assert.match(operateOverridesRoute, /deleteReaderAttestedOverrideForUser/);

  assert.match(receiptRoute, /overrideAcknowledged/);
  assert.match(receiptRoute, /requiresOverrideAcknowledgement/);
  assert.match(receiptRoute, /operateRunId/);

  assert.match(workspaceAiRoute, /unavailable:\s*true/);
  assert.doesNotMatch(workspaceAiRoute, /fallbackBlocks/);

  assert.match(operateOverlay, /Local evidence did not survive validation/);
  assert.match(operateOverlay, /displaySignal/);
  assert.match(operateOverlay, /attestedCount/);
  assert.match(operateOverlay, /buildOperateOverlayCoverage/);

  assert.match(workspaceShell, /useOperateOverlayController/);
  assert.match(workspaceShell, /useReceiptSealController/);
  assert.match(workspaceShell, /WorkspaceDocumentWorkbench/);

  assert.match(overlayRail, /Operate is partial/);
  assert.match(overlayRail, /attested/);
  assert.match(overlayRail, /coverage/);
  assert.match(overlayRail, /workspace-attest-block-submit/);

  assert.match(receiptSealController, /runReceiptSealAudit/);
  assert.match(receiptSealController, /performSealReceiptDraft/);
  assert.match(operateOverlayController, /runInlineOperate/);
  assert.match(operateOverlayController, /createAttestedOverride/);
  assert.match(workbench, /workspace-document-workbench/);
  assert.match(workbench, /workspace-finding-inspect/);
  assert.match(receiptSealDialog, /receipt-seal-blocked-reason/);
  assert.match(receiptSealDialog, /data-draft-id/);
  assert.match(diagnosticsRail, /workspace-latest-receipt-status/);

  assert.match(packageJson, /"test:e2e": "npm run test:e2e:local"/);
  assert.match(packageJson, /"test:e2e:local": "node scripts\/run-phase1-e2e-local\.mjs"/);
  assert.match(packageJson, /"test:e2e:ci": "playwright test --config=playwright.ci.config.mjs"/);
  assert.match(localE2eRunner, /OPENAI_API_KEY is required for the proof loop/);
  assert.match(localE2eRunner, /playwright\.config\.mjs/);
  assert.match(playwrightConfig, /tests\/e2e/);
  assert.doesNotMatch(playwrightConfig, /webServer:/);
  assert.match(playwrightCiConfig, /npm run dev -- --port/);
  assert.match(e2eSmoke, /dev-guardian/);
  assert.doesNotMatch(e2eSmoke, /test\.skip/);
  assert.match(e2eSmoke, /test\.beforeAll/);
  assert.match(e2eSmoke, /receipt-override-acknowledgement/);
  assert.match(e2eSmoke, /workspace-proof-metadata/);
  assert.match(e2eSmoke, /workspace-latest-receipt-status/);
  assert.match(e2eSmoke, /Acknowledge the attested overrides/);

  console.log("phase1-smoke-check: ok");
}

main().catch((error) => {
  console.error("phase1-smoke-check: failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
