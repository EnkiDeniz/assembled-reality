import { appEnv } from "./env.js";
import {
  buildBridgePayloadCitations,
  buildRoomPayloadCitations,
  makeRoomId,
  normalizeRoomTurnResult,
} from "./room.js";
import { normalizeDreamBridgePayload } from "./dream-bridge.js";
import {
  compileRoomSource,
  createOrHydrateRoomRuntimeWindow,
  runRoomProposalGate,
} from "./room-canonical.js";
import {
  applyRoomTurnGuardrails,
  buildRoomSemanticContext,
  buildSafeFallbackTurn,
  classifyRoomTurnMode,
  coerceConversationTurn,
  hasCanonicalProposalSegments,
} from "./room-turn-policy.mjs";
import {
  buildRoomPromptPacket,
  parseRoomResponsesPayload,
} from "./room-turn-service.js";

const ROOM_SEGMENT_DOMAIN_VALUES = [
  "aim",
  "witness",
  "evidence",
  "story",
  "move",
  "test",
  "return",
  "receipt",
  "field",
  "other",
];

const ROOM_SEGMENT_INTENT_VALUES = [
  "declare",
  "ground",
  "interpret",
  "move",
  "test",
  "observe",
  "compare",
  "capture",
  "clarify",
];

const ROOM_MIRROR_REGION_VALUES = ["aim", "evidence", "story", "moves", "returns"];

export const ROOM_TURN_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    assistantText: { type: "string" },
    turnMode: {
      type: "string",
      enum: ["conversation", "proposal"],
    },
    segments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string" },
          domain: {
            type: "string",
            enum: ROOM_SEGMENT_DOMAIN_VALUES,
          },
          mirrorRegion: {
            type: "string",
            enum: ROOM_MIRROR_REGION_VALUES,
          },
          suggestedClause: { type: "string" },
          intent: {
            type: "string",
            enum: ROOM_SEGMENT_INTENT_VALUES,
          },
        },
        required: ["text", "domain", "mirrorRegion", "suggestedClause", "intent"],
      },
    },
    receiptKit: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            need: { type: "string" },
            why: { type: "string" },
            fastestPath: { type: "string" },
            enough: { type: "string" },
            artifact: {
              type: "object",
              additionalProperties: false,
              properties: {
                type: {
                  type: "string",
                  enum: ["upload", "paste", "draft_message", "link", "checklist", "compare"],
                },
                config: {
                  type: "object",
                  additionalProperties: false,
                  properties: {},
                  required: [],
                },
              },
              required: ["type", "config"],
            },
            prediction: {
              type: "object",
              additionalProperties: false,
              properties: {
                expected: { type: "string" },
                direction: {
                  type: "string",
                  enum: ["confirms", "contradicts", "narrows", "surprises"],
                },
                timebound: { type: "string" },
                surprise: { type: "string" },
              },
              required: ["expected", "direction", "timebound", "surprise"],
            },
          },
          required: ["id", "need", "why", "fastestPath", "enough", "artifact", "prediction"],
        },
      ],
    },
  },
  required: ["assistantText", "turnMode", "segments", "receiptKit"],
};

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeLongText(value = "") {
  return String(value || "").trim();
}

function json(body, status = 200) {
  return { body, status };
}

