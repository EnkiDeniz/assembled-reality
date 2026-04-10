import { NextResponse } from "next/server";
import { appEnv } from "@/lib/env";
import { PRODUCT_NAME } from "@/lib/product-language";
import { appendConversationExchangeForUser } from "@/lib/reader-workspace";
import {
  buildRoomPayloadCitations,
  buildRoomThreadKey,
  makeRoomId,
  normalizeReceiptKit,
  normalizeRoomTurnResult,
} from "@/lib/room";
import { buildRoomWorkspaceViewForUser } from "@/lib/room-server";
import { getRequiredSession } from "@/lib/server-session";
import { ensureRoomAssemblyDocumentForProject, getRoomAssemblySource } from "@/lib/room-documents";
import { createOrHydrateRoomRuntimeWindow, runRoomProposalGate } from "@/lib/room-canonical";

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

function countWords(text = "") {
  const normalized = normalizeText(text);
  return normalized ? normalized.split(/\s+/).length : 0;
}

function makeAimCandidate(message = "") {
  const firstSentence = normalizeText(String(message || "").split(/[\n.?!]/)[0] || "");
  if (!firstSentence) return "";
  if (countWords(firstSentence) <= 10) return firstSentence;
  return clipText(firstSentence, 80);
}

function buildRoomSystemPrompt() {
  return [
    `You are Seven inside ${PRODUCT_NAME}.`,
    "You are responding inside the Room. Conversation comes first. Structure appears only as lawful clause proposals.",
    "Return strict JSON only. No markdown fences. No prose outside the JSON object.",
    "Use this exact top-level shape:",
    "{\"assistantText\":\"...\",\"segments\":[{\"text\":\"...\",\"domain\":\"aim|witness|story|move|test|return|other\",\"mirrorRegion\":\"aim|evidence|story|moves|returns\",\"suggestedClause\":\"DIR aim \\\"...\\\"\",\"intent\":\"declare|ground|interpret|move|test|observe|compare|capture|clarify\"}],\"receiptKit\":null}",
    "assistantText must stay plain-language and calm.",
    "Seven proposes. It never mutates canonical state.",
    "Only propose lawful clauses from this set:",
    'DIR aim "<text>"',
    'GND witness @ref from "user_stated" with v_turn_<n>',
    'INT story "<text>"',
    'MOV move "<text>" via manual',
    'TST test "<text>"',
    'RTN observe|confirm|contradict "<text>" via user|third_party|lender_portal|service|system as text|score|bool|date|count',
    "Never propose MOV without also proposing TST in the same response unless both already exist in source.",
    "Keep witness separate from story. Clear firsthand user observations may become GND witness. Interpretation and hypotheses stay INT story.",
    "At most one Receipt Kit. Use it only when a concrete proof action is helpful.",
  ].join(" ");
}

