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
    workspacePage,
    workspaceShell,
    workspaceStarter,
    founderShell,
    loegosRenderer,
    loegosExplainPanel,
    founderRendererUtils,
    operateOverlay,
    overlayRail,
    receiptSealController,
    operateOverlayController,
    workbench,
    seedSurface,
    packageJson,
    localE2eRunner,
    playwrightConfig,
    playwrightCiConfig,
    e2eSmoke,
    receiptSealDialog,
    diagnosticsRail,
    proofRunbook,
    founderWowRunbook,
  ] = await Promise.all([
    read("prisma/schema.prisma"),
    read("src/app/api/workspace/operate/route.js"),
    read("src/app/api/workspace/operate/overrides/route.js"),
    read("src/app/api/workspace/receipt/route.js"),
    read("src/app/api/workspace/ai/route.js"),
    read("src/app/workspace/page.jsx"),
    read("src/components/WorkspaceShell.jsx"),
    read("src/components/WorkspaceStarter.jsx"),
    read("src/components/founder/FounderShell.jsx"),
    read("src/components/founder/LoegosRenderer.jsx"),
    read("src/components/founder/LoegosExplainPanel.jsx"),
    read("src/lib/founder-renderer.js"),
    read("src/lib/operate-overlay.js"),
    read("src/components/WorkspaceOperateOverlayRail.jsx"),
    read("src/components/workspace/useReceiptSealController.js"),
    read("src/components/workspace/useOperateOverlayController.js"),
    read("src/components/workspace/WorkspaceDocumentWorkbench.jsx"),
    read("src/components/SeedSurface.jsx"),
    read("package.json"),
    read("scripts/run-phase1-e2e-local.mjs"),
    read("playwright.config.mjs"),
    read("playwright.ci.config.mjs"),
    read("tests/e2e/phase1-inline-operate.spec.mjs"),
    read("src/components/ReceiptSealDialog.jsx"),
    read("src/components/WorkspaceDiagnosticsRail.jsx"),
    read("docs/LoegosSeed/pivot-history/solution/Phase 1 Proof Runbook/Phase 1 Proof Runbook.md"),
    read("docs/LoegosSeed/pivot-history/solution/Founder Wow Proof Session/Founder Wow Proof Session.md"),
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
  assert.match(workspacePage, /defaultStarterEntry/);
  assert.match(workspacePage, /"start"/);

  assert.match(operateOverlay, /Local evidence did not survive validation/);
  assert.match(operateOverlay, /displaySignal/);
  assert.match(operateOverlay, /attestedCount/);
  assert.match(operateOverlay, /buildOperateOverlayCoverage/);
  assert.match(operateOverlay, /pickPreferredOperateFindingId/);
  assert.match(operateOverlay, /documentOrder/);

  assert.match(workspaceShell, /useOperateOverlayController/);
  assert.match(workspaceShell, /useReceiptSealController/);
  assert.match(workspaceShell, /WorkspaceDocumentWorkbench/);
  assert.match(workspaceShell, /WorkspaceStarter/);
  assert.match(workspaceShell, /starterScopedProjectKey/);
  assert.match(workspaceShell, /showStarterSourceSurface/);
  assert.match(workspaceShell, /starterSeedEntrySourceKey/);
  assert.match(workspaceShell, /openStarterSourceIntake/);
  assert.match(workspaceShell, /openStarterImportedSource/);
  assert.match(workspaceShell, /openStarterSeedFlow/);
  assert.match(workspaceShell, /returnToStarterSourceView/);
  assert.match(workspaceShell, /workspace-source-view/);
  assert.match(workspaceShell, /workspace-source-intake/);
  assert.match(workspaceShell, /workspace-source-next-shape-seed/);
  assert.match(workspaceShell, /workspace-source-open-box/);
  assert.match(workspaceShell, /FounderShell/);
  assert.match(workspaceShell, /pendingInlineOperateSeedOpen/);
  assert.match(workspaceShell, /Switching to the live seed so inline Operate can reveal findings/);
  assert.match(workspaceShell, /DesktopSessionActions/);
  assert.match(workspaceShell, /workspace-account-link/);
  assert.match(workspaceShell, /Current seed is empty\./);
  assert.match(workspaceStarter, /workspace-starter-add-source/);
  assert.match(workspaceStarter, /workspace-starter-open-box/);
  assert.match(workspaceStarter, /workspace-starter-start-fresh/);
  assert.match(workspaceStarter, /workspace-starter-account-link/);
  assert.match(founderShell, /founder-shell/);
  assert.match(founderShell, /LoegosRenderer/);
  assert.match(founderShell, /LoegosExplainPanel/);
  assert.match(founderShell, /Open full workspace/);
  assert.match(founderShell, /Ask Seven/);
  assert.match(founderShell, /founder-shell-open-full-workspace/);
  assert.match(founderShell, /founder-shell-assistant-toggle/);
  assert.match(loegosRenderer, /Lœgos Rendering/);
  assert.match(loegosRenderer, /loegos-learner-toggle/);
  assert.match(loegosRenderer, /founder-seed-state/);
  assert.match(loegosExplainPanel, /Lœgos read/);
  assert.match(loegosExplainPanel, /workspace-attest-block-input/);
  assert.match(loegosExplainPanel, /workspace-attest-block-submit/);
  assert.match(founderRendererUtils, /buildFounderSeedState/);
  assert.match(founderRendererUtils, /buildLoegosBlockView/);

  assert.match(overlayRail, /Operate is partial/);
  assert.match(overlayRail, /attested/);
  assert.match(overlayRail, /coverage/);
  assert.match(overlayRail, /workspace-attest-block-submit/);

  assert.match(receiptSealController, /runReceiptSealAudit/);
  assert.match(receiptSealController, /performSealReceiptDraft/);
  assert.match(operateOverlayController, /runInlineOperate/);
  assert.match(operateOverlayController, /createAttestedOverride/);
  assert.match(operateOverlayController, /latestAppliedRequestIdRef/);
  assert.match(operateOverlayController, /beginOperateOverlayRequest/);
  assert.match(workbench, /workspace-document-workbench/);
  assert.match(workbench, /workspace-finding-inspect/);
  assert.match(workbench, /workspace-selected-finding-evidence-preview/);
  assert.match(seedSurface, /workspace-shape-seed-guide/);
  assert.match(seedSurface, /workspace-shape-seed-back-to-source/);
  assert.match(receiptSealDialog, /receipt-seal-blocked-reason/);
  assert.match(receiptSealDialog, /data-draft-id/);
  assert.match(diagnosticsRail, /workspace-latest-receipt-status/);
  assert.match(diagnosticsRail, /workspace-shell-state-callout/);
  assert.match(diagnosticsRail, /Compiler state follows the live seed\./);

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
  assert.match(e2eSmoke, /await expect\(starter\)\.toBeVisible/);
  assert.match(e2eSmoke, /workspace-starter-open-box/);
  assert.match(e2eSmoke, /workspace-starter-account-link/);
  assert.match(e2eSmoke, /receipt-override-acknowledgement/);
  assert.match(e2eSmoke, /workspace-proof-metadata/);
  assert.match(e2eSmoke, /workspace-latest-receipt-status/);
  assert.match(e2eSmoke, /Acknowledge the attested overrides/);
  assert.match(proofRunbook, /Founder Wow Proof Session/);
  assert.match(proofRunbook, /source view/i);
  assert.match(founderWowRunbook, /Founder Wow Proof/);
  assert.match(founderWowRunbook, /problem-statement-editor-first\.md/);
  assert.match(founderWowRunbook, /AR Version 2 Build Plan\.md/);
  assert.match(founderWowRunbook, /Next: Shape seed/);

  console.log("phase1-smoke-check: ok");
}

main().catch((error) => {
  console.error("phase1-smoke-check: failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
