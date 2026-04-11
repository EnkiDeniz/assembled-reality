import { PRODUCT_NAME } from "./product-language.js";
import { describeRoomTurnStyle } from "./room-turn-policy.mjs";

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

export function extractRoomMessageText(payload) {
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

export function parseRoomJsonObject(text = "") {
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

export function parseRoomResponsesPayload(payload = null) {
  const parsed = parseRoomJsonObject(extractRoomMessageText(payload));
  if (!normalizeLongText(parsed?.assistantText || parsed?.reply)) {
    return null;
  }
  return parsed;
}

export function buildRoomSystemPrompt(turnMode = "conversation") {
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
  ]
    .join(" ");
}

export function buildRoomUserPrompt({
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

export function buildRoomPromptPacket(input = {}) {
  return {
    systemPrompt: buildRoomSystemPrompt(input?.turnMode),
    userPrompt: buildRoomUserPrompt(input),
  };
}
