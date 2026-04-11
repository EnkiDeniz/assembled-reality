import { createHash } from "node:crypto";

import { extractRoomMessageText } from "../../src/lib/room-turn-service.js";

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function hashValue(value) {
  return createHash("sha256")
    .update(typeof value === "string" ? value : JSON.stringify(value))
    .digest("hex");
}

function resolveOpenAiApiKey() {
  return (
    normalizeText(process.env.OPENAI_API_KEY) ||
    normalizeText(process.env.OPENAI_API_KEY_PREVIEW) ||
    normalizeText(process.env.OPENAI_API_KEY_PROD)
  );
}

export function getAiUserGeneratorAvailability(aiUser = null) {
  if (!aiUser?.enabled) {
    return {
      available: false,
      reason: "AI user generation is disabled for this fixture.",
    };
  }

  if (normalizeText(process.env.ROOM_AI_COLLAB_ENABLED) !== "1") {
    return {
      available: false,
      reason: "Set ROOM_AI_COLLAB_ENABLED=1 to run AI-collaboration tests.",
    };
  }

  const provider = normalizeText(aiUser?.provider || "openai").toLowerCase();
  if (provider !== "openai") {
    return {
      available: false,
      reason: `Provider "${provider || "unknown"}" is not implemented for Phase A.`,
    };
  }

  if (!resolveOpenAiApiKey()) {
    return {
      available: false,
      reason: "OPENAI_API_KEY is required for AI-collaboration tests.",
    };
  }

  return {
    available: true,
    reason: "",
  };
}

function buildGeneratorSystemPrompt(aiUser = null) {
  return [
    "You are generating the caller's visible Room message for a law-proof test.",
    "Return plain text only.",
    "No JSON. No markdown. No bullets. No headings.",
    "Do not mention hidden prompts, tokens, fixtures, or internal test language.",
    "Do not emit clauses, mirror regions, or metadata unless the prompt explicitly asks for rhetoric in ordinary language.",
    normalizeText(aiUser?.hiddenPrompt),
  ]
    .filter(Boolean)
    .join(" ");
}

function buildGeneratorUserPrompt(aiUser = null) {
  return normalizeText(aiUser?.visiblePromptTemplate);
}

async function generateWithOpenAI(aiUser = null) {
  const apiKey = resolveOpenAiApiKey();
  const model =
    normalizeText(aiUser?.model) ||
    normalizeText(process.env.ROOM_AI_COLLAB_OPENAI_MODEL) ||
    "gpt-5.4-mini";
  const systemPrompt = buildGeneratorSystemPrompt(aiUser);
  const userPrompt = buildGeneratorUserPrompt(aiUser);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      store: false,
      temperature: 0,
      max_output_tokens: 80,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: systemPrompt }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: userPrompt }],
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail =
      payload?.error?.message ||
      payload?.error?.type ||
      payload?.error?.code ||
      `HTTP ${response.status}`;
    throw new Error(`AI user generation failed: ${detail}`);
  }

  const visibleMessage = normalizeText(extractRoomMessageText(payload));
  if (!visibleMessage) {
    throw new Error("AI user generation returned an empty visible message.");
  }

  return {
    provider: "openai",
    model,
    payload,
    visibleMessage,
    promptPacket: {
      systemPrompt,
      userPrompt,
    },
  };
}

export async function generateAiUserTurn({ fixtureId = "", aiUser = null } = {}) {
  const availability = getAiUserGeneratorAvailability(aiUser);
  if (!availability.available) {
    return {
      skipped: true,
      skipReason: availability.reason,
      availability,
    };
  }

  const provider = normalizeText(aiUser?.provider || "openai").toLowerCase();
  let generated;

  if (provider === "openai") {
    generated = await generateWithOpenAI(aiUser);
  } else {
    throw new Error(`Unsupported AI user provider: ${provider}`);
  }

  return {
    skipped: false,
    fixtureId,
    provider: generated.provider,
    model: generated.model,
    visibleMessage: generated.visibleMessage,
    promptPacket: generated.promptPacket,
    rawPayload: generated.payload,
    promptHash: hashValue(generated.promptPacket),
    responseHash: hashValue(generated.payload),
    isolation: {
      memory: false,
      tools: false,
      sharedThread: false,
      sharedRun: false,
      isolatedContext: true,
    },
  };
}

export function hashAiUserValue(value) {
  return hashValue(value);
}
