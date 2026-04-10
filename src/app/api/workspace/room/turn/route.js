import { NextResponse } from "next/server";
import { appEnv } from "@/lib/env";
import { PRODUCT_NAME } from "@/lib/product-language";
import { appendConversationExchangeForUser } from "@/lib/reader-workspace";
import {
  buildRoomPayloadCitations,
  buildRoomThreadKey,
  normalizeReceiptKit,
  normalizeRoomTurnResult,
} from "@/lib/room";
import { buildRoomWorkspaceViewForUser } from "@/lib/room-server";
import { getRequiredSession } from "@/lib/server-session";

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

function summarizeCollection(items = [], formatter, emptyLabel = "none") {
  const normalizedItems = Array.isArray(items) ? items : [];
  const summary = normalizedItems.map(formatter).filter(Boolean).slice(0, 5).join(" | ");
  return summary || emptyLabel;
}

function countWords(text = "") {
  const normalized = normalizeText(text);
  return normalized ? normalized.split(/\s+/).length : 0;
}

function makeAimCandidate(message = "") {
  const firstSentence = normalizeText(String(message || "").split(/[\n.?!]/)[0] || "");
  if (!firstSentence) return "";
  if (countWords(firstSentence) <= 11) return firstSentence;
  return clipText(firstSentence, 68);
}

function buildRoomSystemPrompt() {
  return [
    `You are Seven inside ${PRODUCT_NAME}.`,
    "This surface is the Room: conversation first, structure only when it helps.",
    "Return strict JSON only. Do not include markdown fences or explanatory prose outside the JSON object.",
    "Use this exact top-level shape:",
    "{\"reply\":\"...\",\"mirrorDraft\":{\"aimText\":\"\",\"aimGloss\":\"\",\"evidenceItems\":[{\"text\":\"\",\"why\":\"\"}],\"storyItems\":[{\"text\":\"\",\"why\":\"\"}],\"moveItems\":[{\"text\":\"\",\"why\":\"\",\"expected\":\"\"}]},\"receiptKit\":{\"need\":\"\",\"why\":\"\",\"fastestPath\":\"\",\"enough\":\"\",\"artifact\":{\"type\":\"paste|upload|link|draft_message|checklist|compare\",\"config\":{}},\"prediction\":{\"expected\":\"\",\"direction\":\"confirms|contradicts|narrows|surprises\",\"timebound\":\"\",\"surprise\":\"\"}}}",
    "Keep reply in plain language first. Be warm, direct, and calm.",
    "Never dump formal Lœgos language unless it is hidden inside a suggestion field or omitted entirely.",
    "Separate witness from story. Do not upgrade interpretation into evidence.",
    "No silent mutation. You are proposing a mirror draft, not committing it.",
    "Mirror draft rules: 0-1 aim, up to 4 evidence items, up to 4 story items, up to 2 moves.",
    "Receipt Kit rules: at most one receipt kit; set it to null if no kit is needed.",
    "If there is a clear next ping, include it as a move and use a receipt kit that helps reality answer.",
    "If the user reports a return, help classify it by prediction versus actual without sounding bureaucratic.",
  ].join(" ");
}

