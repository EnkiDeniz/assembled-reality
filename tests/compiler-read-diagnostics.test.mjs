import test from "node:test";
import assert from "node:assert/strict";
import { buildCompilerReadDiagnosticsView } from "../src/lib/compiler-read-diagnostics.js";

function buildLayer(diagnostics = []) {
  return { diagnostics };
}

test("compiler read groups repeated raw-source PH002 unknown head diagnostics into one noise cluster", () => {
  const view = buildCompilerReadDiagnosticsView({
    rawDocumentResult: buildLayer([
      { code: "PH002", severity: "error", message: 'unknown head "**Status:**"', line: 2 },
      { code: "PH002", severity: "error", message: 'unknown head "December"', line: 5 },
      { code: "PH002", severity: "error", message: 'unknown head "-_"', line: 9 },
    ]),
  });

  const noiseBucket = view.buckets.find((bucket) => bucket.id === "noise");
  assert.ok(noiseBucket);
  assert.equal(noiseBucket.groups.length, 1);
  assert.equal(noiseBucket.groups[0].code, "PH002");
  assert.equal(noiseBucket.groups[0].family, "unknown head");
  assert.equal(noiseBucket.groups[0].count, 3);
  assert.deepEqual(noiseBucket.groups[0].sampleTokens, ["**Status:**", "December", "-_"]);
  assert.equal(view.hasAggregation, true);
  assert.equal(view.flatEntries.length, 3);
});

test("compiler read groups repeated raw-source PH001 clause errors as parser noise", () => {
  const view = buildCompilerReadDiagnosticsView({
    rawDocumentResult: buildLayer([
      {
        code: "PH001",
        severity: "error",
        message: "clause requires at least head and verb",
        line: 11,
      },
      {
        code: "PH001",
        severity: "error",
        message: "clause requires at least head and verb",
        line: 18,
      },
    ]),
  });

  const noiseBucket = view.buckets.find((bucket) => bucket.id === "noise");
  assert.ok(noiseBucket);
  const group = noiseBucket.groups.find((item) => item.code === "PH001");
  assert.ok(group);
  assert.equal(group.count, 2);
  assert.deepEqual(group.sampleMessages, ["clause requires at least head and verb"]);
});

test("compiler read keeps single raw structural blockers as individual groups", () => {
  const view = buildCompilerReadDiagnosticsView({
    rawDocumentResult: buildLayer([
      { code: "SH007", severity: "error", message: "seal requires grounded witness", line: 7 },
    ]),
  });

  const blockersBucket = view.buckets.find((bucket) => bucket.id === "blockers");
  assert.ok(blockersBucket);
  assert.equal(blockersBucket.groups.length, 1);
  assert.equal(blockersBucket.groups[0].count, 1);
  assert.equal(blockersBucket.groups[0].kind, "blocker");
  assert.equal(view.buckets.find((bucket) => bucket.id === "noise"), undefined);
  assert.equal(view.hasAggregation, false);
});

test("compiler read keeps translated subset diagnostics out of raw prose noise", () => {
  const view = buildCompilerReadDiagnosticsView({
    translatedSubsetResult: buildLayer([
      { code: "PH002", severity: "error", message: 'unknown head "MOV"', line: 3 },
      { code: "PH002", severity: "error", message: 'unknown head "MOV"', line: 9 },
    ]),
  });

  const translatedBucket = view.buckets.find((bucket) => bucket.id === "translated");
  assert.ok(translatedBucket);
  assert.equal(translatedBucket.groups.length, 1);
  assert.equal(translatedBucket.groups[0].count, 2);
  assert.equal(view.buckets.find((bucket) => bucket.id === "noise"), undefined);
});

