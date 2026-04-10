import test from "node:test";
import assert from "node:assert/strict";
import { compileSource } from "../LoegosCLI/packages/compiler/src/index.mjs";
import { deriveDistantEchoSignal } from "../LoegosCLI/UX/lib/artifact-view-model.mjs";

test("deriveDistantEchoSignal emits ripple when return maps field without new ping", () => {
  const previousArtifact = compileSource({
    filename: "ripple.loe",
    source: `GND box @farmhouse
DIR aim validate_real_feasibility
MOV move call_lender via manual
TST test real_borrowing_range
`,
  });

  const nextArtifact = compileSource({
    filename: "ripple.loe",
    source: `GND box @farmhouse
DIR aim validate_real_feasibility
MOV move call_lender via manual
TST test real_borrowing_range
RTN receipt @preapproval_780k via lender_portal as score
`,
  });

  const ripple = deriveDistantEchoSignal(previousArtifact, nextArtifact);
  assert.ok(ripple);
  assert.equal(ripple.previousFieldState, "awaiting");
  assert.equal(ripple.nextFieldState, "mapped");
  assert.equal(ripple.returnProvenance, "lender_portal");
  assert.equal(ripple.returnDelta, 1);
  assert.equal(typeof ripple.chainSummary, "string");
});

test("deriveDistantEchoSignal returns null without a field-clearing return", () => {
  const previousArtifact = compileSource({
    filename: "ripple-none.loe",
    source: `GND box @farmhouse
DIR aim validate_real_feasibility
`,
  });

  const nextArtifact = compileSource({
    filename: "ripple-none.loe",
    source: `GND box @farmhouse
DIR aim validate_real_feasibility
MOV move call_lender via manual
TST test real_borrowing_range
`,
  });

  const ripple = deriveDistantEchoSignal(previousArtifact, nextArtifact);
  assert.equal(ripple, null);
});
