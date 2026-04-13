const FALLBACK_DREAM_FILENAME = "section-dream.md";
const SIMPLE_HASH_REPEAT = 8;

export const DREAM_AUDIO_TEXT_LIMIT = 3800;
export const DREAM_STORAGE_VERSION = 1;
export const DREAM_SOURCE_KINDS = Object.freeze({
  upload: "upload",
  paste: "paste",
});
export const DREAM_PLAYBACK_STATUSES = Object.freeze({
  idle: "idle",
  active: "active",
  paused: "paused",
});
export const DREAM_DEFAULT_RATE = 1;
export const DREAM_ALLOWED_EXTENSIONS = Object.freeze([".md", ".markdown"]);

function countWords(value = "") {
  return String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function normalizeWhitespace(value = "") {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ");
}

function escapeForRegex(value = "") {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripFrontmatter(markdown = "") {
  return String(markdown || "").replace(/^---\s*\n[\s\S]*?\n---\s*(?:\n|$)/, "");
}

function splitSentences(paragraph = "") {
  const matched = String(paragraph || "")
    .trim()
    .match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g);

  if (!matched) {
    return [];
  }

  return matched.map((entry) => entry.trim()).filter(Boolean);
}

function splitLongSentence(sentence = "", maxChars = DREAM_AUDIO_TEXT_LIMIT) {
  const words = String(sentence || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  const chunks = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
      current = word;
      continue;
    }

    let remainder = word;
    while (remainder.length > maxChars) {
      chunks.push(remainder.slice(0, maxChars));
      remainder = remainder.slice(maxChars);
    }
    current = remainder;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function splitLongParagraph(paragraph = "", maxChars = DREAM_AUDIO_TEXT_LIMIT) {
  const sentences = splitSentences(paragraph);
  if (!sentences.length) {
    return splitLongSentence(paragraph, maxChars);
  }

  const parts = [];
  let current = "";

  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) {
      parts.push(current);
      current = "";
    }

    if (sentence.length <= maxChars) {
      current = sentence;
      continue;
    }

    parts.push(...splitLongSentence(sentence, maxChars));
  }

  if (current) {
    parts.push(current);
  }

  return parts;
}

function cleanParagraph(entry = "") {
  return String(entry || "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function normalizeDreamSourceKind(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === DREAM_SOURCE_KINDS.paste
    ? DREAM_SOURCE_KINDS.paste
    : DREAM_SOURCE_KINDS.upload;
}

export function normalizeDreamFilename(filename = "", sourceKind = DREAM_SOURCE_KINDS.upload) {
  const trimmed = String(filename || "").trim();
  if (trimmed) {
    return trimmed;
  }

  return sourceKind === DREAM_SOURCE_KINDS.paste
    ? "section-dream-paste.md"
    : FALLBACK_DREAM_FILENAME;
}

export function isDreamMarkdownFilename(filename = "") {
  const normalized = String(filename || "").trim().toLowerCase();
  return DREAM_ALLOWED_EXTENSIONS.some((extension) => normalized.endsWith(extension));
}

export function estimateDreamDurationMs(text = "") {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  if (!words) return 0;

  const baseMs = (words / 190) * 60_000;
  return Math.max(1600, Math.round(baseMs + Math.max(0, words - 10) * 18));
}

export function normalizeDreamMarkdown(markdown = "") {
  const withoutFrontmatter = stripFrontmatter(normalizeWhitespace(markdown));
  const normalized = withoutFrontmatter
    .replace(/```[\s\S]*?```/g, "\n\nCode sample omitted.\n\n")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s{0,3}(#{1,6})\s+(.+)$/gm, (_match, _hashes, title) => `\n\nSection: ${title}\n\n`)
    .replace(/^(.+)\n(=+|-+)\s*$/gm, (_match, title) => `\n\nSection: ${title}\n\n`)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt) => (alt ? `${alt}.` : ""))
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^\[[^\]]+\]:\s+\S+.*$/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*[-*+]\s+\[(?: |x|X)\]\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[\^.+?\]/g, "")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map(cleanParagraph)
    .filter(Boolean)
    .map((entry) => {
      if (entry.startsWith("Section: ")) {
        return entry.replace(/^Section:\s*/, "Section. ").replace(/[.:]\s*$/, "").trim() + ".";
      }

      return entry;
    });

  return paragraphs.join("\n\n").trim();
}

