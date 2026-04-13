import test from "node:test";
import assert from "node:assert/strict";
import { buildCompilerReadFromExtraction } from "../src/lib/compiler-read.js";

function buildExtraction(claimSet = [], summary = {}) {
  return {
    documentSummary: {
      title: "Compiler Read fixture",
      documentType: "mixed",
      dominantMode: "mixed",
      summary: "Fixture summary.",
      ...summary,
    },
    claimSet,
  };
}

test("compiler read returns needs_more_witness for a lawful protocol note with weak witness", () => {
  const compilerRead = buildCompilerReadFromExtraction({
    documentId: "protocol-weak-witness",
    title: "Protocol note",
    text: "Run the contract check before rollout.",
    extracted: buildExtraction([
      {
        id: "claim_protocol",
        text: "Run the contract check before rollout.",
        claimKind: "protocol",
        translationReadiness: "candidate_for_translation",
        provenanceClass: "self_reported",
        supportStatus: "unsupported",
        evidenceRefs: [],
        reason: "The document names a concrete protocol step but does not ground it yet.",
        sourceExcerpt: "Run the contract check before rollout.",
      },
    ], {
      documentType: "protocol",
      dominantMode: "proposal",
    }),
  });

  assert.equal(compilerRead.verdict.readDisposition, "needs_more_witness");
  assert.equal(compilerRead.verdict.overall, "lawful_subset_compiles");
  assert.equal(typeof compilerRead.loeCandidate.source, "string");
  assert.match(compilerRead.loeCandidate.source, /MOV move/);
});

test("compiler read returns needs_clearer_split for mixed architecture content", () => {
  const compilerRead = buildCompilerReadFromExtraction({
    documentId: "architecture-mixed",
    title: "Architecture memo",
    text: [
      "Pull one trace before touching the flow.",
      "The interface is the shadow of the ontology.",
    ].join("\n\n"),
    extracted: buildExtraction([
      {
        id: "claim_protocol",
        text: "Pull one trace before touching the flow.",
        claimKind: "protocol",
        translationReadiness: "candidate_for_translation",
        provenanceClass: "self_reported",
        supportStatus: "weakly_supported",
        evidenceRefs: ["memo-section-2"],
        reason: "This is operational enough to carry into a minimal translation.",
        sourceExcerpt: "Pull one trace before touching the flow.",
      },
      {
        id: "claim_theory",
        text: "The interface is the shadow of the ontology.",
        claimKind: "philosophy",
        translationReadiness: "non_compilable_philosophy",
        provenanceClass: "unknown",
        supportStatus: "unsupported",
        evidenceRefs: [],
        reason: "This belongs to the philosophical layer, not the v0 translated subset.",
        sourceExcerpt: "The interface is the shadow of the ontology.",
      },
    ], {
      documentType: "architecture",
      dominantMode: "mixed",
    }),
  });

  assert.equal(compilerRead.verdict.readDisposition, "needs_clearer_split");
  assert.equal(compilerRead.verdict.failureClass, "mixed");
  assert.deepEqual(compilerRead.loeCandidate.omittedClaims, ["claim_theory"]);
});

test("compiler read exposes compiler gaps when meaning exists but the language cannot hold it yet", () => {
  const compilerRead = buildCompilerReadFromExtraction({
    documentId: "compiler-gap",
    title: "Compiler gap",
    text: "The runtime should preserve competing branches without sealing them.",
    extracted: buildExtraction([
      {
        id: "claim_gap",
        text: "The runtime should preserve competing branches without sealing them.",
        claimKind: "interpretation",
        translationReadiness: "meaningful_but_not_representable",
        provenanceClass: "self_reported",
        supportStatus: "weakly_supported",
        evidenceRefs: ["branching-note"],
        reason: "The current language does not own this construct honestly yet.",
        sourceExcerpt: "The runtime should preserve competing branches without sealing them.",
      },
    ]),
  });

  assert.equal(compilerRead.verdict.failureClass, "compiler_gap");
  assert.equal(compilerRead.verdict.readDisposition, "needs_language_extension");
});

test("compiler read reports translation loss when prose meaning cannot survive current translation", () => {
  const compilerRead = buildCompilerReadFromExtraction({
    documentId: "translation-loss",
    title: "Translation loss",
    text: "The whole system should feel like an ethical membrane around choice.",
    extracted: buildExtraction([
      {
        id: "claim_loss",
        text: "The whole system should feel like an ethical membrane around choice.",
        claimKind: "interpretation",
        translationReadiness: "blocked_by_structure",
        provenanceClass: "self_reported",
        supportStatus: "unsupported",
        evidenceRefs: [],
        reason: "The statement carries intent, but v0 translation would flatten it badly.",
        sourceExcerpt: "The whole system should feel like an ethical membrane around choice.",
      },
    ]),
  });

  assert.equal(compilerRead.verdict.failureClass, "translation_loss");
  assert.equal(compilerRead.verdict.readDisposition, "needs_clearer_split");
});