function buildRoomUserPrompt(message = "", view = null) {
  const mirror = view?.mirror || {};
  const messages = Array.isArray(view?.messages) ? view.messages : [];
  const recentThread = messages
    .slice(-6)
    .map((entry) => {
      const role = String(entry?.role || "").toLowerCase() === "assistant" ? "Seven" : "User";
      return `${role}: ${clipText(entry?.content || "", 240)}`;
    })
    .join("\n");

  return [
    `Box: ${normalizeText(view?.project?.title) || "Untitled Box"}`,
    view?.project?.subtitle ? `Box note: ${normalizeText(view.project.subtitle)}` : "",
    `Field state: ${normalizeText(view?.fieldState?.key) || "new"}`,
    `Aim: ${normalizeText(mirror?.aim?.text) || "none"}`,
    mirror?.aim?.gloss ? `Aim gloss: ${normalizeText(mirror.aim.gloss)}` : "",
    `Witness / Evidence: ${summarizeCollection(
      mirror?.evidence,
      (item) => {
        const title = normalizeText(item?.title);
        const detail = normalizeText(item?.detail);
        return title ? `${title}${detail ? ` (${detail})` : ""}` : "";
      },
      "none",
    )}`,
    `Story: ${summarizeCollection(
      mirror?.story,
      (item) => {
        const text = normalizeText(item?.text);
        const detail = normalizeText(item?.detail);
        return text ? `${text}${detail ? ` (${detail})` : ""}` : "";
      },
      "none",
    )}`,
    `Pings / Moves: ${summarizeCollection(
      mirror?.moves,
      (item) => {
        const text = normalizeText(item?.text);
        const status = normalizeText(item?.status);
        return text ? `${text}${status ? ` [${status}]` : ""}` : "";
      },
      "none",
    )}`,
    `Returns / Receipts: ${summarizeCollection(
      mirror?.returns,
      (item) => {
        const label = normalizeText(item?.label);
        const result = normalizeText(item?.result);
        const actual = normalizeText(item?.actual);
        return label || actual
          ? `${label || actual}${result ? ` [${result}]` : ""}`
          : "";
      },
      "none",
    )}`,
    view?.pendingMove?.text
      ? `Pending outbound ping: ${normalizeText(view.pendingMove.text)}`
      : "",
    Array.isArray(view?.recentSources) && view.recentSources.length
      ? `Recent sources: ${view.recentSources
          .slice(0, 4)
          .map((source) => {
            const title = normalizeText(source?.title);
            const meta = normalizeText(source?.metaLine);
            return title ? `${title}${meta ? ` (${meta})` : ""}` : "";
          })
          .filter(Boolean)
          .join(" | ")}`
      : "Recent sources: none yet",
    recentThread ? `Recent thread:\n${recentThread}` : "",
    `New user turn: ${normalizeLongText(message)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function bindReceiptKitToTurn(turn = null) {
  const normalizedTurn = normalizeRoomTurnResult(turn);
  const receiptKit = normalizeReceiptKit(normalizedTurn.receiptKit);
  if (!receiptKit) return normalizedTurn;

  const moveItems = normalizedTurn.mirrorDraft.moveItems.map((item, index) =>
    index === 0 && !item.receiptKitId
      ? {
          ...item,
          receiptKitId: receiptKit.id,
        }
      : item,
  );

  return normalizeRoomTurnResult({
    ...normalizedTurn,
    mirrorDraft: {
      ...normalizedTurn.mirrorDraft,
      moveItems,
    },
    receiptKit,
  });
}

function buildFallbackTurn(message = "", view = null) {
  const aimCandidate = makeAimCandidate(message);
  const hasAim = Boolean(view?.roomState?.aim?.text || view?.mirror?.aim?.text);
  const hasSources = Array.isArray(view?.recentSources) && view.recentSources.length > 0;
  const wantsCompare = /\b(compare|difference|version|match|actual|predicted)\b/i.test(message);
  const wantsLink = /\bhttps?:\/\//i.test(message);
  const wantsDraft = /\b(email|message|text|call|ask|reach out|follow up|send)\b/i.test(message);
  const moveText = wantsDraft
    ? "Send the smallest direct ping and wait for the first real answer."
    : "Test the next smallest part reality can answer this week.";
  const expected = hasAim
    ? `A return that narrows whether "${view?.roomState?.aim?.text || view?.mirror?.aim?.text}" is holding.`
    : "A return that makes the line more concrete.";

  return bindReceiptKitToTurn({
    reply: hasAim
      ? [
          "Keep the line plain and let the box stay honest about what is witness versus story.",
          "I drafted one small move so the next answer comes from reality instead of more internal debate.",
        ].join(" ")
      : [
          aimCandidate
            ? `I hear a workable line trying to form: "${aimCandidate}".`
            : "There is a real line in this, but it still needs to get smaller and more portable.",
          "I drafted a version you can apply if it feels true, then test with the smallest move reality can answer.",
        ].join(" "),
    mirrorDraft: {
      aimText: hasAim ? "" : aimCandidate,
      aimGloss: hasAim ? "" : "Working line held in plain language.",
      evidenceItems: [],
      storyItems: hasAim
        ? [
            {
              text: clipText(message, 140),
              why: "Working interpretation from the latest turn.",
            },
          ]
        : [],
      moveItems: [
        {
          text: moveText,
          why: "Conversation should hand off to contact with reality.",
          expected,
        },
      ],
    },
    receiptKit: {
      need: wantsDraft ? "Get the ping out and capture the first return." : "Capture the return cleanly.",
      why: wantsDraft
        ? "An outbound move should leave a visible listening state in the room."
        : "The room changes when predicted and actual are held side by side.",
      fastestPath: wantsDraft ? "Draft the message and mark the ping sent." : "Paste or attach what came back.",
      enough: "One concrete return is enough to change the next move.",
      artifact: {
        type: wantsLink ? "link" : wantsDraft ? "draft_message" : wantsCompare ? "compare" : hasSources ? "paste" : "upload",
        config: {},
      },
      prediction: {
        expected,
        direction: "narrows",
        timebound: "This week",
        surprise: "If reality answers in a different direction, mark it directly.",
      },
    },
  });
}

async function persistRoomTurn(userId, projectKey, message, turn, provider) {
  const threadKey = buildRoomThreadKey(projectKey);
  const exchange = await appendConversationExchangeForUser(userId, {
    documentKey: threadKey,
    userLine: message,
    answer: turn.reply,
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

  if (!appEnv.openai.enabled) {
    const fallback = buildFallbackTurn(message, view);
    return NextResponse.json(
      await persistRoomTurn(session.user.id, resolvedProjectKey, message, fallback, "fallback"),
    );
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
            content: [{ type: "input_text", text: buildRoomUserPrompt(message, view) }],
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
      const fallback = buildFallbackTurn(message, view);
      return NextResponse.json(
        await persistRoomTurn(session.user.id, resolvedProjectKey, message, fallback, "fallback"),
      );
    }

    const parsed = parseJsonObject(extractMessageText(payload));
    if (!parsed) {
      const fallback = buildFallbackTurn(message, view);
      return NextResponse.json(
        await persistRoomTurn(session.user.id, resolvedProjectKey, message, fallback, "fallback"),
      );
    }
    const normalizedTurn = bindReceiptKitToTurn(parsed);
    if (!normalizedTurn.reply) {
      const fallback = buildFallbackTurn(message, view);
      return NextResponse.json(
        await persistRoomTurn(session.user.id, resolvedProjectKey, message, fallback, "fallback"),
      );
    }

    return NextResponse.json(
      await persistRoomTurn(session.user.id, resolvedProjectKey, message, normalizedTurn, "openai"),
    );
  } catch (error) {
    console.error("Room turn request crashed.", {
      error: error instanceof Error ? error.message : String(error),
    });
    const fallback = buildFallbackTurn(message, view);
    return NextResponse.json(
      await persistRoomTurn(session.user.id, resolvedProjectKey, message, fallback, "fallback"),
    );
  }
}
