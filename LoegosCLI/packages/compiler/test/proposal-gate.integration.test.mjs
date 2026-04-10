import test from "node:test";
import assert from "node:assert/strict";
import { applySevenProposalGate } from "../../../UX/lib/proposal-gate.mjs";
import { mapSevenProposalResponse } from "../../../UX/lib/seven-proposal-client.mjs";

test("maps Seven root-suggest response into compiler-gated proposal clauses", () => {
  const payload = {
    ok: true,
    answer: "Try a tighter root line.",
    instrumentResult: {
      summary: "Top candidate",
      candidates: [
        {
          rootText: "stabilize source truth",
          gloss: "focus on verifiable inputs",
          rationale: "portable and concrete",
        },
      ],
    },
  };

  const proposal = mapSevenProposalResponse(payload);
  const gate = applySevenProposalGate({
    currentSource: "GND box @phase2\nDIR aim test_window\n",
    proposal,
    filename: "phase2.loe",
  });

  assert.equal(proposal.source, "instrument_candidates");
  assert.equal(proposal.segments.length, 1);
  assert.match(proposal.segments[0].suggestedClause, /^DIR aim /);
  assert.ok(proposal.receiptKit);
  assert.match(proposal.receiptKit.need, /stabilize source truth|Try a tighter root/i);
  assert.equal(typeof proposal.receiptKit.prediction.expected, "string");
  assert.equal(gate.accepted, true);
  assert.match(gate.nextSource, /DIR aim stabilize_source_truth/);
});

test("rejects empty mapped proposal at gate boundary", () => {
  const proposal = mapSevenProposalResponse({
    ok: true,
    answer: "",
    instrumentResult: { candidates: [] },
  });

  const gate = applySevenProposalGate({
    currentSource: "DIR aim baseline\n",
    proposal: { ...proposal, segments: [] },
    filename: "phase2.loe",
  });

  assert.equal(gate.accepted, false);
  assert.equal(gate.reason, "empty_proposal");
});
