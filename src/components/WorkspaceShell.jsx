"use client";

import Link from "next/link";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import {
  buildWorkspaceMarkdown,
  createWorkspaceLogEntry,
  formatWorkspaceLogTime,
  getWorkspaceLogActionColor,
  normalizeWorkspaceBlockKind,
  normalizeWorkspaceBlocks,
  normalizeWorkspaceLogEntries,
  stripMarkdownSyntax,
} from "@/lib/document-blocks";
import {
  clampListeningRate,
  formatVoiceLabel,
  VOICE_PROVIDERS,
} from "@/lib/listening";
import {
  DEFAULT_PROJECT_KEY,
  buildProjectsFromDocuments,
  getProjectByKey,
  getProjectDocuments,
  getProjectEntryDocumentKey,
  getProjectListenDocumentKey,
  hydrateProjectsWithDocuments,
  isProjectDocumentVisible,
  PRIMARY_WORKSPACE_DOCUMENT_KEY,
} from "@/lib/project-model";
import { parseSevenAudioHeaders } from "@/lib/seven";

const STORAGE_VERSION = 3;
const RATE_STEPS = [0.75, 1, 1.25, 1.5, 2];
const STATUS_TIMEOUT_MS = 5000;
const EMPTY_BLOCKS = [];
const WORKSPACE_MODES = {
  listen: "listen",
  assemble: "assemble",
};
const AI_SCOPE_OPTIONS = [
  { value: "document", label: "DOC" },
  { value: "block", label: "BLOCK" },
  { value: "clipboard", label: "CLIP" },
];
const IMAGE_DERIVATION_OPTIONS = [
  { value: "document", label: "Convert to document", shortLabel: "IMAGE → DOC" },
  { value: "notes", label: "Create source notes", shortLabel: "IMAGE → NOTES" },
];
const SOURCE_ACCEPT_VALUE =
  ".txt,.md,.markdown,.doc,.docx,.pdf,.png,.jpg,.jpeg,.webp,.gif,.m4a,.mp3,.wav,.webm,.mp4";
const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

function normalizeImageDerivationMode(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "notes") return "notes";
  if (normalized === "document") return "document";
  return "";
}

function normalizePreferredImageDerivationMode(value = "") {
  return normalizeImageDerivationMode(value) || IMAGE_DERIVATION_OPTIONS[0].value;
}

function isWorkspaceMode(value) {
  return value === WORKSPACE_MODES.listen || value === WORKSPACE_MODES.assemble;
}

function normalizeWorkspaceMode(value, fallback = WORKSPACE_MODES.assemble) {
  return isWorkspaceMode(value) ? value : fallback;
}

function browserSupportsDeviceVoice() {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance !== "undefined"
  );
}

function createInitialDocumentLogMap(documents = []) {
  return documents.reduce((map, document) => {
    map[document.documentKey] = normalizeWorkspaceLogEntries(
      document.logEntries,
      document.documentKey,
    );
    return map;
  }, {});
}

function getDocumentLogEntries(logMap, documentKey, fallback = []) {
  return normalizeWorkspaceLogEntries(
    logMap?.[documentKey] || fallback,
    documentKey,
  );
}

function mergeDocumentLogEntries(logMap, documentKey, incoming) {
  return {
    ...logMap,
    [documentKey]: mergeLogs(logMap?.[documentKey] || [], incoming),
  };
}

function applyDocumentLogState(document, logMap) {
  if (!document?.documentKey) return document;

  return {
    ...document,
    logEntries: getDocumentLogEntries(logMap, document.documentKey, document.logEntries),
  };
}

function formatActualProviderLabel(provider, voiceId = null) {
  if (!provider) return "Voice";
  return formatVoiceLabel(provider, voiceId);
}

function formatDocumentFormat(value, originalFilename = "") {
  const normalized = String(value || "markdown").toLowerCase();
  if (normalized === "docx") return "DOCX";
  if (normalized === "doc") return "DOC";
  if (normalized === "pdf") return "PDF";
  if (String(originalFilename || "").trim().toLowerCase().endsWith(".txt")) {
    return "TXT";
  }
  return "Markdown";
}

function getPrimaryDiagnosticMessage(intake = null) {
  return (
    intake?.diagnostics?.find(
      (diagnostic) =>
        diagnostic?.severity === "warning" || diagnostic?.severity === "error",
    )?.message || ""
  );
}

function isTypingTarget(target) {
  const tagName = target?.tagName?.toLowerCase?.() || "";
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target?.isContentEditable
  );
}

function getAiPlaceholder(scope) {
  if (scope === "block") return "ask about this block...";
  if (scope === "clipboard") return "ask about the clipboard...";
  return "ask about this document...";
}

function getImageDerivationLabel(value = "") {
  return (
    IMAGE_DERIVATION_OPTIONS.find((option) => option.value === value)?.label ||
    IMAGE_DERIVATION_OPTIONS[0].label
  );
}

function getImageDerivationDetail(value = "") {
  if (value === "notes") {
    return "Best for spaces, objects, site visits, and visual observations.";
  }

  return "Best for screenshots, photographed pages, whiteboards, and scanned notes.";
}

function isSupportedImageMimeType(value = "") {
  return SUPPORTED_IMAGE_MIME_TYPES.has(String(value || "").trim().toLowerCase());
}

function isImageFilename(value = "") {
  return /\.(png|jpe?g|webp|gif|heic|heif|bmp|tiff?)$/i.test(String(value || "").trim());
}

function isImageFileLike(file) {
  if (!file) return false;
  return String(file.type || "").trim().toLowerCase().startsWith("image/") || isImageFilename(file.name || "");
}

function isAudioFilename(value = "") {
  return /\.(m4a|mp3|wav|webm|mp4)$/i.test(String(value || "").trim());
}

function isAudioFileLike(file) {
  if (!file) return false;
  return String(file.type || "").trim().toLowerCase().startsWith("audio/") || isAudioFilename(file.name || "");
}

function extractSingleUrlText(text = "") {
  const normalized = String(text || "").trim();
  if (!normalized || /\s/.test(normalized)) return "";

  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "";
    }
    return url.toString();
  } catch {
    return "";
  }
}

function formatAssetDuration(durationMs = 0) {
  const totalSeconds = Math.max(0, Math.round(Number(durationMs || 0) / 1000));
  if (!totalSeconds) return "";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatRecordingElapsed(totalSeconds = 0) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds || 0)));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function getSourceAssetLabel(asset) {
  if (!asset) return "";
  if (asset.kind === "link") {
    try {
      return new URL(asset.canonicalUrl || asset.sourceUrl || asset.url || "").hostname;
    } catch {
      return asset.label || "Original link";
    }
  }

  if (asset.kind === "audio") {
    return asset.originalFilename || asset.label || "Original audio";
  }

  return asset.originalFilename || asset.label || "Original source";
}

function dataUrlMimeType(dataUrl = "") {
  const match = String(dataUrl || "")
    .trim()
    .match(/^data:([^;,]+);base64,/i);
  return match?.[1]?.trim()?.toLowerCase() || "";
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the pasted image."));
    reader.readAsDataURL(blob);
  });
}

function isSourceDocument(document) {
  return Boolean(document) && !document.isAssembly && document.documentType !== "assembly";
}

function resolveProjectModeDocument(project, documents, mode, fallbackDocument = null) {
  const projectDocuments = Array.isArray(documents) ? documents : [];
  const normalizedMode = normalizeWorkspaceMode(mode, WORKSPACE_MODES.assemble);
  if (normalizedMode === WORKSPACE_MODES.listen) {
    const sourceFallback =
      isSourceDocument(fallbackDocument) && isProjectDocumentVisible(fallbackDocument)
        ? fallbackDocument
        : null;
    const listenDocumentKey = getProjectListenDocumentKey(project, projectDocuments);
    return (
      projectDocuments.find((document) => document.documentKey === listenDocumentKey) ||
      sourceFallback ||
      projectDocuments.find(
        (document) => isSourceDocument(document) && isProjectDocumentVisible(document),
      ) ||
      fallbackDocument ||
      projectDocuments[0] ||
      null
    );
  }

  return (
    (project?.currentAssemblyDocumentKey &&
      projectDocuments.find(
        (document) => document.documentKey === project.currentAssemblyDocumentKey,
      )) ||
    projectDocuments.find((document) => document.documentKey === getProjectEntryDocumentKey(project)) ||
    fallbackDocument ||
    projectDocuments[0] ||
    null
  );
}

function summarizePolishChanges(changes = null) {
  const parts = [];
  const normalized = changes || {};

  if (normalized.decorativeLinesRemoved) {
    parts.push(
      `${normalized.decorativeLinesRemoved} decorative line${
        normalized.decorativeLinesRemoved === 1 ? "" : "s"
      }`,
    );
  }

  if (normalized.pageLinesRemoved) {
    parts.push(
      `${normalized.pageLinesRemoved} page marker${normalized.pageLinesRemoved === 1 ? "" : "s"}`,
    );
  }

  if (normalized.bulletLinesNormalized) {
    parts.push(
      `${normalized.bulletLinesNormalized} list marker${
        normalized.bulletLinesNormalized === 1 ? "" : "s"
      }`,
    );
  }

  if (normalized.repeatedParagraphsRemoved) {
    parts.push(
      `${normalized.repeatedParagraphsRemoved} repeated artifact paragraph${
        normalized.repeatedParagraphsRemoved === 1 ? "" : "s"
      }`,
    );
  }

  if (normalized.markdownEscapesRemoved) {
    parts.push(
      `${normalized.markdownEscapesRemoved} markdown escape${
        normalized.markdownEscapesRemoved === 1 ? "" : "s"
      }`,
    );
  }

  if (normalized.blocksRemoved) {
    parts.push(`${normalized.blocksRemoved} empty block${normalized.blocksRemoved === 1 ? "" : "s"}`);
  }

  return parts.length ? parts.join(", ") : "";
}

function countLiteralOccurrences(text, query) {
  if (!query) return 0;
  return String(text || "").split(query).length - 1;
}

