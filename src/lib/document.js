import rawDocument from "../../content/assembled_reality_v07_final.md?raw";

const SECTION_HEADER_RE = /^##\s+(\d+)\s+·\s+(.+)$/gm;

export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/['".,]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseDocument(markdown) {
  const normalized = markdown.replace(/\r\n/g, "\n").trim();
  const titleMatch = normalized.match(/^#\s+(.+)$/m);
  const subtitleMatch = normalized.match(/^###\s+(.+)$/m);
  const title = titleMatch?.[1]?.trim() || "ASSEMBLED REALITY";
  const subtitle = subtitleMatch?.[1]?.trim() || "";

  const firstSectionIndex = normalized.search(/^##\s+\d+\s+·\s+.+$/m);
  const introSource = firstSectionIndex === -1 ? normalized : normalized.slice(0, firstSectionIndex).trim();
  const introMarkdown = introSource
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

  const toc = [
    { slug: "beginning", label: "Beginning", title: "Beginning", number: null },
    ...sections.map((section) => ({
      slug: section.slug,
      label: `${section.number} · ${section.title}`,
      title: section.title,
      number: section.number,
    })),
  ];

  return {
    title,
    subtitle,
    introMarkdown,
    sections,
    toc,
  };
}

export const parsedDocument = parseDocument(rawDocument);
