import { NextResponse } from "next/server";
import { PRIMARY_DOCUMENT_KEY } from "@/lib/document";
import { appEnv } from "@/lib/env";
import { PRODUCT_NAME } from "@/lib/product-language";
import { getReaderDocumentDataForUser } from "@/lib/reader-documents";
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

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function buildOperatingPrinciple(surface = "", explicitPrinciple = "") {
  const normalizedExplicit = String(explicitPrinciple || "").trim();
  if (normalizedExplicit) return normalizedExplicit;

  const normalizedSurface = String(surface || "").trim().toLowerCase();
  if (normalizedSurface === "listen" || normalizedSurface === "think") {
    return "Presence precedes interpretation. Stay with the source, let evidence lead, and keep the listener close to what is actually there.";
  }
  if (normalizedSurface === "seed") {
    return "Aim chooses and action proves. Help the user tighten the line, release what does not belong, and keep the next move concrete.";
  }
  if (normalizedSurface === "operate") {
    return "Read for pattern under constraint. Distinguish signal from noise, name the gradient honestly, and avoid inflating weak evidence.";
  }
  if (normalizedSurface === "receipts") {
    return "Seal is where claim meets evidence and witnesses. Audit for proof, drift, and portability without shaming uncertainty.";
  }
  if (normalizedSurface === "root") {
    return "Presence precedes aim. Help the user compress the declared line until it is portable, concrete, and small enough to build from.";
  }

  return "";
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

function buildInstrumentSystemPrompt(intent = "") {
  const normalizedIntent = normalizeText(intent).toLowerCase();

  if (normalizedIntent === "root-compress" || normalizedIntent === "root-rewrite") {
    return [
      `You are Seven, the Root shaper inside ${PRODUCT_NAME}.`,
      "Help compress or rewrite a box Root without changing its intent.",
      "Return strict JSON only.",
      "Use this shape: {\"summary\":\"...\",\"candidates\":[{\"rootText\":\"...\",\"gloss\":\"...\",\"rationale\":\"...\"}]}",
      "Return 2 or 3 candidates.",
      "Every rootText must be seven words or fewer.",
      "Keep the language operational, portable, and concrete.",
      "Do not include markdown fences.",
    ].join(" ");
  }

  return [
    `You are Seven, the reality interpreter inside ${PRODUCT_NAME}.`,
    "Name the current reality state, explain the pressure honestly, and give the smallest concrete next move.",
    "Stay factual, brief, and oriented toward action.",
  ].join(" ");
}

function buildInstrumentUserPrompt(intent = "", context = {}) {
  const normalizedIntent = normalizeText(intent).toLowerCase();

  if (normalizedIntent === "root-compress" || normalizedIntent === "root-rewrite") {
    return [
      `Intent: ${normalizedIntent}`,
      `Current Root: ${normalizeText(context?.rootText) || "(missing)"}`,
      `Current gloss: ${normalizeText(context?.rootGloss) || "(missing)"}`,
      `Suggested domains: ${(Array.isArray(context?.suggestedDomains) ? context.suggestedDomains : []).join(", ") || "(none)"}`,
      `Applicable domains: ${(Array.isArray(context?.applicableDomains) ? context.applicableDomains : []).join(", ") || "(none)"}`,
      "Keep the declared aim intact while making the Root smaller and more buildable.",
    ].join("\n\n");
  }

  return [
    `Intent: ${normalizedIntent || "warning-interpret"}`,
    `Reality state: ${normalizeText(context?.summary || context?.warning || context?.errorMessage || context?.conflictMessage) || "(unspecified)"}`,
    context?.documentTitle ? `Document: ${normalizeText(context.documentTitle)}` : "",
    context?.draftTitle ? `Receipt draft: ${normalizeText(context.draftTitle)}` : "",
    Array.isArray(context?.checks) && context.checks.length
      ? `Checks:\n${context.checks.map((check) => `- ${normalizeText(check?.label)}: ${normalizeText(check?.message)}`).join("\n")}`
      : "",
    "Interpret the pressure and name the smallest honest move.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function normalizeInstrumentResult(intent = "", rawResult = null) {
  const normalizedIntent = normalizeText(intent).toLowerCase();
  if (!rawResult || typeof rawResult !== "object") return null;

  if (normalizedIntent === "root-compress" || normalizedIntent === "root-rewrite") {
    const candidates = (Array.isArray(rawResult.candidates) ? rawResult.candidates : [])
      .map((candidate) => ({
        rootText: normalizeText(candidate?.rootText),
        gloss: normalizeText(candidate?.gloss),
        rationale: normalizeText(candidate?.rationale),
      }))
      .filter((candidate) => candidate.rootText)
      .slice(0, 3);

    if (!candidates.length) return null;

    return {
      summary: normalizeText(rawResult.summary),
      candidates,
    };
  }

  return null;
}

function formatInstrumentAnswer(intent = "", instrumentResult = null, fallbackAnswer = "") {
  const normalizedIntent = normalizeText(intent).toLowerCase();
  if (!instrumentResult) return normalizeText(fallbackAnswer);

  if (normalizedIntent === "root-compress" || normalizedIntent === "root-rewrite") {
    return [
      instrumentResult.summary || "Seven found a smaller Root shape.",
      ...instrumentResult.candidates.map(
        (candidate, index) =>
          `${index + 1}. ${candidate.rootText}${candidate.gloss ? ` — ${candidate.gloss}` : ""}`,
      ),
    ]
      .filter(Boolean)
      .join("\n");
  }

  return normalizeText(fallbackAnswer);
}

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
    documentTitle = "Current document",
    documentSubtitle = "",
    introMarkdown = "",
    sectionOutline = "",
    currentLabel = "",
    currentSectionTitle = "",
    currentSectionMarkdown = "",
    surface = "",
    operatingPrinciple = "",
    instrumentIntent = "",
    instrumentContext = null,
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
    const documentData = await getReaderDocumentDataForUser(session.user.id, resolvedDocumentKey);
    if (!documentData) {
      return NextResponse.json(
        {
          ok: false,
          error: "Document not found.",
          provider: "openai",
          reasonCode: "document_not_found",
          retryable: false,
        },
        { status: 404 },
      );
    }

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

  const resolvedOperatingPrinciple = buildOperatingPrinciple(surface, operatingPrinciple);
  const normalizedInstrumentIntent = normalizeText(instrumentIntent).toLowerCase();
  const isInstrumentRequest = Boolean(normalizedInstrumentIntent);
  const systemPrompt = isInstrumentRequest
    ? [
        buildInstrumentSystemPrompt(normalizedInstrumentIntent),
        resolvedOperatingPrinciple
          ? `Operating principle for this surface: ${resolvedOperatingPrinciple}`
          : "",
      ]
        .filter(Boolean)
        .join(" ")
    : [
        `You are Seven, the reading guide inside ${PRODUCT_NAME}.`,
        "Your job is to explain the authored document clearly, calmly, and concretely.",
        "Treat the text as a document to interpret, not as unquestionable fact.",
        "Stay close to the provided context and do not invent claims, sections, or authorities.",
        "When relevant context from elsewhere in the manuscript is provided, use it explicitly rather than guessing.",
        "When the writing is metaphorical, translate it into plain language without mocking it.",
        "Do not use markdown tables.",
        "Prefer language that works both on screen and when spoken aloud.",
        resolvedOperatingPrinciple
          ? `Operating principle for this surface: ${resolvedOperatingPrinciple}`
          : "",
      ].join(" ");

  const userPrompt = isInstrumentRequest
    ? buildInstrumentUserPrompt(normalizedInstrumentIntent, instrumentContext || {})
    : [
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

    const rawAnswer = extractMessageText(payload);
    const instrumentResult = normalizeInstrumentResult(
      normalizedInstrumentIntent,
      isInstrumentRequest ? parseJsonObject(rawAnswer) : null,
    );
    const answer = formatInstrumentAnswer(
      normalizedInstrumentIntent,
      instrumentResult,
      rawAnswer,
    );
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
      instrumentResult,
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