function unescapeMarkdownEscapes(text) {
  let replacements = 0;
  const next = String(text || "").replace(/\\(\\|`|\*|_|{|}|\[|\]|\(|\)|#|\+|-|!|\.|>)/g, (_, character) => {
    replacements += 1;
    return character;
  });

  return {
    text: next,
    replacements,
  };
}

function SourceActionIcon({ kind }) {
  if (kind === "clean") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="m12 4 1.2 3.3L16.5 8.5l-3.3 1.2L12 13l-1.2-3.3L7.5 8.5l3.3-1.2z" />
        <path d="m18 13 0.8 2.2L21 16l-2.2 0.8L18 19l-0.8-2.2L15 16l2.2-0.8z" />
      </svg>
    );
  }

  if (kind === "replace") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M7 7h10" />
        <path d="m13 3 4 4-4 4" />
        <path d="M17 17H7" />
        <path d="m11 13-4 4 4 4" />
      </svg>
    );
  }

  if (kind === "unescape") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M8 5 5 12l3 7" />
        <path d="m16 5 3 7-3 7" />
        <path d="m10 17 4-10" />
      </svg>
    );
  }

  if (kind === "delete") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M5.5 7h13" />
        <path d="M9.5 4.5h5" />
        <path d="M8 7l0.8 11h6.4L16 7" />
      </svg>
    );
  }

  if (kind === "close") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="m6 6 12 12" />
        <path d="M18 6 6 18" />
      </svg>
    );
  }

  return null;
}

function WorkspaceActionIcon({ kind }) {
  if (kind === "back") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M19 12H5" />
        <path d="m11 6-6 6 6 6" />
      </svg>
    );
  }

  if (kind === "listen") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="m9 7 8 5-8 5z" />
        <path d="M5 6.5v11" />
      </svg>
    );
  }

  if (kind === "assemble") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <rect x="4.5" y="5.5" width="6" height="6" rx="1.2" />
        <rect x="13.5" y="5.5" width="6" height="6" rx="1.2" />
        <rect x="9" y="14.5" width="6" height="6" rx="1.2" />
      </svg>
    );
  }

  if (kind === "browse") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M4.5 7h15" />
        <path d="M4.5 12h15" />
        <path d="M4.5 17h15" />
      </svg>
    );
  }

  if (kind === "continue") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M5 7.5h8.5L17 11l-3.5 3.5H5z" />
        <path d="M17 11h2" />
      </svg>
    );
  }

  if (kind === "upload") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M12 16V5" />
        <path d="m7.5 9.5 4.5-4.5 4.5 4.5" />
        <path d="M5 18.5h14" />
      </svg>
    );
  }

  if (kind === "paste-source") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <rect x="7" y="4.5" width="10" height="15" rx="1.8" />
        <path d="M9.5 3.5h5" />
        <path d="M9.5 9.5h5" />
        <path d="M9.5 13h5" />
      </svg>
    );
  }

  if (kind === "speak") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <rect x="9" y="3.5" width="6" height="10" rx="3" />
        <path d="M6.5 10.5a5.5 5.5 0 0 0 11 0" />
        <path d="M12 16v4" />
        <path d="M8.5 20h7" />
      </svg>
    );
  }

  if (kind === "clipboard") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M9 5.5h6" />
        <rect x="6.5" y="4" width="11" height="15.5" rx="2" />
        <path d="M10 8.5h4" />
        <path d="M9.5 12h5" />
      </svg>
    );
  }

  if (kind === "account") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <circle cx="12" cy="8.5" r="3.2" />
        <path d="M5 19c1.8-3 4.1-4.5 7-4.5S17.2 16 19 19" />
      </svg>
    );
  }

  if (kind === "menu") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M5 7h14" />
        <path d="M5 12h14" />
        <path d="M5 17h14" />
      </svg>
    );
  }

  if (kind === "log") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M7 6.5h10" />
        <path d="M7 11.5h10" />
        <path d="M7 16.5h6" />
        <rect x="4.5" y="4.5" width="15" height="15" rx="2" />
      </svg>
    );
  }

  return null;
}

async function readClipboardPayloadFromNavigator() {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    throw new Error("Clipboard access is unavailable here. Press Cmd/Ctrl+V in the workspace instead.");
  }

  let lastError = null;

  if (typeof navigator.clipboard.read === "function") {
    try {
      const items = await navigator.clipboard.read();
      let html = "";
      let text = "";
      let imageDataUrl = "";
      let imageMimeType = "";
      let imageFilename = "";

      for (const item of items) {
        const imageType = item.types.find((type) => isSupportedImageMimeType(type));
        if (!imageDataUrl && imageType) {
          const blob = await item.getType(imageType);
          imageDataUrl = await blobToDataUrl(blob);
          imageMimeType = blob.type || imageType;
          imageFilename = imageType.replace("image/", "clipboard-image.") || "clipboard-image.png";
          break;
        }
        if (!html && item.types.includes("text/html")) {
          const blob = await item.getType("text/html");
          html = await blob.text();
        }
        if (!text && item.types.includes("text/plain")) {
          const blob = await item.getType("text/plain");
          text = await blob.text();
        }
        if (html || text) {
          break;
        }
      }

      if (imageDataUrl || html || text) {
        return { html, text, imageDataUrl, imageMimeType, imageFilename };
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (typeof navigator.clipboard.readText === "function") {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        return { html: "", text, imageDataUrl: "", imageMimeType: "", imageFilename: "" };
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    throw new Error("Clipboard access was blocked. Press Cmd/Ctrl+V in the workspace instead.");
  }

  throw new Error("Clipboard is empty.");
}

async function getClipboardPayloadFromPasteEvent(event) {
  const items = Array.from(event?.clipboardData?.items || []);
  const imageItem = items.find(
    (item) =>
      item?.kind === "file" &&
      isSupportedImageMimeType(item?.type || ""),
  );

  if (imageItem?.getAsFile) {
    const file = imageItem.getAsFile();
    if (file) {
      return {
        html: "",
        text: "",
        imageDataUrl: await blobToDataUrl(file),
        imageMimeType: file.type || "",
        imageFilename: file.name || "clipboard-image.png",
      };
    }
  }

  const html = event?.clipboardData?.getData("text/html") || "";
  const text = event?.clipboardData?.getData("text/plain") || "";

  if (!html.trim() && !text.trim()) {
    return null;
  }

  return { html, text, imageDataUrl: "", imageMimeType: "", imageFilename: "" };
}

function toDocumentSummary(document, previous = null) {
  return {
    documentKey: document.documentKey,
    title: document.title,
    subtitle: document.subtitle || "",
    excerpt: document.excerpt || previous?.excerpt || "",
    sourceType: document.sourceType || previous?.sourceType || "upload",
    documentType: document.documentType || previous?.documentType || "source",
    format: String(document.format || previous?.format || "markdown").toLowerCase(),
    formatLabel: formatDocumentFormat(
      document.format || previous?.format || "markdown",
      document.originalFilename || previous?.originalFilename || "",
    ),
    originalFilename: document.originalFilename || previous?.originalFilename || null,
    href:
      document.documentKey === "assembled-reality-v07-final"
        ? "/workspace"
        : `/workspace?document=${encodeURIComponent(document.documentKey)}`,
    wordCount: previous?.wordCount || 0,
    sectionCount: Array.isArray(document.blocks)
      ? document.blocks.length
      : previous?.sectionCount || 0,
    progressPercent: previous?.progressPercent || 0,
    createdAt: document.createdAt || previous?.createdAt || null,
    updatedAt: document.updatedAt || previous?.updatedAt || null,
    isAssembly: Boolean(document.isAssembly),
    isEditable: Boolean(document.isEditable),
    intakeKind: document.intakeKind || previous?.intakeKind || "upload",
    intakeDiagnostics: Array.isArray(document.intakeDiagnostics)
      ? document.intakeDiagnostics
      : previous?.intakeDiagnostics || [],
    hiddenFromProjectHome: Boolean(
      document.hiddenFromProjectHome ?? previous?.hiddenFromProjectHome,
    ),
    sourceFiles: Array.isArray(document.sourceFiles) ? document.sourceFiles : [],
    sourceAssetIds: Array.isArray(document.sourceAssetIds)
      ? document.sourceAssetIds
      : previous?.sourceAssetIds || [],
    sourceAssets: Array.isArray(document.sourceAssets)
      ? document.sourceAssets
      : previous?.sourceAssets || [],
    derivationKind: document.derivationKind || previous?.derivationKind || "",
    derivationModel: document.derivationModel || previous?.derivationModel || "",
    derivationStatus: document.derivationStatus || previous?.derivationStatus || "",
  };
}

function mergeDocumentSummary(documents, document) {
  const nextSummary = toDocumentSummary(
    document,
    documents.find((entry) => entry.documentKey === document.documentKey) || null,
  );
  const remaining = documents.filter((entry) => entry.documentKey !== document.documentKey);
  return sortDocuments(
    nextSummary.documentType === "builtin" ? [nextSummary, ...remaining] : [...remaining, nextSummary],
  );
}

function sortDocuments(documents) {
  const builtin = [];
  const sources = [];
  const assemblies = [];

  documents.forEach((document) => {
    if (document.documentType === "builtin" || document.sourceType === "builtin") {
      builtin.push(document);
      return;
    }

    if (document.isAssembly || document.documentType === "assembly") {
      assemblies.push(document);
      return;
    }

    sources.push(document);
  });

  const byUpdatedAt = (left, right) => {
    const leftTime = Date.parse(left.updatedAt || left.createdAt || 0);
    const rightTime = Date.parse(right.updatedAt || right.createdAt || 0);
    return rightTime - leftTime;
  };

  sources.sort(byUpdatedAt);
  assemblies.sort(byUpdatedAt);

  return [...builtin, ...sources, ...assemblies];
}

function mergeLogs(existing, incoming) {
  const map = new Map();

  [...existing, ...incoming].forEach((entry) => {
    if (!entry?.id) return;
    map.set(entry.id, entry);
  });

  return normalizeWorkspaceLogEntries([...map.values()]);
}

function mergeClipboard(existing, incoming) {
  const next = [...existing];
  const seen = new Set(existing.map((item) => item.id));

  incoming.forEach((item) => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    next.push(item);
  });

  return next;
}

function moveListItem(items, index, delta) {
  const target = index + delta;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function readWorkspaceState(storageKey) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== STORAGE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeWorkspaceState(storageKey, payload) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    storageKey,
    JSON.stringify({
      version: STORAGE_VERSION,
      ...payload,
    }),
  );
}

function groupedDocuments(documents) {
  const visibleDocuments = (Array.isArray(documents) ? documents : []).filter((document) =>
    isProjectDocumentVisible(document),
  );
  return {
    sources: visibleDocuments.filter(
      (document) =>
        document.documentType === "builtin" ||
        (!document.isAssembly && document.documentType !== "assembly"),
    ),
    assemblies: visibleDocuments.filter(
      (document) => document.isAssembly || document.documentType === "assembly",
    ),
  };
}

function buildWorkspaceUrl(
  documentKey,
  projectKey = DEFAULT_PROJECT_KEY,
  {
    launchpad = false,
    mode = "",
  } = {},
) {
  const params = new URLSearchParams();

  if (projectKey && projectKey !== DEFAULT_PROJECT_KEY) {
    params.set("project", projectKey);
  }

  if (isWorkspaceMode(mode)) {
    params.set("mode", mode);
  }

  if (launchpad) {
    params.set("launchpad", "1");
  }

  if (documentKey && documentKey !== PRIMARY_WORKSPACE_DOCUMENT_KEY) {
    params.set("document", documentKey);
  }

  const query = params.toString();
  return query ? `/workspace?${query}` : "/workspace";
}

function getDocumentKindLabel(document) {
  if (!document) return "Document";
  if (document.documentType === "builtin" || document.sourceType === "builtin") {
    return "Sample";
  }
  if (document.isAssembly || document.documentType === "assembly") {
    return "Assembly";
  }
  if (document.derivationKind === "ocr-document") {
    return "Image → Doc";
  }
  if (document.derivationKind === "image-notes") {
    return "Image → Notes";
  }
  if (document.derivationKind === "link-document") {
    return "Link → Doc";
  }
  if (document.derivationKind === "audio-transcript") {
    return "Audio → Transcript";
  }
  return document.formatLabel || "Document";
}

function getPrimarySourceAsset(document, kind = "") {
  const assets = Array.isArray(document?.sourceAssets) ? document.sourceAssets : [];
  const normalizedKind = String(kind || "").trim().toLowerCase();

  if (normalizedKind) {
    return assets.find((asset) => String(asset?.kind || "").trim().toLowerCase() === normalizedKind) || null;
  }

  return assets[0] || null;
}

function getDocumentBlockCount(document) {
  return Number(document?.sectionCount) || 0;
}

function getDocumentBlockCountLabel(document) {
  const blockCount = getDocumentBlockCount(document);
  return `${blockCount} block${blockCount === 1 ? "" : "s"}`;
}

function getResumeSessionLabel(summary) {
  if (!summary?.documentKey) return "";
  const current = summary.blockPosition || 1;
  const total = summary.totalBlocks || 0;
  return total ? `Block ${current} of ${total}` : `Block ${current}`;
}

function WorkspaceShelf({
  open = false,
  activeProject,
  documents,
  activeDocumentKey,
  loadingDocumentKey,
  onOpenProjectHome,
  onOpenDocument,
  onUpload,
  onPasteSource,
  onClose,
  uploading = false,
  lastUsedMode = WORKSPACE_MODES.assemble,
}) {
  if (!open) return null;

  return (
    <div className={`assembler-sheet assembler-sheet--workspace ${open ? "is-open" : ""}`}>
      <div className="assembler-sheet__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="assembler-sheet__panel assembler-sheet__panel--workspace">
        <div className="assembler-sheet__header">
          <div className="assembler-home__copy">
            <span className="assembler-sheet__eyebrow">{activeProject?.title || "Project"}</span>
            <span className="assembler-sheet__title">Browse documents</span>
          </div>

          <div className="assembler-sheet__section-actions">
            <button type="button" className="assembler-sheet__close" onClick={onOpenProjectHome}>
              Project Home
            </button>
            <button
              type="button"
              className="assembler-sheet__close"
              onClick={onUpload}
              disabled={uploading}
            >
              {uploading ? "Importing..." : "Upload"}
            </button>
            <button type="button" className="assembler-sheet__close" onClick={onClose}>
              Done
            </button>
          </div>
        </div>

        <div className="assembler-sheet__content">
          <ListenPicker
            documents={documents}
            activeDocumentKey={activeDocumentKey}
            loadingDocumentKey={loadingDocumentKey}
            lastUsedMode={lastUsedMode}
            onOpenDocument={(documentKey, mode, options = {}) => {
              onClose();
              onOpenDocument(documentKey, mode, options);
            }}
          />
        </div>

        <div className="assembler-sheet__footer">
          <button
            type="button"
            className="assembler-sheet__primary"
            onClick={() => {
              onClose();
              onPasteSource();
            }}
          >
            Paste from clipboard
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkspaceLaunchpad({
  activeProject,
  activeProjectKey,
  projects,
  documents,
  projectDrafts = [],
  projectActionPending = "",
  loadingDocumentKey,
  onEnterMode,
  onCreateProject,
  onOpenDocument,
  onOpenProject,
  onPasteClipboard,
  onOpenSpeak,
  onOpenIntake,
  uploading = false,
  pastePendingMode = "",
  recordingVoice = false,
  clipboardCount = 0,
  lastUsedMode = WORKSPACE_MODES.assemble,
  resumeSessionSummary = null,
}) {
  const grouped = groupedDocuments(documents);
  const listenDocument =
    resolveProjectModeDocument(
      activeProject,
      documents,
      WORKSPACE_MODES.listen,
      null,
    );
  const assembleDocument =
    resolveProjectModeDocument(
      activeProject,
      documents,
      WORKSPACE_MODES.assemble,
      null,
    );
  const currentAssemblyDocument =
    (activeProject?.currentAssemblyDocumentKey &&
      documents.find((document) => document.documentKey === activeProject.currentAssemblyDocumentKey)) ||
    grouped.assemblies[0] ||
    null;
  const sourceDocuments = grouped.sources;
  const assemblyDocuments = grouped.assemblies;
  const sourceCount = sourceDocuments.length;
  const assemblyCount = assemblyDocuments.length;
  const busy = uploading || Boolean(pastePendingMode) || recordingVoice;
  const openMode = normalizeWorkspaceMode(lastUsedMode, WORKSPACE_MODES.assemble);

  function renderDocumentRow(document, { active = false } = {}) {
    return (
      <div
        key={document.documentKey}
        className={`assembler-document-row ${active ? "is-active" : ""}`}
      >
        <button
          type="button"
          className="assembler-document-row__quick"
          onClick={() => onOpenDocument(document.documentKey, WORKSPACE_MODES.listen)}
          aria-label={`Listen to ${document.title}`}
        >
          <WorkspaceActionIcon kind="listen" />
        </button>

        <button
          type="button"
          className="assembler-document-row__body"
          onClick={() => onOpenDocument(document.documentKey, openMode)}
        >
          <span className="assembler-document-row__title">{document.title}</span>
          <span className="assembler-document-row__meta">
            {getDocumentBlockCountLabel(document)}
          </span>
        </button>

        <span className="assembler-document-row__badge">
          {loadingDocumentKey === document.documentKey
            ? "Loading…"
            : getDocumentKindLabel(document)}
        </span>
      </div>
    );
  }

  return (
    <div className="assembler-home">
      <div className="assembler-home__copy">
        <span className="assembler-home__eyebrow">Home loop</span>
        <h1 className="assembler-home__title">Speak. Listen. Assemble. Drop anything.</h1>
        <p className="assembler-home__body">
          Talk a source into existence, return to the current thread of work, or bring in outside material without deciding the format first.
        </p>
      </div>

      {resumeSessionSummary?.documentKey ? (
        <button
          type="button"
          className="assembler-home__resume"
          onClick={() =>
            onOpenDocument(
              resumeSessionSummary.documentKey,
              WORKSPACE_MODES.listen,
              { focusBlockId: resumeSessionSummary.blockId || null },
            )}
        >
          <div className="assembler-home__resume-copy">
            <span className="assembler-home__resume-label">Continue Listening</span>
            <span className="assembler-home__resume-title">{resumeSessionSummary.title}</span>
            <span className="assembler-home__resume-detail">
              {getResumeSessionLabel(resumeSessionSummary)}
            </span>
          </div>
          <span className="assembler-home__resume-icon" aria-hidden="true">
            <WorkspaceActionIcon kind="listen" />
          </span>
        </button>
      ) : null}

      <div className="assembler-home__actions">
        <button
          type="button"
          className="assembler-home__action"
          onClick={() => onEnterMode(WORKSPACE_MODES.listen, listenDocument?.documentKey || "")}
          disabled={!listenDocument || busy}
        >
          <span className="assembler-home__action-icon" aria-hidden="true">
            <WorkspaceActionIcon kind="listen" />
          </span>
          <span className="assembler-home__action-label">Listen</span>
        </button>

        <button
          type="button"
          className="assembler-home__action"
          onClick={() => onEnterMode(WORKSPACE_MODES.assemble, assembleDocument?.documentKey || "")}
          disabled={!assembleDocument || busy}
        >
          <span className="assembler-home__action-icon" aria-hidden="true">
            <WorkspaceActionIcon kind="assemble" />
          </span>
          <span className="assembler-home__action-label">Assemble</span>
        </button>

        <button
          type="button"
          className="assembler-home__action"
          onClick={onOpenSpeak}
          disabled={uploading || Boolean(pastePendingMode)}
        >
          <span className="assembler-home__action-icon" aria-hidden="true">
            <WorkspaceActionIcon kind="speak" />
          </span>
          <span className="assembler-home__action-label">Speak</span>
        </button>

        <button
          type="button"
          className="assembler-home__action"
          onClick={onOpenIntake}
          disabled={busy}
        >
          <span className="assembler-home__action-icon" aria-hidden="true">
            <WorkspaceActionIcon kind="upload" />
          </span>
          <span className="assembler-home__action-label">Drop anything</span>
        </button>
      </div>

      {projects.length > 1 ? (
        <div className="assembler-home__section">
          <div className="assembler-home__section-head">
            <span>Projects</span>
            <button
              type="button"
              className="assembler-home__section-action"
              onClick={onCreateProject}
              disabled={projectActionPending === "__create__"}
            >
              {projectActionPending === "__create__" ? "Creating…" : "New"}
            </button>
          </div>

          <div className="assembler-home__section-list">
            {projects.map((project) => (
              <button
                key={project.projectKey}
                type="button"
                className={`assembler-home__project-row ${
                  project.projectKey === activeProjectKey ? "is-active" : ""
                }`}
                onClick={() => onOpenProject(project.projectKey)}
                disabled={projectActionPending === project.projectKey}
              >
                <span className="assembler-home__project-title">{project.title}</span>
                <span className="assembler-home__project-meta">
                  {projectActionPending === project.projectKey
                    ? "Opening…"
                    : `${project.sourceCount} sources`}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="assembler-home__section">
        <div className="assembler-home__section-head">
          <span>Sources</span>
          <span>{sourceCount}</span>
        </div>

        <div className="assembler-home__section-list">
          {sourceDocuments.length ? (
            sourceDocuments.slice(0, 6).map((document) => renderDocumentRow(document))
          ) : (
            <p className="assembler-home__empty">No sources yet.</p>
          )}
        </div>
      </div>

      <div className="assembler-home__section">
        <div className="assembler-home__section-head">
          <span>Assemblies</span>
          <span>{assemblyCount}</span>
        </div>

        <div className="assembler-home__section-list">
          {assemblyDocuments.length ? (
            assemblyDocuments.slice(0, 6).map((document) =>
              renderDocumentRow(document, {
                active: document.documentKey === currentAssemblyDocument?.documentKey,
              }))
          ) : (
            <p className="assembler-home__empty">Nothing assembled yet.</p>
          )}
        </div>
      </div>

      {clipboardCount || projectDrafts.length ? (
        <div className="assembler-home__footer">
          {clipboardCount ? <span>{clipboardCount} staged for assembly</span> : null}
          {projectDrafts.length ? (
            <Link href="/account" className="assembler-home__footer-link">
              {projectDrafts.length} receipt{projectDrafts.length === 1 ? "" : "s"}
            </Link>
          ) : null}
          {!projectDrafts.length && clipboardCount ? (
            <button
              type="button"
              className="assembler-home__footer-link"
              onClick={onPasteClipboard}
              disabled={pastePendingMode === "clipboard" || busy}
            >
              {pastePendingMode === "clipboard" ? "Pasting…" : "Add from Clipboard"}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ListenPicker({
  documents,
  activeDocumentKey,
  loadingDocumentKey,
  lastUsedMode = WORKSPACE_MODES.listen,
  onOpenDocument,
}) {
  const grouped = groupedDocuments(documents);
  const openMode = normalizeWorkspaceMode(lastUsedMode, WORKSPACE_MODES.listen);

  function renderDocumentRow(document) {
    return (
      <div
        key={document.documentKey}
        className={`assembler-document-row assembler-document-row--picker ${
          document.documentKey === activeDocumentKey ? "is-active" : ""
        }`}
      >
        <button
          type="button"
          className="assembler-document-row__quick"
          onClick={() => onOpenDocument(document.documentKey, WORKSPACE_MODES.listen)}
          aria-label={`Listen to ${document.title}`}
        >
          <WorkspaceActionIcon kind="listen" />
        </button>
        <button
          type="button"
          className="assembler-document-row__body"
          onClick={() => onOpenDocument(document.documentKey, openMode)}
        >
          <span className="assembler-document-row__title">{document.title}</span>
          <span className="assembler-document-row__meta">
            {getDocumentBlockCountLabel(document)}
          </span>
        </button>
        <span className="assembler-document-row__badge">
          {loadingDocumentKey === document.documentKey
            ? "Loading…"
            : getDocumentKindLabel(document)}
        </span>
      </div>
    );
  }

  return (
    <div className="assembler-listen-picker">
      <div className="assembler-listen-picker__section">
        <span className="assembler-listen-picker__label">Sources</span>
        {grouped.sources.length
          ? grouped.sources.map((document) => renderDocumentRow(document))
          : <span className="assembler-listen-picker__empty">No visible sources.</span>}
      </div>

      <div className="assembler-listen-picker__section">
        <span className="assembler-listen-picker__label">Assemblies</span>
        {grouped.assemblies.length
          ? grouped.assemblies.map((document) => renderDocumentRow(document))
          : <span className="assembler-listen-picker__empty">Nothing assembled yet.</span>}
      </div>
    </div>
  );
}

function ListenSurface({
  activeDocument,
  activeDocumentWarning,
  blocks,
  currentBlockId,
  focusedBlockId,
  nextBlockId,
  onFocusBlock,
  onSwitchToAssemble,
  pickerOpen,
  onTogglePicker,
  onOpenProjectHome,
  onOpenDocument,
  projectDocuments,
  loadingDocumentKey,
  onOpenLog,
  onExportDocument,
  lastUsedMode = WORKSPACE_MODES.listen,
  isMobileLayout = false,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="assembler-listen__chrome">
        <div className="assembler-listen__topbar">
          <button
            type="button"
            className="assembler-listen__topbar-icon"
            onClick={onOpenProjectHome}
            aria-label="Back to home"
          >
            <WorkspaceActionIcon kind="back" />
          </button>

          <span className="assembler-listen__topbar-title">{activeDocument.title}</span>

          <div className="assembler-listen__topbar-actions">
            <button
              type="button"
              className={`assembler-listen__topbar-button ${pickerOpen ? "is-active" : ""}`}
              onClick={onTogglePicker}
            >
              Browse
            </button>

            <div className="assembler-listen__menu">
              <button
                type="button"
                className="assembler-listen__topbar-icon"
                onClick={() => setMenuOpen((value) => !value)}
                aria-label="More listening actions"
              >
                <WorkspaceActionIcon kind="menu" />
              </button>

              {menuOpen ? (
                <div className="assembler-listen__menu-panel">
                  <button
                    type="button"
                    className="assembler-listen__menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      onTogglePicker();
                    }}
                  >
                    Browse
                  </button>
                  <button
                    type="button"
                    className="assembler-listen__menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      onSwitchToAssemble();
                    }}
                  >
                    Assemble
                  </button>
                  <button
                    type="button"
                    className="assembler-listen__menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenLog();
                    }}
                  >
                    View Log
                  </button>
                  <button
                    type="button"
                    className="assembler-listen__menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      onExportDocument();
                    }}
                  >
                    Export Document
                  </button>
                  <Link
                    href="/account"
                    className="assembler-listen__menu-item"
                    onClick={() => setMenuOpen(false)}
                  >
                    Account
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {pickerOpen && !isMobileLayout ? (
          <ListenPicker
            documents={projectDocuments}
            activeDocumentKey={activeDocument.documentKey}
            loadingDocumentKey={loadingDocumentKey}
            lastUsedMode={lastUsedMode}
            onOpenDocument={onOpenDocument}
          />
        ) : null}
      </div>

      <section className="assembler-surface assembler-surface--listen">
        <div className="assembler-listen">
          {activeDocument.subtitle || activeDocumentWarning ? (
            <div className="assembler-listen__lead">
              {activeDocument.subtitle ? (
                <p className="assembler-listen__subtitle">{activeDocument.subtitle}</p>
              ) : null}
              {activeDocumentWarning ? (
                <p className="assembler-listen__warning">{activeDocumentWarning}</p>
              ) : null}
            </div>
          ) : null}

          <div className="assembler-listen__blocks">
            {blocks.map((block) => {
              const headingText = block.text.replace(/^#{1,6}\s+/, "");

              return (
                <article
                  key={block.id}
                  className={`assembler-listen-block is-${block.kind} ${
                    block.id === currentBlockId ? "is-playing" : ""
                  } ${block.id === nextBlockId ? "is-next" : ""} ${
                    block.id === focusedBlockId ? "is-focused" : ""
                  }`}
                  onClick={() => onFocusBlock(block.id)}
                >
                  <span className="assembler-listen-block__index">
                    {String(block.sourcePosition + 1).padStart(3, "0")}
                  </span>

                  <div className="assembler-listen-block__body">
                    {block.kind === "heading" ? (
                      <h2 className="assembler-listen-block__heading">{headingText}</h2>
                    ) : block.kind === "list" ? (
                      <div className="assembler-listen-block__text">
                        {String(block.text || "")
                          .split("\n")
                          .filter(Boolean)
                          .map((line, index) => (
                            <div key={`${block.id}-listen-line-${index}`} className="assembler-listen-block__list-line">
                              <span className="assembler-listen-block__bullet">•</span>
                              <span>{line.replace(/^[-+*]\s+/, "").trim()}</span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="assembler-listen-block__text">{headingText}</div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {isMobileLayout ? (
        <div className={`assembler-sheet assembler-sheet--browse ${pickerOpen ? "is-open" : ""}`}>
          <div className="assembler-sheet__backdrop" onClick={onTogglePicker} aria-hidden="true" />
          <div className="assembler-sheet__panel">
            <div className="assembler-sheet__header">
              <span className="assembler-sheet__title">Browse</span>
              <button
                type="button"
                className="assembler-sheet__close"
                onClick={onTogglePicker}
              >
                Done
              </button>
            </div>

            <ListenPicker
              documents={projectDocuments}
              activeDocumentKey={activeDocument.documentKey}
              loadingDocumentKey={loadingDocumentKey}
              lastUsedMode={lastUsedMode}
              onOpenDocument={(documentKey, mode) => {
                onTogglePicker();
                onOpenDocument(documentKey, mode);
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function ImageIntakeChooser({
  open = false,
  draft = null,
  pending = false,
  preferredMode = IMAGE_DERIVATION_OPTIONS[0].value,
  onChoose,
  onClose,
}) {
  if (!open || !draft) return null;

  const resolvedFilename = draft.filename || "Clipboard image";
  const resolvedMimeType =
    draft.mimeType || dataUrlMimeType(draft?.payload?.imageDataUrl || "") || "image";
  const sourceLabel = draft.source === "paste" ? "Pasted image" : "Uploaded image";

  return (
    <div className="assembler-image-chooser">
      <button
        type="button"
        className="assembler-image-chooser__backdrop"
        aria-label="Close image import chooser"
        onClick={pending ? undefined : onClose}
      />

      <div
        className="assembler-image-chooser__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-intake-title"
      >
        <div className="assembler-image-chooser__header">
          <div className="assembler-image-chooser__copy">
            <span className="assembler-sheet__eyebrow">{sourceLabel}</span>
            <h2 id="image-intake-title" className="assembler-image-chooser__title">
              Choose how to turn this image into a source
            </h2>
            <p className="assembler-image-chooser__body">
              One image becomes one source document. The original image stays attached as provenance.
            </p>
          </div>

          <button
            type="button"
            className="assembler-sheet__close"
            onClick={pending ? undefined : onClose}
            disabled={pending}
          >
            Close
          </button>
        </div>

        <div className="assembler-image-chooser__meta">
          <span>{resolvedFilename}</span>
          <span>{resolvedMimeType.replace("image/", "").toUpperCase()}</span>
        </div>

        <div className="assembler-image-chooser__actions">
          {IMAGE_DERIVATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`assembler-image-chooser__action ${
                preferredMode === option.value ? "is-primary" : ""
              }`}
              onClick={() => onChoose(option.value)}
              disabled={pending}
            >
              <span className="assembler-image-chooser__action-label">{option.shortLabel}</span>
              <span className="assembler-image-chooser__action-title">{option.label}</span>
              <span className="assembler-image-chooser__action-detail">
                {getImageDerivationDetail(option.value)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LinkIntakeChooser({
  open = false,
  draft = null,
  pending = false,
  onFetchLink,
  onPasteRaw,
  onClose,
}) {
  if (!open || !draft?.url) return null;

  return (
    <div className="assembler-image-chooser assembler-image-chooser--link">
      <button
        type="button"
        className="assembler-image-chooser__backdrop"
        aria-label="Close link import chooser"
        onClick={pending ? undefined : onClose}
      />

      <div
        className="assembler-image-chooser__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="link-intake-title"
      >
        <div className="assembler-image-chooser__header">
          <div className="assembler-image-chooser__copy">
            <span className="assembler-sheet__eyebrow">Pasted link</span>
            <h2 id="link-intake-title" className="assembler-image-chooser__title">
              Use this link as a source?
            </h2>
            <p className="assembler-image-chooser__body">
              Fetch the page behind this link and turn it into a source document, or keep only the URL text.
            </p>
          </div>

          <button
            type="button"
            className="assembler-sheet__close"
            onClick={pending ? undefined : onClose}
            disabled={pending}
          >
            Close
          </button>
        </div>

        <div className="assembler-image-chooser__meta">
          <span className="assembler-link-chooser__url">{draft.url}</span>
        </div>

        <div className="assembler-image-chooser__actions">
          <button
            type="button"
            className="assembler-image-chooser__action is-primary"
            onClick={onFetchLink}
            disabled={pending}
          >
            <span className="assembler-image-chooser__action-label">LINK → DOC</span>
            <span className="assembler-image-chooser__action-title">Fetch page from link</span>
            <span className="assembler-image-chooser__action-detail">
              Extract the readable page and keep the original URL as provenance.
            </span>
          </button>

          <button
            type="button"
            className="assembler-image-chooser__action"
            onClick={onPasteRaw}
            disabled={pending}
          >
            <span className="assembler-image-chooser__action-label">RAW TEXT</span>
            <span className="assembler-image-chooser__action-title">Keep URL as text</span>
            <span className="assembler-image-chooser__action-detail">
              Keep the link as text instead of fetching the page.
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function DropAnythingSheet({
  open = false,
  pending = false,
  onClose,
  onUpload,
  onImportFolder,
  onPaste,
  onImportLink,
}) {
  const [manualLink, setManualLink] = useState("");

  if (!open) return null;

  const normalizedLink = extractSingleUrlText(manualLink);

  return (
    <div className="assembler-image-chooser assembler-image-chooser--intake">
      <button
        type="button"
        className="assembler-image-chooser__backdrop"
        aria-label="Close intake sheet"
        onClick={pending ? undefined : onClose}
      />

      <div
        className="assembler-image-chooser__panel assembler-drop-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drop-anything-title"
      >
        <div className="assembler-image-chooser__header">
          <div className="assembler-image-chooser__copy">
            <span className="assembler-sheet__eyebrow">Import</span>
            <h2 id="drop-anything-title" className="assembler-image-chooser__title">
              Add source
            </h2>
          </div>

          <button
            type="button"
            className="assembler-sheet__close"
            onClick={pending ? undefined : onClose}
            disabled={pending}
          >
            Close
          </button>
        </div>

        <div className="assembler-drop-sheet__actions">
          <button
            type="button"
            className="assembler-drop-sheet__action is-primary"
            onClick={onUpload}
            disabled={pending}
          >
            <span className="assembler-drop-sheet__action-icon" aria-hidden="true">
              <WorkspaceActionIcon kind="upload" />
            </span>
            <span className="assembler-drop-sheet__action-copy">
              <span className="assembler-drop-sheet__action-title">Upload</span>
              <span className="assembler-drop-sheet__action-detail">Files, images, audio</span>
            </span>
          </button>

          <button
            type="button"
            className="assembler-drop-sheet__action"
            onClick={onPaste}
            disabled={pending}
          >
            <span className="assembler-drop-sheet__action-icon" aria-hidden="true">
              <WorkspaceActionIcon kind="clipboard" />
            </span>
            <span className="assembler-drop-sheet__action-copy">
              <span className="assembler-drop-sheet__action-title">Paste</span>
              <span className="assembler-drop-sheet__action-detail">Clipboard text or one link</span>
            </span>
          </button>

          <button
            type="button"
            className="assembler-drop-sheet__action"
            onClick={onImportFolder}
            disabled={pending}
          >
            <span className="assembler-drop-sheet__action-icon" aria-hidden="true">
              <WorkspaceActionIcon kind="browse" />
            </span>
            <span className="assembler-drop-sheet__action-copy">
              <span className="assembler-drop-sheet__action-title">Folder</span>
              <span className="assembler-drop-sheet__action-detail">Import a batch</span>
            </span>
          </button>
        </div>

        <div className="assembler-drop-sheet__link">
          <label className="assembler-drop-sheet__label" htmlFor="manual-link-input">
            Public link
          </label>
          <div className="assembler-drop-sheet__link-row">
            <input
              id="manual-link-input"
              className="assembler-drop-sheet__input"
              value={manualLink}
              onChange={(event) => setManualLink(event.target.value)}
              placeholder="https://example.com/article"
              disabled={pending}
              onKeyDown={(event) => {
                if (event.key === "Enter" && normalizedLink && !pending) {
                  event.preventDefault();
                  onImportLink(normalizedLink);
                }
              }}
            />
            <button
              type="button"
              className="assembler-drop-sheet__submit"
              disabled={!normalizedLink || pending}
              onClick={() => {
                if (normalizedLink) {
                  onImportLink(normalizedLink);
                }
              }}
            >
              Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VoiceRecorderDialog({
  open = false,
  phase = "idle",
  elapsedSeconds = 0,
  level = 0,
  errorMessage = "",
  onClose,
  onStart,
  onPause,
  onResume,
  onStop,
}) {
  if (!open) return null;

  const recording = phase === "recording";
  const paused = phase === "paused";
  const busy = phase === "requesting" || phase === "finishing" || phase === "transcribing";
  const meterLevel = Math.max(0, Math.min(1, Number(level || 0)));

  return (
    <div className="assembler-image-chooser assembler-image-chooser--recorder">
      <button
        type="button"
        className="assembler-image-chooser__backdrop"
        aria-label="Close recorder"
        onClick={busy ? undefined : onClose}
      />

      <div
        className="assembler-image-chooser__panel assembler-recorder"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-recorder-title"
      >
        <div className="assembler-image-chooser__header">
          <div className="assembler-image-chooser__copy">
            <span className="assembler-sheet__eyebrow">Speak</span>
            <h2 id="voice-recorder-title" className="assembler-image-chooser__title">
              Talk a document into existence
            </h2>
            <p className="assembler-image-chooser__body">
              Record a voice memo and we will turn it into a transcript source you can listen to, edit, and assemble.
            </p>
          </div>

          <button
            type="button"
            className="assembler-sheet__close"
            onClick={busy ? undefined : onClose}
            disabled={busy}
          >
            Close
          </button>
        </div>

        <div className="assembler-recorder__status">
          <span className={`assembler-recorder__dot ${recording ? "is-live" : ""} ${paused ? "is-paused" : ""}`} />
          <span className="assembler-recorder__status-label">
            {phase === "requesting"
              ? "Requesting microphone..."
              : phase === "recording"
                ? "Recording"
                : phase === "paused"
                  ? "Paused"
                  : phase === "finishing"
                    ? "Finishing recording..."
                    : phase === "transcribing"
                      ? "Transcribing..."
                      : "Ready to record"}
          </span>
          <span className="assembler-recorder__time">{formatRecordingElapsed(elapsedSeconds)}</span>
        </div>

        <div className="assembler-recorder__meter" aria-hidden="true">
          <div
            className={`assembler-recorder__meter-fill ${recording ? "is-live" : ""}`}
            style={{ width: `${Math.max(6, Math.round(meterLevel * 100))}%` }}
          />
        </div>

        {errorMessage ? (
          <p className="assembler-recorder__error">{errorMessage}</p>
        ) : null}

        <div className="assembler-recorder__actions">
          {phase === "idle" ? (
            <button
              type="button"
              className="assembler-image-chooser__action is-primary"
              onClick={onStart}
            >
              <span className="assembler-image-chooser__action-label">VOICE → DOC</span>
              <span className="assembler-image-chooser__action-title">Start recording</span>
              <span className="assembler-image-chooser__action-detail">
                Capture a voice memo and turn it into a source document immediately after you stop.
              </span>
            </button>
          ) : (
            <>
              <button
                type="button"
                className="assembler-image-chooser__action"
                onClick={paused ? onResume : onPause}
                disabled={busy || (!recording && !paused)}
              >
                <span className="assembler-image-chooser__action-label">{paused ? "RESUME" : "PAUSE"}</span>
                <span className="assembler-image-chooser__action-title">
                  {paused ? "Resume recording" : "Pause recording"}
                </span>
                <span className="assembler-image-chooser__action-detail">
                  Keep the current memo and continue when you are ready.
                </span>
              </button>

              <button
                type="button"
                className="assembler-image-chooser__action is-primary"
                onClick={onStop}
                disabled={busy || (!recording && !paused)}
              >
                <span className="assembler-image-chooser__action-label">STOP</span>
                <span className="assembler-image-chooser__action-title">
                  {phase === "transcribing" ? "Creating document..." : "Stop and create document"}
                </span>
                <span className="assembler-image-chooser__action-detail">
                  Turn this memo into a transcript source and open it in the workspace.
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SourceActionButton({
  kind,
  label,
  active = false,
  disabled = false,
  danger = false,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`assembler-icon-button ${active ? "is-active" : ""} ${danger ? "is-danger" : ""}`}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <SourceActionIcon kind={kind} />
    </button>
  );
}

function SourceCleanupTray({
  findValue,
  replaceValue,
  pendingAction = "",
  onFindChange,
  onReplaceChange,
  onReplaceAll,
  onDeleteMatches,
  onClose,
}) {
  const replaceDisabled = !findValue.trim() || Boolean(pendingAction);
  const deleteDisabled = !findValue.trim() || Boolean(pendingAction);

  return (
    <div className="assembler-cleanup">
      <input
        className="assembler-cleanup__input"
        value={findValue}
        onChange={(event) => onFindChange(event.target.value)}
        placeholder="Find"
        aria-label="Find text"
      />
      <input
        className="assembler-cleanup__input"
        value={replaceValue}
        onChange={(event) => onReplaceChange(event.target.value)}
        placeholder="Replace"
        aria-label="Replace with"
        onKeyDown={(event) => {
          if (event.key === "Enter" && !replaceDisabled) {
            event.preventDefault();
            onReplaceAll();
          }
        }}
      />
      <div className="assembler-cleanup__actions">
        <SourceActionButton
          kind="replace"
          label={pendingAction === "replace" ? "Replacing..." : "Replace all"}
          disabled={replaceDisabled}
          onClick={onReplaceAll}
        />
        <SourceActionButton
          kind="delete"
          label={pendingAction === "deleteMatches" ? "Deleting..." : "Delete matching blocks"}
          disabled={deleteDisabled}
          danger
          onClick={onDeleteMatches}
        />
        <SourceActionButton kind="close" label="Close cleanup tools" onClick={onClose} />
      </div>
    </div>
  );
}

function WorkspaceToolbar({
  activeDocument,
  viewMode,
  editMode,
  aiOpen,
  documentState,
  onReloadLatest,
  status,
  statusTone,
  onSetViewMode,
  onToggleEditMode,
  onToggleAi,
  clipboardCount = 0,
  stagedCount = 0,
  isMobileLayout = false,
  onOpenClipboard,
  isClipboardOpen = false,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const totalClipboardCount = clipboardCount + stagedCount;
  const canShowEditAction = viewMode === "doc";

  return (
    <div className={`assembler-toolbar ${isMobileLayout ? "is-mobile" : ""}`}>
      <div className="assembler-toolbar__left">
        <button
          type="button"
          className={`assembler-tab ${viewMode === "doc" ? "is-active" : ""}`}
          onClick={() => onSetViewMode("doc")}
        >
          Document
        </button>
        <button
          type="button"
          className={`assembler-tab ${viewMode === "log" ? "is-active is-log" : ""}`}
          onClick={() => onSetViewMode("log")}
        >
          Log
        </button>

        {isMobileLayout ? (
          <button
            type="button"
            className={`assembler-tab ${isClipboardOpen ? "is-active" : ""}`}
            onClick={onOpenClipboard}
          >
            {totalClipboardCount ? `Clipboard ${totalClipboardCount}` : "Clipboard"}
          </button>
        ) : viewMode === "doc" ? (
          <button
            type="button"
            className={`assembler-tab ${editMode ? "is-active is-edit" : ""}`}
            onClick={onToggleEditMode}
            disabled={!activeDocument?.isEditable}
          >
            {editMode ? "Editing" : "Edit"}
          </button>
        ) : null}
      </div>

      <div className="assembler-toolbar__right">
        {documentState ? (
          <div className={`assembler-toolbar__document-state is-${documentState.status}`}>
            <span>{documentState.message}</span>
            {documentState.status === "conflict" && onReloadLatest ? (
              <button type="button" className="assembler-tiny-button" onClick={onReloadLatest}>
                Load latest
              </button>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          className={`assembler-ai-toggle ${aiOpen ? "is-active" : ""}`}
          onClick={onToggleAi}
          aria-label={aiOpen ? "Close 7 prompt" : "Open 7 prompt"}
        >
          7
        </button>

        {isMobileLayout ? (
          canShowEditAction ? (
            <div className="assembler-toolbar__menu">
              <button
                type="button"
                className="assembler-toolbar__menu-button"
                onClick={() => setMenuOpen((value) => !value)}
                aria-label="More document actions"
              >
                <WorkspaceActionIcon kind="menu" />
              </button>

              {menuOpen ? (
                <div className="assembler-toolbar__menu-panel">
                  <button
                    type="button"
                    className="assembler-toolbar__menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      onToggleEditMode();
                    }}
                    disabled={!activeDocument?.isEditable}
                  >
                    {editMode ? "Stop Editing" : "Edit"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null
        ) : null}
      </div>

      {status ? (
        <div className={`assembler-toolbar__status ${statusTone ? `is-${statusTone}` : ""}`}>
          {status}
        </div>
      ) : null}
    </div>
  );
}

function BlockRow({
  block,
  isFocused,
  isPlaying,
  isNext,
  isSelected,
  editMode,
  canDelete = false,
  saveState,
  onFocus,
  onAdd,
  onDelete,
  onRemove,
  onEdit,
  blockRef,
}) {
  return (
    <article
      ref={blockRef}
      className={`assembler-block is-${block.kind} ${
        isFocused ? "is-focused" : ""
      } ${isPlaying ? "is-playing" : ""} ${isNext ? "is-next" : ""} ${
        isSelected ? "is-selected" : ""
      } ${block.author === "ai" ? "is-ai" : ""} ${
        block.operation === "edited" ? "is-edited" : ""
      }`}
      onClick={() => onFocus(block.id)}
      data-block-id={block.id}
    >
      <div className="assembler-block__stripe" aria-hidden="true" />

      <div className="assembler-block__select">
        {isSelected ? (
          <button
            type="button"
            className="assembler-block__toggle is-selected"
            onClick={(event) => {
              event.stopPropagation();
              onRemove(block.id);
            }}
          >
            −
          </button>
        ) : (
          <button
            type="button"
            className="assembler-block__toggle"
            onClick={(event) => {
              event.stopPropagation();
              onAdd(block);
            }}
          >
            +
          </button>
        )}

        {canDelete ? (
          <button
            type="button"
            className="assembler-block__icon assembler-block__icon--danger"
            aria-label={`Delete block ${block.sourcePosition + 1}`}
            title={`Delete block ${block.sourcePosition + 1}`}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(block.id);
            }}
          >
            <SourceActionIcon kind="delete" />
          </button>
        ) : null}
      </div>

      <div className="assembler-block__body">
        <div className="assembler-block__meta">
          <span>{String(block.sourcePosition + 1).padStart(3, "0")}</span>
          <span>{block.sectionLabel || block.sourceTitle || block.sourceDocumentKey}</span>
          <span>{block.author === "ai" ? "AI" : block.operation}</span>
        </div>

        {editMode && block.isEditable ? (
          <BlockEditor
            key={`${block.id}:${block.updatedAt || block.text}`}
            block={block}
            saveState={saveState}
            onEdit={onEdit}
          />
        ) : block.kind === "list" ? (
          <div className="assembler-block__text">
            {String(block.text || "")
              .split("\n")
              .filter(Boolean)
              .map((line, index) => (
                <div key={`${block.id}-line-${index}`} className="assembler-block__list-line">
                  <span className="assembler-block__bullet">•</span>
                  <span>{line.replace(/^[-+*]\s+/, "").trim()}</span>
                </div>
              ))}
          </div>
        ) : (
          <div className="assembler-block__text">{block.text.replace(/^#{1,6}\s+/, "")}</div>
        )}

        {block.author === "ai" ? (
          <span className="assembler-block__badge">AI-GENERATED · {block.operation}</span>
        ) : null}
      </div>
    </article>
  );
}

function BlockEditor({ block, saveState, onEdit }) {
  const [draftText, setDraftText] = useState(block.text);

  return (
    <div className="assembler-block__editor-wrap">
      <textarea
        className="assembler-block__editor"
        value={draftText}
        onChange={(event) => setDraftText(event.target.value)}
        onClick={(event) => event.stopPropagation()}
        onBlur={() => onEdit(block.id, draftText)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            void onEdit(block.id, draftText);
            event.currentTarget.blur();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            setDraftText(block.text);
            event.currentTarget.blur();
          }
        }}
      />

      <div className={`assembler-block__editor-status is-${saveState || "idle"}`}>
        {saveState === "saving"
          ? "Saving..."
          : saveState === "saved"
            ? "Saved"
            : saveState === "conflict"
              ? "Reload latest before saving again"
              : saveState === "error"
                ? "Not saved"
                : "Blur or Cmd/Ctrl+Enter to save"}
      </div>
    </div>
  );
}

function LogView({
  logEntries,
  receiptPending,
  onCreateReceipt,
  onExportReceipt,
  onExportDocument,
}) {
  return (
    <div className="assembler-log">
      <div className="assembler-log__top">
        <div className="assembler-log__header">
          RECEIPT LOG · {logEntries.length} entr{logEntries.length === 1 ? "y" : "ies"}
        </div>
        <div className="assembler-log__actions">
          <button type="button" className="assembler-tiny-button" onClick={onCreateReceipt}>
            {receiptPending ? "Drafting..." : "Draft receipt"}
          </button>
          <button type="button" className="assembler-tiny-button" onClick={onExportReceipt}>
            Export log
          </button>
          <button type="button" className="assembler-tiny-button" onClick={onExportDocument}>
            Export doc
          </button>
        </div>
      </div>

      {logEntries.length ? (
        logEntries.map((entry) => (
          <div key={entry.id} className="assembler-log__row">
            <span className="assembler-log__time">{formatWorkspaceLogTime(entry.time)}</span>
            <span
              className="assembler-log__action"
              style={{ color: getWorkspaceLogActionColor(entry.action) }}
            >
              {entry.action}
            </span>
            <span className="assembler-log__detail">{entry.detail}</span>
          </div>
        ))
      ) : (
        <p className="assembler-log__empty">No visible receipt events yet.</p>
      )}
    </div>
  );
}

function AiBar({
  inputRef,
  value,
  scope,
  pending,
  stagedBlocks,
  onChange,
  onScopeChange,
  onSubmit,
  onPreset,
  onAcceptStagedBlock,
  onAcceptAllStagedBlocks,
  onClearStagedBlocks,
  onClose,
}) {
  return (
    <div className="assembler-ai">
      <div className="assembler-ai__presets">
        {["extract", "summarize", "synthesize", "evidence search"].map((label) => (
          <button
            key={label}
            type="button"
            className="assembler-ai__preset"
            onClick={() => onPreset(label)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="assembler-ai__scope" role="tablist" aria-label="AI scope">
        {AI_SCOPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`assembler-ai__scope-button ${scope === option.value ? "is-active" : ""}`}
            onClick={() => onScopeChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="assembler-ai__field">
        <span className="assembler-ai__prompt">&gt;</span>
        <input
          ref={inputRef}
          className="assembler-ai__input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSubmit();
            }
          }}
          placeholder={pending ? "thinking..." : getAiPlaceholder(scope)}
          disabled={pending}
        />
        <button
          type="button"
          className="assembler-ai__run"
          disabled={!value.trim() || pending}
          onClick={onSubmit}
        >
          {pending ? "..." : "RUN"}
        </button>
        <button type="button" className="assembler-ai__close" onClick={onClose}>
          CLOSE
        </button>
      </div>

      {stagedBlocks.length ? (
        <div className="assembler-ai__results" aria-live="polite">
          <div className="assembler-ai__results-head">
            <span>RESULT · {stagedBlocks.length}</span>
            <div className="assembler-ai__results-actions">
              <button type="button" className="assembler-tiny-button" onClick={onAcceptAllStagedBlocks}>
                Add all
              </button>
              <button type="button" className="assembler-tiny-button" onClick={onClearStagedBlocks}>
                Clear
              </button>
            </div>
          </div>

          <div className="assembler-ai__results-list">
            {stagedBlocks.map((block, index) => (
              <div key={block.id} className="assembler-ai__result-row">
                <span className="assembler-ai__result-index">AI</span>
                <span className="assembler-ai__result-text">{block.plainText || block.text}</span>
                <button
                  type="button"
                  className="assembler-tiny-button"
                  onClick={() => onAcceptStagedBlock(index)}
                >
                  +
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ClipboardTray({
  expanded,
  stagedBlocks,
  clipboard,
  documents,
  onToggleExpanded,
  onAcceptStagedBlock,
  onAcceptAllStagedBlocks,
  onClearStagedBlocks,
  onRemoveClipboardIndex,
  onReorderClipboard,
  onClearClipboard,
  onAssemble,
}) {
  const sourceCount = new Set(
    clipboard.map((block) => block.sourceDocumentKey || block.documentKey).filter(Boolean),
  ).size;

  function getDocumentTitle(documentKey) {
    return (
      documents.find((document) => document.documentKey === documentKey)?.title ||
      documentKey ||
      "document"
    );
  }

  return (
    <div className="assembler-clipboard">
      <div className="assembler-clipboard__header" onClick={onToggleExpanded}>
        <span>
          Clipboard
          {stagedBlocks.length
            ? ` · ${stagedBlocks.length} AI`
            : ""}
          {` · ${clipboard.length} block${clipboard.length === 1 ? "" : "s"} from ${sourceCount} doc${sourceCount === 1 ? "" : "s"}`}
        </span>
        <span>{expanded ? "▼" : "▶"}</span>
      </div>

      {expanded ? (
        <div className="assembler-clipboard__body">
          {stagedBlocks.length ? (
            <div className="assembler-clipboard__section">
              <div className="assembler-clipboard__section-head">
                <span>AI staging · {stagedBlocks.length}</span>
                <div className="assembler-clipboard__section-actions">
                  <button type="button" className="assembler-tiny-button" onClick={onAcceptAllStagedBlocks}>
                    Add all
                  </button>
                  <button type="button" className="assembler-tiny-button" onClick={onClearStagedBlocks}>
                    Clear
                  </button>
                </div>
              </div>

              {stagedBlocks.map((block, index) => (
                <div key={block.id} className="assembler-clipboard__row is-staged">
                  <span className="assembler-clipboard__index">AI</span>
                  <span className="assembler-clipboard__text">{block.plainText || block.text}</span>
                  <button
                    type="button"
                    className="assembler-tiny-button"
                    onClick={() => onAcceptStagedBlock(index)}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="assembler-clipboard__section">
            <div className="assembler-clipboard__section-head">
              <span>Selected blocks</span>
              <div className="assembler-clipboard__section-actions">
                <button type="button" className="assembler-tiny-button" onClick={onAssemble}>
                  Assemble
                </button>
                <button type="button" className="assembler-tiny-button" onClick={onClearClipboard}>
                  Clear
                </button>
              </div>
            </div>

            {clipboard.length ? (
              clipboard.map((block, index) => (
                <div key={`${block.id}-${index}`} className="assembler-clipboard__row">
                  <span className="assembler-clipboard__index">{index + 1}</span>
                  <span className="assembler-clipboard__source">
                    [{getDocumentTitle(block.sourceDocumentKey || block.documentKey)}]
                  </span>
                  <span className="assembler-clipboard__text">{block.plainText || block.text}</span>
                  <button
                    type="button"
                    className="assembler-tiny-button"
                    disabled={index === 0}
                    onClick={() => onReorderClipboard(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="assembler-tiny-button"
                    disabled={index === clipboard.length - 1}
                    onClick={() => onReorderClipboard(index, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="assembler-tiny-button is-danger"
                    onClick={() => onRemoveClipboardIndex(index)}
                  >
                    −
                  </button>
                </div>
              ))
            ) : (
              <p className="assembler-clipboard__empty">
                Add blocks here to build a new document.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MobileComposeSheet({
  open = false,
  clipboard,
  stagedBlocks,
  documents,
  onClose,
  onAcceptStagedBlock,
  onAcceptAllStagedBlocks,
  onClearStagedBlocks,
  onRemoveClipboardIndex,
  onReorderClipboard,
  onClearClipboard,
  onAssemble,
}) {
  const sourceCount = new Set(
    clipboard.map((block) => block.sourceDocumentKey || block.documentKey).filter(Boolean),
  ).size;

  function getDocumentTitle(documentKey) {
    return (
      documents.find((document) => document.documentKey === documentKey)?.title ||
      documentKey ||
      "document"
    );
  }

  return (
    <div className={`assembler-sheet assembler-sheet--compose ${open ? "is-open" : ""}`}>
      <div className="assembler-sheet__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="assembler-sheet__panel">
        <div className="assembler-sheet__header">
          <div>
            <span className="assembler-sheet__eyebrow">Clipboard</span>
            <span className="assembler-sheet__title">
              {clipboard.length} block{clipboard.length === 1 ? "" : "s"} from {sourceCount} source{sourceCount === 1 ? "" : "s"}
            </span>
          </div>
          <button
            type="button"
            className="assembler-sheet__close"
            onClick={onClose}
          >
            Done
          </button>
        </div>

        <div className="assembler-sheet__content">
          {stagedBlocks.length ? (
            <div className="assembler-sheet__section">
              <div className="assembler-sheet__section-head">
                <span>AI Staging</span>
                <div className="assembler-sheet__section-actions">
                  <button type="button" className="assembler-tiny-button" onClick={onAcceptAllStagedBlocks}>
                    Add all
                  </button>
                  <button type="button" className="assembler-tiny-button" onClick={onClearStagedBlocks}>
                    Clear
                  </button>
                </div>
              </div>

              {stagedBlocks.map((block, index) => (
                <div key={block.id} className="assembler-mobile-clipboard__row is-staged">
                  <span className="assembler-mobile-clipboard__source">AI</span>
                  <span className="assembler-mobile-clipboard__text">{block.plainText || block.text}</span>
                  <button
                    type="button"
                    className="assembler-tiny-button"
                    onClick={() => onAcceptStagedBlock(index)}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="assembler-sheet__section">
            <div className="assembler-sheet__section-head">
              <span>Selected Blocks</span>
              <button type="button" className="assembler-tiny-button" onClick={onClearClipboard}>
                Clear
              </button>
            </div>

            {clipboard.length ? (
              clipboard.map((block, index) => (
                <div key={`${block.id}-${index}`} className="assembler-mobile-clipboard__row">
                  <div className="assembler-mobile-clipboard__main">
                    <span className="assembler-mobile-clipboard__index">{index + 1}</span>
                    <span className="assembler-mobile-clipboard__source">
                      {getDocumentTitle(block.sourceDocumentKey || block.documentKey)}
                    </span>
                    <span className="assembler-mobile-clipboard__text">{block.plainText || block.text}</span>
                  </div>
                  <div className="assembler-mobile-clipboard__actions">
                    <button
                      type="button"
                      className="assembler-tiny-button"
                      disabled={index === 0}
                      onClick={() => onReorderClipboard(index, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="assembler-tiny-button"
                      disabled={index === clipboard.length - 1}
                      onClick={() => onReorderClipboard(index, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="assembler-tiny-button is-danger"
                      onClick={() => onRemoveClipboardIndex(index)}
                    >
                      −
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="assembler-sheet__empty">Add blocks here to build a new document.</p>
            )}
          </div>
        </div>

        <div className="assembler-sheet__footer">
          <button
            type="button"
            className="assembler-sheet__primary"
            disabled={!clipboard.length}
            onClick={onAssemble}
          >
            Assemble
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayerBar({
  workspaceMode = WORKSPACE_MODES.assemble,
  currentBlock,
  currentIndex,
  totalBlocks,
  isPlaying,
  loadingAudio,
  playbackAvailable,
  rate,
  voiceCatalog,
  voiceChoice,
  providerLabel,
  progress,
  deviceVoiceSupported,
  onTogglePlayback,
  onSeekBack,
  onSeekForward,
  onPreviousBlock,
  onNextBlock,
  onCycleRate,
  onVoiceChange,
}) {
  const immersive = workspaceMode === WORKSPACE_MODES.listen;
  const selectedVoiceValue = voiceChoice
    ? `${voiceChoice.provider}:${voiceChoice.voiceId || "default"}`
    : "";

  return (
    <div className={`assembler-player ${immersive ? "is-listen" : ""}`}>
      <div className="assembler-player__controls">
        {immersive ? (
          <>
            <button
              type="button"
              className="assembler-player__button"
              onClick={onPreviousBlock}
              disabled={!playbackAvailable}
            >
              PREV
            </button>
            <button
              type="button"
              className={`assembler-player__button is-primary ${isPlaying ? "is-playing" : ""}`}
              onClick={onTogglePlayback}
              disabled={!playbackAvailable}
            >
              {loadingAudio ? "..." : isPlaying ? "PAUSE" : "PLAY"}
            </button>
            <button
              type="button"
              className="assembler-player__button"
              onClick={onNextBlock}
              disabled={!playbackAvailable}
            >
              NEXT
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="assembler-player__button"
              onClick={onSeekBack}
              disabled={!playbackAvailable}
            >
              ◄10
            </button>
            <button
              type="button"
              className={`assembler-player__button is-primary ${isPlaying ? "is-playing" : ""}`}
              onClick={onTogglePlayback}
              disabled={!playbackAvailable}
            >
              {loadingAudio ? "..." : isPlaying ? "PAUSE" : "PLAY"}
            </button>
            <button
              type="button"
              className="assembler-player__button"
              onClick={onSeekForward}
              disabled={!playbackAvailable}
            >
              10►
            </button>
            <button
              type="button"
              className="assembler-player__button"
              onClick={onPreviousBlock}
              disabled={!playbackAvailable}
            >
              PREV
            </button>
            <button
              type="button"
              className="assembler-player__button"
              onClick={onNextBlock}
              disabled={!playbackAvailable}
            >
              NEXT
            </button>
          </>
        )}
      </div>

      <div className="assembler-player__progress">
        <span className="assembler-player__counter">
          {totalBlocks ? `${currentIndex + 1}/${totalBlocks}` : "0/0"}
        </span>
        <div className="assembler-player__rail">
          <div
            className="assembler-player__fill"
            style={{ width: `${Number.isFinite(progress) ? progress : 0}%` }}
          />
        </div>
      </div>

      <div className="assembler-player__meta">
        <button type="button" className="assembler-player__button" onClick={onCycleRate}>
          {rate.toFixed(2).replace(/\.00$/, "")}x
        </button>

        <select
          className="assembler-player__select"
          value={selectedVoiceValue}
          onChange={(event) => {
            const [provider, voiceId] = event.target.value.split(":");
            onVoiceChange(
              voiceCatalog.find(
                (entry) =>
                  entry.provider === provider &&
                  String(entry.voiceId || "default") === String(voiceId || "default"),
              ) || voiceCatalog[0],
            );
          }}
          disabled={!voiceCatalog.length}
        >
          {voiceCatalog.map((entry) => (
            <option key={`${entry.provider}:${entry.voiceId || "default"}`} value={`${entry.provider}:${entry.voiceId || "default"}`}>
              {entry.label}
            </option>
          ))}
        </select>

        <span className="assembler-player__status">
          {!playbackAvailable
            ? deviceVoiceSupported
              ? "Voice unavailable"
              : "Device voice unavailable in this browser"
            : `${providerLabel} · ${
                currentBlock ? `block ${currentBlock.sourcePosition + 1}` : "idle"
              }`}
        </span>
      </div>
    </div>
  );
}

function formatAudioErrorMessage(message) {
  const normalized = String(message || "").trim().toLowerCase();

  if (!normalized) {
    return "Couldn't play this section. Try again.";
  }

  if (normalized.includes("disturbed or locked")) {
    return "Couldn't play this section. Try again.";
  }

  if (normalized.includes("quota")) {
    return "Voice is unavailable right now. Try again in a moment.";
  }

  if (normalized.includes("rate limit")) {
    return "Voice is busy right now. Try again in a moment.";
  }

  return "Couldn't play this section. Try again.";
}

export default function WorkspaceShell({
  userId,
  documents,
  projects,
  projectDrafts = [],
  initialDocument,
  initialProjectKey = DEFAULT_PROJECT_KEY,
  initialMode = "",
  voiceCatalog,
  defaultVoiceChoice,
  showLaunchpadInitially = false,
  resumeSessionSummary = null,
}) {
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const aiInputRef = useRef(null);
  const blockRefs = useRef({});
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingAnimationFrameRef = useRef(null);
  const recordingAnalyserRef = useRef(null);
  const recordingAudioContextRef = useRef(null);
  const closeVoiceRecorderRef = useRef(() => {});
  const speechUtteranceRef = useRef(null);
  const speechRunIdRef = useRef(0);
  const playbackStateRef = useRef({ active: false, kind: null, paused: false });
  const storageHydratedRef = useRef(false);
  const pasteIntoWorkspaceRef = useRef(null);
  const pendingFocusBlockIdRef = useRef(null);
  const activeDocumentRef = useRef(initialDocument);
  const blocksRef = useRef(initialDocument.blocks || []);
  const rateRef = useRef(1);
  const voiceChoiceRef = useRef(defaultVoiceChoice);
  const documentLogsRef = useRef(createInitialDocumentLogMap([initialDocument]));

  const storageKey = `document-assembler:${userId}:workspace`;

  const [documentsState, setDocumentsState] = useState(() => sortDocuments(documents));
  const [projectsState, setProjectsState] = useState(() =>
    Array.isArray(projects) && projects.length ? projects : buildProjectsFromDocuments(documents),
  );
  const requestedWorkspaceMode = normalizeWorkspaceMode(initialMode || "", "");
  const [activeProjectKey, setActiveProjectKey] = useState(
    initialProjectKey || projects?.[0]?.projectKey || DEFAULT_PROJECT_KEY,
  );
  const [documentCache, setDocumentCache] = useState({
    [initialDocument.documentKey]: initialDocument,
  });
  const [documentLogs, setDocumentLogs] = useState(() =>
    createInitialDocumentLogMap([initialDocument]),
  );
  const [documentStates, setDocumentStates] = useState({});
  const [deviceVoiceSupported, setDeviceVoiceSupported] = useState(false);
  const [activeDocumentKey, setActiveDocumentKey] = useState(initialDocument.documentKey);
  const [workspaceMode, setWorkspaceMode] = useState(
    normalizeWorkspaceMode(requestedWorkspaceMode, WORKSPACE_MODES.assemble),
  );
  const [viewMode, setViewMode] = useState("doc");
  const [editMode, setEditMode] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [clipboard, setClipboard] = useState([]);
  const [stagedAiBlocks, setStagedAiBlocks] = useState([]);
  const [clipboardExpanded, setClipboardExpanded] = useState(true);
  const [aiScope, setAiScope] = useState("document");
  const [focusBlockId, setFocusBlockId] = useState(initialDocument.blocks[0]?.id || null);
  const [playheadBlockId, setPlayheadBlockId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [rate, setRate] = useState(1);
  const [voiceChoice, setVoiceChoice] = useState(defaultVoiceChoice || voiceCatalog[0] || null);
  const [providerLabel, setProviderLabel] = useState(
    defaultVoiceChoice?.label || voiceCatalog[0]?.label || "Voice",
  );
  const [loadingDocumentKey, setLoadingDocumentKey] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pastePendingMode, setPastePendingMode] = useState("");
  const [preferredImageDerivationMode, setPreferredImageDerivationMode] = useState(
    IMAGE_DERIVATION_OPTIONS[0].value,
  );
  const [pendingImageIntake, setPendingImageIntake] = useState(null);
  const [pendingLinkIntake, setPendingLinkIntake] = useState(null);
  const [dropActive, setDropActive] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiPending, setAiPending] = useState(false);
  const [receiptPending, setReceiptPending] = useState(false);
  const [polishPending, setPolishPending] = useState(false);
  const [cleanupPendingAction, setCleanupPendingAction] = useState("");
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleanupFind, setCleanupFind] = useState("");
  const [cleanupReplace, setCleanupReplace] = useState("");
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState("");
  const [lastModeByProjectKey, setLastModeByProjectKey] = useState({});
  const [blockSaveStates, setBlockSaveStates] = useState({});
  const [projectDraftsState, setProjectDraftsState] = useState(projectDrafts);
  const [projectActionPending, setProjectActionPending] = useState("");
  const [launchpadOpen, setLaunchpadOpen] = useState(showLaunchpadInitially);
  const [listenPickerOpen, setListenPickerOpen] = useState(false);
  const [workspacePickerOpen, setWorkspacePickerOpen] = useState(false);
  const [dropAnythingOpen, setDropAnythingOpen] = useState(false);
  const [mobileComposeOpen, setMobileComposeOpen] = useState(false);
  const [mobileSourceToolsOpen, setMobileSourceToolsOpen] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState("idle");
  const [voiceRecorderOpen, setVoiceRecorderOpen] = useState(false);
  const [voiceRecorderPhase, setVoiceRecorderPhase] = useState("idle");
  const [voiceRecorderElapsed, setVoiceRecorderElapsed] = useState(0);
  const [voiceRecorderLevel, setVoiceRecorderLevel] = useState(0);
  const [voiceRecorderError, setVoiceRecorderError] = useState("");
  const [resumeSessionSummaryState, setResumeSessionSummaryState] = useState(
    resumeSessionSummary,
  );

  const hydratedProjects = hydrateProjectsWithDocuments(projectsState, documentsState);
  const activeProject =
    getProjectByKey(hydratedProjects, activeProjectKey) ||
    hydratedProjects[0] ||
    null;
  const projectDocuments = getProjectDocuments(documentsState, activeProject);
  const availableVoiceCatalog = voiceCatalog.filter(
    (entry) =>
      entry.provider !== VOICE_PROVIDERS.device || deviceVoiceSupported,
  );
  const resolvedVoiceChoice =
    availableVoiceCatalog.find(
      (entry) =>
        entry.provider === voiceChoice?.provider &&
        String(entry.voiceId || "") === String(voiceChoice?.voiceId || ""),
    ) ||
    availableVoiceCatalog.find(
      (entry) =>
        entry.provider === defaultVoiceChoice?.provider &&
        String(entry.voiceId || "") === String(defaultVoiceChoice?.voiceId || ""),
    ) ||
    availableVoiceCatalog[0] ||
    null;
  const playbackAvailable = availableVoiceCatalog.length > 0;
  const activeDocumentBase = documentCache[activeDocumentKey] || initialDocument;
  const activeDocument = applyDocumentLogState(activeDocumentBase, documentLogs);
  const blocks = activeDocument?.blocks ?? EMPTY_BLOCKS;
  const activeDocumentState = documentStates[activeDocumentKey] || null;
  const activeDocumentWarning = getPrimaryDiagnosticMessage({
    diagnostics: activeDocument?.intakeDiagnostics,
  });
  const activeDocumentAsset =
    getPrimarySourceAsset(activeDocument, "image") ||
    getPrimarySourceAsset(activeDocument, "link") ||
    getPrimarySourceAsset(activeDocument, "audio") ||
    getPrimarySourceAsset(activeDocument);
  const canPolishActiveDocument =
    Boolean(activeDocument?.documentKey) &&
    !activeDocument?.isAssembly &&
    activeDocument?.documentType !== "assembly";
  const canManageActiveSource =
    Boolean(activeDocument?.documentKey) &&
    !activeDocument?.isAssembly &&
    activeDocument?.documentType !== "assembly" &&
    Boolean(activeDocument?.isEditable);
  const focusedBlock =
    blocks.find((block) => block.id === focusBlockId) || blocks[0] || null;
  const playbackBlockId = playheadBlockId || focusBlockId || blocks[0]?.id || null;
  const firstBlockId = blocks[0]?.id || null;
  const currentIndex = Math.max(
    0,
    blocks.findIndex((block) => block.id === playbackBlockId),
  );
  const currentBlock = blocks[currentIndex] || null;
  const nextBlock = blocks[currentIndex + 1] || null;
  const progress = blocks.length ? ((currentIndex + 1) / blocks.length) * 100 : 0;
  const isListenMode = workspaceMode === WORKSPACE_MODES.listen;
  const lastUsedMode =
    normalizeWorkspaceMode(lastModeByProjectKey[activeProjectKey], workspaceMode) ||
    workspaceMode;

  activeDocumentRef.current = activeDocument;
  blocksRef.current = blocks;
  rateRef.current = rate;
  voiceChoiceRef.current = resolvedVoiceChoice;
  documentLogsRef.current = documentLogs;

  const persistListeningSession = useCallback(async (
    status = "paused",
    {
      documentKey = activeDocument.documentKey,
      block = currentBlock || focusedBlock || blocks[0] || null,
    } = {},
  ) => {
    if (!documentKey) return;

    try {
      await fetch("/api/reader/listening-session", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentKey,
          mode: "flow",
          activeNodeId: block?.id || null,
          activeSectionSlug: block?.sectionSlug || null,
          rate,
          provider: resolvedVoiceChoice?.provider || null,
          voiceId: resolvedVoiceChoice?.voiceId || null,
          status,
          preferredVoiceProvider: resolvedVoiceChoice?.provider || undefined,
          preferredVoiceId: resolvedVoiceChoice?.voiceId || undefined,
          preferredListeningRate: rate,
        }),
      });

      if (status === "active" || status === "paused") {
        setResumeSessionSummaryState({
          documentKey,
          title:
            documentsState.find((document) => document.documentKey === documentKey)?.title ||
            activeDocument.title,
          subtitle:
            documentsState.find((document) => document.documentKey === documentKey)?.subtitle ||
            activeDocument.subtitle ||
            "",
          status,
          blockId: block?.id || null,
          blockPosition:
            typeof block?.sourcePosition === "number" ? block.sourcePosition + 1 : 1,
          totalBlocks:
            documentsState.find((document) => document.documentKey === documentKey)?.sectionCount ||
            blocks.length,
          updatedAt: new Date().toISOString(),
        });
      } else if (resumeSessionSummaryState?.documentKey === documentKey) {
        setResumeSessionSummaryState(null);
      }
    } catch {
      // Session persistence is additive; do not interrupt the core workspace flow.
    }
  }, [
    activeDocument.documentKey,
    activeDocument.subtitle,
    activeDocument.title,
    blocks,
    currentBlock,
    documentsState,
    focusedBlock,
    rate,
    resolvedVoiceChoice?.provider,
    resolvedVoiceChoice?.voiceId,
    resumeSessionSummaryState?.documentKey,
  ]);

  useEffect(() => {
    if (storageHydratedRef.current) return;
    storageHydratedRef.current = true;

    const stored = readWorkspaceState(storageKey);
    if (!stored) return;

    setClipboard(
      normalizeWorkspaceBlocks(stored.clipboard, {
        documentKey: activeDocument.documentKey,
        defaultSourceDocumentKey: activeDocument.documentKey,
        defaultIsEditable: true,
      }),
    );
    if (stored.documentLogs && typeof stored.documentLogs === "object") {
      setDocumentLogs((previous) =>
        Object.entries(stored.documentLogs).reduce((next, [documentKey, entries]) => {
          return mergeDocumentLogEntries(next, documentKey, normalizeWorkspaceLogEntries(entries, documentKey));
        }, previous),
      );
    }
    setRate(clampListeningRate(stored.rate, 1));
    setPreferredImageDerivationMode(
      normalizePreferredImageDerivationMode(stored.preferredImageDerivationMode),
    );
    if (stored.lastModeByProjectKey && typeof stored.lastModeByProjectKey === "object") {
      setLastModeByProjectKey(stored.lastModeByProjectKey);
    }
    if (!requestedWorkspaceMode && stored.lastModeByProjectKey?.[activeProjectKey]) {
      setWorkspaceMode(
        normalizeWorkspaceMode(stored.lastModeByProjectKey[activeProjectKey], WORKSPACE_MODES.assemble),
      );
    }

  }, [storageKey, voiceCatalog, defaultVoiceChoice, activeDocument.documentKey, activeProjectKey, requestedWorkspaceMode]);

  useEffect(() => {
    setDeviceVoiceSupported(browserSupportsDeviceVoice());
  }, []);

  useEffect(() => {
    if (!folderInputRef.current) return;

    folderInputRef.current.setAttribute("webkitdirectory", "");
    folderInputRef.current.setAttribute("directory", "");
  }, []);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      if (recordingAnimationFrameRef.current) {
        window.cancelAnimationFrame(recordingAnimationFrameRef.current);
        recordingAnimationFrameRef.current = null;
      }

      if (mediaRecorderRef.current?.state && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      if (recordingAudioContextRef.current) {
        recordingAudioContextRef.current.close().catch(() => {});
        recordingAudioContextRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(max-width: 820px)");
    const updateLayout = () => setIsMobileLayout(mediaQuery.matches);
    updateLayout();
    mediaQuery.addEventListener("change", updateLayout);
    return () => mediaQuery.removeEventListener("change", updateLayout);
  }, []);

  useEffect(() => {
    setResumeSessionSummaryState(resumeSessionSummary);
  }, [resumeSessionSummary]);

  useEffect(() => {
    if (!resolvedVoiceChoice && voiceChoice) {
      setVoiceChoice(null);
      setProviderLabel("Voice");
      return;
    }

    if (
      resolvedVoiceChoice &&
      (resolvedVoiceChoice.provider !== voiceChoice?.provider ||
        String(resolvedVoiceChoice.voiceId || "") !== String(voiceChoice?.voiceId || ""))
    ) {
      setVoiceChoice(resolvedVoiceChoice);
      setProviderLabel(resolvedVoiceChoice.label);
    }
  }, [resolvedVoiceChoice, voiceChoice]);

  useEffect(() => {
    if (!activeProject) return;
    if (activeProject.projectKey === activeProjectKey) return;
    setActiveProjectKey(activeProject.projectKey);
  }, [activeProject, activeProjectKey]);

  useEffect(() => {
    if (!activeProject) return;

    const projectDocumentKeys = new Set(activeProject.documentKeys || []);
    if (!projectDocumentKeys.size) return;

    if (!projectDocumentKeys.has(activeDocumentKey)) {
      const fallbackDocumentKey =
        workspaceMode === WORKSPACE_MODES.listen
          ? getProjectListenDocumentKey(activeProject, projectDocuments)
          : getProjectEntryDocumentKey(activeProject);
      if (fallbackDocumentKey && fallbackDocumentKey !== activeDocumentKey) {
        startTransition(() => {
          setActiveDocumentKey(fallbackDocumentKey);
        });

        if (typeof window !== "undefined") {
          window.history.replaceState(
            {},
            "",
            buildWorkspaceUrl(fallbackDocumentKey, activeProject.projectKey, {
              mode: workspaceMode,
            }),
          );
        }
      }
    }
  }, [activeProject, activeDocumentKey, projectDocuments, workspaceMode]);

  useEffect(() => {
    setLastModeByProjectKey((previous) => {
      if (previous[activeProjectKey] === workspaceMode) {
        return previous;
      }

      return {
        ...previous,
        [activeProjectKey]: workspaceMode,
      };
    });
  }, [activeProjectKey, workspaceMode]);

  useEffect(() => {
    if (
      launchpadOpen ||
      !storageHydratedRef.current ||
      !activeDocumentKey ||
      typeof window === "undefined"
    ) {
      return;
    }

    window.history.replaceState(
      {},
      "",
      buildWorkspaceUrl(activeDocumentKey, activeProjectKey, {
        mode: workspaceMode,
      }),
    );
  }, [activeDocumentKey, activeProjectKey, launchpadOpen, workspaceMode]);

  useEffect(() => {
    writeWorkspaceState(storageKey, {
      clipboard,
      documentLogs,
      rate,
      preferredImageDerivationMode,
      lastModeByProjectKey,
    });
  }, [clipboard, documentLogs, rate, storageKey, preferredImageDerivationMode, lastModeByProjectKey]);

  useEffect(() => {
    const pendingFocusBlockId = pendingFocusBlockIdRef.current;
    const availableBlocks = blocksRef.current;
    const resolvedFocusBlockId =
      availableBlocks.find((block) => block.id === pendingFocusBlockId)?.id || firstBlockId;

    setFocusBlockId(resolvedFocusBlockId);
    setPlayheadBlockId(resolvedFocusBlockId);
    setEditMode(false);
    setBlockSaveStates({});
    setCleanupOpen(false);
    setCleanupFind("");
    setCleanupReplace("");
    setCleanupPendingAction("");
    setListenPickerOpen(false);
    setWorkspacePickerOpen(false);
    setDropAnythingOpen(false);
    setVoiceRecorderOpen(false);
    setVoiceRecorderPhase("idle");
    setVoiceRecorderElapsed(0);
    setVoiceRecorderLevel(0);
    setVoiceRecorderError("");
    setMobileComposeOpen(false);
    setMobileSourceToolsOpen(false);
    pendingFocusBlockIdRef.current = null;
  }, [activeDocumentKey, firstBlockId]);

  useEffect(() => {
    if (!aiOpen) return;
    aiInputRef.current?.focus();
  }, [aiOpen]);

  useEffect(() => {
    if (!currentBlock?.id) return;
    const element = blockRefs.current[currentBlock.id];
    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [currentBlock?.id]);

  useEffect(
    () => () => {
      playbackStateRef.current.active = false;

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }

      if (browserSupportsDeviceVoice()) {
        window.speechSynthesis.cancel();
      }
    },
    [],
  );

  useEffect(() => {
    if (!status) return;

    const timeoutId = window.setTimeout(() => {
      setStatus("");
      setStatusTone("");
    }, STATUS_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [status]);

  useEffect(() => {
    if (workspaceMode !== WORKSPACE_MODES.listen) return undefined;
    if (playbackStatus !== "active" && playbackStatus !== "paused") return undefined;

    const block = currentBlock || focusedBlock || blocks[0] || null;
    const timeoutId = window.setTimeout(() => {
      void persistListeningSession(playbackStatus, {
        documentKey: activeDocument.documentKey,
        block,
      });
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [
    activeDocument.documentKey,
    blocks,
    currentBlock,
    focusedBlock,
    playbackStatus,
    persistListeningSession,
    rate,
    resolvedVoiceChoice,
    workspaceMode,
  ]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (
        event.key === "/" &&
        workspaceMode === WORKSPACE_MODES.assemble &&
        !launchpadOpen &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isTypingTarget(event.target)
      ) {
        event.preventDefault();
        setAiOpen(true);
        return;
      }

      if (event.key === "Escape" && listenPickerOpen) {
        setListenPickerOpen(false);
        return;
      }

      if (event.key === "Escape" && workspacePickerOpen) {
        setWorkspacePickerOpen(false);
        return;
      }

      if (event.key === "Escape" && dropAnythingOpen) {
        setDropAnythingOpen(false);
        return;
      }

      if (event.key === "Escape" && voiceRecorderOpen) {
        closeVoiceRecorderRef.current?.();
        return;
      }

      if (event.key === "Escape" && mobileComposeOpen) {
        setMobileComposeOpen(false);
        return;
      }

      if (event.key === "Escape" && aiOpen) {
        setAiOpen(false);
      }

      if (event.key === "Escape" && pendingImageIntake && !uploading && !pastePendingMode) {
        setPendingImageIntake(null);
      }

      if (event.key === "Escape" && pendingLinkIntake && !uploading && !pastePendingMode) {
        setPendingLinkIntake(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [aiOpen, launchpadOpen, listenPickerOpen, workspacePickerOpen, dropAnythingOpen, voiceRecorderOpen, mobileComposeOpen, pendingImageIntake, pendingLinkIntake, pastePendingMode, uploading, workspaceMode]);

  useEffect(() => {
    async function handlePaste(event) {
      if (pastePendingMode) return;
      if (isTypingTarget(event.target)) return;

      try {
        const payload = await getClipboardPayloadFromPasteEvent(event);
        if (!payload) return;

        event.preventDefault();
        void pasteIntoWorkspaceRef.current?.("clipboard", payload);
      } catch {
        // Ignore malformed clipboard payloads here and let explicit paste actions handle errors.
      }
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [pastePendingMode]);

  function setFeedback(message, tone = "") {
    setStatus(message);
    setStatusTone(tone);
  }

  function setDocumentState(documentKey, nextState = null) {
    if (!documentKey) return;

    setDocumentStates((previous) => {
      if (!nextState) {
        if (!(documentKey in previous)) return previous;
        const next = { ...previous };
        delete next[documentKey];
        return next;
      }

      return {
        ...previous,
        [documentKey]: nextState,
      };
    });
  }

  function updateUrl(
    documentKey,
    projectKey = activeProjectKey,
    options = {},
  ) {
    if (typeof window === "undefined") return;
    const nextUrl = buildWorkspaceUrl(documentKey, projectKey, {
      mode: workspaceMode,
      ...options,
    });
    window.history.replaceState({}, "", nextUrl);
  }

  function attachDocumentToActiveProject(document, { role = "SOURCE", setAsCurrentAssembly = false } = {}) {
    if (!document?.documentKey) return;

    setProjectsState((previous) =>
      previous.map((project) => {
        if (project.projectKey !== activeProjectKey) {
          return project;
        }

        const nextDocumentKeys = Array.from(
          new Set([...(Array.isArray(project.documentKeys) ? project.documentKeys : []), document.documentKey]),
        );
        const nextSourceDocumentKeys =
          role === "SOURCE"
            ? Array.from(
                new Set([
                  ...(Array.isArray(project.sourceDocumentKeys) ? project.sourceDocumentKeys : []),
                  document.documentKey,
                ]),
              )
            : Array.isArray(project.sourceDocumentKeys)
              ? project.sourceDocumentKeys
              : [];
        const nextAssemblyDocumentKeys =
          role === "ASSEMBLY"
            ? Array.from(
                new Set([
                  ...(Array.isArray(project.assemblyDocumentKeys) ? project.assemblyDocumentKeys : []),
                  document.documentKey,
                ]),
              )
            : Array.isArray(project.assemblyDocumentKeys)
              ? project.assemblyDocumentKeys
              : [];

        return {
          ...project,
          documentKeys: nextDocumentKeys,
          sourceDocumentKeys: nextSourceDocumentKeys,
          assemblyDocumentKeys: nextAssemblyDocumentKeys,
          currentAssemblyDocumentKey: setAsCurrentAssembly
            ? document.documentKey
            : project.currentAssemblyDocumentKey,
          subtitle: setAsCurrentAssembly
            ? `Current assembly: ${document.title}`
            : project.subtitle,
          updatedAt: document.updatedAt || new Date().toISOString(),
        };
      }),
    );
  }

  function upsertProjectDraft(draft) {
    if (!draft?.id) return;

    setProjectDraftsState((previous) => {
      const remaining = previous.filter((entry) => entry.id !== draft.id);
      return [draft, ...remaining].slice(0, 6);
    });
  }

  function openProject(projectKey) {
    if (!projectKey || typeof window === "undefined") return;

    if (projectKey === activeProjectKey) {
      openLaunchpad();
      return;
    }

    setProjectActionPending(projectKey);
    window.location.assign(buildWorkspaceUrl("", projectKey, { launchpad: true }));
  }

  async function createProject() {
    const fallbackTitle = `Project ${hydratedProjects.length + 1}`;
    const title = window.prompt("Name this project", fallbackTitle)?.trim();
    if (!title) return;

    setProjectActionPending("__create__");

    try {
      const response = await fetch("/api/workspace/project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.project?.projectKey) {
        throw new Error(payload?.error || "Could not create the project.");
      }

      window.location.assign(
        buildWorkspaceUrl("", payload.project.projectKey, {
          launchpad: true,
        }),
      );
    } catch (error) {
      setProjectActionPending("");
      setFeedback(error instanceof Error ? error.message : "Could not create the project.", "error");
    }
  }

  function openLaunchpad() {
    if (workspaceMode === WORKSPACE_MODES.listen && currentBlock) {
      void persistListeningSession("paused", {
        documentKey: activeDocument.documentKey,
        block: currentBlock,
      });
    }
    stopPlayback();
    setAiOpen(false);
    setEditMode(false);
    setViewMode("doc");
    setListenPickerOpen(false);
    setWorkspacePickerOpen(false);
    setDropAnythingOpen(false);
    closeVoiceRecorder();
    setMobileComposeOpen(false);
    setLaunchpadOpen(true);
    if (typeof window !== "undefined") {
      window.history.replaceState(
        {},
        "",
        buildWorkspaceUrl("", activeProjectKey, {
          launchpad: true,
        }),
      );
    }
  }

  function cancelDeviceSpeech({ incrementRunId = true } = {}) {
    if (incrementRunId) {
      speechRunIdRef.current += 1;
    }

    speechUtteranceRef.current = null;

    if (browserSupportsDeviceVoice()) {
      window.speechSynthesis.cancel();
    }
  }

  function stopPlayback({ keepPlayhead = true } = {}) {
    playbackStateRef.current = {
      active: false,
      kind: null,
      paused: false,
      documentKey: playbackStateRef.current.documentKey || null,
    };
    setIsPlaying(false);
    setLoadingAudio(false);
    setPlaybackStatus("idle");

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    cancelDeviceSpeech();

    if (!keepPlayhead) {
      setPlayheadBlockId(null);
    }
  }

  function pausePlayback() {
    playbackStateRef.current = {
      ...playbackStateRef.current,
      active: false,
      paused: true,
    };
    setIsPlaying(false);
    setLoadingAudio(false);
    setPlaybackStatus("paused");

    if (audioRef.current) {
      audioRef.current.pause();
      return;
    }

    if (speechUtteranceRef.current && browserSupportsDeviceVoice()) {
      window.speechSynthesis.pause();
    }
  }

  function appendLog(action, detail, options = {}) {
    const documentKey = options.documentKey || activeDocumentRef.current?.documentKey || "";
    const entry = createWorkspaceLogEntry({
      time: new Date().toISOString(),
      action,
      detail,
      documentKey,
      blockIds: options.blockIds || [],
    });

    setDocumentLogs((previous) => mergeDocumentLogEntries(previous, documentKey, [entry]));
    return entry;
  }

  function upsertDocument(document, { replaceLogs = false } = {}) {
    const nextLogEntries = replaceLogs
      ? normalizeWorkspaceLogEntries(document.logEntries, document.documentKey)
      : mergeLogs(
          documentLogsRef.current[document.documentKey] || [],
          normalizeWorkspaceLogEntries(document.logEntries, document.documentKey),
        );
    const nextDocument = {
      ...document,
      logEntries: nextLogEntries,
    };

    setDocumentLogs((previous) => ({
      ...previous,
      [document.documentKey]: nextLogEntries,
    }));
    setDocumentCache((previous) => ({
      ...previous,
      [document.documentKey]: nextDocument,
    }));
    setDocumentsState((previous) => mergeDocumentSummary(previous, nextDocument));
  }

  async function fetchLatestDocument(documentKey) {
    const response = await fetch(
      `/api/workspace/document?documentKey=${encodeURIComponent(documentKey)}`,
      { cache: "no-store" },
    );
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.document) {
      throw new Error(payload?.error || "Could not load the latest document.");
    }

    return payload.document;
  }

  async function reloadLatestDocument(documentKey = activeDocumentKey) {
    if (!documentKey) return;

    try {
      if (documentKey === activeDocumentKey) {
        stopPlayback();
      }

      const latestDocument = await fetchLatestDocument(documentKey);
      upsertDocument(latestDocument, { replaceLogs: true });
      setDocumentState(documentKey, {
        status: "saved",
        message: "Loaded latest version",
      });
      setBlockSaveStates({});
      setFeedback(`Loaded the latest version of ${latestDocument.title}.`, "success");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Could not reload the latest version.",
        "error",
      );
    }
  }

  function applyWorkspaceMode(nextMode) {
    const normalizedMode = normalizeWorkspaceMode(nextMode, WORKSPACE_MODES.assemble);
    setWorkspaceMode(normalizedMode);

    if (normalizedMode === WORKSPACE_MODES.listen) {
      setAiOpen(false);
      setEditMode(false);
      setViewMode("doc");
      return normalizedMode;
    }

    setListenPickerOpen(false);
    return normalizedMode;
  }

  function openMode(mode, documentKey = activeDocumentKey, options = {}) {
    if (workspaceMode === WORKSPACE_MODES.listen && currentBlock) {
      void persistListeningSession("paused", {
        documentKey: activeDocument.documentKey,
        block: currentBlock,
      });
    }
    const normalizedMode = applyWorkspaceMode(mode);
    setLaunchpadOpen(false);
    setWorkspacePickerOpen(false);
    setDropAnythingOpen(false);
    closeVoiceRecorder();
    setMobileComposeOpen(false);
    pendingFocusBlockIdRef.current = options.focusBlockId || null;

    if (!documentKey || documentKey === activeDocumentKey) {
      if (options.focusBlockId) {
        setFocusBlockId(options.focusBlockId);
        setPlayheadBlockId(options.focusBlockId);
      }
      updateUrl(activeDocumentKey, activeProjectKey, { mode: normalizedMode });
      return;
    }

    void loadDocument(documentKey, {
      mode: normalizedMode,
      focusBlockId: options.focusBlockId || null,
    });
  }

  async function loadDocument(documentKey, options = {}) {
    if (!documentKey) return;
    const nextMode = normalizeWorkspaceMode(options.mode || workspaceMode, workspaceMode);
    const nextFocusBlockId = options.focusBlockId || null;

    if (documentKey === activeDocumentKey) {
      if (nextFocusBlockId) {
        setFocusBlockId(nextFocusBlockId);
        setPlayheadBlockId(nextFocusBlockId);
      }
      updateUrl(documentKey, activeProjectKey, { mode: nextMode });
      return;
    }

    if (workspaceMode === WORKSPACE_MODES.listen && currentBlock) {
      void persistListeningSession("paused", {
        documentKey: activeDocument.documentKey,
        block: currentBlock,
      });
    }

    stopPlayback({ keepPlayhead: false });
    setLoadingDocumentKey(documentKey);
    pendingFocusBlockIdRef.current = nextFocusBlockId;

    try {
      if (!documentCache[documentKey]) {
        upsertDocument(await fetchLatestDocument(documentKey), { replaceLogs: true });
      }

      startTransition(() => {
        setActiveDocumentKey(documentKey);
      });
      updateUrl(documentKey, activeProjectKey, { mode: nextMode });
      setFeedback(`Opened ${documentsState.find((document) => document.documentKey === documentKey)?.title || "document"}.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not load the document.", "error");
    } finally {
      setLoadingDocumentKey("");
    }
  }

  async function enterWorkspace(documentKey = activeDocumentKey, mode = workspaceMode, options = {}) {
    openMode(mode, documentKey, options);
  }

  async function saveDocument(nextDocument) {
    if (!nextDocument?.isEditable) return;

    const response = await fetch("/api/workspace/document", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documentKey: nextDocument.documentKey,
        title: nextDocument.title,
        subtitle: nextDocument.subtitle || "",
        baseUpdatedAt: nextDocument.updatedAt || null,
        blocks: nextDocument.blocks,
        logEntries: getDocumentLogEntries(
          documentLogsRef.current,
          nextDocument.documentKey,
          nextDocument.logEntries,
        ),
      }),
    });
    const payload = await response.json().catch(() => null);

    if (response.status === 409) {
      const error = new Error(payload?.error || "This document changed somewhere else.");
      error.code = payload?.code || "stale_document";
      error.currentDocument = payload?.currentDocument || null;
      throw error;
    }

    if (!response.ok || !payload?.document) {
      throw new Error(payload?.error || "Could not save the document.");
    }

    upsertDocument(payload.document, { replaceLogs: true });
    return payload.document;
  }

  async function createLinkSource(url) {
    const normalizedUrl = extractSingleUrlText(url);
    if (!normalizedUrl) {
      throw new Error("Paste a valid public link.");
    }

    const response = await fetch("/api/workspace/link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectKey: activeProjectKey,
        url: normalizedUrl,
      }),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.document?.documentKey) {
      throw new Error(payload?.error || "Could not create a source from that link.");
    }

    upsertDocument(payload.document, { replaceLogs: true });
    attachDocumentToActiveProject(payload.document, { role: "SOURCE" });
    setLaunchpadOpen(false);
    await loadDocument(payload.document.documentKey);

    const intakeWarning = getPrimaryDiagnosticMessage(payload.intake);
    setFeedback(
      [
        `Created ${payload.document.title} from link.`,
        intakeWarning || "",
      ]
        .filter(Boolean)
        .join(" "),
      intakeWarning ? "" : "success",
    );

    return payload;
  }

  async function submitUploadedFile(file, { derivationMode = "" } = {}) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectKey", activeProjectKey);
    if (derivationMode) {
      formData.append("derivationMode", derivationMode);
    }

    const response = await fetch("/api/documents", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.document) {
      throw new Error(payload?.error || "The document could not be imported.");
    }

    return payload;
  }

  function stopVoiceRecorderMeter() {
    if (recordingAnimationFrameRef.current) {
      window.cancelAnimationFrame(recordingAnimationFrameRef.current);
      recordingAnimationFrameRef.current = null;
    }

    if (recordingAudioContextRef.current) {
      recordingAudioContextRef.current.close().catch(() => {});
      recordingAudioContextRef.current = null;
    }

    recordingAnalyserRef.current = null;
    setVoiceRecorderLevel(0);
  }

  function stopVoiceRecorderTracks() {
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    stopVoiceRecorderMeter();
  }

  function startVoiceRecorderTimer() {
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
    }

    recordingTimerRef.current = window.setInterval(() => {
      setVoiceRecorderElapsed((previous) => previous + 1);
    }, 1000);
  }

  function startVoiceRecorderMeter(stream) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      setVoiceRecorderLevel(0);
      return;
    }

    try {
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      recordingAudioContextRef.current = audioContext;
      recordingAnalyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        const activeAnalyser = recordingAnalyserRef.current;
        if (!activeAnalyser) return;

        activeAnalyser.getByteFrequencyData(data);
        const average = data.reduce((sum, value) => sum + value, 0) / data.length;
        setVoiceRecorderLevel(Math.max(0.05, average / 255));
        recordingAnimationFrameRef.current = window.requestAnimationFrame(tick);
      };

      tick();
    } catch {
      setVoiceRecorderLevel(0);
    }
  }

  function getVoiceRecorderMimeType() {
    if (typeof window === "undefined" || typeof window.MediaRecorder === "undefined") {
      return "";
    }

    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "video/mp4",
    ];

    if (typeof window.MediaRecorder.isTypeSupported !== "function") {
      return candidates[0];
    }

    return candidates.find((candidate) => window.MediaRecorder.isTypeSupported(candidate)) || "";
  }

  function openVoiceRecorder() {
    setDropAnythingOpen(false);
    setVoiceRecorderOpen(true);
    setVoiceRecorderPhase("idle");
    setVoiceRecorderElapsed(0);
    setVoiceRecorderLevel(0);
    setVoiceRecorderError("");
  }

  async function startVoiceRecorder() {
    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof window.MediaRecorder === "undefined"
    ) {
      setVoiceRecorderError("Voice recording is not available in this browser.");
      return;
    }

    try {
      setVoiceRecorderError("");
      setVoiceRecorderPhase("requesting");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getVoiceRecorderMimeType();
      const recorder = mimeType
        ? new window.MediaRecorder(stream, { mimeType })
        : new window.MediaRecorder(stream);

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recordingChunksRef.current = [];
      setVoiceRecorderElapsed(0);
      setVoiceRecorderLevel(0.08);

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      });

      recorder.start(1000);
      startVoiceRecorderTimer();
      startVoiceRecorderMeter(stream);
      setVoiceRecorderPhase("recording");
    } catch (error) {
      stopVoiceRecorderTracks();
      mediaRecorderRef.current = null;
      setVoiceRecorderPhase("idle");
      setVoiceRecorderError(
        error instanceof Error && /notallowed|permission|denied/i.test(error.message)
          ? "Microphone access was denied. Allow microphone access and try again."
          : error instanceof Error
            ? error.message
            : "Could not start recording.",
      );
    }
  }

  function pauseVoiceRecorder() {
    if (!mediaRecorderRef.current || typeof mediaRecorderRef.current.pause !== "function") {
      return;
    }

    if (mediaRecorderRef.current.state !== "recording") {
      return;
    }

    mediaRecorderRef.current.pause();
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    stopVoiceRecorderMeter();
    setVoiceRecorderPhase("paused");
  }

  function resumeVoiceRecorder() {
    if (!mediaRecorderRef.current || typeof mediaRecorderRef.current.resume !== "function") {
      return;
    }

    if (mediaRecorderRef.current.state !== "paused") {
      return;
    }

    mediaRecorderRef.current.resume();
    if (mediaStreamRef.current) {
      startVoiceRecorderMeter(mediaStreamRef.current);
    }
    startVoiceRecorderTimer();
    setVoiceRecorderPhase("recording");
  }

  async function stopVoiceRecorder({ discard = false } = {}) {
    const recorder = mediaRecorderRef.current;

    if (!recorder) {
      setVoiceRecorderOpen(false);
      setVoiceRecorderPhase("idle");
      return;
    }

    setVoiceRecorderPhase(discard ? "idle" : "finishing");
    const recordedMimeType = recorder.mimeType || getVoiceRecorderMimeType() || "audio/webm";

    recorder.onstop = async () => {
      const chunks = recordingChunksRef.current;
      recordingChunksRef.current = [];
      mediaRecorderRef.current = null;
      stopVoiceRecorderTracks();

      if (discard) {
        setVoiceRecorderOpen(false);
        setVoiceRecorderPhase("idle");
        setVoiceRecorderElapsed(0);
        setVoiceRecorderError("");
        return;
      }

      const blob = new Blob(chunks, { type: recordedMimeType });
      if (!blob.size) {
        setVoiceRecorderPhase("idle");
        setVoiceRecorderError("The recording was empty. Try again.");
        return;
      }

      const extension = recordedMimeType.includes("mp4") ? "mp4" : "webm";
      const file = new File(
        [blob],
        `voice-memo-${new Date().toISOString().replace(/[:.]/g, "-")}.${extension}`,
        { type: recordedMimeType },
      );

      setVoiceRecorderPhase("transcribing");
      const result = await handleUpload(file, { sourceKind: "voice" });
      if (result?.document?.documentKey) {
        setVoiceRecorderOpen(false);
        setVoiceRecorderPhase("idle");
        setVoiceRecorderElapsed(0);
        setVoiceRecorderLevel(0);
        setVoiceRecorderError("");
        return;
      }

      setVoiceRecorderPhase("idle");
      setVoiceRecorderError("Could not turn that voice memo into a document. Try again.");
    };

    recorder.stop();
  }

  const closeVoiceRecorder = useCallback(() => {
    const recorder = mediaRecorderRef.current;

    const resetRecorderState = () => {
      recordingChunksRef.current = [];
      mediaRecorderRef.current = null;

      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      if (recordingAnimationFrameRef.current) {
        window.cancelAnimationFrame(recordingAnimationFrameRef.current);
        recordingAnimationFrameRef.current = null;
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      if (recordingAudioContextRef.current) {
        recordingAudioContextRef.current.close().catch(() => {});
        recordingAudioContextRef.current = null;
      }

      recordingAnalyserRef.current = null;
      setVoiceRecorderOpen(false);
      setVoiceRecorderPhase("idle");
      setVoiceRecorderElapsed(0);
      setVoiceRecorderLevel(0);
      setVoiceRecorderError("");
    };

    if (recorder?.state && recorder.state !== "inactive") {
      recorder.onstop = () => {
        resetRecorderState();
      };
      recorder.stop();
      return;
    }

    resetRecorderState();
  }, []);

  closeVoiceRecorderRef.current = closeVoiceRecorder;

  async function importLinkFromIntake(url) {
    setDropAnythingOpen(false);
    setPastePendingMode("source");
    setFeedback("Fetching page from link...");

    try {
      await createLinkSource(url);
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Could not create a source from that link.",
        "error",
      );
    } finally {
      setPastePendingMode("");
    }
  }

  async function importFileBatch(files, { bundleName = "" } = {}) {
    const normalizedFiles = Array.from(files || []).filter(Boolean);
    if (!normalizedFiles.length) return;

    if (normalizedFiles.length === 1 && !normalizedFiles[0]?.webkitRelativePath) {
      await handleUpload(normalizedFiles[0]);
      return;
    }

    setUploading(true);
    setFeedback(
      `Importing ${normalizedFiles.length} source${normalizedFiles.length === 1 ? "" : "s"}...`,
    );

    try {
      const formData = new FormData();
      normalizedFiles.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("projectKey", activeProjectKey);
      if (bundleName) {
        formData.append("bundleName", bundleName);
      }

      const response = await fetch("/api/workspace/folder", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !Array.isArray(payload?.results) || !payload.results.length) {
        throw new Error(payload?.error || "Could not import this folder.");
      }

      payload.results.forEach((result) => {
        if (!result?.document?.documentKey) return;
        upsertDocument(result.document, { replaceLogs: true });
        attachDocumentToActiveProject(result.document, { role: "SOURCE" });
      });

      setLaunchpadOpen(false);

      const firstDocument = payload.results[0]?.document;
      if (firstDocument?.documentKey) {
        await loadDocument(firstDocument.documentKey);
      }

      const skippedCount = Array.isArray(payload?.skipped) ? payload.skipped.length : 0;
      setFeedback(
        `Imported ${payload.results.length} source${payload.results.length === 1 ? "" : "s"}${
          skippedCount ? `, skipped ${skippedCount}` : ""
        }.`,
        "success",
      );
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not import this folder.", "error");
    } finally {
      setUploading(false);
      setDropActive(false);
    }
  }

  async function handleUpload(file, options = {}) {
    if (!file) return;

    const imageLike = isImageFileLike(file);
    const audioLike = isAudioFileLike(file);
    const normalizedImageMode = normalizeImageDerivationMode(options.derivationMode);
    const sourceKind = options.sourceKind || "";

    if (imageLike && !normalizedImageMode) {
      setPendingImageIntake({
        source: "upload",
        file,
        filename: file.name || "image-source",
        mimeType: file.type || "",
        selectedMode: preferredImageDerivationMode,
      });
      setFeedback("Choose how to turn this image into a source.");
      return;
    }

    setUploading(true);
    setFeedback(
      imageLike
        ? `Importing ${file.name} as ${getImageDerivationLabel(normalizedImageMode).toLowerCase()}...`
        : audioLike || sourceKind === "voice"
          ? `Transcribing ${file.name || "voice memo"}...`
          : `Importing ${file.name}...`,
    );

    try {
      const payload = await submitUploadedFile(file, {
        derivationMode: normalizedImageMode,
      });

      upsertDocument(payload.document, { replaceLogs: true });
      attachDocumentToActiveProject(payload.document, { role: "SOURCE" });
      if (!payload?.sourceAsset && !payload?.derivation?.kind) {
        appendLog(
          "UPLOADED",
          `${payload.document.title} (${formatDocumentFormat(
            payload.document.format,
            payload.document.originalFilename,
          )})`,
          {
            documentKey: payload.document.documentKey,
          },
        );
      }
      setLaunchpadOpen(false);
      setPendingImageIntake(null);
      await loadDocument(payload.document.documentKey);
      const intakeWarning = getPrimaryDiagnosticMessage(payload.intake);
      setFeedback(
        intakeWarning
          ? payload?.derivation?.kind === "audio-transcript"
            ? `Created ${payload.document.title} from voice memo. ${intakeWarning}`
            : payload?.sourceAsset || payload?.derivation?.kind
              ? `Created ${payload.document.title} from image. ${intakeWarning}`
              : `Imported ${payload.document.title}. ${intakeWarning}`
          : payload?.derivation?.kind === "audio-transcript"
            ? `Created ${payload.document.title} from voice memo.`
            : payload?.sourceAsset || payload?.derivation?.kind
              ? `Created ${payload.document.title} from image.`
              : `Imported ${payload.document.title}.`,
        intakeWarning ? "" : "success",
      );
      return payload;
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "The document could not be imported.",
        "error",
      );
      return null;
    } finally {
      setUploading(false);
    }
  }

  function openFolderPicker() {
    folderInputRef.current?.click();
  }

  function handleDragEnter(event) {
    if (!event.dataTransfer?.types?.includes("Files")) return;
    event.preventDefault();
    setDropActive(true);
  }

  function handleDragOver(event) {
    if (!event.dataTransfer?.types?.includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDropActive(true);
  }

  function handleDragLeave(event) {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setDropActive(false);
  }

  function handleDrop(event) {
    if (!event.dataTransfer?.files?.length) return;
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files || []);
    const bundleName = droppedFiles[0]?.webkitRelativePath
      ? droppedFiles[0].webkitRelativePath.split("/")[0]
      : "";
    void importFileBatch(droppedFiles, { bundleName });
  }

  function buildEditedBlock(block, nextText, updatedAt = new Date().toISOString()) {
    const normalizedText = String(nextText || "").trim();
    return {
      ...block,
      text: normalizedText,
      plainText: stripMarkdownSyntax(normalizedText),
      kind: normalizeWorkspaceBlockKind(block.kind, normalizedText),
      operation: "edited",
      updatedAt,
    };
  }

  async function saveTransformedSourceBlocks(
    nextBlocks,
    { pendingAction, successMessage, logAction, logDetail, nextFocusId = null } = {},
  ) {
    if (!canManageActiveSource) return false;

    const preparedBlocks = (Array.isArray(nextBlocks) ? nextBlocks : [])
      .filter((block) => String(block?.text || "").trim())
      .map((block, index) => ({
        ...block,
        sourcePosition: index,
      }));

    if (!preparedBlocks.length) {
      setFeedback("This would remove every block.", "error");
      return false;
    }

    const normalizedNextBlocks = normalizeWorkspaceBlocks(preparedBlocks, {
      documentKey: activeDocument.documentKey,
      defaultSourceDocumentKey: activeDocument.documentKey,
      defaultIsEditable: true,
    });

    if (currentBlock?.id) {
      stopPlayback();
    }

    const nextDocument = {
      ...activeDocument,
      blocks: normalizedNextBlocks,
      rawMarkdown: buildWorkspaceMarkdown({
        title: activeDocument.title,
        subtitle: activeDocument.subtitle || "",
        blocks: normalizedNextBlocks,
        sectionTitle: activeDocument.isAssembly ? "Assembly" : "Document",
      }),
    };

    setCleanupPendingAction(pendingAction || "");
    setBlockSaveStates({});
    setDocumentState(activeDocument.documentKey, {
      status: "saving",
      message: "Saving changes...",
    });
    upsertDocument(nextDocument);
    appendLog(logAction || "EDITED", logDetail || `${activeDocument.title} updated`, {
      documentKey: activeDocument.documentKey,
    });

    try {
      await saveDocument(nextDocument);
      const resolvedFocusId =
        normalizedNextBlocks.find((block) => block.id === focusBlockId)?.id ||
        nextFocusId ||
        normalizedNextBlocks[0]?.id ||
        null;
      setFocusBlockId(resolvedFocusId);
      setPlayheadBlockId(resolvedFocusId);
      setDocumentState(activeDocument.documentKey, {
        status: "saved",
        message: "All changes saved",
      });
      setFeedback(successMessage || "Source updated.", "success");
      return true;
    } catch (error) {
      if (error?.code === "stale_document") {
        setDocumentState(activeDocument.documentKey, {
          status: "conflict",
          message: "Newer version saved elsewhere",
          serverDocument: error.currentDocument || null,
        });
        setFeedback("A newer version exists. Load latest before saving again.", "error");
        return false;
      }

      setDocumentState(activeDocument.documentKey, {
        status: "error",
        message: "Save failed",
      });
      setFeedback(error instanceof Error ? error.message : "Could not save the cleanup.", "error");
      return false;
    } finally {
      setCleanupPendingAction("");
    }
  }

  async function unescapeActiveSource() {
    if (!canManageActiveSource || cleanupPendingAction || polishPending) return;

    let replacements = 0;
    const updatedAt = new Date().toISOString();
    const nextBlocks = blocks.map((block) => {
      const result = unescapeMarkdownEscapes(block.text);
      if (!result.replacements) {
        return block;
      }

      replacements += result.replacements;
      return buildEditedBlock(block, result.text, updatedAt);
    });

    if (!replacements) {
      setFeedback("No escaped markdown found.");
      return;
    }

    await saveTransformedSourceBlocks(nextBlocks, {
      pendingAction: "unescape",
      successMessage: `Removed ${replacements} escaped markdown marker${replacements === 1 ? "" : "s"}.`,
      logAction: "CLEANED",
      logDetail: `${activeDocument.title} — unescaped ${replacements} markdown marker${replacements === 1 ? "" : "s"}`,
    });
  }

  async function replaceAcrossSource() {
    if (!canManageActiveSource || cleanupPendingAction || polishPending) return;

    const query = cleanupFind.trim();
    if (!query) {
      setFeedback("Enter text to find.", "error");
      return;
    }

    let replacements = 0;
    let removedBlocks = 0;
    let changedBlocks = 0;
    const updatedAt = new Date().toISOString();
    const nextBlocks = [];

    blocks.forEach((block) => {
      const blockReplacements = countLiteralOccurrences(block.text, query);
      if (!blockReplacements) {
        nextBlocks.push(block);
        return;
      }

      const nextText = String(block.text || "").split(query).join(cleanupReplace);
      if (nextText === block.text) {
        nextBlocks.push(block);
        return;
      }

      replacements += blockReplacements;
      changedBlocks += 1;
      if (!nextText.trim()) {
        removedBlocks += 1;
        return;
      }

      nextBlocks.push(buildEditedBlock(block, nextText, updatedAt));
    });

    if (!replacements || !changedBlocks) {
      setFeedback("No changes to apply.");
      return;
    }

    await saveTransformedSourceBlocks(nextBlocks, {
      pendingAction: "replace",
      successMessage: `Replaced ${replacements} match${replacements === 1 ? "" : "es"}${removedBlocks ? ` and removed ${removedBlocks} empty block${removedBlocks === 1 ? "" : "s"}` : ""}.`,
      logAction: "REPLACED",
      logDetail: `${activeDocument.title} — replaced ${replacements} match${replacements === 1 ? "" : "es"} for "${query}"`,
    });
  }

  async function deleteMatchingBlocks() {
    if (!canManageActiveSource || cleanupPendingAction || polishPending) return;

    const query = cleanupFind.trim();
    if (!query) {
      setFeedback("Enter text to find.", "error");
      return;
    }

    const matchingBlocks = blocks.filter((block) => String(block.text || "").includes(query));
    if (!matchingBlocks.length) {
      setFeedback("No matching blocks found.");
      return;
    }

    const matchingIds = new Set(matchingBlocks.map((block) => block.id));
    const nextBlocks = blocks.filter((block) => !matchingIds.has(block.id));
    const nextFocusId =
      nextBlocks.find((block) => block.id === focusBlockId)?.id || nextBlocks[0]?.id || null;

    await saveTransformedSourceBlocks(nextBlocks, {
      pendingAction: "deleteMatches",
      nextFocusId,
      successMessage: `Deleted ${matchingBlocks.length} matching block${matchingBlocks.length === 1 ? "" : "s"}.`,
      logAction: "DELETED",
      logDetail: `${activeDocument.title} — deleted ${matchingBlocks.length} block${matchingBlocks.length === 1 ? "" : "s"} matching "${query}"`,
    });
  }

  async function deleteBlock(blockId) {
    if (!canManageActiveSource || cleanupPendingAction || polishPending) return;

    const index = blocks.findIndex((block) => block.id === blockId);
    if (index === -1) return;

    const targetBlock = blocks[index];
    const nextBlocks = blocks.filter((block) => block.id !== blockId);
    const nextFocusId = nextBlocks[index]?.id || nextBlocks[index - 1]?.id || nextBlocks[0]?.id || null;

    await saveTransformedSourceBlocks(nextBlocks, {
      pendingAction: "deleteBlock",
      nextFocusId,
      successMessage: `Deleted block ${targetBlock.sourcePosition + 1}.`,
      logAction: "DELETED",
      logDetail: `${activeDocument.title} — deleted block ${targetBlock.sourcePosition + 1}`,
    });
  }

  async function polishActiveSource() {
    if (!canPolishActiveDocument || polishPending) return;

    const sourceTitle = activeDocument.title;
    setPolishPending(true);
    setFeedback(`Cleaning ${sourceTitle}...`);

    try {
      const response = await fetch("/api/workspace/polish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentKey: activeDocument.documentKey,
          projectKey: activeProjectKey,
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Could not polish this source.");
      }

      if (result?.unchanged) {
        const polishSummary = summarizePolishChanges(result?.changes);
        setFeedback(
          polishSummary
            ? `No new copy needed. ${polishSummary}.`
            : `No formatting artifacts found in ${sourceTitle}.`,
          "success",
        );
        return;
      }

      if (!result?.document?.documentKey) {
        throw new Error("The polished source could not be created.");
      }

      upsertDocument(result.document, { replaceLogs: true });
      attachDocumentToActiveProject(result.document, { role: "SOURCE" });
      appendLog("POLISHED", `${result.document.title} created from ${sourceTitle}`, {
        documentKey: result.document.documentKey,
      });
      setLaunchpadOpen(false);
      setAiOpen(false);
      setViewMode("doc");
      await loadDocument(result.document.documentKey);

      const polishSummary = summarizePolishChanges(result?.changes);
      const intakeWarning = getPrimaryDiagnosticMessage(result?.intake);
      setFeedback(
        [
          `Created ${result.document.title}.`,
          polishSummary ? `Cleaned ${polishSummary}.` : "",
          intakeWarning || "",
        ]
          .filter(Boolean)
          .join(" "),
        "success",
      );
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not polish this source.", "error");
    } finally {
      setPolishPending(false);
    }
  }

  async function pasteIntoWorkspace(mode, payload = null, options = {}) {
    if (pastePendingMode) return;

    try {
      const clipboardPayload = payload || (await readClipboardPayloadFromNavigator());
      const urlFromClipboard =
        !clipboardPayload?.imageDataUrl
          ? extractSingleUrlText(clipboardPayload?.text || "")
          : "";
      const resolvedImageMimeType =
        clipboardPayload?.imageMimeType ||
        dataUrlMimeType(clipboardPayload?.imageDataUrl || "");
      const hasImagePayload = Boolean(clipboardPayload?.imageDataUrl);
      const normalizedImageMode = normalizeImageDerivationMode(options.derivationMode);

      if (mode === "source" && urlFromClipboard && !options.forceRawText) {
        setPastePendingMode("source");
        setFeedback("Fetching page from link...");

        try {
          await createLinkSource(urlFromClipboard);
          return;
        } catch (error) {
          setPendingLinkIntake({
            url: urlFromClipboard,
            payload: clipboardPayload,
          });
          setFeedback(
            error instanceof Error
              ? `${error.message} You can keep the URL as text instead.`
              : "Could not fetch this link. You can keep the URL as text instead.",
            "error",
          );
          return;
        } finally {
          setPastePendingMode("");
        }
      }

      if (hasImagePayload && !normalizedImageMode) {
        setPendingImageIntake({
          source: "paste",
          payload: clipboardPayload,
          filename: clipboardPayload?.imageFilename || "clipboard-image.png",
          mimeType: resolvedImageMimeType,
          selectedMode: preferredImageDerivationMode,
        });
        setFeedback("Choose how to turn this image into a source.");
        return;
      }

      const requestMode =
        hasImagePayload && normalizedImageMode
          ? `source-image-${normalizedImageMode}`
          : mode;

      setPastePendingMode(mode);
      setFeedback(
        hasImagePayload
          ? `Creating ${getImageDerivationLabel(normalizedImageMode).toLowerCase()} from image...`
          : mode === "source"
            ? "Pasting source..."
            : "Pasting to clipboard...",
      );

      const response = await fetch("/api/workspace/paste", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey: activeProjectKey,
          mode: requestMode,
          html: clipboardPayload?.html || "",
          text: clipboardPayload?.text || "",
          imageDataUrl: clipboardPayload?.imageDataUrl || "",
          imageMimeType: resolvedImageMimeType,
          imageFilename: clipboardPayload?.imageFilename || "",
          derivationMode: normalizedImageMode,
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Could not paste into the workspace.");
      }

      if (mode === "source" || result?.sourceAsset || result?.derivation?.kind) {
        if (!result?.document?.documentKey) {
          throw new Error("The pasted source could not be created.");
        }

        upsertDocument(result.document, { replaceLogs: true });
        attachDocumentToActiveProject(result.document, { role: "SOURCE" });
        if (!result?.sourceAsset && !result?.derivation?.kind) {
          appendLog("PASTED", `${result.document.title} created from clipboard`, {
            documentKey: result.document.documentKey,
          });
        }
        setLaunchpadOpen(false);
        setAiOpen(false);
        setViewMode("doc");
        setPendingImageIntake(null);
        setPendingLinkIntake(null);
        await loadDocument(result.document.documentKey);

        const intakeWarning = getPrimaryDiagnosticMessage(result.intake);
        setFeedback(
          intakeWarning
            ? result?.sourceAsset || result?.derivation?.kind
              ? `Created ${result.document.title} from image. ${intakeWarning}`
              : `Pasted ${result.document.title}. ${intakeWarning}`
            : result?.sourceAsset || result?.derivation?.kind
              ? `Created ${result.document.title} from image.`
              : `Pasted ${result.document.title}.`,
          intakeWarning ? "" : "success",
        );
        return;
      }

      if (!result?.sourceDocument?.documentKey || !Array.isArray(result?.blocks)) {
        throw new Error("The clipboard paste did not return readable blocks.");
      }

      const pastedBlocks = normalizeWorkspaceBlocks(result.blocks, {
        documentKey: result.sourceDocument.documentKey,
        defaultSourceDocumentKey: result.sourceDocument.documentKey,
        defaultIsEditable: true,
      });
      upsertDocument(result.sourceDocument, { replaceLogs: true });
      attachDocumentToActiveProject(result.sourceDocument, { role: "SOURCE" });
      appendLog("PASTED", `${result.sourceDocument.title} staged from clipboard`, {
        documentKey: result.sourceDocument.documentKey,
      });
      setClipboard((previous) => mergeClipboard(previous, pastedBlocks));
      setLaunchpadOpen(false);
      setAiOpen(false);
      setViewMode("doc");
      setPendingLinkIntake(null);

      const intakeWarning = getPrimaryDiagnosticMessage(result.intake);
      const blockLabel = `${pastedBlocks.length} block${pastedBlocks.length === 1 ? "" : "s"}`;
      setFeedback(
        intakeWarning
          ? `Pasted ${blockLabel} to clipboard. ${intakeWarning}`
          : `Pasted ${blockLabel} to clipboard.`,
        intakeWarning ? "" : "success",
      );
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Could not paste into the workspace.",
        "error",
      );
    } finally {
      setPastePendingMode("");
    }
  }

  pasteIntoWorkspaceRef.current = pasteIntoWorkspace;

  function addBlockToClipboard(block) {
    const alreadySelected = clipboard.some((item) => item.id === block.id);
    if (alreadySelected) return;

    setClipboard((previous) => mergeClipboard(previous, [block]));
    appendLog("SELECTED", `${activeDocument.title} — block ${block.sourcePosition + 1} → clipboard`, {
      documentKey: activeDocument.documentKey,
      blockIds: [block.id],
    });
  }

  function removeBlockFromClipboard(blockId) {
    setClipboard((previous) => previous.filter((block) => block.id !== blockId));
  }

  function removeClipboardIndex(index) {
    setClipboard((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  }

  async function editBlock(blockId, nextText) {
    if (!activeDocument?.isEditable) return;

    const normalizedText = String(nextText || "").trim();
    if (!normalizedText) return;

    const originalBlock = activeDocument.blocks.find((block) => block.id === blockId);
    if (!originalBlock) return;
    if (normalizedText === originalBlock.text.trim()) {
      setBlockSaveStates((previous) => ({
        ...previous,
        [blockId]: "saved",
      }));
      setDocumentState(activeDocument.documentKey, {
        status: "saved",
        message: "All changes saved",
      });
      return;
    }

    if (currentBlock?.id === blockId) {
      stopPlayback();
      setFeedback("Playback stopped because the active block changed.");
    }

    const nextBlocks = activeDocument.blocks.map((block) =>
      block.id === blockId
        ? {
            ...block,
            text: normalizedText,
            plainText: normalizedText.replace(/^#{1,6}\s+/, ""),
            kind: normalizeWorkspaceBlockKind("", normalizedText),
            operation: "edited",
            updatedAt: new Date().toISOString(),
          }
        : block,
    );
    const nextDocument = {
      ...activeDocument,
      blocks: nextBlocks,
      rawMarkdown: buildWorkspaceMarkdown({
        title: activeDocument.title,
        subtitle: activeDocument.subtitle || "",
        blocks: nextBlocks,
        sectionTitle: activeDocument.isAssembly ? "Assembly" : "Document",
        }),
    };

    setBlockSaveStates((previous) => ({
      ...previous,
      [blockId]: "saving",
    }));
    setDocumentState(activeDocument.documentKey, {
      status: "saving",
      message: "Saving changes...",
    });
    upsertDocument(nextDocument);
    appendLog("EDITED", `${activeDocument.title} — block ${originalBlock.sourcePosition + 1} edited`, {
      documentKey: activeDocument.documentKey,
      blockIds: [blockId],
    });

    try {
      await saveDocument(nextDocument);
      setBlockSaveStates((previous) => ({
        ...previous,
        [blockId]: "saved",
      }));
      setDocumentState(activeDocument.documentKey, {
        status: "saved",
        message: "All changes saved",
      });
      setFeedback(`Saved edit to block ${originalBlock.sourcePosition + 1}.`, "success");
    } catch (error) {
      setBlockSaveStates((previous) => ({
        ...previous,
        [blockId]: error?.code === "stale_document" ? "conflict" : "error",
      }));
      if (error?.code === "stale_document") {
        setDocumentState(activeDocument.documentKey, {
          status: "conflict",
          message: "Newer version saved elsewhere",
          serverDocument: error.currentDocument || null,
        });
        setFeedback("A newer version exists. Load latest before saving again.", "error");
        return;
      }

      setDocumentState(activeDocument.documentKey, {
        status: "error",
        message: "Save failed",
      });
      setFeedback(error instanceof Error ? error.message : "Could not save the edit.", "error");
    }
  }

  function focusBlock(blockId) {
    setFocusBlockId(blockId);

    if (!isPlaying) {
      if (audioRef.current && playheadBlockId && playheadBlockId !== blockId) {
        stopPlayback({ keepPlayhead: false });
      }

      setPlayheadBlockId(blockId);
    }

    if (workspaceMode === WORKSPACE_MODES.listen) {
      const block = blocks.find((entry) => entry.id === blockId) || null;
      if (block && playbackStatus !== "active") {
        void persistListeningSession("paused", {
          documentKey: activeDocument.documentKey,
          block,
        });
      }
    }
  }

  async function requestAudioForBlock(block) {
    if (!resolvedVoiceChoice || !playbackAvailable) {
      throw new Error("Voice is unavailable right now.");
    }

    const response = await fetch("/api/seven/audio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: block.plainText || block.text,
        preferredProvider: resolvedVoiceChoice.provider || undefined,
        voiceId:
          resolvedVoiceChoice.provider === "device"
            ? undefined
            : resolvedVoiceChoice.voiceId || undefined,
        rate: rateRef.current,
      }),
    });

    if (!response.ok) {
      let message = "";

      try {
        const payload = await response.clone().json();
        message = payload?.error || payload?.message || "";
      } catch {
        message = await response.text().catch(() => "");
      }

      throw new Error(formatAudioErrorMessage(message));
    }

    return {
      blob: await response.blob(),
      headers: parseSevenAudioHeaders(response.headers),
    };
  }

  async function playCloudSequenceFromIndex(index) {
    const documentAtStart = activeDocumentRef.current;
    const sequence = blocksRef.current;
    const block = sequence[index];

    if (!playbackStateRef.current.active || !block) {
      stopPlayback();
      return;
    }

    setPlayheadBlockId(block.id);
    setFocusBlockId(block.id);
    setLoadingAudio(true);

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }

      cancelDeviceSpeech({ incrementRunId: false });

      const { blob, headers } = await requestAudioForBlock(block);
      const nextAudioUrl = URL.createObjectURL(blob);
      const audio = new Audio(nextAudioUrl);

      audio.playbackRate = rateRef.current;
      audioRef.current = audio;
      audioUrlRef.current = nextAudioUrl;
      playbackStateRef.current = {
        active: true,
        kind: headers.provider || voiceChoiceRef.current?.provider || null,
        paused: false,
        documentKey: documentAtStart.documentKey,
      };

      audio.addEventListener("ended", () => {
        if (
          !playbackStateRef.current.active ||
          playbackStateRef.current.documentKey !== documentAtStart.documentKey
        ) {
          stopPlayback();
          return;
        }

        const nextIndex = index + 1;
        if (nextIndex >= blocksRef.current.length) {
          void persistListeningSession("idle", {
            documentKey: documentAtStart.documentKey,
            block,
          });
          stopPlayback();
          setFeedback(`Finished ${documentAtStart.title}.`, "success");
          return;
        }

        playSequenceFromIndex(nextIndex);
      });
      audio.addEventListener("pause", () => {
        setIsPlaying(false);
        setPlaybackStatus(playbackStateRef.current.paused ? "paused" : "idle");
      });
      audio.addEventListener("play", () => {
        setIsPlaying(true);
        setPlaybackStatus("active");
      });

      setProviderLabel(
        formatActualProviderLabel(
          headers.provider || voiceChoiceRef.current?.provider,
          headers.voiceId || voiceChoiceRef.current?.voiceId || null,
        ),
      );
      appendLog(
        "LISTENED",
        `${documentAtStart.title} — block ${block.sourcePosition + 1}`,
        {
          documentKey: documentAtStart.documentKey,
          blockIds: [block.id],
        },
      );

      await audio.play();
      setFeedback(`Playing block ${block.sourcePosition + 1}.`);
    } catch (error) {
      stopPlayback();
      setFeedback(error instanceof Error ? error.message : "Could not start playback.", "error");
    } finally {
      setLoadingAudio(false);
    }
  }

  async function playDeviceSequenceFromIndex(index) {
    const documentAtStart = activeDocumentRef.current;
    const sequence = blocksRef.current;
    const block = sequence[index];

    if (!playbackStateRef.current.active || !block) {
      stopPlayback();
      return;
    }

    if (!browserSupportsDeviceVoice()) {
      throw new Error("Device voice is unavailable in this browser.");
    }

    setPlayheadBlockId(block.id);
    setFocusBlockId(block.id);
    setLoadingAudio(true);

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }

      const runId = speechRunIdRef.current + 1;
      speechRunIdRef.current = runId;
      cancelDeviceSpeech({ incrementRunId: false });

      const utterance = new SpeechSynthesisUtterance(block.plainText || block.text);
      utterance.rate = rateRef.current;
      speechUtteranceRef.current = utterance;
      playbackStateRef.current = {
        active: true,
        kind: VOICE_PROVIDERS.device,
        paused: false,
        documentKey: documentAtStart.documentKey,
      };

      utterance.onstart = () => {
        if (runId !== speechRunIdRef.current) return;

        setIsPlaying(true);
        setLoadingAudio(false);
        setPlaybackStatus("active");
        setProviderLabel(formatActualProviderLabel(VOICE_PROVIDERS.device));
        appendLog(
          "LISTENED",
          `${documentAtStart.title} — block ${block.sourcePosition + 1}`,
          {
            documentKey: documentAtStart.documentKey,
            blockIds: [block.id],
          },
        );
        setFeedback(`Playing block ${block.sourcePosition + 1}.`);
      };

      utterance.onpause = () => {
        if (runId !== speechRunIdRef.current) return;

        playbackStateRef.current = {
          ...playbackStateRef.current,
          active: false,
          paused: true,
        };
        setIsPlaying(false);
        setPlaybackStatus("paused");
      };

      utterance.onresume = () => {
        if (runId !== speechRunIdRef.current) return;

        playbackStateRef.current = {
          ...playbackStateRef.current,
          active: true,
          paused: false,
        };
        setIsPlaying(true);
        setPlaybackStatus("active");
      };

      utterance.onerror = () => {
        if (runId !== speechRunIdRef.current) return;

        speechUtteranceRef.current = null;
        stopPlayback();
        setFeedback("Couldn't play this section. Try again.", "error");
      };

      utterance.onend = () => {
        if (runId !== speechRunIdRef.current) return;

        speechUtteranceRef.current = null;

        if (
          !playbackStateRef.current.active ||
          playbackStateRef.current.documentKey !== documentAtStart.documentKey
        ) {
          stopPlayback();
          return;
        }

        const nextIndex = index + 1;
        if (nextIndex >= blocksRef.current.length) {
          void persistListeningSession("idle", {
            documentKey: documentAtStart.documentKey,
            block,
          });
          stopPlayback();
          setFeedback(`Finished ${documentAtStart.title}.`, "success");
          return;
        }

        void playDeviceSequenceFromIndex(nextIndex);
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      stopPlayback();
      setFeedback(error instanceof Error ? error.message : "Could not start playback.", "error");
    } finally {
      setLoadingAudio(false);
    }
  }

  async function playSequenceFromIndex(index) {
    if (voiceChoiceRef.current?.provider === VOICE_PROVIDERS.device) {
      await playDeviceSequenceFromIndex(index);
      return;
    }

    await playCloudSequenceFromIndex(index);
  }

  async function togglePlayback() {
    if (!blocks.length || !playbackAvailable) {
      setFeedback("Voice is unavailable right now.", "error");
      return;
    }

    if (audioRef.current && !audioRef.current.paused) {
      pausePlayback();
      setFeedback("Playback paused.");
      return;
    }

    if (
      audioRef.current &&
      audioRef.current.paused &&
      playbackStateRef.current.documentKey === activeDocument.documentKey
    ) {
      playbackStateRef.current = {
        ...playbackStateRef.current,
        active: true,
        paused: false,
      };
      await audioRef.current.play();
      setIsPlaying(true);
      setFeedback("Playback resumed.");
      return;
    }

    if (
      speechUtteranceRef.current &&
      playbackStateRef.current.kind === VOICE_PROVIDERS.device &&
      playbackStateRef.current.documentKey === activeDocument.documentKey &&
      playbackStateRef.current.paused
    ) {
      playbackStateRef.current = {
        ...playbackStateRef.current,
        active: true,
        paused: false,
      };
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setFeedback("Playback resumed.");
      return;
    }

    if (
      speechUtteranceRef.current &&
      playbackStateRef.current.kind === VOICE_PROVIDERS.device &&
      playbackStateRef.current.documentKey === activeDocument.documentKey &&
      playbackStateRef.current.active
    ) {
      pausePlayback();
      setFeedback("Playback paused.");
      return;
    }

    playbackStateRef.current = {
      active: true,
      kind: voiceChoiceRef.current?.provider || null,
      paused: false,
      documentKey: activeDocument.documentKey,
    };

    const startIndex = Math.max(
      0,
      blocks.findIndex((block) => block.id === (focusBlockId || blocks[0]?.id)),
    );
    await playSequenceFromIndex(startIndex === -1 ? 0 : startIndex);
  }

  function seekAudio(deltaSeconds) {
    if (playbackStateRef.current.kind === VOICE_PROVIDERS.device) {
      setFeedback("Seek is only available during generated audio playback.", "error");
      return;
    }

    if (!audioRef.current) {
      setFeedback("Start playback before seeking.", "error");
      return;
    }

    const nextTime = Math.max(
      0,
      Math.min(audioRef.current.duration || Infinity, audioRef.current.currentTime + deltaSeconds),
    );
    audioRef.current.currentTime = nextTime;
    setFeedback(`Jumped ${deltaSeconds > 0 ? "forward" : "back"} ${Math.abs(deltaSeconds)} seconds.`);
  }

  async function jumpToIndex(index) {
    const clampedIndex = Math.max(0, Math.min(blocks.length - 1, index));
    const block = blocks[clampedIndex];
    if (!block) return;

    setFocusBlockId(block.id);
    setPlayheadBlockId(block.id);

    if (
      isPlaying ||
      playbackStateRef.current.active ||
      playbackStateRef.current.paused ||
      audioRef.current ||
      speechUtteranceRef.current
    ) {
      stopPlayback();
      playbackStateRef.current = {
        active: true,
        kind: voiceChoiceRef.current?.provider || null,
        paused: false,
        documentKey: activeDocument.documentKey,
      };
      await playSequenceFromIndex(clampedIndex);
      return;
    }

    if (workspaceMode === WORKSPACE_MODES.listen) {
      void persistListeningSession("paused", {
        documentKey: activeDocument.documentKey,
        block,
      });
    }

    setFeedback(`Moved to block ${block.sourcePosition + 1}.`);
  }

  function cycleRate() {
    const currentRate = clampListeningRate(rate, 1);
    const rateStepIndex = RATE_STEPS.indexOf(currentRate);
    const nextRate = RATE_STEPS[(rateStepIndex + 1) % RATE_STEPS.length];
    setRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }

    if (speechUtteranceRef.current && playbackStateRef.current.kind === VOICE_PROVIDERS.device) {
      const restartIndex = currentIndex >= 0 ? currentIndex : 0;
      stopPlayback();
      playbackStateRef.current = {
        active: true,
        kind: VOICE_PROVIDERS.device,
        paused: false,
        documentKey: activeDocument.documentKey,
      };
      void playSequenceFromIndex(restartIndex);
    }

    setFeedback(`Playback rate ${nextRate.toFixed(2)}x.`);
  }

  async function runAiOperation() {
    const prompt = aiInput.trim();
    if (!prompt) return;

    if (aiScope === "clipboard" && !clipboard.length) {
      setFeedback("Add blocks to the clipboard first.", "error");
      return;
    }

    if (aiScope === "block" && !focusedBlock) {
      setFeedback("Focus a block first.", "error");
      return;
    }

    const requestBlocks =
      aiScope === "clipboard" ? clipboard : activeDocument.blocks;
    const requestSelectedBlocks =
      aiScope === "block"
        ? focusedBlock
          ? [focusedBlock]
          : []
        : aiScope === "clipboard"
          ? clipboard
          : [];

    setAiPending(true);
    appendLog("AI_QUERY", `"${prompt}"`, {
      documentKey: activeDocument.documentKey,
      blockIds:
        aiScope === "block"
          ? focusedBlock
            ? [focusedBlock.id]
            : []
          : aiScope === "clipboard"
            ? clipboard.map((block) => block.id)
            : [],
    });

    try {
      const response = await fetch("/api/workspace/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          scope: aiScope,
          documentKey: activeDocument.documentKey,
          title: activeDocument.title,
          blocks: requestBlocks,
          selectedBlocks: requestSelectedBlocks,
          clipboardBlocks: clipboard,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !Array.isArray(payload?.blocks)) {
        throw new Error(payload?.error || "The workspace AI operation failed.");
      }

      setStagedAiBlocks(payload.blocks);
      setClipboardExpanded(true);
      appendLog(
        "AI_RESULT",
        `${payload.blocks.length} block${payload.blocks.length === 1 ? "" : "s"} produced (${payload.operation || "operation"})`,
        {
          documentKey: activeDocument.documentKey,
          blockIds: payload.blocks.map((block) => block.id),
        },
      );
      setAiInput("");
      setAiOpen(true);
      setFeedback(
        payload.fallback
          ? "AI staging ready using the workspace fallback."
          : "AI staging ready.",
        payload.fallback ? "" : "success",
      );
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "The workspace AI operation failed.",
        "error",
      );
    } finally {
      setAiPending(false);
    }
  }

  function acceptStagedBlock(index) {
    const block = stagedAiBlocks[index];
    if (!block) return;
    setClipboard((previous) => mergeClipboard(previous, [block]));
    setStagedAiBlocks((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  }

  function acceptAllStagedBlocks() {
    setClipboard((previous) => mergeClipboard(previous, stagedAiBlocks));
    setStagedAiBlocks([]);
  }

  async function assembleClipboard() {
    if (!clipboard.length) {
      setFeedback("Select blocks before assembling.", "error");
      return;
    }

    const fallbackTitle = `Assembly ${documentsState.filter((document) => document.isAssembly).length + 1}`;
    const title = window.prompt("Name this assembly", fallbackTitle)?.trim() || fallbackTitle;

    try {
      const response = await fetch("/api/workspace/assemble", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          blocks: clipboard,
          createReceipt: true,
          projectKey: activeProjectKey,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.document) {
        throw new Error(payload?.error || "Could not assemble the document.");
      }

      upsertDocument(payload.document, { replaceLogs: true });
      attachDocumentToActiveProject(payload.document, {
        role: "ASSEMBLY",
        setAsCurrentAssembly: true,
      });
      setDocumentsState((previous) =>
        sortDocuments(payload.documents || mergeDocumentSummary(previous, payload.document)),
      );
      setClipboard([]);
      setStagedAiBlocks([]);
      setMobileComposeOpen(false);
      if (payload?.draft?.id) {
        upsertProjectDraft(payload.draft);
        appendLog(
          "RECEIPT",
          payload.remoteReceipt
            ? `Drafted receipt for "${payload.document.title}" and pushed it to GetReceipts`
            : `Drafted receipt for "${payload.document.title}" locally`,
          {
            documentKey: payload.document.documentKey,
          },
        );
      }
      await loadDocument(payload.document.documentKey);
      setFeedback(
        payload?.draft?.id
          ? payload.remoteReceipt
            ? `Assembled ${payload.document.title}. Receipt draft pushed to GetReceipts.`
            : `Assembled ${payload.document.title}. Receipt draft saved locally.`
          : `Assembled ${payload.document.title}.`,
        "success",
      );
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not assemble the document.", "error");
    }
  }

  async function createReceiptDraft() {
    setReceiptPending(true);

    try {
      const receiptLogEntries = activeDocument.logEntries || [];
      const response = await fetch("/api/workspace/receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document: activeDocument,
          blocks: activeDocument.blocks,
          logEntries: receiptLogEntries,
          projectKey: activeProjectKey,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.draft?.id) {
        throw new Error(payload?.error || "Could not draft the receipt.");
      }

      upsertProjectDraft(payload.draft);
      appendLog(
        "RECEIPT",
        payload.remoteReceipt
          ? `Drafted receipt for "${activeDocument.title}" and pushed it to GetReceipts`
          : `Drafted receipt for "${activeDocument.title}" locally`,
        {
          documentKey: activeDocument.documentKey,
        },
      );
      setFeedback(
        payload.remoteReceipt
          ? "Drafted receipt and pushed it to GetReceipts."
          : "Drafted receipt locally. It has not been pushed to GetReceipts.",
        "success",
      );
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not draft the receipt.", "error");
    } finally {
      setReceiptPending(false);
    }
  }

  function exportDocument() {
    const markdown = buildWorkspaceMarkdown({
      title: activeDocument.title,
      subtitle: activeDocument.subtitle || "",
      blocks: activeDocument.blocks,
      sectionTitle: activeDocument.isAssembly ? "Assembly" : "Document",
    });
    downloadFile(`${activeDocument.documentKey}.md`, markdown, "text/markdown;charset=utf-8");
    setFeedback(`Exported ${activeDocument.title}.`, "success");
  }

  function exportReceipt() {
    const receiptLogEntries = activeDocument.logEntries || [];
    downloadFile(
      `${activeDocument.documentKey}-receipt.json`,
      JSON.stringify(
        {
          documentKey: activeDocument.documentKey,
          title: activeDocument.title,
          logEntries: receiptLogEntries,
        },
        null,
        2,
      ),
      "application/json;charset=utf-8",
    );
    setFeedback(`Exported receipt log for ${activeDocument.title}.`, "success");
  }

  const showComposeHeader = !launchpadOpen && !isListenMode;

  return (
    <main
      className={`assembler-page ${dropActive ? "is-dropping" : ""}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        className="terminal-file-input"
        type="file"
        accept={SOURCE_ACCEPT_VALUE}
        multiple
        onChange={(event) => {
          const files = Array.from(event.target.files || []);
          if (!files.length) return;
          void importFileBatch(files, {
            bundleName: files[0]?.webkitRelativePath
              ? files[0].webkitRelativePath.split("/")[0]
              : "",
          });
          event.target.value = "";
        }}
      />
      <input
        ref={folderInputRef}
        className="terminal-file-input"
        type="file"
        multiple
        onChange={(event) => {
          const files = Array.from(event.target.files || []);
          if (!files.length) return;
          void importFileBatch(files, {
            bundleName: files[0]?.webkitRelativePath
              ? files[0].webkitRelativePath.split("/")[0]
              : "Imported Folder",
          });
          event.target.value = "";
        }}
      />

      <div className="assembler-shell">
        <header className={`assembler-header ${showComposeHeader ? "is-workspace" : ""}`}>
          <div className="assembler-header__identity">
            {showComposeHeader ? (
              <>
                <button type="button" className="assembler-header__start" onClick={openLaunchpad}>
                  Home
                </button>
                {activeProject ? (
                  <span className="assembler-header__project">{activeProject.title}</span>
                ) : null}
                <span className="assembler-header__context">
                  {getDocumentKindLabel(activeDocument)}
                </span>
              </>
            ) : (
              <>
                <span className="assembler-header__name">Assembled Reality</span>
                {activeProject ? (
                  <span className="assembler-header__project">
                    {activeProject.title}
                  </span>
                ) : null}
              </>
            )}
          </div>

          <div className="assembler-header__actions">
            {showComposeHeader ? (
              <button
                type="button"
                className={`assembler-header__start ${workspacePickerOpen ? "is-active" : ""}`}
                onClick={() => setWorkspacePickerOpen(true)}
              >
                Browse
              </button>
            ) : !launchpadOpen ? (
              <button type="button" className="assembler-header__start" onClick={openLaunchpad}>
                Home
              </button>
            ) : null}

            <Link href="/account" className="assembler-header__account" aria-label="Account">
              <WorkspaceActionIcon kind="account" />
            </Link>
          </div>
        </header>

        {launchpadOpen ? (
          <section className="assembler-surface assembler-surface--launchpad">
            <WorkspaceLaunchpad
              activeProject={activeProject}
              activeProjectKey={activeProjectKey}
              projects={hydratedProjects}
              documents={projectDocuments}
              projectDrafts={projectDraftsState}
              projectActionPending={projectActionPending}
              loadingDocumentKey={loadingDocumentKey}
              uploading={uploading}
              pastePendingMode={pastePendingMode}
              clipboardCount={clipboard.length}
              onEnterMode={openMode}
              onCreateProject={() => void createProject()}
              onOpenDocument={enterWorkspace}
              onOpenProject={openProject}
              onPasteClipboard={() => void pasteIntoWorkspace("clipboard")}
              onOpenSpeak={openVoiceRecorder}
              onOpenIntake={() => setDropAnythingOpen(true)}
              recordingVoice={voiceRecorderOpen && voiceRecorderPhase !== "idle"}
              lastUsedMode={lastUsedMode}
              resumeSessionSummary={resumeSessionSummaryState}
            />
          </section>
        ) : isListenMode ? (
          <>
            <ListenSurface
              activeDocument={activeDocument}
              activeDocumentWarning={activeDocumentWarning}
              blocks={blocks}
              currentBlockId={currentBlock?.id || null}
              focusedBlockId={focusBlockId}
              nextBlockId={nextBlock?.id || null}
              onFocusBlock={focusBlock}
              onSwitchToAssemble={() => openMode(WORKSPACE_MODES.assemble)}
              pickerOpen={listenPickerOpen}
              onTogglePicker={() => setListenPickerOpen((value) => !value)}
              onOpenProjectHome={openLaunchpad}
              onOpenDocument={(documentKey, mode, options = {}) => {
                setListenPickerOpen(false);
                void enterWorkspace(documentKey, mode, options);
              }}
              projectDocuments={projectDocuments}
              loadingDocumentKey={loadingDocumentKey}
              onOpenLog={() => {
                setViewMode("log");
                openMode(WORKSPACE_MODES.assemble, activeDocument.documentKey);
              }}
              onExportDocument={exportDocument}
              lastUsedMode={lastUsedMode}
              isMobileLayout={isMobileLayout}
            />

            <PlayerBar
              workspaceMode={workspaceMode}
              currentBlock={currentBlock}
              currentIndex={currentIndex}
              totalBlocks={blocks.length}
              isPlaying={isPlaying}
              loadingAudio={loadingAudio}
              playbackAvailable={playbackAvailable}
              rate={rate}
              voiceCatalog={availableVoiceCatalog}
              voiceChoice={resolvedVoiceChoice || availableVoiceCatalog[0] || null}
              providerLabel={providerLabel}
              progress={progress}
              deviceVoiceSupported={deviceVoiceSupported}
              onTogglePlayback={togglePlayback}
              onSeekBack={() => seekAudio(-10)}
              onSeekForward={() => seekAudio(10)}
              onPreviousBlock={() => jumpToIndex(currentIndex - 1)}
              onNextBlock={() => jumpToIndex(currentIndex + 1)}
              onCycleRate={cycleRate}
              onVoiceChange={(choice) => {
                const changed =
                  choice?.provider !== voiceChoiceRef.current?.provider ||
                  String(choice?.voiceId || "") !== String(voiceChoiceRef.current?.voiceId || "");
                if (
                  changed &&
                  (audioRef.current ||
                    speechUtteranceRef.current ||
                    playbackStateRef.current.active ||
                    playbackStateRef.current.paused)
                ) {
                  stopPlayback();
                  setFeedback("Playback stopped so the new voice can take over.");
                }
                setVoiceChoice(choice);
                setProviderLabel(choice?.label || "Voice");
              }}
            />
          </>
        ) : (
          <>
            <WorkspaceShelf
              open={workspacePickerOpen}
              activeProject={activeProject}
              documents={projectDocuments}
              activeDocumentKey={activeDocumentKey}
              loadingDocumentKey={loadingDocumentKey}
              onOpenProjectHome={() => {
                setWorkspacePickerOpen(false);
                openLaunchpad();
              }}
              uploading={uploading}
              onOpenDocument={(documentKey, mode, options = {}) => {
                void enterWorkspace(documentKey, mode, options);
              }}
              onUpload={() => fileInputRef.current?.click()}
              onPasteSource={() => void pasteIntoWorkspace("source")}
              onClose={() => setWorkspacePickerOpen(false)}
              lastUsedMode={lastUsedMode}
            />

            <WorkspaceToolbar
              activeDocument={activeDocument}
              viewMode={viewMode}
              editMode={editMode}
              aiOpen={aiOpen}
              documentState={activeDocumentState}
              onReloadLatest={() => void reloadLatestDocument()}
              status={status}
              statusTone={statusTone}
              onSetViewMode={setViewMode}
              onToggleEditMode={() => setEditMode((value) => !value)}
              onToggleAi={() => setAiOpen((value) => !value)}
              clipboardCount={clipboard.length}
              stagedCount={stagedAiBlocks.length}
              isMobileLayout={isMobileLayout}
              onOpenClipboard={() => setMobileComposeOpen(true)}
              isClipboardOpen={mobileComposeOpen}
            />

            <section className="assembler-surface">
              {viewMode === "log" ? (
                <LogView
                  logEntries={activeDocument.logEntries || []}
                  receiptPending={receiptPending}
                  onCreateReceipt={createReceiptDraft}
                  onExportReceipt={exportReceipt}
                  onExportDocument={exportDocument}
                />
              ) : (
                <div className="assembler-document">
                  <div className="assembler-document__header">
                    <div>
                      <h2 className="assembler-document__title">{activeDocument.title}</h2>
                      {activeDocument.subtitle ? (
                        <p className="assembler-document__subtitle">{activeDocument.subtitle}</p>
                      ) : null}
                    </div>

                    <div className="assembler-document__side">
                      <div className="assembler-document__meta">
                        <span>{getDocumentKindLabel(activeDocument)}</span>
                        <span>{getDocumentBlockCountLabel(activeDocument)}</span>
                        {activeDocument.sourceFiles?.length ? (
                          <span>{activeDocument.sourceFiles.join(", ")}</span>
                        ) : null}
                        {activeDocument.derivationModel ? (
                          <span>{activeDocument.derivationModel}</span>
                        ) : null}
                      </div>
                      {activeDocumentAsset ? (
                        <div className="assembler-document__asset">
                          {activeDocumentAsset.kind === "image" ? (
                            <img
                              className="assembler-document__asset-thumb"
                              src={activeDocumentAsset.url}
                              alt={`Original image for ${activeDocument.title}`}
                            />
                          ) : (
                            <div className="assembler-document__asset-thumb assembler-document__asset-thumb--icon">
                              {activeDocumentAsset.kind === "audio" ? "AUDIO" : "LINK"}
                            </div>
                          )}
                          <div className="assembler-document__asset-copy">
                            <span className="assembler-document__asset-badge">
                              {getDocumentKindLabel(activeDocument).toUpperCase()}
                            </span>
                            <span className="assembler-document__asset-label">
                              {getSourceAssetLabel(activeDocumentAsset)}
                            </span>
                            {activeDocumentAsset.kind === "audio" && activeDocumentAsset.durationMs ? (
                              <span className="assembler-document__asset-detail">
                                {formatAssetDuration(activeDocumentAsset.durationMs)}
                              </span>
                            ) : null}
                            <a
                              className="assembler-document__asset-link"
                              href={activeDocumentAsset.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {activeDocumentAsset.kind === "image"
                                ? "Open original image"
                                : activeDocumentAsset.kind === "audio"
                                  ? "Open original audio"
                                  : "Open original link"}
                            </a>
                          </div>
                        </div>
                      ) : null}
                      {isMobileLayout && canManageActiveSource ? (
                        <button
                          type="button"
                          className="assembler-document__tools-toggle"
                          onClick={() => setMobileSourceToolsOpen((value) => !value)}
                        >
                          {mobileSourceToolsOpen || cleanupOpen ? "Hide Tools" : "Tools"}
                        </button>
                      ) : null}
                      {canManageActiveSource ? (
                        <div
                          className={`assembler-document__actions ${
                            !isMobileLayout || mobileSourceToolsOpen || cleanupOpen ? "is-visible" : ""
                          }`}
                        >
                          <SourceActionButton
                            kind="replace"
                            label={cleanupOpen ? "Hide find and replace" : "Show find and replace"}
                            active={cleanupOpen}
                            disabled={Boolean(cleanupPendingAction) || polishPending}
                            onClick={() => setCleanupOpen((value) => !value)}
                          />
                          <SourceActionButton
                            kind="unescape"
                            label={cleanupPendingAction === "unescape" ? "Unescaping markdown..." : "Unescape markdown"}
                            disabled={Boolean(cleanupPendingAction) || polishPending}
                            onClick={() => void unescapeActiveSource()}
                          />
                          <SourceActionButton
                            kind="clean"
                            label={polishPending ? "Cleaning formatting..." : "Clean formatting"}
                            disabled={Boolean(cleanupPendingAction) || polishPending}
                            onClick={() => void polishActiveSource()}
                          />
                        </div>
                      ) : null}
                      {activeDocumentWarning ? (
                        <div className="assembler-document__note">{activeDocumentWarning}</div>
                      ) : null}
                    </div>
                  </div>

                  {cleanupOpen && canManageActiveSource ? (
                    <SourceCleanupTray
                      findValue={cleanupFind}
                      replaceValue={cleanupReplace}
                      pendingAction={cleanupPendingAction}
                      onFindChange={setCleanupFind}
                      onReplaceChange={setCleanupReplace}
                      onReplaceAll={() => void replaceAcrossSource()}
                      onDeleteMatches={() => void deleteMatchingBlocks()}
                      onClose={() => setCleanupOpen(false)}
                    />
                  ) : null}

                  <div className="assembler-document__blocks">
                    {blocks.map((block) => (
                      <BlockRow
                        key={block.id}
                        block={block}
                        blockRef={(element) => {
                          blockRefs.current[block.id] = element;
                        }}
                        isFocused={block.id === focusBlockId}
                        isPlaying={block.id === currentBlock?.id && isPlaying}
                        isNext={block.id === nextBlock?.id}
                        isSelected={clipboard.some((item) => item.id === block.id)}
                        editMode={editMode}
                        canDelete={editMode && canManageActiveSource && !cleanupPendingAction && !polishPending}
                        saveState={blockSaveStates[block.id] || ""}
                        onFocus={focusBlock}
                        onAdd={addBlockToClipboard}
                        onDelete={(blockId) => void deleteBlock(blockId)}
                        onRemove={removeBlockFromClipboard}
                        onEdit={editBlock}
                      />
                    ))}
                  </div>
                </div>
              )}
            </section>

            {(clipboard.length || stagedAiBlocks.length) && !isMobileLayout ? (
              <ClipboardTray
                expanded={clipboardExpanded}
                stagedBlocks={stagedAiBlocks}
                clipboard={clipboard}
                documents={projectDocuments}
                onToggleExpanded={() => setClipboardExpanded((value) => !value)}
                onAcceptStagedBlock={acceptStagedBlock}
                onAcceptAllStagedBlocks={acceptAllStagedBlocks}
                onClearStagedBlocks={() => setStagedAiBlocks([])}
                onRemoveClipboardIndex={removeClipboardIndex}
                onReorderClipboard={(index, delta) =>
                  setClipboard((previous) => moveListItem(previous, index, delta))
                }
                onClearClipboard={() => setClipboard([])}
                onAssemble={assembleClipboard}
              />
            ) : null}

            {isMobileLayout ? (
              <MobileComposeSheet
                open={mobileComposeOpen}
                clipboard={clipboard}
                stagedBlocks={stagedAiBlocks}
                documents={projectDocuments}
                onClose={() => setMobileComposeOpen(false)}
                onAcceptStagedBlock={acceptStagedBlock}
                onAcceptAllStagedBlocks={acceptAllStagedBlocks}
                onClearStagedBlocks={() => setStagedAiBlocks([])}
                onRemoveClipboardIndex={removeClipboardIndex}
                onReorderClipboard={(index, delta) =>
                  setClipboard((previous) => moveListItem(previous, index, delta))
                }
                onClearClipboard={() => setClipboard([])}
                onAssemble={assembleClipboard}
              />
            ) : null}

            {aiOpen ? (
              <AiBar
                inputRef={aiInputRef}
                value={aiInput}
                scope={aiScope}
                pending={aiPending}
                stagedBlocks={stagedAiBlocks}
                onChange={setAiInput}
                onScopeChange={setAiScope}
                onSubmit={runAiOperation}
                onPreset={(preset) => setAiInput(`${preset} `)}
                onAcceptStagedBlock={acceptStagedBlock}
                onAcceptAllStagedBlocks={acceptAllStagedBlocks}
                onClearStagedBlocks={() => setStagedAiBlocks([])}
                onClose={() => setAiOpen(false)}
              />
            ) : null}

            <PlayerBar
              workspaceMode={workspaceMode}
              currentBlock={currentBlock}
              currentIndex={currentIndex}
              totalBlocks={blocks.length}
              isPlaying={isPlaying}
              loadingAudio={loadingAudio}
              playbackAvailable={playbackAvailable}
              rate={rate}
              voiceCatalog={availableVoiceCatalog}
              voiceChoice={resolvedVoiceChoice || availableVoiceCatalog[0] || null}
              providerLabel={providerLabel}
              progress={progress}
              deviceVoiceSupported={deviceVoiceSupported}
              onTogglePlayback={togglePlayback}
              onSeekBack={() => seekAudio(-10)}
              onSeekForward={() => seekAudio(10)}
              onPreviousBlock={() => jumpToIndex(currentIndex - 1)}
              onNextBlock={() => jumpToIndex(currentIndex + 1)}
              onCycleRate={cycleRate}
              onVoiceChange={(choice) => {
                const changed =
                  choice?.provider !== voiceChoiceRef.current?.provider ||
                  String(choice?.voiceId || "") !== String(voiceChoiceRef.current?.voiceId || "");
                if (
                  changed &&
                  (audioRef.current ||
                    speechUtteranceRef.current ||
                    playbackStateRef.current.active ||
                    playbackStateRef.current.paused)
                ) {
                  stopPlayback();
                  setFeedback("Playback stopped so the new voice can take over.");
                }
                setVoiceChoice(choice);
                setProviderLabel(choice?.label || "Voice");
              }}
            />
          </>
        )}

        <ImageIntakeChooser
          open={Boolean(pendingImageIntake)}
          draft={pendingImageIntake}
          pending={uploading || Boolean(pastePendingMode)}
          preferredMode={preferredImageDerivationMode}
          onClose={() => setPendingImageIntake(null)}
          onChoose={(nextMode) => {
            const normalizedMode = normalizePreferredImageDerivationMode(nextMode);
            setPreferredImageDerivationMode(normalizedMode);

            if (pendingImageIntake?.source === "upload" && pendingImageIntake.file) {
              void handleUpload(pendingImageIntake.file, { derivationMode: normalizedMode });
              return;
            }

            if (pendingImageIntake?.source === "paste" && pendingImageIntake.payload) {
              void pasteIntoWorkspace("source", pendingImageIntake.payload, {
                derivationMode: normalizedMode,
              });
            }
          }}
        />
        <DropAnythingSheet
          open={dropAnythingOpen}
          pending={uploading || Boolean(pastePendingMode)}
          onClose={() => setDropAnythingOpen(false)}
          onUpload={() => {
            setDropAnythingOpen(false);
            fileInputRef.current?.click();
          }}
          onImportFolder={() => {
            setDropAnythingOpen(false);
            openFolderPicker();
          }}
          onPaste={() => {
            setDropAnythingOpen(false);
            void pasteIntoWorkspace("source");
          }}
          onImportLink={(url) => {
            void importLinkFromIntake(url);
          }}
        />
        <LinkIntakeChooser
          open={Boolean(pendingLinkIntake)}
          draft={pendingLinkIntake}
          pending={Boolean(pastePendingMode) || uploading}
          onFetchLink={() => {
            const pendingUrl = pendingLinkIntake?.url || "";
            setPendingLinkIntake(null);
            setPastePendingMode("source");
            setFeedback("Fetching page from link...");
            void createLinkSource(pendingUrl)
              .catch((error) => {
                setFeedback(
                  error instanceof Error ? error.message : "Could not create a source from that link.",
                  "error",
                );
              })
              .finally(() => {
                setPastePendingMode("");
              });
          }}
          onPasteRaw={() => {
            const nextPayload = pendingLinkIntake?.payload || null;
            setPendingLinkIntake(null);
            if (nextPayload) {
              void pasteIntoWorkspace("source", nextPayload, { forceRawText: true });
            }
          }}
          onClose={() => setPendingLinkIntake(null)}
        />
        <VoiceRecorderDialog
          open={voiceRecorderOpen}
          phase={voiceRecorderPhase}
          elapsedSeconds={voiceRecorderElapsed}
          level={voiceRecorderLevel}
          errorMessage={voiceRecorderError}
          onClose={closeVoiceRecorder}
          onStart={() => void startVoiceRecorder()}
          onPause={pauseVoiceRecorder}
          onResume={resumeVoiceRecorder}
          onStop={() => void stopVoiceRecorder()}
        />
      </div>
      {dropActive ? (
        <div className="assembler-drop-overlay" aria-hidden="true">
          <div className="assembler-drop-overlay__panel">
            <span className="assembler-drop-overlay__eyebrow">Drop anything</span>
            <strong>Files, folders, images, screenshots, links, voice memos</strong>
          </div>
        </div>
      ) : null}
    </main>
  );
}
