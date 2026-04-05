import { buildExcerpt } from "@/lib/text";
import {
  normalizeAssemblyBlockFields,
} from "@/lib/assembly-architecture";

const BLOCK_KIND_MAP = {
  heading: "heading",
  title: "heading",
  paragraph: "paragraph",
  text: "paragraph",
  list: "list",
  bullet: "list",
  quote: "quote",
};

const LOG_ACTION_COLORS = {
  UPLOADED: "#888888",
  UPLOADED_IMAGE: "#f59e0b",
  LINK_ADDED: "#38bdf8",
  UPLOADED_AUDIO: "#fb7185",
  PASTED: "#2dd4bf",
  PASTED_IMAGE: "#2dd4bf",
  LISTENED: "#60a5fa",
  AI_QUERY: "#a78bfa",
  AI_RESULT: "#22c55e",
  DERIVED_IMAGE_SOURCE: "#f59e0b",
  DERIVED_LINK_SOURCE: "#38bdf8",
  DERIVED_AUDIO_SOURCE: "#fb7185",
  SELECTED: "#06b6d4",
  EDITED: "#f472b6",
  CLEANED: "#f59e0b",
  REPLACED: "#60a5fa",
  DELETED: "#ef4444",
  POLISHED: "#f59e0b",
  ASSEMBLED: "#f59e0b",
  OPERATED: "#339cff",
  RECEIPT: "#22c55e",
  CONFIRMED: "#22c55e",
  DISCARDED: "#ef4444",
  ROOT_DECLARED: "#60a5fa",
  RECEIPT_SEALED: "#22c55e",
};

function timestamp(value) {
  if (value instanceof Date) return value.toISOString();
  const normalized = String(value || "").trim();
  if (!normalized) return new Date().toISOString();
  const parsed = Date.parse(normalized);
  return Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString();
}

function toLines(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd());
}

function buildWorkspaceBlockId(documentKey, sourcePosition, extractionPassId = "") {
  const resolvedDocumentKey = String(documentKey || "document").trim() || "document";
  const positionLabel = String(sourcePosition).padStart(4, "0");
  const extractionLabel = String(extractionPassId || "").trim();
  return extractionLabel
    ? `${resolvedDocumentKey}:block:${extractionLabel}:${positionLabel}`
    : `${resolvedDocumentKey}:block:${positionLabel}`;
}