export function buildDreamChunkMap(text = "", maxChars = DREAM_AUDIO_TEXT_LIMIT) {
  const normalized = normalizeWhitespace(text).trim();
  if (!normalized) {
    return [];
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map(cleanParagraph)
    .filter(Boolean);
  const chunks = [];
  let current = "";

  const pushChunk = (value) => {
    const textValue = cleanParagraph(value);
    if (!textValue) return;
    chunks.push({
      id: `dream-chunk-${chunks.length + 1}`,
      index: chunks.length,
      text: textValue,
      estimatedDurationMs: estimateDreamDurationMs(textValue),
    });
  };

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChars) {
      if (current) {
        pushChunk(current);
        current = "";
      }

      const parts = splitLongParagraph(paragraph, maxChars);
      for (const part of parts) {
        pushChunk(part);
      }
      continue;
    }

    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) {
      pushChunk(current);
    }
    current = paragraph;
  }

  if (current) {
    pushChunk(current);
  }

  return chunks;
}

export function getDreamQueueDurationMs(chunks = [], durationMap = {}) {
  return chunks.reduce(
    (total, chunk) => total + (durationMap?.[chunk.id] || chunk.estimatedDurationMs || estimateDreamDurationMs(chunk.text)),
    0,
  );
}

export function getDreamElapsedMs(chunks = [], currentIndex = -1, chunkOffsetMs = 0, durationMap = {}) {
  if (!Array.isArray(chunks) || currentIndex < 0) {
    return 0;
  }

  const priorMs = chunks.slice(0, currentIndex).reduce(
    (total, chunk) =>
      total + (durationMap?.[chunk.id] || chunk.estimatedDurationMs || estimateDreamDurationMs(chunk.text)),
    0,
  );

  return Math.max(0, priorMs + Math.max(0, Number(chunkOffsetMs) || 0));
}

export function findDreamPositionByElapsedMs(chunks = [], targetElapsedMs = 0, durationMap = {}) {
  if (!Array.isArray(chunks) || !chunks.length) {
    return {
      index: -1,
      chunkOffsetMs: 0,
      globalOffsetMs: 0,
    };
  }

  let elapsed = 0;
  const target = Math.max(0, Number(targetElapsedMs) || 0);

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const durationMs =
      durationMap?.[chunk.id] || chunk.estimatedDurationMs || estimateDreamDurationMs(chunk.text);
    const nextElapsed = elapsed + durationMs;

    if (target <= nextElapsed || index === chunks.length - 1) {
      return {
        index,
        chunkOffsetMs: Math.max(0, Math.min(durationMs, target - elapsed)),
        globalOffsetMs: Math.min(target, nextElapsed),
      };
    }

    elapsed = nextElapsed;
  }

  const totalDurationMs = getDreamQueueDurationMs(chunks, durationMap);
  return {
    index: chunks.length - 1,
    chunkOffsetMs: 0,
    globalOffsetMs: totalDurationMs,
  };
}