function buildRoomUserPrompt({
  message = "",
  view = null,
  roomSource = "",
  turnNumber = 1,
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

function shouldGroundAsWitness(message = "") {
  return /\b(i|we)\b/i.test(message) || /\bmy\b/i.test(message) || /\bnoticed|saw|found|got|received|measured|wrote|have\b/i.test(message);
}

function suggestsReturn(message = "") {
  return /\b(came back|came through|returned|it changed|it stopped|it now|result|output changed|confirmed|contradicted|worked|didn't work)\b/i.test(
    message,
  );
}

function suggestsDraftMessage(message = "") {
  return /\b(email|message|text|send|reach out|write to|follow up)\b/i.test(message);
}

function suggestsCompare(message = "") {
  return /\b(compare|difference|different|before|after|changed|match|mismatch)\b/i.test(message);
}

function buildFallbackTurn(message = "", view = null) {
  const currentAim = normalizeText(view?.mirror?.aim?.text);
  const aimCandidate = currentAim || makeAimCandidate(message);
  const turnNumber = (Array.isArray(view?.messages) ? view.messages.length : 0) + 1;
  const witnessRef = `user_turn_${turnNumber}`;
  const moveText = suggestsDraftMessage(message)
    ? "Send one concrete message that asks reality to answer plainly."
    : "Rerun one concrete example with the screenshot explicitly labeled static.";
  const testText = suggestsDraftMessage(message)
    ? "A reply arrives and changes what the room should do next."
    : "The output changes when the screenshot is labeled static.";
  const assistantText = suggestsReturn(message)
    ? "That sounds like a real return, not just more story. I turned it into a proposed observation so you can apply it cleanly."
    : "I pulled out a lawful next shape for the room. Read it first, then apply only what feels true.";

  const segments = [];
  if (!currentAim && aimCandidate) {
    segments.push({
      text: aimCandidate,
      domain: "aim",
      mirrorRegion: "aim",
      suggestedClause: `DIR aim "${aimCandidate.replace(/"/g, '\\"')}"`,
      intent: "declare",
    });
  }
  if (shouldGroundAsWitness(message) && !suggestsReturn(message)) {
    segments.push({
      text: clipText(message, 160),
      domain: "witness",
      mirrorRegion: "evidence",
      suggestedClause: `GND witness @${witnessRef} from "user_stated" with v_turn_${turnNumber}`,
      intent: "ground",
    });
  } else if (normalizeLongText(message)) {
    segments.push({
      text: clipText(message, 160),
      domain: "story",
      mirrorRegion: "story",
      suggestedClause: `INT story "${clipText(message, 160).replace(/"/g, '\\"')}"`,
      intent: "interpret",
    });
  }

  if (suggestsReturn(message)) {
    segments.push({
      text: clipText(message, 180),
      domain: "return",
      mirrorRegion: "returns",
      suggestedClause: `RTN observe "${clipText(message, 180).replace(/"/g, '\\"')}" via user as text`,
      intent: "observe",
    });
  } else {
    segments.push(
      {
        text: moveText,
        domain: "move",
        mirrorRegion: "moves",
        suggestedClause: `MOV move "${moveText.replace(/"/g, '\\"')}" via manual`,
        intent: "move",
      },
      {
        text: testText,
        domain: "test",
        mirrorRegion: "moves",
        suggestedClause: `TST test "${testText.replace(/"/g, '\\"')}"`,
        intent: "test",
      },
    );
  }

  const receiptKit = suggestsReturn(message)
    ? null
    : normalizeReceiptKit({
        need: "Capture the return that comes back from this test.",
        why: "The room only changes when predicted and actual are held side by side.",
        fastestPath: suggestsDraftMessage(message) ? "Draft the message and send it." : "Paste what changes after the rerun.",
        enough: "One concrete return is enough to change the next move.",
        artifact: {
          type: suggestsCompare(message) ? "compare" : suggestsDraftMessage(message) ? "draft_message" : "paste",
          config: {},
        },
        prediction: {
          expected: testText,
          direction: "narrows",
          timebound: "This turn or the next real contact.",
          surprise: "If reality answers differently, record that directly.",
        },
      });

  return normalizeRoomTurnResult({
    assistantText,
    proposalId: makeRoomId("proposal"),
    segments,
    receiptKit,
  });
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
  const currentArtifactWindow = createOrHydrateRoomRuntimeWindow(
    roomDocument,
    runRoomProposalGate({
      currentSource: roomSource,
      proposal: { segments: [] },
      filename: `${roomDocument?.documentKey || "room"}.loe`,
    }).artifact,
  );
  const turnNumber = (Array.isArray(view?.messages) ? view.messages.length : 0) + 1;

  async function finalizeTurn(nextTurn, provider) {
    const gate = runRoomProposalGate({
      currentSource: roomSource,
      proposal: nextTurn,
      filename: `${roomDocument?.documentKey || "room"}.loe`,
      runtimeWindow: currentArtifactWindow,
    });
    const normalizedTurn = normalizeRoomTurnResult({
      ...nextTurn,
      gatePreview: gate.gatePreview,
    });
    return NextResponse.json(
      await persistRoomTurn(session.user.id, resolvedProjectKey, message, normalizedTurn, provider),
    );
  }

  if (!appEnv.openai.enabled) {
    return finalizeTurn(buildFallbackTurn(message, view), "fallback");
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
            content: [{ type: "input_text", text: buildRoomSystemPrompt() }],
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
      return finalizeTurn(buildFallbackTurn(message, view), "fallback");
    }

    const parsed = parseJsonObject(extractMessageText(payload));
    if (!parsed) {
      return finalizeTurn(buildFallbackTurn(message, view), "fallback");
    }

    const normalizedTurn = normalizeRoomTurnResult({
      ...parsed,
      proposalId: makeRoomId("proposal"),
    });

    if (!normalizedTurn.assistantText || normalizedTurn.segments.length === 0) {
      return finalizeTurn(buildFallbackTurn(message, view), "fallback");
    }

    return finalizeTurn(normalizedTurn, "openai");
  } catch (error) {
    console.error("Room turn request crashed.", {
      error: error instanceof Error ? error.message : String(error),
    });
    return finalizeTurn(buildFallbackTurn(message, view), "fallback");
  }
}
