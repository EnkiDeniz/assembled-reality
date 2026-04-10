import test from "node:test";
import assert from "node:assert/strict";
import { compileSource } from "../LoegosCLI/packages/compiler/src/index.mjs";
import {
  buildEchoFieldModel,
  derivePaneInteractionContract,
} from "../LoegosCLI/UX/lib/artifact-view-model.mjs";

test("echo field state shifts from awaiting to mapped after return compile cycle", () => {
  const awaitingArtifact = compileSource({
    filename: "echo-field.loe",
    source: `GND box @home
DIR aim validate_range
MOV move call_lender via manual
TST test real_borrowing_range
`,
  });
  const awaitingModel = buildEchoFieldModel(awaitingArtifact, null);
  const awaitingContract = derivePaneInteractionContract(awaitingArtifact, {
    state: awaitingArtifact.mergedWindowState,
    events: [],
  });
  assert.equal(awaitingModel.fieldState, "awaiting");
  assert.equal(awaitingModel.waiting, true);
  assert.match(awaitingContract.nextBestAction, /Capture one return/);
  assert.match(awaitingContract.paneContract.echoes.proofCondition, /RTN/);

  const mappedArtifact = compileSource({
    filename: "echo-field.loe",
    source: `GND box @home
DIR aim validate_range
MOV move call_lender via manual
TST test real_borrowing_range
RTN receipt @preapproval_780k via lender_portal as score
`,
  });
  const mappedModel = buildEchoFieldModel(mappedArtifact, null);
  const mappedContract = derivePaneInteractionContract(mappedArtifact, {
    state: mappedArtifact.mergedWindowState,
    events: [{ kind: "return_received", createdAt: new Date().toISOString() }],
  });
  assert.equal(mappedModel.fieldState, "mapped");
  assert.equal(mappedModel.waiting, false);
  assert.equal(mappedModel.returnProvenance, "lender_portal");
  assert.match(mappedContract.nextBestAction, /closure deliberately/i);
});
