const SPEECH_CHUNK_LIMIT = 3600;
const SEARCH_STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "all",
  "also",
  "and",
  "any",
  "are",
  "because",
  "been",
  "before",
  "being",
  "between",
  "both",
  "but",
  "can",
  "could",
  "does",
  "doing",
  "down",
  "each",
  "even",
  "from",
  "had",
  "has",
  "have",
  "here",
  "into",
  "just",
  "more",
  "most",
  "much",
  "must",
  "only",
  "other",
  "ought",
  "over",
  "same",
  "should",
  "some",
  "such",
  "than",
  "that",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "through",
  "under",
  "until",
  "very",
  "what",
  "when",
  "where",
  "which",
  "while",
  "with",
  "would",
  "your",
]);
const SEVEN_PROVIDER_LABELS = {
  openai: "OpenAI",
  elevenlabs: "ElevenLabs",
  device: "Device voice",
};

export function getSevenProviderLabel(provider) {
  return SEVEN_PROVIDER_LABELS[provider] || "Provider";
}

export function getSevenRetryAfterSeconds(headersLike) {
  const raw =
    typeof headersLike?.get === "function"
      ? headersLike.get("retry-after")
      : headersLike?.["retry-after"] || headersLike?.retryAfter;
  if (!raw) return null;

  const numeric = Number(raw);
  if (Number.isFinite(numeric) && numeric >= 0) {
    return Math.round(numeric);
  }

  const dateValue = Date.parse(String(raw));
  if (Number.isNaN(dateValue)) {
    return null;
  }

  const seconds = Math.round((dateValue - Date.now()) / 1000);
  return seconds > 0 ? seconds : null;
}

export function getSevenReasonCode({ status = 0, detail = "", code = "", type = "" } = {}) {
  const normalized = [detail, code, type]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    normalized.includes("quota") ||
    normalized.includes("insufficient_quota") ||
    normalized.includes("credit balance") ||
    normalized.includes("billing")
  ) {
    return "quota_exceeded";
  }

  if (status === 429 || normalized.includes("rate limit")) {
    return "rate_limited";
  }

  if (status === 401 || status === 403 || normalized.includes("unauthorized")) {
    return "auth_failed";
  }

  if (status >= 500 || normalized.includes("temporarily unavailable")) {
    return "provider_unavailable";
  }

  return "unknown_error";
}

export function buildSevenIssueMessage({
  feature = "chat",
  provider = "",
  reasonCode = "unknown_error",
  retryAfterSeconds = null,
} = {}) {
  const providerLabel = getSevenProviderLabel(provider);
  const featureLabel = feature === "voice" ? "voice" : "chat";

  if (reasonCode === "rate_limited") {
    return retryAfterSeconds
      ? `Seven's ${featureLabel} is rate limited right now. Try again in about ${retryAfterSeconds} seconds.`
      : `Seven's ${featureLabel} is rate limited right now. Try again shortly.`;
  }

  if (reasonCode === "quota_exceeded") {
    return `Seven's ${providerLabel} ${featureLabel} is unavailable because the provider quota is exhausted.`;
  }

  if (reasonCode === "auth_failed") {
    return `Seven's ${providerLabel} ${featureLabel} is unavailable because the provider credentials were rejected.`;
  }

  if (reasonCode === "provider_unavailable") {
    return `Seven's ${providerLabel} ${featureLabel} is unavailable right now because the provider is not responding.`;
  }

  return `Seven's ${featureLabel} is unavailable right now.`;
}