export function formatDreamTime(value = 0) {
  const totalSeconds = Math.max(0, Math.floor((Number(value) || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function normalizeDreamSession(
  value = {},
  {
    documentId = "",
    provider = null,
    voiceId = null,
    rate = DREAM_DEFAULT_RATE,
    chunkCount = 0,
  } = {},
) {
  const normalizedDocumentId = String(value?.documentId || documentId || "").trim();
  const maxChunkIndex = Math.max(0, chunkCount - 1);
  const rawIndex = Math.floor(Number(value?.activeChunkIndex));
  const activeChunkIndex =
    Number.isFinite(rawIndex) && rawIndex >= 0 ? Math.min(rawIndex, maxChunkIndex) : 0;
  const normalizedStatus = String(value?.status || "").trim().toLowerCase();

  return {
    version: DREAM_STORAGE_VERSION,
    documentId: normalizedDocumentId,
    provider: String(value?.provider || provider || "").trim() || null,
    voiceId: String(value?.voiceId || voiceId || "").trim() || null,
    rate: Number.isFinite(Number(value?.rate)) && Number(value?.rate) > 0 ? Number(value.rate) : rate,
    status:
      normalizedStatus === DREAM_PLAYBACK_STATUSES.active
        ? DREAM_PLAYBACK_STATUSES.active
        : normalizedStatus === DREAM_PLAYBACK_STATUSES.paused
          ? DREAM_PLAYBACK_STATUSES.paused
          : DREAM_PLAYBACK_STATUSES.idle,
    activeChunkIndex,
    chunkOffsetMs: Math.max(0, Math.floor(Number(value?.chunkOffsetMs) || 0)),
    globalOffsetMs: Math.max(0, Math.floor(Number(value?.globalOffsetMs) || 0)),
    lastOpenedAt: String(value?.lastOpenedAt || new Date().toISOString()),
  };
}

function buildSimpleHash(value = "") {
  let hash = 2166136261;
  for (const char of String(value || "")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  const chunk = Math.abs(hash >>> 0).toString(16).padStart(8, "0");
  return chunk.repeat(SIMPLE_HASH_REPEAT).slice(0, 64);
}

async function digestSha256(value = "") {
  if (!globalThis.crypto?.subtle || typeof TextEncoder === "undefined") {
    return buildSimpleHash(value);
  }

  try {
    const encoded = new TextEncoder().encode(String(value || ""));
    const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(hashBuffer), (entry) => entry.toString(16).padStart(2, "0")).join("");
  } catch {
    return buildSimpleHash(value);
  }
}

export async function createDreamDocumentId({ filename = "", rawMarkdown = "" } = {}) {
  const normalizedFilename = normalizeDreamFilename(filename);
  return digestSha256(`${normalizedFilename}::${String(rawMarkdown || "")}`);
}

export async function buildDreamDocumentRecord({
  filename = "",
  rawMarkdown = "",
  sourceKind = DREAM_SOURCE_KINDS.upload,
} = {}) {
  const normalizedSourceKind = normalizeDreamSourceKind(sourceKind);
  const normalizedFilename = normalizeDreamFilename(filename, normalizedSourceKind);
  const normalizedText = normalizeDreamMarkdown(rawMarkdown);

  if (!normalizedText) {
    throw new Error("Section Dream needs readable markdown before it can start listening.");
  }

  const id = await createDreamDocumentId({
    filename: normalizedFilename,
    rawMarkdown,
  });
  const timestamp = new Date().toISOString();
  const chunkMap = buildDreamChunkMap(normalizedText).map((chunk, index) => ({
    ...chunk,
    id: `${id}:${index}`,
    index,
  }));
  const wordCount = countWords(normalizedText);
  const totalDurationMs = getDreamQueueDurationMs(chunkMap);

  return {
    id,
    filename: normalizedFilename,
    sourceKind: normalizedSourceKind,
    rawMarkdown: String(rawMarkdown || ""),
    normalizedText,
    chunkMap,
    wordCount,
    progressMs: 0,
    totalDurationMs,
    lastOpenedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function getDreamDocumentSummary(document = null) {
  const chunkMap = Array.isArray(document?.chunkMap) ? document.chunkMap : [];
  const totalDurationMs = Number(document?.totalDurationMs) || getDreamQueueDurationMs(chunkMap);
  const wordCount = Number(document?.wordCount) || countWords(document?.normalizedText);

  return {
    chunkCount: chunkMap.length,
    wordCount,
    totalDurationMs,
  };
}

export function trimDreamMarkdownExtension(filename = "") {
  let normalized = normalizeDreamFilename(filename);

  for (const extension of DREAM_ALLOWED_EXTENSIONS) {
    normalized = normalized.replace(new RegExp(`${escapeForRegex(extension)}$`, "i"), "");
  }

  return normalized || FALLBACK_DREAM_FILENAME.replace(/\.md$/, "");
}
