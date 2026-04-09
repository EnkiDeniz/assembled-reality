import test from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { migrate } from "../shape-store/db.js";
import {
  insertReceipt,
  insertMintedPrimitive,
  listReceiptsForCandidate,
  listLibrary,
  recordPromotionDecision,
  suggestPrimitiveLink,
  updateCandidateLibraryFields,
} from "../shape-store/repository.js";
import { receiptsSatisfyAssemblyClass } from "../shape-core/assembly-path.js";

test("receipt records can be attached to candidate", () => {
  const db = new Database(":memory:");
  migrate(db);
  const candidateId = "candidate-test-1";
  db.prepare(
    "INSERT OR REPLACE INTO ShapeCandidate (candidateId, runId, resultType, granularity, invariant, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(
    candidateId,
    "run-x",
    "candidate_primitive",
    "primitive",
    "test invariant",
    "candidate",
    new Date().toISOString(),
  );
  insertReceipt(db, {
    candidateId,
    receiptType: "runtime_observation",
    payload: { observed: true },
    accepted: true,
  });
  const receipts = listReceiptsForCandidate(db, candidateId);
  assert.ok(receipts.length >= 1);

  const decisionId = recordPromotionDecision(db, {
    candidateId,
    targetType: "primitive",
    fromState: "candidate",
    toState: "provisional",
    approved: false,
    rationale: "threshold not met",
  });
  assert.equal(typeof decisionId, "string");
});

test("library closure: link fields and mint add primitive", () => {
  const db = new Database(":memory:");
  migrate(db);
  const candidateId = "candidate-lib-1";
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO ShapeCandidate (
      candidateId, runId, resultType, granularity, invariant, status, createdAt,
      linkedShapeId, libraryMergeStatus, kernelState, convergenceScore, domainMapJson, isMythDerived
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, 0)`,
  ).run(
    candidateId,
    "run-lib",
    "candidate_primitive",
    "primitive",
    "One constrained review step limits the full flow.",
    "candidate",
    now,
  );
  db.prepare(
    `INSERT INTO ShapePrimitive (shapeId, name, invariantText, status, metadataJson, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    "primitive_bottleneck",
    "Bottleneck",
    "One constrained step limits whole flow.",
    "promoted",
    "{}",
    now,
  );

  const suggested = suggestPrimitiveLink(db, "One constrained review step limits the full flow.");
  assert.equal(suggested, "primitive_bottleneck");
  updateCandidateLibraryFields(db, candidateId, {
    linkedShapeId: suggested,
    libraryMergeStatus: "linked",
  });

  insertMintedPrimitive(db, {
    shapeId: "mint_promo_test",
    name: "Minted",
    invariantText: "novel invariant text for test",
    metadata: { from: "promotion.test" },
  });
  const lib = listLibrary(db, { type: "all" });
  assert.ok(lib.primitives.some((p) => p.shapeId === "mint_promo_test"));
});

test("assembly class receipt requirements are enforced", () => {
  const pathFail = receiptsSatisfyAssemblyClass(
    [{ receiptType: "runtime_observation", payload: {} }],
    "path_dependent",
  );
  assert.equal(pathFail.passed, false);
  assert.ok(pathFail.missing.includes("stage_transition_proof"));

  const embodiedPass = receiptsSatisfyAssemblyClass(
    [
      { receiptType: "runtime_observation", payload: {} },
      { receiptType: "embodied_feedback", payload: {} },
      { receiptType: "falsifier_outcome", payload: {} },
      { receiptType: "settlement_receipt", payload: {} },
    ],
    "developmental_embodied",
  );
  assert.equal(embodiedPass.passed, true);
});