export function buildSevenFallbackMessage({
  fallbackTo = "device",
  fallbackFrom = "",
  reasonCode = "unknown_error",
} = {}) {
  const fallbackLabel =
    fallbackTo === "device" ? "your device voice" : getSevenProviderLabel(fallbackTo);
  const sourceLabel = fallbackFrom ? getSevenProviderLabel(fallbackFrom) : "provider audio";

  if (reasonCode === "quota_exceeded") {
    return `Seven switched to ${fallbackLabel} because ${sourceLabel} ran out of quota.`;
  }

  if (reasonCode === "rate_limited") {
    return `Seven switched to ${fallbackLabel} because ${sourceLabel} is rate limited.`;
  }

  if (reasonCode === "auth_failed") {
    return `Seven switched to ${fallbackLabel} because ${sourceLabel} rejected the request.`;
  }

  return `Seven switched to ${fallbackLabel} because provider audio is unavailable right now.`;
}

export function parseSevenAudioHeaders(headers) {
  if (!headers || typeof headers.get !== "function") {
    return {
      provider: null,
      fallbackFrom: null,
      fallbackReasonCode: "",
    };
  }

  return {
    provider: headers.get("x-seven-provider") || null,
    fallbackFrom: headers.get("x-seven-fallback-from") || null,
    fallbackReasonCode: headers.get("x-seven-fallback-reason-code") || "",
  };
}

export function stripMarkdownForSpeech(markdown) {
  return String(markdown || "")
    .replace(/\r\n/g, "\n")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/^\|[-: ]+\|?$/gm, "")
    .replace(/^\|\s*/gm, "")
    .replace(/\s*\|\s*/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitLongParagraph(paragraph, limit) {
  const sentences = paragraph.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length <= 1) {
    const chunks = [];
    let cursor = 0;
    while (cursor < paragraph.length) {
      chunks.push(paragraph.slice(cursor, cursor + limit).trim());
      cursor += limit;
    }
    return chunks.filter(Boolean);
  }

  const chunks = [];
  let current = "";

  sentences.forEach((sentence) => {
    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length <= limit) {
      current = next;
      return;
    }

    if (current) {
      chunks.push(current);
    }

    if (sentence.length <= limit) {
      current = sentence;
      return;
    }

    splitLongParagraph(sentence, limit).forEach((chunk) => chunks.push(chunk));
    current = "";
  });

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

export function splitTextForSpeech(text, limit = SPEECH_CHUNK_LIMIT) {
  const normalized = String(text || "").replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const chunks = [];
  let current = "";

  paragraphs.forEach((paragraph) => {
    if (paragraph.length > limit) {
      if (current) {
        chunks.push(current);
        current = "";
      }

      splitLongParagraph(paragraph, limit).forEach((chunk) => chunks.push(chunk));
      return;
    }

    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (next.length <= limit) {
      current = next;
      return;
    }

    if (current) {
      chunks.push(current);
    }

    current = paragraph;
  });

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

export function getReaderSection(documentData, activeSlug) {
  if (activeSlug === "beginning") {
    return {
      slug: "beginning",
      number: "0",
      title: "Beginning",
      label: "Beginning",
      markdown: documentData?.introMarkdown || "",
    };
  }

  const section = documentData?.sections?.find((entry) => entry.slug === activeSlug);
  if (!section) {
    return {
      slug: activeSlug,
      number: "",
      title: activeSlug,
      label: activeSlug,
      markdown: "",
    };
  }

  return {
    slug: section.slug,
    number: section.number,
    title: section.title,
    label: `${section.number} · ${section.title}`,
    markdown: section.markdown,
  };
}

export function getNarrationText(documentData, activeSlug) {
  const section = getReaderSection(documentData, activeSlug);
  const heading = section.slug === "beginning" ? documentData?.title || section.title : section.label;
  const subtitle =
    section.slug === "beginning" && documentData?.subtitle ? `${documentData.subtitle}\n\n` : "";
  const body = stripMarkdownForSpeech(section.markdown);
  return [heading, subtitle.trim(), body].filter(Boolean).join("\n\n").trim();
}

export function getSectionPreview(documentData, activeSlug) {
  const section = getReaderSection(documentData, activeSlug);
  const paragraphs = String(section.markdown || "")
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => {
      const raw = paragraph.trim();
      return {
        raw,
        clean: stripMarkdownForSpeech(raw)
          .replace(/\s+/g, " ")
          .replace(/[-]{3,}/g, " ")
          .trim(),
      };
    })
    .filter(({ raw, clean }) => {
      if (!clean || clean.length <= 36) return false;
      if (/\|/.test(raw)) return false;
      if (/^[-:\s|]+$/m.test(raw)) return false;
      return true;
    })
    .map(({ clean }) => clean);

  return (
    paragraphs[0] ||
    stripMarkdownForSpeech(section.markdown)
      .replace(/\s+/g, " ")
      .trim()
  );
}