export async function createRoomTurnRouteDependencies(overrides = {}) {
  const deps = {
    appEnvValue: appEnv,
    fetchImpl: (...args) => fetch(...args),
    buildBridgePayloadCitations,
    buildRoomPayloadCitations,
    makeRoomId,
    normalizeRoomTurnResult,
    normalizeDreamBridgePayload,
    compileRoomSource,
    createOrHydrateRoomRuntimeWindow,
    runRoomProposalGate,
    applyRoomTurnGuardrails,
    buildRoomSemanticContext,
    buildSafeFallbackTurn,
    classifyRoomTurnMode,
    coerceConversationTurn,
    hasCanonicalProposalSegments,
    buildRoomPromptPacket,
    parseRoomResponsesPayload,
    ...overrides,
  };

  if (!deps.appendConversationExchangeForUser) {
    const readerWorkspace = await import("./reader-workspace.js");
    deps.appendConversationExchangeForUser = readerWorkspace.appendConversationExchangeForUser;
  }

  if (!deps.buildRoomWorkspaceViewForUser) {
    const roomServer = await import("./room-server.js");
    deps.buildRoomWorkspaceViewForUser = roomServer.buildRoomWorkspaceViewForUser;
  }

  if (!deps.ensureCompilerFirstWorkspaceResetForUser) {
    const roomSessions = await import("./room-sessions.js");
    deps.ensureCompilerFirstWorkspaceResetForUser =
      roomSessions.ensureCompilerFirstWorkspaceResetForUser;
  }

  if (!deps.getRequiredSession) {
    const serverSession = await import("./server-session.js");
    deps.getRequiredSession = serverSession.getRequiredSession;
  }

  if (!deps.ensureRoomAssemblyDocumentForProject || !deps.getRoomAssemblySource) {
    const roomDocuments = await import("./room-documents.js");
    deps.ensureRoomAssemblyDocumentForProject ||= roomDocuments.ensureRoomAssemblyDocumentForProject;
    deps.getRoomAssemblySource ||= roomDocuments.getRoomAssemblySource;
  }

  return deps;
}

async function persistRoomTurn(
  deps,
  userId,
  roomSession,
  projectKey,
  documentKey,
  message,
  turn,
  provider,
  bridgePayload = null,
) {
  if (!normalizeText(roomSession?.threadDocumentKey)) {
    throw new Error("Conversation not found.");
  }

  const exchange = await deps.appendConversationExchangeForUser(userId, {
    documentKey: roomSession.threadDocumentKey,
    userLine: message,
    answer: turn.assistantText,
    userCitations: deps.buildBridgePayloadCitations(bridgePayload),
    assistantCitations: deps.buildRoomPayloadCitations(turn),
  });
  const view = await deps.buildRoomWorkspaceViewForUser(userId, {
    projectKey,
    sessionId: roomSession.id,
    documentKey,
  });

  return {
    ok: true,
    provider,
    turn,
    view,
    threadId: exchange?.threadId || null,
    userMessageId: exchange?.userMessage?.id || null,
    messageId: exchange?.assistantMessage?.id || null,
  };
}

