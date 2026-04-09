import test from "node:test";
import assert from "node:assert/strict";
import {
  WINDOW_STATES,
  appendEvent,
  appendReceipt,
  applyClosureState,
  createWindowState,
} from "../src/index.mjs";

test("createWindowState seeds runtime from compile artifact", () => {
  const compileResult = {
    compilationId: "abc123",
    diagnostics: [],
    summary: { ok: true, hardErrorCount: 0, warningCount: 0 },
    metadata: { activeClosureVerb: null },
    mergedWindowState: "open",
  };
  const windowState = createWindowState({
    windowId: "phase2-window",
    filePath: "phase2.loe",
    compileResult,
  });

  assert.equal(windowState.windowId, "phase2-window");
  assert.equal(windowState.filePath, "phase2.loe");
  assert.equal(windowState.state, WINDOW_STATES.open);
  assert.equal(windowState.compile.compilationId, "abc123");
  assert.deepEqual(windowState.events, []);
  assert.deepEqual(windowState.receipts, []);
});

test("appendEvent and appendReceipt keep append-only ordering", () => {
  const seed = createWindowState({
    windowId: "window",
    filePath: "window.loe",
    compileResult: null,
  });

  const withEvent = appendEvent(seed, {
    kind: "proposal_accepted",
    detail: "Seven proposal accepted",
  });
  const withReceipt = appendReceipt(withEvent, {
    kind: "attest",
    summary: "Human attested closure",
  });

  assert.equal(withReceipt.events.length, 1);
  assert.equal(withReceipt.events[0].id, "evt_1");
  assert.equal(withReceipt.events[0].kind, "proposal_accepted");
  assert.equal(withReceipt.receipts.length, 1);
  assert.equal(withReceipt.receipts[0].id, "rcpt_1");
  assert.equal(withReceipt.receipts[0].kind, "attest");
});

test("applyClosureState maps closure verb to runtime window state", () => {
  const seed = createWindowState({
    windowId: "window",
    filePath: "window.loe",
    compileResult: null,
  });

  const sealed = applyClosureState(seed, "seal");
  const attested = applyClosureState(seed, "attest");
  const flagged = applyClosureState(seed, "flag");

  assert.equal(sealed.state, WINDOW_STATES.sealed);
  assert.equal(attested.state, WINDOW_STATES.attested);
  assert.equal(flagged.state, WINDOW_STATES.flagged);
});
