import test from "node:test";
import assert from "node:assert/strict";

import { buildWorkingEcho } from "../src/lib/room-working-echo.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("buildWorkingEcho returns null below the wake-up threshold", () => {
  const result = buildWorkingEcho({
    canonicalView: {
      fieldState: { key: "open", label: "Open" },
      activePreview: null,
      interaction: { nextBestAction: "" },
      pendingMove: null,
    },
    messages: [
      {
        id: "assistant_1",
        role: "assistant",
        content: "I need a little more signal before I say anything concrete.",
        roomPayload: { segments: [] },
      },
    ],
    recentSources: [],
    focusedWitness: null,
    activeSession: { id: "session_1" },
  });

  assert.equal(result, null);
});

test("buildWorkingEcho emits grounded surfaced claims with refs and a deciding split", () => {
  const result = buildWorkingEcho({
    canonicalView: {
      fieldState: { key: "open", label: "Open" },
      activePreview: {
        assistantMessageId: "assistant_2",
        status: "active",
      },
      interaction: {
        nextBestAction: "Compare verifier timestamps against client clock skew.",
      },
      pendingMove: {
        id: "move_1",
        text: "Compare verifier timestamps against client clock skew.",
      },
    },
    messages: [
      {
        id: "assistant_2",
        role: "assistant",
        content:
          "Clock skew looks more plausible than the popup story. Compare verifier timestamps against client clock skew before deciding.",
        roomPayload: {
          segments: [
            { id: "seg_aim", text: "Find the real blocker before shipping a fix.", mirrorRegion: "aim" },
            { id: "seg_evidence", text: "Replay A shows the device clock is 47 minutes ahead.", mirrorRegion: "evidence" },
            { id: "seg_story", text: "The popup explanation is still unsupported.", mirrorRegion: "story" },
            { id: "seg_move", text: "Compare verifier timestamps against client clock skew.", mirrorRegion: "moves" },
          ],
        },
      },
    ],
    recentSources: [
      {
        documentKey: "source_a",
        title: "Replay A",
        operateSummary: "Device clock is 47 minutes ahead of network time.",
      },
    ],
    focusedWitness: {
      documentKey: "doc_a",
      title: "Replay A",
      excerptBlocks: [{ id: "block_1", text: "Verification link expired after the user returned to the app." }],
    },
    activeSession: { id: "session_2" },
  });

  assert.ok(result);
  assert.equal(result.status, "move_ready");
  assert.equal(result.turnId, "assistant_2");
  assert.ok(result.whatWouldDecideIt);
  assert.match(result.whatWouldDecideIt.text, /Compare verifier timestamps/i);
  assert.ok(Array.isArray(result.whatWouldDecideIt.sourceRefs));
  assert.ok(result.whatWouldDecideIt.sourceRefs.length > 0);
  assert.ok(Array.isArray(result.evidenceCarried));
  assert.ok(result.evidenceCarried.length > 0);
  assert.ok(result.evidenceCarried.every((item) => Array.isArray(item.sourceRefs) && item.sourceRefs.length > 0));
  assert.ok(Array.isArray(result.evidenceBuckets.supports));
  assert.ok(Array.isArray(result.evidenceBuckets.weakens));
  assert.ok(Array.isArray(result.evidenceBuckets.missing));
  assert.ok(Array.isArray(result.openTension));
  assert.ok(result.openTension.length > 0);
  assert.ok(Array.isArray(result.aim.sourceRefs) && result.aim.sourceRefs.length > 0);
  assert.ok(result.whatWouldDecideIt.text.length > 20);
  assert.deepEqual(result.previewLink, {
    assistantMessageId: "assistant_2",
    previewStatus: "active",
  });
  assert.equal(result.returnDelta, null);
});

test("buildWorkingEcho preserves canonical input and can wake in awaiting-return state", () => {
  const canonicalView = {
    fieldState: { key: "awaiting", label: "Awaiting" },
    activePreview: null,
    interaction: { nextBestAction: "" },
    pendingMove: null,
    mirror: {
      aim: { text: "Canonical aim" },
      evidence: [],
      story: [],
      moves: [],
      returns: [],
    },
  };
  const snapshot = clone(canonicalView);

  const result = buildWorkingEcho({
    canonicalView,
    messages: [],
    recentSources: [
      {
        documentKey: "source_waiting",
        title: "Verifier Log Return",
        operateSummary: "Waiting on the verifier return.",
      },
    ],
    focusedWitness: null,
    activeSession: { id: "session_awaiting" },
  });

  assert.ok(result);
  assert.equal(result.status, "awaiting_return");
  assert.equal(result.candidateMove, null);
  assert.match(result.whatWouldDecideIt.text, /which return/i);
  assert.deepEqual(canonicalView, snapshot);
});

test("buildWorkingEcho does not surface internal shape-fix instructions as the deciding split", () => {
  const result = buildWorkingEcho({
    canonicalView: {
      fieldState: { key: "open", label: "Open" },
      activePreview: {
        assistantMessageId: "assistant_internal",
        gatePreview: {
          reason: "Fix shape violations first, then retry the loop.",
        },
      },
      interaction: {
        nextBestAction: "Fix shape violations first, then retry the loop.",
      },
      pendingMove: {
        id: "move_internal",
        text: "Fix shape violations first, then retry the loop.",
      },
    },
    messages: [
      {
        id: "assistant_internal",
        role: "assistant",
        content:
          "Real: the drop is Mobile Safari-specific. Conflicts: the popup claim lacks support. Ask: where exactly do users vanish?",
        roomPayload: {
          segments: [
            { id: "seg_evidence", text: "Mobile Safari-specific drop is real.", mirrorRegion: "evidence" },
            { id: "seg_story", text: "Popup blame still lacks support.", mirrorRegion: "story" },
          ],
        },
      },
    ],
    recentSources: [],
    focusedWitness: null,
    activeSession: { id: "session_internal" },
  });

  assert.ok(result);
  assert.match(result.whatWouldDecideIt.text, /where exactly do users vanish/i);
  assert.equal(result.candidateMove, null);
  assert.ok(
    result.openTension.every((item) => !/fix shape violations/i.test(item.text)),
  );
});

