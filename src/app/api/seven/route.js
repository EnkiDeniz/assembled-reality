import { NextResponse } from "next/server";
import { appEnv } from "@/lib/env";

export const runtime = "nodejs";

const CHAT_UNAVAILABLE_MESSAGE = "Seven's chat is unavailable right now.";

function buildInstruction(mode) {
  if (mode === "summary") {
    return [
      "Summarize the current section in 4 to 6 short sentences.",
      "Make it easy to follow in the ear.",
      "End with one gentle next question the listener could ask.",
    ].join(" ");
  }

  if (mode === "question") {
    return [
      "Answer the user's question using the current section as the main anchor.",
      "If you need to infer beyond the provided text, say that you are inferring.",
      "Keep the answer under 220 words unless the question truly needs more.",
    ].join(" ");
  }

  return [
    "Explain the current section to a first-time listener in plain language.",
    "Prefer short paragraphs that sound natural when read aloud.",
    "Define abstract terms without getting mystical or evasive.",
    "Keep the answer under 220 words.",
  ].join(" ");
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

export async function POST(request) {
  if (!appEnv.openai.enabled) {
    return NextResponse.json(
      {
        ok: false,
        error: CHAT_UNAVAILABLE_MESSAGE,
      },
      { status: 503 },
    );
  }

  const body = await request.json();
  const {
    mode = "explain",
    question = "",
    documentTitle = "Assembled Reality",
    documentSubtitle = "",
    introMarkdown = "",
    sectionOutline = "",
    currentLabel = "",
    currentSectionTitle = "",
    currentSectionMarkdown = "",
  } = body || {};

  const systemPrompt = [
    "You are Seven, the reading guide inside Assembled Reality.",
    "Your job is to explain the authored document clearly, calmly, and concretely.",
    "Treat the text as a document to interpret, not as unquestionable fact.",
    "Stay close to the provided context and do not invent claims, sections, or authorities.",
    "When the writing is metaphorical, translate it into plain language without mocking it.",
    "Do not use markdown tables.",
    "Prefer language that works both on screen and when spoken aloud.",
  ].join(" ");

  const userPrompt = [
    `Document: ${documentTitle}`,
    documentSubtitle ? `Subtitle: ${documentSubtitle}` : "",
    `Current section: ${currentLabel || currentSectionTitle}`,
    sectionOutline ? `Section outline:\n${sectionOutline}` : "",
    introMarkdown ? `Opening context:\n${introMarkdown}` : "",
    `Current section markdown:\n${currentSectionMarkdown}`,
    `Instruction: ${buildInstruction(mode)}`,
    question ? `User question: ${question}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

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
          content: [{ type: "input_text", text: systemPrompt }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: userPrompt }],
        },
      ],
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    console.error("Seven chat request failed.", {
      status: response.status,
    });
    return NextResponse.json(
      {
        ok: false,
        error: CHAT_UNAVAILABLE_MESSAGE,
      },
      { status: response.status },
    );
  }

  const answer = extractMessageText(payload);
  if (!answer) {
    return NextResponse.json(
      {
        ok: false,
        error: "Seven returned an empty answer.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    answer,
  });
}
