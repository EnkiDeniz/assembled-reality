import test from "node:test";
import assert from "node:assert/strict";

import { handleRoomTurnPost } from "../src/lib/room-turn-route-handler.js";
import { extractBridgePayloadFromCitations } from "../src/lib/room.js";

function buildRequest(body) {
  return new Request("http://localhost/api/workspace/room/turn", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

test("room turn persists bridge provenance on the user message and rehydrates bridgeContext", async () => {
  const captured = {
    exchange: null,
    storedBridge: null,
  };

  const response = await handleRoomTurnPost(
    buildRequest({
      projectKey: "alpha-box",
      sessionId: "session_alpha",
      message: "Bring this into Room.",
      bridgePayload: {
        kind: "passage",
        documentId: "dream_doc_1",
        documentTitle: "Field Notes",
        anchor: "block_1",
        excerpt: "Carry this passage into Room.",
        savedAt: "2026-04-13T15:00:00.000Z",
      },
    }),
    {
      appEnvValue: {
        openai: {
          enabled: false,
        },
      },
      getRequiredSession: async () => ({ user: { id: "user_1" } }),
      ensureCompilerFirstWorkspaceResetForUser: async () => ({
        resetAt: "2026-04-13T15:00:00.000Z",
      }),
      buildRoomWorkspaceViewForUser: async () => ({
        project: { projectKey: "alpha-box", title: "Alpha Box", subtitle: "" },
        roomIdentity: { boxTitle: "Alpha Box", conversationTitle: "Conversation", canonScopeLabel: "" },
        session: {
          id: "session_alpha",
          title: "Conversation",
          threadDocumentKey: "room:alpha-box",
        },
        sessions: [],
        messages: [],
        recentSources: [],
        recentReturns: [],
        focusedWitness: null,
        bridgeContext: captured.storedBridge,
      }),
      ensureRoomAssemblyDocumentForProject: async () => ({
        documentKey: "room_alpha_box",
        title: "Alpha Box Room",
        seedMeta: { roomDocument: true },
      }),
      getRoomAssemblySource: () => 'GND box @room_alpha_box\nDIR aim "Keep the room open."',
      buildSafeFallbackTurn: () => ({
        assistantText: "Fallback room reply.",
        turnMode: "conversation",
        segments: [],
        receiptKit: null,
      }),
      appendConversationExchangeForUser: async (_userId, payload) => {
        captured.exchange = payload;
        captured.storedBridge = extractBridgePayloadFromCitations(payload.userCitations);
        return {
          threadId: "room:alpha-box",
          userMessage: { id: "user_message_1" },
          assistantMessage: { id: "assistant_message_1" },
        };
      },
    },
  );

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(captured.exchange.userCitations));
  assert.equal(captured.exchange.userCitations.length, 1);
  assert.deepEqual(captured.storedBridge, {
    kind: "passage",
    state: "pending",
    documentId: "dream_doc_1",
    documentTitle: "Field Notes",
    sourceLabel: "Field Notes",
    provenanceLabel: "From Library",
    versionId: null,
    versionLabel: null,
    anchor: "block_1",
    excerpt: "Carry this passage into Room.",
    savedAt: "2026-04-13T15:00:00.000Z",
    readSummary: null,
    receiptStatus: null,
  });
  assert.deepEqual(response.body.view.bridgeContext, captured.storedBridge);
});

test("room turn preserves read summary bridge payloads end-to-end", async () => {
  const captured = {
    storedBridge: null,
  };

  const response = await handleRoomTurnPost(
    buildRequest({
      projectKey: "alpha-box",
      sessionId: "session_alpha",
      message: "Carry this read forward.",
      bridgePayload: {
        kind: "read_summary",
        state: "armed",
        documentId: "dream_doc_2",
        documentTitle: "Field Notes",
        versionId: "version_2",
        versionLabel: "v2",
        anchor: "block_9",
        excerpt: "The document is not direct source.",
        readSummary: {
          primaryFinding: "The document is not direct source.",
          nextMove: "Discuss the provisional read in Room.",
          readDisposition: "informative_only",
        },
      },
    }),
    {
      appEnvValue: {
        openai: {
          enabled: false,
        },
      },
      getRequiredSession: async () => ({ user: { id: "user_1" } }),
      ensureCompilerFirstWorkspaceResetForUser: async () => ({
        resetAt: "2026-04-13T15:00:00.000Z",
      }),
      buildRoomWorkspaceViewForUser: async () => ({
        project: { projectKey: "alpha-box", title: "Alpha Box", subtitle: "" },
        roomIdentity: { boxTitle: "Alpha Box", conversationTitle: "Conversation", canonScopeLabel: "" },
        session: {
          id: "session_alpha",
          title: "Conversation",
          threadDocumentKey: "room:alpha-box",
        },
        sessions: [],
        messages: [],
        recentSources: [],
        recentReturns: [],
        focusedWitness: null,
        bridgeContext: captured.storedBridge,
      }),
      ensureRoomAssemblyDocumentForProject: async () => ({
        documentKey: "room_alpha_box",
        title: "Alpha Box Room",
        seedMeta: { roomDocument: true },
      }),
      getRoomAssemblySource: () => 'GND box @room_alpha_box\nDIR aim "Keep the room open."',
      buildSafeFallbackTurn: () => ({
        assistantText: "Fallback room reply.",
        turnMode: "conversation",
        segments: [],
        receiptKit: null,
      }),
      appendConversationExchangeForUser: async (_userId, payload) => {
        captured.storedBridge = extractBridgePayloadFromCitations(payload.userCitations);
        return {
          threadId: "room:alpha-box",
          userMessage: { id: "user_message_2" },
          assistantMessage: { id: "assistant_message_2" },
        };
      },
    },
  );

  assert.equal(response.status, 200);
  assert.equal(captured.storedBridge.kind, "read_summary");
  assert.equal(captured.storedBridge.versionId, "version_2");
  assert.equal(captured.storedBridge.versionLabel, "v2");
  assert.equal(captured.storedBridge.readSummary.primaryFinding, "The document is not direct source.");
  assert.equal(response.body.view.bridgeContext.kind, "read_summary");
});