test("buildWorkingEcho groups evidence and surfaces return-aware deltas when prior reads weaken", () => {
  const result = buildWorkingEcho({
    canonicalView: {
      fieldState: { key: "open", label: "Open" },
      activePreview: {
        assistantMessageId: "assistant_return",
        status: "active",
      },
      interaction: {
        nextBestAction: "Inspect AVS logs for foreign-card travelers after SMS succeeds.",
      },
      pendingMove: null,
    },
    messages: [
      {
        id: "assistant_return",
        role: "assistant",
        content:
          "The SMS fix changed timeout behavior, but the remaining traveler failures still look post-SMS. Compare AVS mismatch rates before blaming the CTA copy.",
        roomPayload: {
          segments: [
            { id: "seg_aim", text: "Find what still fails after the SMS fix.", mirrorRegion: "aim" },
            { id: "seg_story", text: "The CTA-copy explanation is unsupported.", mirrorRegion: "story" },
            { id: "seg_move", text: "Compare post-SMS AVS mismatches against CTA exposure.", mirrorRegion: "moves" },
          ],
        },
      },
    ],
    recentSources: [
      {
        documentKey: "E2_return_after_fix",
        title: "E2 Return After SMS Fix",
        operateSummary:
          "After the SMS timeout fix, timeout errors drop 80%, but completion rate stays flat for travelers using foreign cards.",
      },
      {
        documentKey: "E3_trace_b",
        title: "E3 Replay B",
        operateSummary:
          "Trace B shows a user passing SMS verification, then failing later on AVS postal-code mismatch.",
      },
      {
        documentKey: "E4_support_claim",
        title: "E4 Support Claim",
        operateSummary:
          "Support note says it is definitely the new CTA copy, but no evidence links the copy change to the foreign-card cohort.",
      },
    ],
    focusedWitness: null,
    activeSession: { id: "session_return" },
  });

  assert.ok(result);
  assert.ok(result.evidenceBuckets.supports.some((item) => item.id === "E3"));
  assert.ok(result.evidenceBuckets.weakens.some((item) => item.id === "E2" || item.id === "E4"));
  assert.ok(result.evidenceBuckets.missing.length > 0);
  assert.ok(result.returnDelta);
  assert.ok(result.returnDelta.changedRead.length > 0);
  assert.ok(result.returnDelta.weakenedRead.length > 0);
  assert.match(result.whatWouldDecideIt.text, /post-SMS|AVS|traveler/i);
});

test("buildWorkingEcho keeps no-move-yet explicit and prefers artifact-backed aim", () => {
  const result = buildWorkingEcho({
    canonicalView: {
      fieldState: { key: "open", label: "Open" },
      activePreview: {
        assistantMessageId: "assistant_fog",
        status: "active",
      },
      interaction: { nextBestAction: "" },
      pendingMove: null,
      mirror: {
        aim: { text: "Find the failed step before changing pricing." },
      },
    },
    messages: [
      {
        id: "assistant_fog",
        role: "assistant",
        content:
          "The pricing-table story is unsupported. Which step actually loses them first: legal review, SSO setup, or pricing exposure?",
        roomPayload: {
          segments: [
            { id: "seg_aim", text: "Blame pricing first.", mirrorRegion: "aim" },
            {
              id: "seg_story",
              text: "The known failures do not happen in one clearly shared step.",
              mirrorRegion: "story",
            },
          ],
        },
      },
    ],
    recentSources: [
      {
        documentKey: "E1_sparse",
        title: "E1 Sparse Funnel Snapshot",
        operateSummary:
          "A one-day funnel snapshot shows four enterprise prospects dropping before activation, but it does not break the failures down by step.",
      },
      {
        documentKey: "E2_sales",
        title: "E2 Sales Call Note",
        operateSummary:
          "One buyer paused after procurement asked for legal review of the security addendum, before anyone mentioned pricing.",
      },
      {
        documentKey: "E3_support",
        title: "E3 Support Thread",
        operateSummary:
          "Another prospect reported getting stuck during SSO setup, but there is no replay or step-by-step trace attached.",
      },
      {
        documentKey: "E4_blame",
        title: "E4 Internal Blame Note",
        operateSummary:
          "Internal note says it is definitely the new annual-plan pricing table, but no linked evidence shows the pricing table on the failed path.",
      },
    ],
    focusedWitness: null,
    activeSession: { id: "session_fog" },
  });

  assert.ok(result);
  assert.equal(result.candidateMove, null);
  assert.equal(result.aim.text, "Find the failed step before changing pricing.");
  assert.ok(result.aim.sourceRefs.includes("mirror:aim"));
  assert.match(result.whatWouldDecideIt.text, /replay|legal review|SSO|pricing exposure/i);
  assert.match(result.uncertainty.detail, /still open because/i);
  assert.match(result.uncertainty.detail, /replay|breakdown/i);
  assert.ok(result.evidenceBuckets.supports.some((item) => item.id === "E2"));
  assert.ok(result.evidenceBuckets.weakens.some((item) => item.id === "E1"));
  assert.ok(result.evidenceBuckets.missing.length > 0);
});