export function getSectionOutline(documentData) {
  return (documentData?.sections || [])
    .map((section) => `${section.number}. ${section.title}`)
    .join("\n");
}

export function getConversationStarters(sectionTitle, sectionNumber) {
  if (!sectionTitle || sectionTitle === "Beginning") {
    return [
      "What is this document about?",
      "What are the main arguments?",
      "Summarize the key ideas.",
      "What should I pay attention to?",
    ];
  }

  const short = sectionTitle.length > 40 ? "this section" : `"${sectionTitle}"`;

  return [
    `What is the main argument of ${short}?`,
    `How does section ${sectionNumber} connect to the larger thesis?`,
    `What evidence supports the claims here?`,
    `Summarize the key takeaways from ${short}.`,
  ];
}

function normalizeSearchText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\r\n/g, "\n")
    .replace(/[`*_>#~[\]()|]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeSearchText(text) {
  const normalized = normalizeSearchText(text);
  if (!normalized) return [];

  return [...new Set(normalized.split(" "))].filter(
    (token) => token.length > 2 && !SEARCH_STOP_WORDS.has(token),
  );
}

function countTokenMatches(text, tokens) {
  if (!tokens.length) return 0;

  const normalized = normalizeSearchText(text);
  if (!normalized) return 0;

  return tokens.reduce((count, token) => count + (normalized.includes(token) ? 1 : 0), 0);
}

function splitMarkdownIntoPassages(markdown, maxLength = 680) {
  const paragraphs = String(markdown || "")
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return [];
  }

  const passages = [];
  let current = "";

  paragraphs.forEach((paragraph) => {
    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (next.length <= maxLength) {
      current = next;
      return;
    }

    if (current) {
      passages.push(current);
    }

    if (paragraph.length <= maxLength) {
      current = paragraph;
      return;
    }

    for (let cursor = 0; cursor < paragraph.length; cursor += maxLength) {
      passages.push(paragraph.slice(cursor, cursor + maxLength).trim());
    }
    current = "";
  });

  if (current) {
    passages.push(current);
  }

  return passages;
}

function trimExcerpt(text, maxLength = 960) {
  const normalized = String(text || "").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}…`;
}

function buildSectionExcerpt(section, tokens) {
  const passages = splitMarkdownIntoPassages(section.markdown);
  if (passages.length === 0) {
    return "";
  }

  const scored = passages.map((passage, index) => ({
    index,
    passage,
    score: countTokenMatches(passage, tokens) + (index === 0 ? 0.35 : 0),
  }));

  const selected = (
    scored.some((entry) => entry.score > 0)
      ? [...scored].sort((left, right) => right.score - left.score || left.index - right.index)
      : scored
  )
    .slice(0, 2)
    .sort((left, right) => left.index - right.index)
    .map((entry) => entry.passage)
    .join("\n\n");

  return trimExcerpt(selected);
}

function isBackwardLookingQuestion(normalizedQuestion) {
  return (
    normalizedQuestion.includes("before") ||
    normalizedQuestion.includes("earlier") ||
    normalizedQuestion.includes("previous") ||
    normalizedQuestion.includes("came before")
  );
}

function isForwardLookingQuestion(normalizedQuestion) {
  return (
    normalizedQuestion.includes("after") ||
    normalizedQuestion.includes("later") ||
    normalizedQuestion.includes("ahead") ||
    normalizedQuestion.includes("comes next")
  );
}

function scoreSectionForQuestion({
  section,
  tokens,
  normalizedQuestion,
  activeSlug,
  sectionIndex,
  activeIndex,
}) {
  const titleMatches = countTokenMatches(section.title, tokens);
  const labelMatches = countTokenMatches(section.label, tokens);
  const bodyMatches = countTokenMatches(section.markdown, tokens);

  let score = titleMatches * 8 + labelMatches * 5 + bodyMatches * 2;

  if (section.slug === activeSlug) {
    score += 10;
  }

  if (normalizedQuestion.includes("appendix") && /appendix/i.test(section.title)) {
    score += 8;
  }

  if (activeIndex >= 0) {
    const distance = Math.abs(sectionIndex - activeIndex);
    if (distance > 0) {
      score += Math.max(0, 2.5 - distance * 0.25);
    }

    if (isBackwardLookingQuestion(normalizedQuestion) && sectionIndex < activeIndex) {
      score += 4;
    }

    if (isForwardLookingQuestion(normalizedQuestion) && sectionIndex > activeIndex) {
      score += 4;
    }
  }

  return score;
}

export function getDocumentSections(documentData) {
  return [
    {
      slug: "beginning",
      number: "0",
      title: "Beginning",
      label: "Beginning",
      markdown: documentData?.introMarkdown || "",
    },
    ...(documentData?.sections || []).map((section) => ({
      slug: section.slug,
      number: section.number,
      title: section.title,
      label: `${section.number} · ${section.title}`,
      markdown: section.markdown,
    })),
  ].filter((section) => section.markdown);
}

export function getRelevantSectionsForQuestion({
  documentData,
  activeSlug,
  question = "",
  maxSections = 4,
} = {}) {
  const tokens = tokenizeSearchText(question);
  const normalizedQuestion = normalizeSearchText(question);
  const sections = getDocumentSections(documentData);
  const activeIndex = sections.findIndex((section) => section.slug === activeSlug);

  return sections
    .map((section, sectionIndex) => ({
      ...section,
      score: scoreSectionForQuestion({
        section,
        tokens,
        normalizedQuestion,
        activeSlug,
        sectionIndex,
        activeIndex,
      }),
      excerpt: buildSectionExcerpt(section, tokens),
    }))
    .filter((section) => section.slug !== activeSlug)
    .filter((section) => section.score > 0 && section.excerpt)
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label))
    .slice(0, maxSections);
}

