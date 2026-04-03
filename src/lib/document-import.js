import "server-only";

import {
  buildWorkspaceMarkdown,
  normalizeWorkspaceBlockKind,
  normalizeWorkspaceBlocks,
  stripMarkdownSyntax,
} from "@/lib/document-blocks";
import { buildExcerpt } from "@/lib/text";

export const MAX_DOCUMENT_UPLOAD_BYTES = 15 * 1024 * 1024;
export const MAX_CLIPBOARD_PASTE_BYTES = 1024 * 1024;

const PDF_LOW_TEXT_WORD_THRESHOLD = 40;
const REPEATED_ARTIFACT_MIN_OCCURRENCES = 3;
const REPEATED_ARTIFACT_MAX_WORDS = 10;
const REPEATED_ARTIFACT_MAX_LENGTH = 80;

const SUPPORTED_FORMATS = new Map([
  [".md", "markdown"],
  [".markdown", "markdown"],
  [".txt", "markdown"],
  [".doc", "doc"],
  [".docx", "docx"],
  [".pdf", "pdf"],
]);

const MARKDOWN_HEADING_RE = /^(#{1,6})\s+(.+?)\s*$/;
const ZERO_WIDTH_RE = /[\u00ad\u200b-\u200d\u2060\ufeff]/gi;
const NON_BREAKING_SPACE_RE = /\u00a0/g;
const SYMBOL_BULLET_RE = /^([>\s]*)[•◦▪▫▸▹►▻◉○●◆◇■□✦✧✱➜➤→]\s+/;
const DASH_BULLET_RE = /^([>\s]*)[–—]\s+/;
const PAGE_NUMBER_LINE_RE = /^(?:page\s+)?\d+(?:\s*(?:\/|of)\s*\d+)?$/i;
const MARKDOWN_ESCAPE_RE = /\\(\\|`|\*|_|{|}|\[|\]|\(|\)|#|\+|-|!|\.|>)/g;

function createPolishStats() {
  return {
    decorativeLinesRemoved: 0,
    pageLinesRemoved: 0,
    bulletLinesNormalized: 0,
    repeatedParagraphsRemoved: 0,
    markdownEscapesRemoved: 0,
    blocksRemoved: 0,
  };
}

function hasPolishChanges(stats = {}) {
  return Object.values(stats).some((value) => Number(value) > 0);
}

function summarizePolishStats(stats = {}, label = "Basic polish") {
  const parts = [];

  if (stats.decorativeLinesRemoved) {
    parts.push(
      `${stats.decorativeLinesRemoved} decorative line${stats.decorativeLinesRemoved === 1 ? "" : "s"}`,
    );
  }

  if (stats.pageLinesRemoved) {
    parts.push(
      `${stats.pageLinesRemoved} page marker${stats.pageLinesRemoved === 1 ? "" : "s"}`,
    );
  }

  if (stats.bulletLinesNormalized) {
    parts.push(
      `${stats.bulletLinesNormalized} list marker${stats.bulletLinesNormalized === 1 ? "" : "s"}`,
    );
  }

  if (stats.repeatedParagraphsRemoved) {
    parts.push(
      `${stats.repeatedParagraphsRemoved} repeated artifact paragraph${
        stats.repeatedParagraphsRemoved === 1 ? "" : "s"
      }`,
    );
  }

  if (stats.markdownEscapesRemoved) {
    parts.push(
      `${stats.markdownEscapesRemoved} escaped markdown marker${
        stats.markdownEscapesRemoved === 1 ? "" : "s"
      }`,
    );
  }

  if (stats.blocksRemoved) {
    parts.push(`${stats.blocksRemoved} empty block${stats.blocksRemoved === 1 ? "" : "s"}`);
  }

  if (!parts.length) return "";
  return `${label} removed or normalized ${parts.join(", ")}.`;
}

function pushPolishDiagnostic(diagnostics, stats, { code = "intake_polish", label = "Basic polish" } = {}) {
  if (!hasPolishChanges(stats)) return;

  diagnostics.push(
    createIntakeDiagnostic(code, "info", summarizePolishStats(stats, label)),
  );
}

function createImportError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function createIntakeDiagnostic(code, severity, message) {
  return {
    code: String(code || "info").trim() || "info",
    severity:
      severity === "warning" || severity === "error" ? severity : "info",
    message: String(message || "").trim(),
  };
}

function getFilenameExtension(filename) {
  const match = String(filename || "")
    .trim()
    .toLowerCase()
    .match(/(\.[a-z0-9]+)$/);
  return match?.[1] || "";
}

function stripFileExtension(filename) {
  return String(filename || "").replace(/\.[^.]+$/, "");
}

function guessTitleFromFilename(filename) {
  const cleaned = stripFileExtension(filename)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "Uploaded document";
}

function trimTitleCandidate(text, fallback = "Pasted source") {
  const normalized = String(text || "")
    .replace(/^[#>*_\-`[\]()\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return fallback;
  if (normalized.length <= 80) return normalized;
  return `${normalized.slice(0, 77).trimEnd()}...`;
}

function guessTitleFromText(text, fallback = "Pasted source") {
  const lines = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => cleanHeadingText(line).replace(/^[-*+]\s+/, "").trim())
    .filter(Boolean);

  return trimTitleCandidate(lines[0], fallback);
}

