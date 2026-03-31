const SPEECH_CHUNK_LIMIT = 3600;

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

export function getSectionOutline(documentData) {
  return (documentData?.sections || [])
    .map((section) => `${section.number}. ${section.title}`)
    .join("\n");
}