export function stripMarkdownSyntax(markdown) {
  return String(markdown || "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^[-+*]\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeWorkspaceBlockKind(value = "", fallbackText = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (BLOCK_KIND_MAP[normalized]) return BLOCK_KIND_MAP[normalized];

  const text = String(fallbackText || "").trim();
  if (!text) return "paragraph";
  if (text.startsWith(">")) return "quote";
  if (/^[-+*]\s+/m.test(text) || /^\d+\.\s+/m.test(text)) return "list";
  if (text.startsWith("#")) return "heading";
  return "paragraph";
}

export function normalizeWorkspaceBlock(input, options = {}) {
  const now = new Date().toISOString();
  const sourceDocumentKey =
    String(
      input?.sourceDocumentKey ||
        input?.origin_doc ||
        options.defaultSourceDocumentKey ||
        options.documentKey ||
        "",
    ).trim() || options.documentKey || "document";
  const sourcePosition = Number.isFinite(Number(input?.sourcePosition))
    ? Number(input.sourcePosition)
    : Number.isFinite(Number(input?.origin_position))
      ? Number(input.origin_position)
      : Number.isFinite(Number(options.fallbackSourcePosition))
        ? Number(options.fallbackSourcePosition)
        : 0;
  const text = String(input?.text || input?.markdown || "").trim();
  const kind = normalizeWorkspaceBlockKind(input?.kind || input?.type, text);
  const operation = String(input?.operation || options.defaultOperation || "imported")
    .trim()
    .toLowerCase();
  const author = String(input?.author || options.defaultAuthor || "human")
    .trim()
    .toLowerCase() === "ai"
    ? "ai"
    : "human";
  const documentKey = String(input?.documentKey || options.documentKey || sourceDocumentKey).trim();
  const architectureFields = normalizeAssemblyBlockFields(input, {
    defaultIsAssemblyBlock: Boolean(input?.isAssemblyBlock) || Boolean(options.defaultIsAssemblyBlock),
    defaultConfirmationStatus: options.defaultConfirmationStatus,
    defaultExtractionPassId: options.defaultExtractionPassId,
    defaultSevenStage: options.defaultSevenStage,
    defaultSourceType: options.defaultSourceType,
    root: options.root,
  });

  return {
    id:
      String(input?.id || "").trim() ||
      buildWorkspaceBlockId(documentKey || sourceDocumentKey, sourcePosition, architectureFields.extractionPassId),
    documentKey,
    sourceDocumentKey,
    sourcePosition,
    kind,
    text,
    plainText: String(input?.plainText || stripMarkdownSyntax(text)).trim(),
    author,
    operation,
    createdAt: timestamp(input?.createdAt || now),
    updatedAt: timestamp(input?.updatedAt || now),
    isAssemblyBlock:
      Boolean(input?.isAssemblyBlock) || Boolean(options.defaultIsAssemblyBlock) || false,
    isEditable:
      input?.isEditable === undefined ? options.defaultIsEditable !== false : Boolean(input.isEditable),
    isPlayable:
      input?.isPlayable === undefined ? true : Boolean(input.isPlayable),
    sectionSlug: input?.sectionSlug || null,
    sectionLabel: input?.sectionLabel || "",
    sectionTitle: input?.sectionTitle || "",
    sourceTitle: input?.sourceTitle || "",
    ...architectureFields,
  };
}

export function normalizeWorkspaceBlocks(blocks, options = {}) {
  return (Array.isArray(blocks) ? blocks : []).map((block, index) =>
    normalizeWorkspaceBlock(block, {
      ...options,
      fallbackSourcePosition: options.fallbackSourcePosition === undefined ? index : options.fallbackSourcePosition + index,
    }),
  );
}

function splitSectionIntoChunks(markdown) {
  const lines = toLines(markdown);
  const chunks = [];
  let current = [];

  function pushCurrent() {
    const value = current.join("\n").trim();
    if (value) chunks.push(value);
    current = [];
  }

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      pushCurrent();
      return;
    }

    const startsStandalone =
      trimmed.startsWith(">") ||
      /^[-+*]\s+/.test(trimmed) ||
      /^\d+\.\s+/.test(trimmed) ||
      trimmed.startsWith("#");

    if (startsStandalone && current.length > 0) {
      pushCurrent();
    }

    current.push(line);

    if (startsStandalone) {
      pushCurrent();
    }
  });

  pushCurrent();
  return chunks.length ? chunks : ["_No content yet._"];
}

export function buildWorkspaceBlocksFromDocument(documentData, options = {}) {
  const sections = Array.isArray(documentData?.sections) ? documentData.sections : [];
  let runningIndex = 0;

  return sections.flatMap((section) =>
    splitSectionIntoChunks(section.markdown).map((chunk) => {
      const sourcePosition = runningIndex;
      const block = normalizeWorkspaceBlock(
        {
          id: buildWorkspaceBlockId(
            options.documentKey || documentData?.documentKey || "document",
            sourcePosition,
            options.defaultExtractionPassId,
          ),
          text: chunk,
          kind: normalizeWorkspaceBlockKind("", chunk),
          operation: options.defaultOperation || "imported",
          author: options.defaultAuthor || "human",
          sectionSlug: section.slug,
          sectionTitle: section.title,
          sectionLabel: `${section.number} · ${section.title}`,
          sourceTitle: documentData?.title || "",
        },
        {
          documentKey: options.documentKey || documentData?.documentKey || "",
          defaultSourceDocumentKey:
            options.defaultSourceDocumentKey || options.documentKey || documentData?.documentKey || "",
          fallbackSourcePosition: sourcePosition,
          defaultIsEditable: options.defaultIsEditable,
          defaultIsAssemblyBlock: options.defaultIsAssemblyBlock,
          defaultExtractionPassId: options.defaultExtractionPassId,
        },
      );

      runningIndex += 1;
      return block;
    }),
  );
}

