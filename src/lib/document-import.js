import "server-only";

import { buildExcerpt } from "@/lib/text";

export const MAX_DOCUMENT_UPLOAD_BYTES = 15 * 1024 * 1024;
export const MAX_CLIPBOARD_PASTE_BYTES = 1024 * 1024;

const PDF_LOW_TEXT_WORD_THRESHOLD = 40;

const SUPPORTED_FORMATS = new Map([
  [".md", "markdown"],
  [".markdown", "markdown"],
  [".txt", "markdown"],
  [".doc", "doc"],
  [".docx", "docx"],
  [".pdf", "pdf"],
]);

const MARKDOWN_HEADING_RE = /^(#{1,6})\s+(.+?)\s*$/;

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

function normalizeMarkdownSource(markdown) {
  return String(markdown || "")
    .replace(/\uFEFF/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizePlainTextSource(text) {
  return String(text || "")
    .replaceAll("\u0000", "")
    .replace(/\uFEFF/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\f/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/(?<=\S)\n(?=\S)/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
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
  const normalized = stripFrontmatter(normalizeMarkdownSource(markdown));
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
      sections: chunkParagraphsIntoSections(splitIntoParagraphs(normalized)),
    };
  }

  return {
    title,
    introMarkdown: introLines.join("\n").trim(),
    sections: normalizedSections,
  };
}

function structurePlainTextImport(text, titleHint) {
  const normalized = normalizePlainTextSource(text);
  const paragraphs = splitIntoParagraphs(normalized);

  return {
    title: titleHint || "Uploaded document",
    introMarkdown: "",
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

function finalizeImportedDocument(format, structured, diagnostics = []) {
  const contentMarkdown = buildCanonicalMarkdown(structured);
  const visibleText = extractVisibleText(contentMarkdown);

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
    const markdown = normalizeMarkdownSource(await convertHtmlToMarkdown(normalizedHtml));
    if (markdown) {
      const titleHint = guessTitleFromText(
        markdown,
        mode === "clipboard" ? "Clipboard source" : "Pasted source",
      );
      return finalizeImportedDocument("markdown", structureMarkdownImport(markdown, titleHint));
    }
  }

  const titleHint = guessTitleFromText(
    normalizedText,
    mode === "clipboard" ? "Clipboard source" : "Pasted source",
  );
  if (!normalizedText) {
    throw createImportError("clipboard_empty", "Clipboard did not contain readable text.");
  }
  return finalizeImportedDocument("markdown", structurePlainTextImport(normalizedText, titleHint));
}
