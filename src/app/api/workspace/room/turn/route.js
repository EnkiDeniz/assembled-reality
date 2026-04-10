import { NextResponse } from "next/server";
import { appEnv } from "@/lib/env";
import { PRODUCT_NAME } from "@/lib/product-language";
import { appendConversationExchangeForUser } from "@/lib/reader-workspace";
import {
  buildRoomPayloadCitations,
  makeRoomId,
  normalizeRoomTurnResult,
} from "@/lib/room";
import { buildRoomWorkspaceViewForUser } from "@/lib/room-server";
import { ensureCompilerFirstWorkspaceResetForUser } from "@/lib/room-sessions";
import { getRequiredSession } from "@/lib/server-session";
import { ensureRoomAssemblyDocumentForProject, getRoomAssemblySource } from "@/lib/room-documents";
import {
  compileRoomSource,
  createOrHydrateRoomRuntimeWindow,
  runRoomProposalGate,
} from "@/lib/room-canonical";
import {
  applyRoomTurnGuardrails,
  buildRoomSemanticContext,
  buildSafeFallbackTurn,
  classifyRoomTurnMode,
  coerceConversationTurn,
  describeRoomTurnStyle,
  hasCanonicalProposalSegments,
} from "@/lib/room-turn-policy.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

const ROOM_TURN_RESPONSE_SCHEMA = {
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

function clipText(value = "", max = 280) {
  const normalized = normalizeLongText(value);
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function extractMessageText(payload) {
  const output = Array.isArray(payload?.output) ? payload.output : [];
  const parts = [];

  output.forEach((item) => {
    const content = Array.isArray(item?.content) ? item.content : [];
    content.forEach((entry) => {
      if (
        (entry?.type === "output_text" || entry?.type === "text") &&
        typeof entry?.text === "string"
      ) {
        parts.push(entry.text);
      }
    });
  });

  return parts.join("\n\n").trim();
}

function parseJsonObject(text = "") {
  const normalized = String(text || "").trim();
  if (!normalized) return null;

  try {
    return JSON.parse(normalized);
  } catch {
    // Ignore and try to recover wrapped JSON.
  }

  const start = normalized.indexOf("{");
  const end = normalized.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(normalized.slice(start, end + 1));
  } catch {
    return null;
  }
}

function buildRoomSystemPrompt(turnMode = "conversation") {
  return [
    `You are Seven inside ${PRODUCT_NAME}.`,
    "Sound like a sharp friend: warm, direct, brief.",
    "Seven speaks in 7x7: at most 7 sentences, at most 7 words each.",
    "Shorter is better when the signal is clear.",
    "Every sentence should act like an operator sentence: name, move, test, return, or close.",
    "If you cannot compress the response into 7x7 honestly, ask one short question instead.",
    "assistantText may ask at most one question.",
    "If the user asks a general question, give one short answer and then ask why it matters right now.",
    "If the user is scoping, emotional, vague, or aspirational, stay conversational and help them narrow what matters.",
    "Do not write numbered lists, bullet lists, headings, or textbook explainers in assistantText.",
    'Do not use internal product language in assistantText unless the user already used it first: "compile", "canonical", "gate", "clause", "sigil", "kernel".',
    "Return strict JSON only. No markdown fences. No prose outside the JSON object.",
    "Use this exact top-level shape:",
    "{\"assistantText\":\"...\",\"turnMode\":\"conversation|proposal\",\"segments\":[{\"text\":\"...\",\"domain\":\"aim|witness|story|move|test|return|receipt|field|other\",\"mirrorRegion\":\"aim|evidence|story|moves|returns\",\"suggestedClause\":\"DIR aim \\\"...\\\"\",\"intent\":\"declare|ground|interpret|move|test|observe|compare|capture|clarify\"}],\"receiptKit\":null}",
    "assistantText is the only thing the user sees by default.",
    "segments are hidden structural metadata. Every segment.text must be an exact excerpt from assistantText, never internal planning notes or hidden reasoning.",
    "If nothing structural is earned, segments must be [] and receiptKit must be null.",
    "Seven proposes. It never mutates canonical state.",
    "Only propose lawful clauses from this set:",
    'DIR aim "<text>"',
    'GND witness @ref from "user_stated" with v_turn_<n>',
    'INT story "<text>"',
    'MOV move "<text>" via manual',
    'TST test "<text>"',
    'RTN observe|confirm|contradict "<text>" via user|third_party|lender_portal|service|system as text|score|bool|date|count',
    "Desire, hope, intention, and aspiration are story, not witness.",
    "Observations, reported facts, and returned signals may become witness.",
    "Clarifying inside the chat is conversation, not MOV/TST.",
    "Only real-world checks get MOV/TST, and never propose MOV without TST in the same response unless both already exist in source.",
    "At most one Receipt Kit. Use it only when a concrete proof action is genuinely helpful.",
    'Example: "I want to build Loegos" -> conversation mode, brief reply, ask which layer matters most, no clauses.',
    'Example: "I want to understand what a monolith is" -> conversation mode, one short answer, then ask why it matters now, no clauses.',
    'Example: "I\'m scared to leave my job" -> conversation mode, acknowledge the feeling, ask what decision is actually in front of them, no clauses.',
    'Example: "The offer is $145k base, remote, 40-person Series B" -> proposal mode is allowed because this is a concrete reported fact.',
    turnMode === "conversation"
      ? 'Turn mode is conversation. Return {"turnMode":"conversation"} with assistantText only. segments must be [] and receiptKit must be null.'
      : 'Turn mode is proposal. Return {"turnMode":"proposal"} only if the user has genuinely earned structure. If structure is not earned, fall back to assistantText with empty segments.',
  ].join(" ");
}

function buildRoomUserPrompt({
  message = "",
  view = null,
  roomSource = "",
  turnNumber = 1,
  turnMode = "conversation",
} = {}) {
  const messages = Array.isArray(view?.messages) ? view.messages : [];
  const recentThread = messages
    .slice(-6)
    .map((entry) => {
      const role = String(entry?.role || "").toLowerCase() === "assistant" ? "Seven" : "User";
      return `${role}: ${clipText(entry?.content || "", 240)}`;
    })
    .join("\n");

  return [
    `Turn number: ${turnNumber}`,
    `Turn mode: ${turnMode}`,
    `Turn style hint: ${describeRoomTurnStyle(message)}`,
    `Box: ${normalizeText(view?.project?.title) || "Untitled Box"}`,
    view?.project?.subtitle ? `Box note: ${normalizeText(view.project.subtitle)}` : "",
    `Canonical Room source:\n${roomSource || "GND box @room_default"}`,
    `Current status: ${normalizeText(view?.fieldState?.key) || "open"}`,
    view?.mirror?.aim?.text ? `Current aim: ${normalizeText(view.mirror.aim.text)}` : "Current aim: none",
    view?.session?.handoffSummary
      ? `Session handoff: ${normalizeLongText(view.session.handoffSummary)}`
      : "",
    Array.isArray(view?.recentReturns) && view.recentReturns.length
      ? `Recent returns: ${view.recentReturns
          .slice(0, 3)
          .map((item) => `${item.actual} [${item.provenanceLabel || item.via || "unlabeled"}]`)
          .join(" | ")}`
      : "Recent returns: none",
    Array.isArray(view?.recentSources) && view.recentSources.length
      ? `Recent sources: ${view.recentSources
          .slice(0, 4)
          .map((source) => normalizeText(source?.title))
          .filter(Boolean)
          .join(" | ")}`
      : "Recent sources: none",
    recentThread ? `Recent thread:\n${recentThread}` : "",
    `New user turn: ${normalizeLongText(message)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function persistRoomTurn(userId, roomSession, projectKey, documentKey, message, turn, provider) {
  if (!normalizeText(roomSession?.threadDocumentKey)) {
    throw new Error("Conversation not found.");
  }

  const exchange = await appendConversationExchangeForUser(userId, {
    documentKey: roomSession.threadDocumentKey,
    userLine: message,
    answer: turn.assistantText,
    citations: buildRoomPayloadCitations(turn),
  });
  const view = await buildRoomWorkspaceViewForUser(userId, {
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

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  await ensureCompilerFirstWorkspaceResetForUser(session.user.id);

  const body = await request.json().catch(() => null);
  const projectKey = String(body?.projectKey || "").trim();
  const sessionId = String(body?.sessionId || "").trim();
  const documentKey = String(body?.documentKey || body?.document || "").trim();
  const message = normalizeLongText(body?.message);

  if (!message) {
    return NextResponse.json({ ok: false, error: "Say what the room should respond to." }, { status: 400 });
  }

  let view;
  try {
    view = await buildRoomWorkspaceViewForUser(session.user.id, { projectKey, sessionId, documentKey });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not open the room." },
      { status: 400 },
    );
  }

  if (!normalizeText(view?.project?.projectKey)) {
    return NextResponse.json({ ok: false, error: "Create a box first." }, { status: 400 });
  }
  if (!normalizeText(view?.session?.id)) {
    return NextResponse.json({ ok: false, error: "Open a conversation first." }, { status: 400 });
  }

  const resolvedProjectKey = view?.project?.projectKey || projectKey;
  const roomDocument = await ensureRoomAssemblyDocumentForProject(session.user.id, resolvedProjectKey);
  const roomSource = getRoomAssemblySource(roomDocument);
  const currentArtifact = compileRoomSource({
    source: roomSource,
    filename: `${roomDocument?.documentKey || "room"}.loe`,
  });
  const currentArtifactWindow = createOrHydrateRoomRuntimeWindow(roomDocument, currentArtifact);
  const turnNumber = (Array.isArray(view?.messages) ? view.messages.length : 0) + 1;
  const turnMode = classifyRoomTurnMode({ message, view });
  const semanticContext = buildRoomSemanticContext({
    currentSource: roomSource,
    recentSources: view?.recentSources,
    latestUserMessage: message,
  });

  async function finalizeTurn(nextTurn, provider) {
    const guardedTurn = applyRoomTurnGuardrails(nextTurn, {
      requestedTurnMode: turnMode,
    });
    const normalizedTurn = normalizeRoomTurnResult({
      ...guardedTurn,
      proposalId:
        normalizeText(guardedTurn?.proposalId || nextTurn?.proposalId) || makeRoomId("proposal"),
      turnMode: guardedTurn?.turnMode || turnMode,
    });

    if (normalizedTurn.turnMode === "conversation" || !hasCanonicalProposalSegments(normalizedTurn)) {
      return NextResponse.json(
        await persistRoomTurn(
          session.user.id,
          view.session,
          resolvedProjectKey,
          documentKey,
          message,
          normalizeRoomTurnResult(coerceConversationTurn(normalizedTurn)),
          provider,
        ),
      );
    }

    const gate = runRoomProposalGate({
      currentSource: roomSource,
      proposal: normalizedTurn,
      filename: `${roomDocument?.documentKey || "room"}.loe`,
      runtimeWindow: currentArtifactWindow,
      semanticContext,
    });
    const gatedTurn = normalizeRoomTurnResult({
      ...normalizedTurn,
      turnMode: "proposal",
      gatePreview: gate.gatePreview,
    });
    return NextResponse.json(
      await persistRoomTurn(
        session.user.id,
        view.session,
        resolvedProjectKey,
        documentKey,
        message,
        gatedTurn,
        provider,
      ),
    );
  }

  if (!appEnv.openai.enabled) {
    return finalizeTurn(buildSafeFallbackTurn(), "fallback");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${appEnv.openai.apiKey}`,
      },
      body: JSON.stringify({
        model: appEnv.openai.textModel,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: buildRoomSystemPrompt(turnMode) }],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: buildRoomUserPrompt({
                  message,
                  view,
                  roomSource,
                  turnNumber,
                  turnMode,
                }),
              },
            ],
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
      return finalizeTurn(buildSafeFallbackTurn(), "fallback");
    }

    const parsed = parseJsonObject(extractMessageText(payload));
    if (!parsed) {
      return finalizeTurn(buildSafeFallbackTurn(), "fallback");
    }

    if (!normalizeLongText(parsed?.assistantText || parsed?.reply)) {
      return finalizeTurn(buildSafeFallbackTurn(), "fallback");
    }

    return finalizeTurn(
      {
        ...parsed,
        proposalId: makeRoomId("proposal"),
        turnMode,
      },
      "openai",
    );
  } catch (error) {
    console.error("Room turn request crashed.", {
      error: error instanceof Error ? error.message : String(error),
    });
    return finalizeTurn(buildSafeFallbackTurn(), "fallback");
  }
}
