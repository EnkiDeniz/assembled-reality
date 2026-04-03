function stripMarkdownSyntax(markdown) {
  return String(markdown || "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`~>-]/g, " ")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^[-+*]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateText(text, length = 220) {
  const normalized = String(text || "").trim();
  if (normalized.length <= length) return normalized;
  return `${normalized.slice(0, Math.max(0, length - 1)).trim()}…`;
}

function guessBlockKind(markdown) {
  const normalized = String(markdown || "").trim();
  if (!normalized) return "text";
  if (normalized.startsWith("#")) return "heading";
  if (normalized.startsWith(">")) return "quote";
  if (/^[-+*]\s+/.test(normalized) || /^\d+\.\s+/.test(normalized)) return "list";
  return "text";
}

function splitSectionMarkdown(markdown) {
  const chunks = String(markdown || "")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  return chunks.length ? chunks : ["_No content yet._"];
}

export function buildDocumentBlocks(documentData) {
  const sections = Array.isArray(documentData?.sections) ? documentData.sections : [];
  let runningNumber = 0;

  return sections.flatMap((section) =>
    splitSectionMarkdown(section.markdown).map((chunk, index) => {
      runningNumber += 1;
      const plainText = stripMarkdownSyntax(chunk);

      return {
        id: `${section.slug}:${index + 1}`,
        number: runningNumber,
        orderInSection: index + 1,
        sectionSlug: section.slug,
        sectionTitle: section.title,
        sectionLabel: `${section.number} · ${section.title}`,
        kind: guessBlockKind(chunk),
        markdown: chunk,
        plainText,
        preview: truncateText(plainText || chunk, 220),
      };
    }),
  );
}
