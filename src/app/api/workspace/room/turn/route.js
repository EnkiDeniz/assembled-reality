import { NextResponse } from "next/server";
import { appEnv } from "@/lib/env";
import { PRODUCT_NAME } from "@/lib/product-language";
import { appendConversationExchangeForUser } from "@/lib/reader-workspace";
import {
  buildRoomPayloadCitations,
  buildRoomThreadKey,
  makeRoomId,
  normalizeRoomTurnResult,
} from "@/lib/room";
import { buildRoomWorkspaceViewForUser } from "@/lib/room-server";
import { getRequiredSession } from "@/lib/server-session";
import { ensureRoomAssemblyDocumentForProject, getRoomAssemblySource } from "@/lib/room-documents";
import {
  compileRoomSource,
  createOrHydrateRoomRuntimeWindow,
  runRoomProposalGate,
} from "@/lib/room-canonical";
import {
  buildRoomSemanticContext,
  buildSafeFallbackTurn,
  classifyRoomTurnMode,
  coerceConversationTurn,
  hasCanonicalProposalSegments,
} from "@/lib/room-turn-policy.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    "You are responding inside the Room. Conversation comes first. Structure appears only as lawful clause proposals.",
    "Return strict JSON only. No markdown fences. No prose outside the JSON object.",
    "Use this exact top-level shape:",
    "{\"assistantText\":\"...\",\"turnMode\":\"conversation|proposal\",\"segments\":[{\"text\":\"...\",\"domain\":\"aim|witness|story|move|test|return|other\",\"mirrorRegion\":\"aim|evidence|story|moves|returns\",\"suggestedClause\":\"DIR aim \\\"...\\\"\",\"intent\":\"declare|ground|interpret|move|test|observe|compare|capture|clarify\"}],\"receiptKit\":null}",
    "assistantText must stay plain-language and calm.",
    "segments[].text must be user-facing preview language, never internal planning notes or hidden reasoning.",
    "Seven proposes. It never mutates canonical state.",
    "Only propose lawful clauses from this set:",
    'DIR aim "<text>"',
    'GND witness @ref from "user_stated" with v_turn_<n>',
    'INT story "<text>"',
    'MOV move "<text>" via manual',
    'TST test "<text>"',
    'RTN observe|confirm|contradict "<text>" via user|third_party|lender_portal|service|system as text|score|bool|date|count',
    "Never propose MOV without also proposing TST in the same response unless both already exist in source.",
    "Keep witness separate from story. Desire, intention, hope, and aspiration are never GND witness. Interpretation and hypotheses stay INT story.",
    "In-conversation clarification is not MOV/TST. Only propose MOV/TST when the user should do something outside this conversation.",
    "At most one Receipt Kit. Use it only when a concrete proof action is helpful.",
    turnMode === "conversation"
      ? 'Turn mode is conversation. Return {"turnMode":"conversation"} with assistantText only. segments must be [] and receiptKit must be null.'
      : 'Turn mode is proposal. Return {"turnMode":"proposal"} only if the user has earned canonical structure. If structure is not earned, fall back to plain assistantText with empty segments.',
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
    `Box: ${normalizeText(view?.project?.title) || "Untitled Box"}`,
    view?.project?.subtitle ? `Box note: ${normalizeText(view.project.subtitle)}` : "",
    `Canonical Room source:\n${roomSource || "GND box @room_default"}`,
    `Current status: ${normalizeText(view?.fieldState?.key) || "open"}`,
    view?.mirror?.aim?.text ? `Current aim: ${normalizeText(view.mirror.aim.text)}` : "Current aim: none",
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

async function persistRoomTurn(userId, projectKey, message, turn, provider) {
  const threadKey = buildRoomThreadKey(projectKey);
  const exchange = await appendConversationExchangeForUser(userId, {
    documentKey: threadKey,
    userLine: message,
    answer: turn.assistantText,
    citations: buildRoomPayloadCitations(turn),
  });
  const view = await buildRoomWorkspaceViewForUser(userId, { projectKey });

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

  const body = await request.json().catch(() => null);
  const projectKey = String(body?.projectKey || "").trim();
  const message = normalizeLongText(body?.message);

  if (!message) {
    return NextResponse.json({ ok: false, error: "Say what the room should respond to." }, { status: 400 });
  }

  const view = await buildRoomWorkspaceViewForUser(session.user.id, { projectKey });
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
    const normalizedTurn = normalizeRoomTurnResult({
      ...nextTurn,
      proposalId: normalizeText(nextTurn?.proposalId) || makeRoomId("proposal"),
      turnMode,
    });

    if (turnMode === "conversation" || !hasCanonicalProposalSegments(normalizedTurn)) {
      return NextResponse.json(
        await persistRoomTurn(
          session.user.id,
          resolvedProjectKey,
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
      await persistRoomTurn(session.user.id, resolvedProjectKey, message, gatedTurn, provider),
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
      }),
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

      const normalizedTurn = normalizeRoomTurnResult({
        ...parsed,
        proposalId: makeRoomId("proposal"),
        turnMode,
      });

      if (!normalizedTurn.assistantText) {
        return finalizeTurn(buildSafeFallbackTurn(), "fallback");
      }

      return finalizeTurn(normalizedTurn, "openai");
  } catch (error) {
    console.error("Room turn request crashed.", {
      error: error instanceof Error ? error.message : String(error),
    });
    return finalizeTurn(buildSafeFallbackTurn(), "fallback");
  }
}