export function buildRelevantSectionsContext(options) {
  const sections = getRelevantSectionsForQuestion(options);
  if (sections.length === 0) {
    return "";
  }

  return sections
    .map((section) => [`${section.label}`, section.excerpt].filter(Boolean).join("\n"))
    .join("\n\n---\n\n");
}

export function buildSevenCitations({
  documentData,
  activeSlug,
  mode = "question",
  question = "",
  maxCitations = 3,
} = {}) {
  const sections = [];
  const currentSection = getReaderSection(documentData, activeSlug);
  const tokens = tokenizeSearchText(question);
  const currentExcerpt = buildSectionExcerpt(currentSection, tokens);

  if (currentExcerpt) {
    sections.push({
      id: `${currentSection.slug}-current`,
      sectionSlug: currentSection.slug,
      sectionTitle: currentSection.title,
      sectionLabel: currentSection.label,
      excerpt: currentExcerpt,
      reason: "current_section",
    });
  }

  if (mode === "question" && question.trim()) {
    getRelevantSectionsForQuestion({
      documentData,
      activeSlug,
      question,
      maxSections: Math.max(0, maxCitations - sections.length),
    }).forEach((section, index) => {
      sections.push({
        id: `${section.slug}-${index + 1}`,
        sectionSlug: section.slug,
        sectionTitle: section.title,
        sectionLabel: section.label,
        excerpt: section.excerpt,
        reason: "related_section",
      });
    });
  }

  return sections.slice(0, maxCitations);
}
