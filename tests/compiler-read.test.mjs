import test from "node:test";
import assert from "node:assert/strict";
import { evaluateCompilerRead, runCompilerRead } from "../src/lib/compiler-read.js";

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

test("compiler read treats raw blocked prose as admission control and keeps interpretation open", () => {
  const compilerRead = evaluateCompilerRead({
    documentId: "protocol-weak-witness",
    title: "Protocol note",
    text: "Run the contract check before rollout.",
    extracted: buildExtraction(
      [
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
      ],
      {
        documentType: "protocol",
        dominantMode: "proposal",
      },
    ),
  });

  assert.equal(compilerRead.rawDocumentResult.compileState, "blocked");
  assert.equal(compilerRead.rawDocumentResult.secondaryRuntimeTrusted, false);
  assert.equal(compilerRead.translatedSubsetResult.present, true);
  assert.equal(compilerRead.translatedSubsetResult.compileState, "clean");
  assert.equal(compilerRead.translatedSubsetResult.mergedWindowState, "awaiting");
  assert.equal(compilerRead.limitationClass, null);
  assert.equal(compilerRead.outcomeClass, "mixed");
  assert.equal(compilerRead.verdict.readDisposition, "needs_more_witness");
  assert.match(compilerRead.translatedSubsetResult.source, /MOV move/);
});

test("compiler read keeps protocol and philosophy separate in the translated subset", () => {
  const compilerRead = evaluateCompilerRead({
    documentId: "architecture-mixed",
    title: "Architecture memo",
    text: [
      "Pull one trace before touching the flow.",
      "The interface is the shadow of the ontology.",
    ].join("\n\n"),
    extracted: buildExtraction(
      [
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
      ],
      {
        documentType: "architecture",
        dominantMode: "mixed",
      },
    ),
  });

  assert.equal(compilerRead.translatedSubsetResult.present, true);
  assert.deepEqual(compilerRead.translatedSubsetResult.omittedClaims, ["claim_theory"]);
  assert.equal(compilerRead.limitationClass, null);
  assert.equal(compilerRead.outcomeClass, "mixed");
  assert.equal(compilerRead.verdict.readDisposition, "needs_clearer_split");
});

