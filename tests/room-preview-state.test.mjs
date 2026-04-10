import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRoomCanonicalViewModel,
  buildRoomPreviewState,
  compileRoomSource,
  createOrHydrateRoomRuntimeWindow,
} from "../src/lib/room-canonical.js";

function makeProposalMessage(id, proposalId, text, { accepted = true } = {}) {
  return {
    id,
    role: "assistant",
    content: text,
    roomPayload: {
      proposalId,
      turnMode: "proposal",
      gatePreview: {
        accepted,
        nextBestAction: accepted ? "Apply to make it canonical." : "",
        reason: accepted ? "" : "semantic_reject",
        diagnostics: accepted ? [] : [{ message: "Not lawful yet." }],
      },
      segments: [
        {
          id: `${proposalId}-aim`,
          text,
          domain: "aim",
          mirrorRegion: "aim",
          suggestedClause: `DIR aim "${text}"`,
        },
      ],
      receiptKit: null,
    },
  };
}

test("preview state marks latest accepted proposal active and earlier ones superseded", () => {
  const previewState = buildRoomPreviewState([
    { id: "u1", role: "user", content: "help", roomPayload: null },
    makeProposalMessage("a1", "proposal_1", "First preview."),
    makeProposalMessage("a2", "proposal_2", "Blocked preview.", { accepted: false }),
    makeProposalMessage("a3", "proposal_3", "Latest preview."),
  ]);

  assert.equal(previewState.activePreview?.assistantMessageId, "a3");
  assert.equal(previewState.messages.find((message) => message.id === "u1")?.previewStatus, "none");
  assert.equal(previewState.messages.find((message) => message.id === "a1")?.previewStatus, "superseded");
  assert.equal(previewState.messages.find((message) => message.id === "a2")?.previewStatus, "blocked");
  assert.equal(previewState.messages.find((message) => message.id === "a3")?.previewStatus, "active");
});

test("applied latest preview does not resurrect older superseded previews", () => {
  const previewState = buildRoomPreviewState(
    [
      makeProposalMessage("a1", "proposal_1", "Earlier preview."),
      makeProposalMessage("a2", "proposal_2", "Latest preview."),
    ],
    {
      events: [
        {
          kind: "proposal_applied",
          assistantMessageId: "a2",
          proposalId: "proposal_2",
        },
      ],
    },
  );

  assert.equal(previewState.activePreview, null);
  assert.equal(previewState.messages.find((message) => message.id === "a1")?.previewStatus, "superseded");
  assert.equal(previewState.messages.find((message) => message.id === "a2")?.previewStatus, "applied");
});

test("preview messages do not alter canonical field state or mirror", () => {
  const roomDocument = {
    documentKey: "room_doc_1",
    title: "Room",
    seedMeta: {},
  };
  const artifact = compileRoomSource({
    source: 'GND box @room_default\nDIR aim "stabilize source truth"\n',
    filename: "room.loe",
  });
  const runtimeWindow = createOrHydrateRoomRuntimeWindow(roomDocument, artifact);

  const baseView = buildRoomCanonicalViewModel({
    roomDocument,
    artifact,
    runtimeWindow,
    messages: [],
  });
  const previewView = buildRoomCanonicalViewModel({
    roomDocument,
    artifact,
    runtimeWindow,
    messages: [makeProposalMessage("a1", "proposal_1", "Try tightening the aim.")],
  });

  assert.deepEqual(previewView.fieldState, baseView.fieldState);
  assert.deepEqual(previewView.mirror, baseView.mirror);
  assert.equal(previewView.activePreview?.assistantMessageId, "a1");
});
