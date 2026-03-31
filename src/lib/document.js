import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import { slugify } from "@/lib/text";

const SECTION_HEADER_RE = /^##\s+(\d+)\s+·\s+(.+)$/gm;
const APPENDIX_DOCUMENTS = [
  {
    number: "21",
    title: "Appendix · Operator Sentences",
    segments: ["docs", "operator-sentences.md"],
  },
];
function normalizeMarkdown(markdown) {
  return markdown.replace(/\r\n/g, "\n").trim();
}

function readMarkdownFile(...segments) {
  const filePath = path.join(process.cwd(), ...segments);
  return fs.readFileSync(filePath, "utf8");
}

function stripLeadingTitle(markdown) {
  return normalizeMarkdown(markdown).replace(/^#\s+.+\n+/, "").trim();
}

function buildAppendixMarkdown(baseDocument = "") {
  return APPENDIX_DOCUMENTS.flatMap((appendix) => {
    const heading = `## ${appendix.number} · ${appendix.title}`;
    if (baseDocument.includes(heading)) {
      return [];
    }

    const filePath = path.join(process.cwd(), ...appendix.segments);
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const body = stripLeadingTitle(readMarkdownFile(...appendix.segments));
    if (!body) {
      return [];
    }

    return [`${heading}\n\n${body}`];
  }).join("\n\n---\n\n");
}

export function parseDocument(markdown) {
  const normalized = normalizeMarkdown(markdown);
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

export const getParsedDocument = cache(() => {
  const baseDocument = normalizeMarkdown(readMarkdownFile("content", "assembled_reality_v07_final.md"));
  const appendixDocument = buildAppendixMarkdown(baseDocument);
  const raw = [baseDocument, appendixDocument].filter(Boolean).join("\n\n---\n\n");
  return parseDocument(raw);
});
