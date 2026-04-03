import "server-only";

import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import { buildToc, parseDocument } from "@/lib/document-parser";
import { slugify } from "@/lib/text";

export const PRIMARY_DOCUMENT_KEY = "assembled-reality-v07-final";

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

export { parseDocument };

export const getParsedDocument = cache(() => {
  const baseDocument = normalizeMarkdown(readMarkdownFile("content", "assembled_reality_v07_final.md"));
  return applyAuthoritativeAppendices(parseDocument(baseDocument));
});