test("compiler read exposes compiler gaps when meaning exists but the language cannot hold it yet", () => {
  const compilerRead = evaluateCompilerRead({
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

  assert.equal(compilerRead.limitationClass, "compiler_gap");
  assert.equal(compilerRead.outcomeClass, "raw_not_direct_source");
  assert.equal(compilerRead.translatedSubsetResult.present, false);
  assert.equal(compilerRead.translatedSubsetResult.compileState, "not_run");
  assert.equal(compilerRead.verdict.readDisposition, "needs_language_extension");
});

test("compiler read reports translation loss when prose meaning cannot survive current translation", () => {
  const compilerRead = evaluateCompilerRead({
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

  assert.equal(compilerRead.limitationClass, "translation_loss");
  assert.equal(compilerRead.outcomeClass, "raw_not_direct_source");
  assert.equal(compilerRead.translatedSubsetResult.present, false);
  assert.equal(compilerRead.translatedSubsetResult.compileState, "not_run");
  assert.equal(compilerRead.verdict.readDisposition, "needs_clearer_split");
});

test("compiler read stays informative for mostly philosophical documents", () => {
  const compilerRead = evaluateCompilerRead({
    documentId: "mostly-philosophy",
    title: "Mostly philosophy",
    text: "Reality is the echo of attention.",
    extracted: buildExtraction(
      [
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
      ],
      {
        documentType: "essay",
        dominantMode: "philosophy",
      },
    ),
  });

  assert.equal(compilerRead.limitationClass, "out_of_scope");
  assert.equal(compilerRead.outcomeClass, "raw_not_direct_source");
  assert.equal(compilerRead.translatedSubsetResult.executed, false);
  assert.equal(compilerRead.translatedSubsetResult.compileState, "not_run");
  assert.equal(compilerRead.verdict.overall, "document_mostly_philosophy");
  assert.equal(compilerRead.verdict.readDisposition, "informative_only");
});

test("compiler read preserves provenance fields and explicit omitted claims", () => {
  const compilerRead = evaluateCompilerRead({
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
  assert.deepEqual(compilerRead.translatedSubsetResult.omittedClaims, ["claim_interp"]);
  assert.ok(Array.isArray(compilerRead.translatedSubsetResult.diagnostics));
});

test("compiler read rejects claims whose source excerpt is not present in the document", () => {
  assert.throws(
    () =>
      evaluateCompilerRead({
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

test("compiler read recovers exact source excerpts across quote and whitespace normalization drift", () => {
  const sourceText = ['He said, “Pull one trace', 'before touching the flow.”'].join("\n");
  const compilerRead = evaluateCompilerRead({
    documentId: "grounding-recovery",
    title: "Grounding recovery",
    text: sourceText,
    extracted: buildExtraction([
      {
        id: "claim_grounded",
        text: 'He said, "Pull one trace before touching the flow."',
        claimKind: "protocol",
        translationReadiness: "candidate_for_translation",
        provenanceClass: "quoted_witness",
        supportStatus: "supported",
        evidenceRefs: ["trace-18"],
        reason: "This should recover the exact in-document quote rather than fail on punctuation drift.",
        sourceExcerpt: 'He said, "Pull one trace before touching the flow."',
      },
    ]),
  });

  assert.equal(compilerRead.claimSet[0].sourceExcerpt, sourceText);
  assert.equal(compilerRead.claimSet[0].provenanceClass, "quoted_witness");
});

test("compiler read does not mark the translated aim claim as omitted", () => {
  const compilerRead = evaluateCompilerRead({
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

  assert.match(
    compilerRead.translatedSubsetResult.source,
    /DIR aim "Preserve competing branches without sealing them\."/,
  );
  assert.deepEqual(compilerRead.translatedSubsetResult.omittedClaims, []);
});

test("compiler read detects embedded executable loe separately from translated prose", () => {
  const compilerRead = evaluateCompilerRead({
    documentId: "embedded-spec",
    title: "Embedded spec",
    text: [
      "# Farmhouse",
      "",
      "Pull one trace before calling the lender.",
      "",
      "```loe",
      "GND box @farmhouse_box",
      "DIR aim buy_farmhouse_upstate",
      "GND witness @saved_listings from \"saved_listings.md\" with v_apr9",
      "MOV move call_lender via manual",
      "TST test lender_replies",
      "RTN receipt @lender_reply via lender_portal as score",
      "CLS reroute search_region",
      "```",
    ].join("\n"),
    extracted: buildExtraction([
      {
        id: "claim_protocol",
        text: "Pull one trace before calling the lender.",
        claimKind: "protocol",
        translationReadiness: "candidate_for_translation",
        provenanceClass: "self_reported",
        supportStatus: "weakly_supported",
        evidenceRefs: [],
        reason: "This is a conservative protocol step worth translating.",
        sourceExcerpt: "Pull one trace before calling the lender.",
      },
    ]),
  });

  assert.equal(compilerRead.embeddedExecutableResult.present, true);
  assert.equal(compilerRead.embeddedExecutableResult.detectionMethod, "fenced_loe");
  assert.equal(compilerRead.embeddedExecutableResult.compileState, "clean");
  assert.equal(compilerRead.embeddedExecutableResult.mergedWindowState, "rerouted");
  assert.equal(compilerRead.outcomeClass, "mixed");
  assert.equal(compilerRead.verdict.readDisposition, "inspect_direct_program");
});

test("compiler read distinguishes direct source success from translated subset success", () => {
  const compilerRead = evaluateCompilerRead({
    documentId: "direct-source",
    title: "Direct source",
    text: [
      "GND box @direct_source",
      'DIR aim "Keep the loop honest."',
      'MOV move "Ask for one concrete receipt." via manual',
      'TST test "A concrete receipt arrives."',
    ].join("\n"),
    extracted: buildExtraction([], {
      documentType: "protocol",
      dominantMode: "proposal",
    }),
  });

  assert.equal(compilerRead.rawDocumentResult.compileState, "clean");
  assert.equal(compilerRead.translatedSubsetResult.present, false);
  assert.equal(compilerRead.embeddedExecutableResult.present, false);
  assert.equal(compilerRead.outcomeClass, "direct_source_compiled");
  assert.equal(compilerRead.verdict.overall, "direct_source_compiles");
  assert.equal(compilerRead.verdict.readDisposition, "inspect_direct_source");
  assert.deepEqual(compilerRead.nextMoves, [
    "Treat the direct source compile as the primary read for this document.",
    "Do not force a translated subset when the document already runs honestly as source.",
  ]);
});

test("compiler read does not overstate malformed embedded loe as a direct program found", () => {
  const compilerRead = evaluateCompilerRead({
    documentId: "bad-embedded",
    title: "Bad embedded",
    text: [
      "# Embedded candidate",
      "",
      "Pull one trace before changing the flow.",
      "",
      "```loe",
      "This is illustrative prose, not lawful source.",
      "```",
    ].join("\n"),
    extracted: buildExtraction([
      {
        id: "claim_protocol",
        text: "Pull one trace before changing the flow.",
        claimKind: "protocol",
        translationReadiness: "candidate_for_translation",
        provenanceClass: "self_reported",
        supportStatus: "weakly_supported",
        evidenceRefs: [],
        reason: "This is a conservative protocol step worth translating.",
        sourceExcerpt: "Pull one trace before changing the flow.",
      },
    ]),
  });

  assert.equal(compilerRead.embeddedExecutableResult.present, true);
  assert.equal(compilerRead.embeddedExecutableResult.compileState, "blocked");
  assert.equal(compilerRead.outcomeClass, "mixed");
  assert.equal(compilerRead.verdict.readDisposition, "needs_more_witness");
});

test("compiler read consumes structured schema output directly when present", async () => {
  const compilerRead = await runCompilerRead({
    documentId: "structured-payload",
    title: "Structured payload",
    text: "Run the contract check before rollout.",
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        output: [
          {
            content: [
              {
                type: "output_json",
                json: buildExtraction([
                  {
                    id: "claim_protocol",
                    text: "Run the contract check before rollout.",
                    claimKind: "protocol",
                    translationReadiness: "candidate_for_translation",
                    provenanceClass: "self_reported",
                    supportStatus: "unsupported",
                    evidenceRefs: [],
                    reason: "Structured output should parse without text scraping.",
                    sourceExcerpt: "Run the contract check before rollout.",
                  },
                ]),
              },
            ],
          },
        ],
      }),
    }),
  });

  assert.equal(compilerRead.claimSet.length, 1);
  assert.equal(compilerRead.claimSet[0].sourceExcerpt, "Run the contract check before rollout.");
  assert.equal(compilerRead.translatedSubsetResult.compileState, "clean");
});

test("live compiler read returns an honest non-anchorable limitation when every extracted quote fails grounding", async () => {
  const compilerRead = await runCompilerRead({
    documentId: "non-anchorable",
    title: "Non-anchorable",
    text: "Reality moves faster than our names for it.",
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        output: [
          {
            content: [
              {
                type: "output_json",
                json: buildExtraction([
                  {
                    id: "claim_bad",
                    text: "Reality moves faster than our names for it.",
                    claimKind: "interpretation",
                    translationReadiness: "candidate_for_translation",
                    provenanceClass: "self_reported",
                    supportStatus: "unsupported",
                    evidenceRefs: [],
                    reason: "This quote is wrong on purpose.",
                    sourceExcerpt: "This excerpt never appears in the document.",
                  },
                ]),
              },
            ],
          },
        ],
      }),
    }),
  });

  assert.equal(compilerRead.claimSet.length, 0);
  assert.equal(compilerRead.groundingRejectedClaimCount, 1);
  assert.deepEqual(compilerRead.groundingRejectedClaimIds, ["claim_bad"]);
  assert.equal(compilerRead.limitationClass, "excerpt_not_anchorable");
  assert.equal(compilerRead.outcomeClass, "raw_not_direct_source");
  assert.equal(compilerRead.verdict.overall, "excerpt_not_anchorable");
  assert.equal(compilerRead.translatedSubsetResult.compileState, "not_run");
});

test("live compiler read keeps grounded claims and records rejected ones separately", async () => {
  const compilerRead = await runCompilerRead({
    documentId: "mixed-grounding",
    title: "Mixed grounding",
    text: [
      "Pull one trace before rollout.",
      "Reality moves faster than our names for it.",
    ].join("\n\n"),
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        output: [
          {
            content: [
              {
                type: "output_json",
                json: buildExtraction([
                  {
                    id: "claim_good",
                    text: "Pull one trace before rollout.",
                    claimKind: "protocol",
                    translationReadiness: "candidate_for_translation",
                    provenanceClass: "self_reported",
                    supportStatus: "unsupported",
                    evidenceRefs: [],
                    reason: "This quote is exact.",
                    sourceExcerpt: "Pull one trace before rollout.",
                  },
                  {
                    id: "claim_bad",
                    text: "Reality moves faster than our names for it.",
                    claimKind: "interpretation",
                    translationReadiness: "candidate_for_translation",
                    provenanceClass: "self_reported",
                    supportStatus: "unsupported",
                    evidenceRefs: [],
                    reason: "This quote is wrong on purpose.",
                    sourceExcerpt: "This excerpt never appears in the document.",
                  },
                ]),
              },
            ],
          },
        ],
      }),
    }),
  });

  assert.equal(compilerRead.claimSet.length, 1);
  assert.equal(compilerRead.claimSet[0].id, "claim_good");
  assert.equal(compilerRead.groundingRejectedClaimCount, 1);
  assert.deepEqual(compilerRead.groundingRejectedClaimIds, ["claim_bad"]);
  assert.equal(compilerRead.limitationClass, null);
  assert.equal(compilerRead.translatedSubsetResult.compileState, "clean");
});
