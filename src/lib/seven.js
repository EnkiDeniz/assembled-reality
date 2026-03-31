const SPEECH_CHUNK_LIMIT = 3600;
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
