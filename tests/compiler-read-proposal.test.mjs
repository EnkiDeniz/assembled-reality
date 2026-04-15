import test from "node:test";
import assert from "node:assert/strict";

import { evaluateCompilerRead } from "../src/lib/compiler-read.js";

function buildExtraction(claimSet = [], summary = {}) {
  return {
    documentSummary: {
      title: "Proposal fixture",
      documentType: "mixed",
      dominantMode: "proposal",
      summary: "Fixture summary.",
      ...summary,
    },
    claimSet,
  };
}

test("compiler read infers proposal documents from commercial structure and separates review groups", () => {
  const text = [
    "Pricing Plan",
    "First 3 months: $6,000 per month.",
    "Week 1: Kick-off call and access review.",
    "Both parties agree to bi-weekly meetings.",
    "Purplefire will enhance ROAS through better targeting and CRO work.",
    "Purplefire provides a full-stack team including developers and analysts.",
  ].join("\n");

  const compilerRead = evaluateCompilerRead({
    documentId: "proposal-fixture",
    title: "Growth Partnership",
    text,
    extracted: buildExtraction([
      {
        id: "claim_pricing",
        text: "The proposal is priced at $6,000 per month for the first 3 months.",
        claimKind: "ground",
        translationReadiness: "blocked_by_structure",
        provenanceClass: "self_reported",
        supportStatus: "supported",
        evidenceRefs: [],
        reason: "Explicit price term in the source.",
        sourceExcerpt: "First 3 months: $6,000 per month.",
      },
      {
        id: "claim_timeline",
        text: "The proposal starts with a Week 1 kick-off call and access review.",
        claimKind: "ground",
        translationReadiness: "blocked_by_structure",
        provenanceClass: "self_reported",
        supportStatus: "supported",
        evidenceRefs: [],
        reason: "Explicit timeline term in the source.",
        sourceExcerpt: "Week 1: Kick-off call and access review.",
      },
      {
        id: "claim_terms",
        text: "Both parties agree to bi-weekly meetings.",
        claimKind: "ground",
        translationReadiness: "blocked_by_structure",
        provenanceClass: "self_reported",
        supportStatus: "supported",
        evidenceRefs: [],
        reason: "Explicit engagement cadence in the source.",
        sourceExcerpt: "Both parties agree to bi-weekly meetings.",
      },
      {
        id: "claim_team",
        text: "Purplefire provides a full-stack team including developers and analysts.",
        claimKind: "ground",
        translationReadiness: "blocked_by_structure",
        provenanceClass: "self_reported",
        supportStatus: "supported",
        evidenceRefs: [],
        reason: "Explicit service-team term in the source.",
        sourceExcerpt: "Purplefire provides a full-stack team including developers and analysts.",
      },
      {
        id: "claim_efficacy",
        text: "Purplefire will enhance ROAS through better targeting and CRO work.",
        claimKind: "protocol",
        translationReadiness: "candidate_for_translation",
        provenanceClass: "self_reported",
        supportStatus: "unsupported",
        evidenceRefs: [],
        reason: "Promised outcome without witness in the proposal.",
        sourceExcerpt: "Purplefire will enhance ROAS through better targeting and CRO work.",
      },
    ]),
  });

  assert.equal(compilerRead.documentSummary.documentType, "proposal");
  assert.deepEqual(
    compilerRead.supportedOfferTerms.map((claim) => claim.id),
    ["claim_pricing", "claim_timeline", "claim_terms", "claim_team"],
  );
  assert.deepEqual(
    compilerRead.unsupportedEfficacyClaims.map((claim) => claim.id),
    ["claim_efficacy"],
  );
  assert.equal(compilerRead.verdict.readDisposition, "needs_more_witness");
  assert.match(
    compilerRead.verdict.primaryFinding,
    /commercial structure is explicit/i,
  );
  assert.equal(
    compilerRead.missingDecisionWitness.some((item) => /baseline metrics/i.test(item)),
    true,
  );
});
