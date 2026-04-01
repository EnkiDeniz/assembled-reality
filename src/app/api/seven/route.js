import { NextResponse } from "next/server";
import { getParsedDocument, PRIMARY_DOCUMENT_KEY } from "@/lib/document";
import { appEnv } from "@/lib/env";
import { appendConversationExchangeForUser } from "@/lib/reader-workspace";
import {
  buildSevenCitations,
  buildRelevantSectionsContext,
  buildSevenIssueMessage,
  getReaderSection,
  getSectionOutline,
  getSevenReasonCode,
  getSevenRetryAfterSeconds,
} from "@/lib/seven";
import { getRequiredSession } from "@/lib/server-session";

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
      "Bring in other relevant parts of the document when they help answer the question.",
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
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!appEnv.openai.enabled) {
    return NextResponse.json(
      {
        ok: false,
        error: CHAT_UNAVAILABLE_MESSAGE,
        provider: "openai",
        reasonCode: "provider_unavailable",
        retryable: false,
      },
      { status: 503 },
    );
  }

  const body = await request.json();
  const {
    mode = "explain",
    question = "",
    documentKey = PRIMARY_DOCUMENT_KEY,
    activeSlug = "",
    documentTitle = "Assembled Reality",
    documentSubtitle = "",
    introMarkdown = "",
    sectionOutline = "",
    currentLabel = "",
    currentSectionTitle = "",
    currentSectionMarkdown = "",
  } = body || {};

  let resolvedDocumentTitle = documentTitle;
  let resolvedDocumentSubtitle = documentSubtitle;
  let resolvedIntroMarkdown = introMarkdown;
  let resolvedSectionOutline = sectionOutline;
  let resolvedCurrentLabel = currentLabel;
  let resolvedCurrentSectionTitle = currentSectionTitle;
  let resolvedCurrentSectionMarkdown = currentSectionMarkdown;
  let relevantSectionsContext = "";
  let citations = [];
  let resolvedDocumentKey = documentKey || PRIMARY_DOCUMENT_KEY;

  if (activeSlug) {
    const documentData = getParsedDocument();
    const currentSection = getReaderSection(documentData, activeSlug);

    resolvedDocumentKey = documentData?.documentKey || resolvedDocumentKey;
    resolvedDocumentTitle = documentData?.title || resolvedDocumentTitle;
    resolvedDocumentSubtitle = documentData?.subtitle || resolvedDocumentSubtitle;
    resolvedIntroMarkdown = documentData?.introMarkdown || resolvedIntroMarkdown;
    resolvedSectionOutline = getSectionOutline(documentData) || resolvedSectionOutline;
    resolvedCurrentLabel = currentSection.label || resolvedCurrentLabel;
    resolvedCurrentSectionTitle = currentSection.title || resolvedCurrentSectionTitle;
    resolvedCurrentSectionMarkdown = currentSection.markdown || resolvedCurrentSectionMarkdown;
    citations = buildSevenCitations({
      documentData,
      activeSlug,
      mode,
      question,
    });

    if (mode === "question" && question.trim()) {
      relevantSectionsContext = buildRelevantSectionsContext({
        documentData,
        activeSlug,
        question,
      });
    }
  }

  const systemPrompt = [
    "You are Seven, the reading guide inside Assembled Reality.",
    "Your job is to explain the authored document clearly, calmly, and concretely.",
    "Treat the text as a document to interpret, not as unquestionable fact.",
    "Stay close to the provided context and do not invent claims, sections, or authorities.",
    "When relevant context from elsewhere in the manuscript is provided, use it explicitly rather than guessing.",
    "When the writing is metaphorical, translate it into plain language without mocking it.",
    "Do not use markdown tables.",
    "Prefer language that works both on screen and when spoken aloud.",
  ].join(" ");

  const userPrompt = [
    `Document: ${resolvedDocumentTitle}`,
    resolvedDocumentSubtitle ? `Subtitle: ${resolvedDocumentSubtitle}` : "",
    `Current section: ${resolvedCurrentLabel || resolvedCurrentSectionTitle}`,
    resolvedSectionOutline ? `Section outline:\n${resolvedSectionOutline}` : "",
    resolvedIntroMarkdown ? `Opening context:\n${resolvedIntroMarkdown}` : "",
    `Current section markdown:\n${resolvedCurrentSectionMarkdown}`,
    relevantSectionsContext
      ? `Relevant sections from elsewhere in the document:\n${relevantSectionsContext}`
      : "",
    `Instruction: ${buildInstruction(mode)}`,
    question ? `User question: ${question}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

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
      const providerDetail =
        payload?.error?.message || payload?.error?.code || payload?.error?.type || "";
      const reasonCode = getSevenReasonCode({
        status: response.status,
        detail: providerDetail,
        code: payload?.error?.code,
        type: payload?.error?.type,
      });
      const retryAfterSeconds = getSevenRetryAfterSeconds(response.headers);
      const retryable =
        reasonCode === "rate_limited" || reasonCode === "provider_unavailable";

      console.error("Seven chat request failed.", {
        provider: "openai",
        status: response.status,
        reasonCode,
        retryAfterSeconds: retryAfterSeconds || undefined,
        detail: providerDetail || undefined,
      });

      return NextResponse.json(
        {
          ok: false,
          error: buildSevenIssueMessage({
            feature: "chat",
            provider: "openai",
            reasonCode,
            retryAfterSeconds,
          }),
          provider: "openai",
          reasonCode,
          retryable,
          retryAfterSeconds,
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
          provider: "openai",
          reasonCode: "empty_response",
          retryable: false,
        },
        { status: 502 },
      );
    }

    const exchange = await appendConversationExchangeForUser(session.user.id, {
      documentKey: resolvedDocumentKey,
      userLine: question || buildInstruction(mode),
      answer,
      citations,
    });

    return NextResponse.json({
      ok: true,
      answer,
      citations,
      threadId: exchange?.threadId || null,
      userMessageId: exchange?.userMessage?.id || null,
      messageId: exchange?.assistantMessage?.id || null,
      provider: "openai",
    });
  } catch (error) {
    console.error("Seven chat request crashed.", {
      provider: "openai",
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        ok: false,
        error: buildSevenIssueMessage({
          feature: "chat",
          provider: "openai",
          reasonCode: "provider_unavailable",
        }),
        provider: "openai",
        reasonCode: "provider_unavailable",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