export function buildWorkspaceExcerptFromBlocks(blocks) {
  return buildExcerpt(
    (Array.isArray(blocks) ? blocks : []).map((block) => block.plainText || block.text).join(" "),
    180,
  );
}

function renderHeadingMarkdown(text) {
  const cleaned = stripMarkdownSyntax(text);
  return cleaned ? `### ${cleaned}` : "### Untitled";
}

function renderQuoteMarkdown(text) {
  const lines = toLines(text).filter(Boolean);
  if (lines.length === 0) return "> ";
  return lines.map((line) => (line.trim().startsWith(">") ? line.trim() : `> ${line.trim()}`)).join("\n");
}

function renderListMarkdown(text) {
  const lines = toLines(text).filter(Boolean);
  if (lines.length === 0) return "- ";

  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (/^[-+*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) return trimmed;
      return `- ${trimmed}`;
    })
    .join("\n");
}

export function renderWorkspaceBlockMarkdown(block) {
  if (block.kind === "heading") return renderHeadingMarkdown(block.text);
  if (block.kind === "quote") return renderQuoteMarkdown(block.text);
  if (block.kind === "list") return renderListMarkdown(block.text);
  return String(block.text || block.plainText || "").trim();
}

export function buildWorkspaceMarkdown({
  title,
  subtitle = "",
  blocks = [],
  sectionTitle = "Workspace",
}) {
  const lines = [`# ${String(title || "Untitled document").trim()}`];

  if (String(subtitle || "").trim()) {
    lines.push("", `### ${String(subtitle).trim()}`);
  }

  lines.push("", `## 1 · ${String(sectionTitle || "Workspace").trim()}`);

  const renderedBlocks = normalizeWorkspaceBlocks(blocks).map(renderWorkspaceBlockMarkdown).filter(Boolean);

  if (renderedBlocks.length === 0) {
    lines.push("", "_No content yet._");
  } else {
    renderedBlocks.forEach((blockMarkdown) => {
      lines.push("", blockMarkdown);
    });
  }

  return lines.join("\n").trim();
}

export function createWorkspaceLogEntry({
  id = "",
  time = new Date().toISOString(),
  action = "INFO",
  detail = "",
  documentKey = "",
  blockIds = [],
} = {}) {
  const normalizedTime = timestamp(time);

  return {
    id: String(id || `${action}-${normalizedTime}-${Math.random().toString(36).slice(2, 8)}`),
    time: normalizedTime,
    action: String(action || "INFO").trim().toUpperCase(),
    detail: String(detail || "").trim(),
    documentKey: String(documentKey || "").trim(),
    blockIds: Array.isArray(blockIds) ? blockIds.filter(Boolean) : [],
  };
}

export function normalizeWorkspaceLogEntries(entries, defaultDocumentKey = "") {
  return (Array.isArray(entries) ? entries : [])
    .map((entry) =>
      createWorkspaceLogEntry({
        ...entry,
        documentKey: entry?.documentKey || defaultDocumentKey,
      }),
    )
    .sort((left, right) => Date.parse(left.time) - Date.parse(right.time));
}

export function getWorkspaceLogActionColor(action) {
  return LOG_ACTION_COLORS[String(action || "").trim().toUpperCase()] || "#888888";
}

export function formatWorkspaceLogTime(value) {
  const parsed = Date.parse(String(value || ""));
  if (Number.isNaN(parsed)) return "--:--:--";
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(parsed));
}
