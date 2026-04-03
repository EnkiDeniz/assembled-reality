import { slugify } from "@/lib/text";

const SECTION_HEADER_RE = /^##\s+(\d+)\s+·\s+(.+)$/gm;

function normalizeMarkdown(markdown) {
  return String(markdown || "").replace(/\r\n/g, "\n").trim();
}

function buildToc(sections) {
  return [
    { slug: "beginning", label: "Beginning", title: "Beginning", number: null },
    ...sections.map((section) => ({
      slug: section.slug,
      label: `${section.number} · ${section.title}`,
      title: section.title,
      number: section.number,
    })),
  ];
}

export function parseDocument(markdown, { documentKey } = {}) {
  const normalized = normalizeMarkdown(markdown);
  const firstSectionIndex = normalized.search(/^##\s+\d+\s+·\s+.+$/m);
  const preambleSource =
    firstSectionIndex === -1 ? normalized : normalized.slice(0, firstSectionIndex).trim();
  const titleMatch = preambleSource.match(/^#\s+(.+)$/m);
  const subtitleMatch = preambleSource.match(/^###\s+(.+)$/m);
  const title = titleMatch?.[1]?.trim() || "ASSEMBLED REALITY";
  const subtitle = subtitleMatch?.[1]?.trim() || "";

  const introMarkdown = preambleSource
    .split("\n")
    .filter((line) => !line.startsWith("# ") && !line.startsWith("### "))
    .join("\n")
    .trim();

  const matches = [...normalized.matchAll(SECTION_HEADER_RE)];
  const sections = matches.map((match, index) => {
    const bodyStart = (match.index ?? 0) + match[0].length;
    const bodyEnd = index < matches.length - 1 ? matches[index + 1].index : normalized.length;
    const number = match[1];
    const sectionTitle = match[2].trim();
    return {
      number,
      title: sectionTitle,
      slug: slugify(sectionTitle),
      markdown: normalized.slice(bodyStart, bodyEnd).trim(),
      heading: match[0],
    };
  });

  return {
    documentKey,
    title,
    subtitle,
    introMarkdown,
    sections,
    toc: buildToc(sections),
  };
}

export { buildToc };
