import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import { slugify } from "@/lib/text";

export const PRIMARY_DOCUMENT_KEY = "assembled-reality-v07-final";

const SECTION_HEADER_RE = /^##\s+(\d+)\s+·\s+(.+)$/gm;
const APPENDIX_DOCUMENTS = [
  {
    number: "21",
    title: "Appendix I · Operator Sentences",
    segments: ["docs", "operator-sentences.md"],
  },
  {
    number: "22",
    title: "Appendix II · Convergence Foundations",
    segments: ["docs", "convergence-foundations.md"],
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

function readAppendixBody(appendix) {
  const filePath = path.join(process.cwd(), ...appendix.segments);
  if (!fs.existsSync(filePath)) {
    return "";
  }

  return stripLeadingTitle(readMarkdownFile(...appendix.segments));
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

function applyAuthoritativeAppendices(documentData) {
  const sections = [...(documentData?.sections || [])];

  APPENDIX_DOCUMENTS.forEach((appendix) => {
    const markdown = readAppendixBody(appendix);
    if (!markdown) return;

    const replacement = {
      number: appendix.number,
      title: appendix.title,
      slug: slugify(appendix.title),
      markdown,
      heading: `## ${appendix.number} · ${appendix.title}`,
    };

    const existingIndex = sections.findIndex((section) => section.number === appendix.number);
    if (existingIndex === -1) {
      sections.push(replacement);
      return;
    }

    sections[existingIndex] = replacement;
  });

  sections.sort((left, right) => Number(left.number) - Number(right.number));

  return {
    ...documentData,
    sections,
    toc: buildToc(sections),
  };
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

  return {
    documentKey: PRIMARY_DOCUMENT_KEY,
    title,
    subtitle,
    introMarkdown,
    sections,
    toc: buildToc(sections),
  };
}

export const getParsedDocument = cache(() => {
  const baseDocument = normalizeMarkdown(readMarkdownFile("content", "assembled_reality_v07_final.md"));
  return applyAuthoritativeAppendices(parseDocument(baseDocument));
});