test("compiler read stays informative for mostly philosophical documents", () => {
  const compilerRead = buildCompilerReadFromExtraction({
    documentId: "mostly-philosophy",
    title: "Mostly philosophy",
    text: "Reality is the echo of attention.",
    extracted: buildExtraction([
      {
        id: "claim_phi",
        text: "Reality is the echo of attention.",
        claimKind: "philosophy",
        translationReadiness: "non_compilable_philosophy",
        provenanceClass: "unknown",
        supportStatus: "unsupported",
        evidenceRefs: [],
        reason: "This is insight, not an operational claim for v0.",
        sourceExcerpt: "Reality is the echo of attention.",
      },
    ], {
      documentType: "essay",
      dominantMode: "philosophy",
    }),
  });

  assert.equal(compilerRead.verdict.overall, "document_mostly_philosophy");
  assert.equal(compilerRead.verdict.readDisposition, "informative_only");
  assert.equal(compilerRead.compileResult.compileState, "not_run");
  assert.equal(compilerRead.compileResult.runtimeState, "not_run");
});

test("compiler read preserves provenance fields and explicit omitted claims", () => {
  const compilerRead = buildCompilerReadFromExtraction({
    documentId: "explicit-fields",
    title: "Explicit fields",
    text: [
      "The cited trace shows the blocker at permissions.",
      "This probably means the policy is spiritually wrong.",
    ].join("\n\n"),
    extracted: buildExtraction([
      {
        id: "claim_ground",
        text: "The cited trace shows the blocker at permissions.",
        claimKind: "ground",
        translationReadiness: "candidate_for_translation",
        provenanceClass: "external_citation",
        supportStatus: "supported",
        evidenceRefs: ["trace-17"],
        reason: "A cited witness is present in the document.",
        sourceExcerpt: "The cited trace shows the blocker at permissions.",
      },
      {
        id: "claim_interp",
        text: "This probably means the policy is spiritually wrong.",
        claimKind: "interpretation",
        translationReadiness: "blocked_by_structure",
        provenanceClass: "self_reported",
        supportStatus: "unsupported",
        evidenceRefs: [],
        reason: "This interpretation is not part of the v0 translated subset.",
        sourceExcerpt: "This probably means the policy is spiritually wrong.",
      },
    ]),
  });

  const claim = compilerRead.claimSet[0];
  assert.equal(claim.provenanceClass, "external_citation");
  assert.equal(claim.supportStatus, "supported");
  assert.deepEqual(claim.evidenceRefs, ["trace-17"]);
  assert.deepEqual(compilerRead.loeCandidate.omittedClaims, ["claim_interp"]);
  assert.ok(Array.isArray(compilerRead.compileResult.diagnostics));
});

test("compiler read rejects claims whose source excerpt is not present in the document", () => {
  assert.throws(
    () =>
      buildCompilerReadFromExtraction({
        documentId: "bad-excerpt",
        title: "Bad excerpt",
        text: "The document says something else entirely.",
        extracted: buildExtraction([
          {
            id: "claim_bad",
            text: "Invented structure.",
            claimKind: "protocol",
            translationReadiness: "candidate_for_translation",
            provenanceClass: "self_reported",
            supportStatus: "unsupported",
            evidenceRefs: [],
            reason: "This should fail grounding.",
            sourceExcerpt: "This excerpt never appears in the document.",
          },
        ]),
      }),
    /source excerpt is not present in the document/i,
  );
});

test("compiler read does not mark the translated aim claim as omitted", () => {
  const compilerRead = buildCompilerReadFromExtraction({
    documentId: "aim-only",
    title: "Aim only",
    text: "Preserve competing branches without sealing them.",
    extracted: buildExtraction([
      {
        id: "claim_aim",
        text: "Preserve competing branches without sealing them.",
        claimKind: "interpretation",
        translationReadiness: "candidate_for_translation",
        provenanceClass: "self_reported",
        supportStatus: "weakly_supported",
        evidenceRefs: [],
        reason: "This is the smallest translatable vector in the document.",
        sourceExcerpt: "Preserve competing branches without sealing them.",
      },
    ]),
  });

  assert.match(compilerRead.loeCandidate.source, /DIR aim "Preserve competing branches without sealing them\."/);
  assert.deepEqual(compilerRead.loeCandidate.omittedClaims, []);
});