export async function handleRoomTurnPost(request, overrides = {}) {
  const deps = await createRoomTurnRouteDependencies(overrides);
  const session = await deps.getRequiredSession();
  if (!session?.user?.id) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  await deps.ensureCompilerFirstWorkspaceResetForUser(session.user.id);

  const body = await request.json().catch(() => null);
  const projectKey = String(body?.projectKey || "").trim();
  const sessionId = String(body?.sessionId || "").trim();
  const documentKey = String(body?.documentKey || body?.document || "").trim();
  const message = normalizeLongText(body?.message);
  const bridgePayload = deps.normalizeDreamBridgePayload(body?.bridgePayload);

  if (!message) {
    return json({ ok: false, error: "Say what the room should respond to." }, 400);
  }

  let view;
  try {
    view = await deps.buildRoomWorkspaceViewForUser(session.user.id, {
      projectKey,
      sessionId,
      documentKey,
    });
  } catch (error) {
    return json(
      { ok: false, error: error instanceof Error ? error.message : "Could not open the room." },
      400,
    );
  }

  if (!normalizeText(view?.project?.projectKey)) {
    return json({ ok: false, error: "Create a box first." }, 400);
  }
  if (!normalizeText(view?.session?.id)) {
    return json({ ok: false, error: "Open a conversation first." }, 400);
  }

  const resolvedProjectKey = view?.project?.projectKey || projectKey;
  const roomDocument = await deps.ensureRoomAssemblyDocumentForProject(session.user.id, resolvedProjectKey);
  const roomSource = deps.getRoomAssemblySource(roomDocument);
  const currentArtifact = deps.compileRoomSource({
    source: roomSource,
    filename: `${roomDocument?.documentKey || "room"}.loe`,
  });
  const currentArtifactWindow = deps.createOrHydrateRoomRuntimeWindow(roomDocument, currentArtifact);
  const turnNumber = (Array.isArray(view?.messages) ? view.messages.length : 0) + 1;
  const turnMode = deps.classifyRoomTurnMode({ message, view });
  const semanticContext = deps.buildRoomSemanticContext({
    currentSource: roomSource,
    recentSources: view?.recentSources,
    latestUserMessage: message,
  });

  async function finalizeTurn(nextTurn, provider) {
    const guardedTurn = deps.applyRoomTurnGuardrails(nextTurn, {
      requestedTurnMode: turnMode,
    });
    const normalizedTurn = deps.normalizeRoomTurnResult({
      ...guardedTurn,
      proposalId:
        normalizeText(guardedTurn?.proposalId || nextTurn?.proposalId) || deps.makeRoomId("proposal"),
      turnMode: guardedTurn?.turnMode || turnMode,
    });

    if (
      normalizedTurn.turnMode === "conversation" ||
      !deps.hasCanonicalProposalSegments(normalizedTurn)
    ) {
      return json(
        await persistRoomTurn(
          deps,
          session.user.id,
          view.session,
          resolvedProjectKey,
          documentKey,
          message,
          deps.normalizeRoomTurnResult(deps.coerceConversationTurn(normalizedTurn)),
          provider,
          bridgePayload,
        ),
      );
    }

    const gate = deps.runRoomProposalGate({
      currentSource: roomSource,
      proposal: normalizedTurn,
      filename: `${roomDocument?.documentKey || "room"}.loe`,
      runtimeWindow: currentArtifactWindow,
      semanticContext,
    });
    const gatedTurn = deps.normalizeRoomTurnResult({
      ...normalizedTurn,
      turnMode: "proposal",
      gatePreview: gate.gatePreview,
    });
    return json(
      await persistRoomTurn(
        deps,
        session.user.id,
        view.session,
        resolvedProjectKey,
        documentKey,
        message,
        gatedTurn,
        provider,
        bridgePayload,
      ),
    );
  }

  if (!deps.appEnvValue?.openai?.enabled) {
    return finalizeTurn(deps.buildSafeFallbackTurn(), "fallback");
  }

  try {
    const promptPacket = deps.buildRoomPromptPacket({
      message,
      view,
      roomSource,
      turnNumber,
      turnMode,
    });
    const response = await deps.fetchImpl("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${deps.appEnvValue.openai.apiKey}`,
      },
      body: JSON.stringify({
        model: deps.appEnvValue.openai.textModel,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: promptPacket.systemPrompt }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: promptPacket.userPrompt }],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "room_turn_result",
            strict: true,
            schema: ROOM_TURN_RESPONSE_SCHEMA,
          },
        },
      }),
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      console.error("Room turn request failed.", {
        status: response.status,
        detail: payload?.error?.message || payload?.error?.type || payload?.error?.code || "",
      });
      return finalizeTurn(deps.buildSafeFallbackTurn(), "fallback");
    }

    const parsed = deps.parseRoomResponsesPayload(payload);
    if (!parsed) {
      return finalizeTurn(deps.buildSafeFallbackTurn(), "fallback");
    }

    return finalizeTurn(
      {
        ...parsed,
        proposalId: deps.makeRoomId("proposal"),
        turnMode,
      },
      "openai",
    );
  } catch (error) {
    console.error("Room turn request crashed.", {
      error: error instanceof Error ? error.message : String(error),
    });
    return finalizeTurn(deps.buildSafeFallbackTurn(), "fallback");
  }
}