function isPlainTextImport(filename, mimeType = "") {
  const extension = getFilenameExtension(filename);
  const normalizedMime = String(mimeType || "").toLowerCase();

  return extension === ".txt" || (normalizedMime.startsWith("text/") && !normalizedMime.includes("markdown"));
}

function normalizeArtifactTextValue(text) {
  return String(text || "")
    .replaceAll("\u0000", "")
    .replace(ZERO_WIDTH_RE, "")
    .replace(NON_BREAKING_SPACE_RE, " ");
}

function normalizeMarkdownSource(markdown) {
  return normalizeArtifactTextValue(markdown)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizePlainTextSource(text) {
  return normalizeArtifactTextValue(text)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\f/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/(?<=\S)\n(?=\S)/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function normalizeComparableLine(line) {
  return String(line || "")
    .replace(/^>\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isLikelyPageNumberLine(line) {
  return PAGE_NUMBER_LINE_RE.test(normalizeComparableLine(line));
}

function isDecorativeOnlyLine(line, { aggressive = false } = {}) {
  const normalized = normalizeComparableLine(line);
  if (!normalized) return false;
  if (/[A-Za-z0-9]/.test(normalized)) return false;

  const symbolCount = (normalized.match(/[^\s]/g) || []).length;
  if (symbolCount < (aggressive ? 2 : 3)) return false;

  return /^[*_~=\-|.·•◦▪▫▸▹►▻◉○●◆◇■□✦✧✱+\s]+$/u.test(normalized);
}

function unescapeMarkdownArtifacts(text, stats) {
  let replacements = 0;
  const next = String(text || "").replace(MARKDOWN_ESCAPE_RE, (_, character) => {
    replacements += 1;
    return character;
  });

  if (replacements > 0) {
    stats.markdownEscapesRemoved += replacements;
  }

  return next;
}

function polishLineArtifacts(line, stats, { aggressive = false } = {}) {
  let next = normalizeArtifactTextValue(line).replace(/[ \t]+$/g, "");
  if (!next.trim()) return "";

  if (isLikelyPageNumberLine(next)) {
    stats.pageLinesRemoved += 1;
    return "";
  }

  if (isDecorativeOnlyLine(next, { aggressive })) {
    stats.decorativeLinesRemoved += 1;
    return "";
  }

  let bulletMatch = next.match(SYMBOL_BULLET_RE);
  if (!bulletMatch) {
    bulletMatch = next.match(DASH_BULLET_RE);
  }

  if (bulletMatch) {
    next = `${bulletMatch[1]}- ${next.slice(bulletMatch[0].length).trim()}`;
    stats.bulletLinesNormalized += 1;
  }

  if (aggressive) {
    next = unescapeMarkdownArtifacts(next, stats);
  }

  return next;
}

function polishMarkdownArtifacts(markdown, stats, { aggressive = false } = {}) {
  const polishedLines = [];
  let previousBlank = true;

  String(markdown || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .forEach((line) => {
      const polishedLine = polishLineArtifacts(line, stats, { aggressive });
      const isBlank = !polishedLine.trim();

      if (isBlank) {
        if (!previousBlank) {
          polishedLines.push("");
        }
        previousBlank = true;
        return;
      }

      polishedLines.push(polishedLine);
      previousBlank = false;
    });

  return polishedLines.join("\n").trim();
}

function isShortRepeatedArtifactParagraph(paragraph) {
  const normalized = String(paragraph || "").trim();
  if (!normalized) return false;

  const wordCount = countWords(stripMarkdownSyntax(normalized) || normalized);
  return wordCount > 0 && wordCount <= REPEATED_ARTIFACT_MAX_WORDS && normalized.length <= REPEATED_ARTIFACT_MAX_LENGTH;
}

function removeRepeatedArtifactParagraphs(paragraphs, stats) {
  const normalizedParagraphs = Array.isArray(paragraphs) ? paragraphs.filter(Boolean) : [];
  const counts = normalizedParagraphs.reduce((map, paragraph) => {
    const comparable = normalizeComparableLine(paragraph).toLowerCase();
    if (!isShortRepeatedArtifactParagraph(comparable)) {
      return map;
    }

    map.set(comparable, (map.get(comparable) || 0) + 1);
    return map;
  }, new Map());

  return normalizedParagraphs.filter((paragraph) => {
    const comparable = normalizeComparableLine(paragraph).toLowerCase();
    if ((counts.get(comparable) || 0) < REPEATED_ARTIFACT_MIN_OCCURRENCES) {
      return true;
    }

    stats.repeatedParagraphsRemoved += 1;
    return false;
  });
}

function stripFrontmatter(markdown) {
  if (!markdown.startsWith("---\n")) return markdown;

  const endIndex = markdown.indexOf("\n---\n", 4);
  if (endIndex === -1) return markdown;

  return markdown.slice(endIndex + 5).trim();
}

function stripLeadingTitleHeading(markdown, title) {
  const normalized = String(markdown || "").trim();
  const match = normalized.match(/^#\s+(.+?)\s*(?:\n+|$)/);
  if (!match) return normalized;

  const headingText = cleanHeadingText(match[1]);
  if (headingText !== cleanHeadingText(title)) {
    return normalized;
  }

  return normalized.slice(match[0].length).trim();
}

function cleanHeadingText(text) {
  return String(text || "")
    .replace(/[*_`~]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function splitIntoParagraphs(text) {
  return String(text || "")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function chunkParagraphsIntoSections(paragraphs, { targetSize = 2200, maxParagraphs = 7 } = {}) {
  if (!Array.isArray(paragraphs) || paragraphs.length === 0) {
    return [{ title: "Section 1", markdown: "No readable text could be extracted from this document." }];
  }

  const sections = [];
  let current = [];
  let currentLength = 0;

  paragraphs.forEach((paragraph) => {
    const nextLength = currentLength + paragraph.length;
    if (current.length > 0 && (nextLength > targetSize || current.length >= maxParagraphs)) {
      sections.push({
        title: `Section ${sections.length + 1}`,
        markdown: current.join("\n\n"),
      });
      current = [];
      currentLength = 0;
    }

    current.push(paragraph);
    currentLength += paragraph.length;
  });

  if (current.length > 0) {
    sections.push({
      title: `Section ${sections.length + 1}`,
      markdown: current.join("\n\n"),
    });
  }

  return sections;
}

function chooseSectionHeadingLevel(markdown, title) {
  const headingLevels = String(markdown || "")
    .split("\n")
    .map((line) => line.match(MARKDOWN_HEADING_RE))
    .filter(Boolean)
    .map((match) => ({
      level: match[1].length,
      text: cleanHeadingText(match[2]),
    }));

  const filtered = headingLevels.filter(
    (heading, index) => !(index === 0 && heading.level === 1 && heading.text === cleanHeadingText(title)),
  );
  const levelCounts = filtered.reduce((accumulator, heading) => {
    accumulator[heading.level] = (accumulator[heading.level] || 0) + 1;
    return accumulator;
  }, {});

  if (levelCounts[2]) return 2;
  if ((levelCounts[1] || 0) > 1) return 1;
  if (levelCounts[3]) return 3;
  return null;
}

function structureMarkdownImport(markdown, titleHint) {
  const polishStats = createPolishStats();
  const normalized = polishMarkdownArtifacts(
    stripFrontmatter(normalizeMarkdownSource(markdown)),
    polishStats,
  );
  const lines = normalized.split("\n");
  const detectedTitle = cleanHeadingText(
    lines.find((line) => /^#\s+/.test(line))?.replace(/^#\s+/, "") || "",
  );
  const title = detectedTitle || titleHint || "Uploaded document";
  const sectionLevel = chooseSectionHeadingLevel(normalized, title);

  if (!sectionLevel) {
    const singleSectionMarkdown =
      stripLeadingTitleHeading(normalized, title) || normalized || "_No extracted text yet._";

    return {
      title,
      introMarkdown: "",
      polishStats,
      sections: [
        {
          title,
          markdown: singleSectionMarkdown,
        },
      ],
    };
  }

  let skippedTitle = false;
  let currentSection = null;
  const introLines = [];
  const sections = [];

  lines.forEach((line) => {
    const headingMatch = line.match(MARKDOWN_HEADING_RE);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = cleanHeadingText(headingMatch[2]);

      if (!skippedTitle && level === 1 && headingText === cleanHeadingText(title)) {
        skippedTitle = true;
        return;
      }

      if (level === sectionLevel) {
        if (currentSection) {
          sections.push({
            title: currentSection.title,
            markdown: currentSection.lines.join("\n").trim(),
          });
        }

        currentSection = {
          title: headingText || `Section ${sections.length + 1}`,
          lines: [],
        };
        return;
      }
    }

    if (currentSection) {
      currentSection.lines.push(line);
      return;
    }

    introLines.push(line);
  });

  if (currentSection) {
    sections.push({
      title: currentSection.title,
      markdown: currentSection.lines.join("\n").trim(),
    });
  }

  const normalizedSections = sections
    .map((section, index) => ({
      title: section.title || `Section ${index + 1}`,
      markdown: section.markdown || "_No extracted text yet._",
    }))
    .filter((section) => section.markdown.trim());

  if (normalizedSections.length === 0) {
    return {
      title,
      introMarkdown: "",
      polishStats,
      sections: chunkParagraphsIntoSections(splitIntoParagraphs(normalized)),
    };
  }

  return {
    title,
    introMarkdown: introLines.join("\n").trim(),
    polishStats,
    sections: normalizedSections,
  };
}

function structurePlainTextImport(text, titleHint) {
  const polishStats = createPolishStats();
  const normalized = normalizePlainTextSource(text);
  const paragraphs = removeRepeatedArtifactParagraphs(
    splitIntoParagraphs(normalized)
      .map((paragraph) => polishLineArtifacts(paragraph, polishStats))
      .filter(Boolean),
    polishStats,
  );

  return {
    title: titleHint || "Uploaded document",
    introMarkdown: "",
    polishStats,
    sections: chunkParagraphsIntoSections(paragraphs, {
      targetSize: 1900,
      maxParagraphs: 6,
    }),
  };
}

function buildCanonicalMarkdown({ title, introMarkdown = "", sections = [] }) {
  const parts = [`# ${title}`];

  if (introMarkdown.trim()) {
    parts.push("", introMarkdown.trim());
  }

  sections.forEach((section, index) => {
    parts.push(
      "",
      `## ${index + 1} · ${cleanHeadingText(section.title) || `Section ${index + 1}`}`,
      "",
      section.markdown?.trim() || "_No extracted text yet._",
    );
  });

  return parts.join("\n").trim();
}

function extractVisibleText(markdown) {
  return String(markdown || "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`~>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text) {
  if (!text) return 0;
  return text
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean).length;
}

async function extractMarkdownFromDocx(buffer) {
  const mammoth = await import("mammoth");
  const result = await mammoth.convertToMarkdown({ buffer });
  return result.value || "";
}

async function extractTextFromDoc(buffer) {
  const wordExtractorModule = await import("word-extractor");
  const WordExtractor = wordExtractorModule.default || wordExtractorModule;
  const extractor = new WordExtractor();
  const document = await extractor.extract(buffer);

  return [
    typeof document.getHeaders === "function"
      ? document.getHeaders({ includeFooters: false })
      : "",
    typeof document.getBody === "function" ? document.getBody() : "",
    typeof document.getFootnotes === "function" ? document.getFootnotes() : "",
    typeof document.getEndnotes === "function" ? document.getEndnotes() : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function extractTextFromPdf(buffer) {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result?.text || "";
  } finally {
    if (typeof parser.destroy === "function") {
      await parser.destroy();
    }
  }
}

async function convertHtmlToMarkdown(html) {
  const turndownModule = await import("turndown");
  const TurndownService = turndownModule.default || turndownModule;
  const service = new TurndownService({
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "_",
    headingStyle: "atx",
  });

  return service.turndown(String(html || ""));
}

export async function ingestHtmlSource({
  html = "",
  titleHint = "",
  fallbackTitle = "Pasted source",
} = {}) {
  const normalizedHtml = String(html || "").trim();

  if (!normalizedHtml) {
    throw createImportError("clipboard_empty", "No readable HTML was provided.");
  }

  const markdown = normalizeMarkdownSource(await convertHtmlToMarkdown(normalizedHtml));
  if (!markdown) {
    throw createImportError(
      "html_no_text",
      "The provided page did not contain readable content.",
    );
  }

  const resolvedTitleHint =
    String(titleHint || "").trim() || guessTitleFromText(markdown, fallbackTitle);

  return finalizeImportedDocument(
    "markdown",
    structureMarkdownImport(markdown, resolvedTitleHint),
  );
}

export function ingestPlainTextSource({
  text = "",
  titleHint = "",
  fallbackTitle = "Pasted source",
} = {}) {
  const normalizedText = String(text || "").trim();
  if (!normalizedText) {
    throw createImportError("clipboard_empty", "No readable text was provided.");
  }

  const resolvedTitleHint =
    String(titleHint || "").trim() || guessTitleFromText(normalizedText, fallbackTitle);

  return finalizeImportedDocument(
    "markdown",
    structurePlainTextImport(normalizedText, resolvedTitleHint),
  );
}

function finalizeImportedDocument(format, structured, diagnostics = []) {
  const contentMarkdown = buildCanonicalMarkdown(structured);
  const visibleText = extractVisibleText(contentMarkdown);
  pushPolishDiagnostic(diagnostics, structured?.polishStats, {
    code: "intake_polish",
    label: "Basic polish",
  });

  return {
    format,
    title: structured.title || "Untitled document",
    subtitle: "",
    contentMarkdown,
    wordCount: countWords(visibleText),
    sectionCount: structured.sections.length,
    preview: buildExcerpt(visibleText, 180),
    diagnostics: Array.isArray(diagnostics) ? diagnostics : [],
  };
}

export function polishWorkspaceSourceDocument({
  title,
  subtitle = "",
  blocks = [],
  sectionTitle = "Document",
}) {
  const stats = createPolishStats();
  const normalizedBlocks = normalizeWorkspaceBlocks(blocks, {
    documentKey: "polish-source",
    defaultSourceDocumentKey: "polish-source",
    defaultIsEditable: true,
  });

  const polishedBlocks = normalizedBlocks.reduce((nextBlocks, block) => {
    const polishedText = polishMarkdownArtifacts(block.text, stats, { aggressive: true });
    if (!polishedText) {
      stats.blocksRemoved += 1;
      return nextBlocks;
    }

    nextBlocks.push({
      ...block,
      text: polishedText,
      plainText: stripMarkdownSyntax(polishedText),
      kind: normalizeWorkspaceBlockKind(block.kind, polishedText),
    });
    return nextBlocks;
  }, []);

  const changed =
    stats.blocksRemoved > 0 ||
    normalizedBlocks.length !== polishedBlocks.length ||
    normalizedBlocks.some((block, index) => polishedBlocks[index]?.text !== block.text);

  const contentMarkdown = buildWorkspaceMarkdown({
    title,
    subtitle,
    blocks: polishedBlocks,
    sectionTitle,
  });
  const visibleText = extractVisibleText(contentMarkdown);
  const diagnostics = [];
  pushPolishDiagnostic(diagnostics, stats, {
    code: "source_polished",
    label: "Polish",
  });

  return {
    changed,
    contentMarkdown,
    wordCount: countWords(visibleText),
    sectionCount: polishedBlocks.length,
    diagnostics,
    stats,
  };
}

export function getImportedDocumentFormat(filename, mimeType = "") {
  const normalizedMime = String(mimeType || "").toLowerCase();
  const extension = getFilenameExtension(filename);

  if (SUPPORTED_FORMATS.has(extension)) {
    return SUPPORTED_FORMATS.get(extension);
  }

  if (normalizedMime.includes("pdf")) return "pdf";
  if (normalizedMime.includes("wordprocessingml")) return "docx";
  if (normalizedMime.includes("msword")) return "doc";
  if (normalizedMime.includes("markdown") || normalizedMime.startsWith("text/")) {
    return "markdown";
  }

  return null;
}

export async function ingestUploadedDocument({ filename, mimeType = "", buffer }) {
  const format = getImportedDocumentFormat(filename, mimeType);
  if (!format) {
    throw new Error("Please upload a text, Markdown, Word, or PDF file.");
  }

  if (!buffer || buffer.length === 0) {
    throw new Error("The uploaded file was empty.");
  }

  if (buffer.length > MAX_DOCUMENT_UPLOAD_BYTES) {
    throw new Error("This file is too large. Keep uploads under 15 MB for now.");
  }

  const titleHint = guessTitleFromFilename(filename);
  const diagnostics = [];

  let structured;
  if (format === "markdown") {
    const source = buffer.toString("utf8");
    structured = isPlainTextImport(filename, mimeType)
      ? structurePlainTextImport(source, titleHint)
      : structureMarkdownImport(source, titleHint);
  } else if (format === "docx") {
    structured = structureMarkdownImport(await extractMarkdownFromDocx(buffer), titleHint);
  } else if (format === "doc") {
    structured = structurePlainTextImport(await extractTextFromDoc(buffer), titleHint);
  } else {
    let extractedText = "";
    try {
      extractedText = await extractTextFromPdf(buffer);
    } catch {
      throw createImportError(
        "pdf_extract_failed",
        "Could not extract text from this PDF. Text PDFs are supported right now.",
      );
    }

    const normalizedPdfText = normalizePlainTextSource(extractedText);
    if (!normalizedPdfText) {
      throw createImportError(
        "pdf_no_text",
        "This PDF did not yield readable text. Scanned, image-based, or protected PDFs are not supported yet.",
      );
    }

    if (countWords(normalizedPdfText) < PDF_LOW_TEXT_WORD_THRESHOLD) {
      diagnostics.push(
        createIntakeDiagnostic(
          "pdf_low_text",
          "warning",
          "Text extraction was sparse. PDF import is text-only for now, so layout may be rough.",
        ),
      );
    }

    structured = structurePlainTextImport(normalizedPdfText, titleHint);
  }

  return finalizeImportedDocument(format, structured, diagnostics);
}

export async function ingestPastedDocument({ html = "", text = "", mode = "source" }) {
  const normalizedHtml = String(html || "").trim();
  const normalizedText = String(text || "").trim();
  const payloadBytes =
    Buffer.byteLength(normalizedHtml, "utf8") + Buffer.byteLength(normalizedText, "utf8");

  if (!normalizedHtml && !normalizedText) {
    throw createImportError("clipboard_empty", "Clipboard is empty.");
  }

  if (payloadBytes > MAX_CLIPBOARD_PASTE_BYTES) {
    throw createImportError(
      "clipboard_too_large",
      "Clipboard payload too large. Keep pasted content under 1 MB for now.",
    );
  }

  if (normalizedHtml) {
    return ingestHtmlSource({
      html: normalizedHtml,
      fallbackTitle: mode === "clipboard" ? "Clipboard source" : "Pasted source",
    });
  }

  if (!normalizedText) {
    throw createImportError("clipboard_empty", "Clipboard did not contain readable text.");
  }

  return ingestPlainTextSource({
    text: normalizedText,
    fallbackTitle: mode === "clipboard" ? "Clipboard source" : "Pasted source",
  });
}
