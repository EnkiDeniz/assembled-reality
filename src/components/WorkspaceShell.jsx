"use client";

import Link from "next/link";
import { startTransition, useEffect, useRef, useState } from "react";
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
  hydrateProjectsWithDocuments,
  isProjectDocumentVisible,
  PRIMARY_WORKSPACE_DOCUMENT_KEY,
} from "@/lib/project-model";
import { parseSevenAudioHeaders } from "@/lib/seven";

const STORAGE_VERSION = 2;
const RATE_STEPS = [0.75, 1, 1.25, 1.5, 2];
const STATUS_TIMEOUT_MS = 5000;
const AI_SCOPE_OPTIONS = [
  { value: "document", label: "DOC" },
  { value: "block", label: "BLOCK" },
  { value: "clipboard", label: "CLIP" },
];

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

      for (const item of items) {
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

      if (html || text) {
        return { html, text };
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (typeof navigator.clipboard.readText === "function") {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        return { html: "", text };
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

function getClipboardPayloadFromPasteEvent(event) {
  const html = event?.clipboardData?.getData("text/html") || "";
  const text = event?.clipboardData?.getData("text/plain") || "";

  if (!html.trim() && !text.trim()) {
    return null;
  }

  return { html, text };
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

function buildWorkspaceUrl(documentKey, projectKey = DEFAULT_PROJECT_KEY, { launchpad = false } = {}) {
  const params = new URLSearchParams();

  if (projectKey && projectKey !== DEFAULT_PROJECT_KEY) {
    params.set("project", projectKey);
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

function ShelfGroup({
  label,
  documents,
  activeDocumentKey,
  onSelect,
  loadingDocumentKey,
  emptyMessage = "",
}) {
  return (
    <div className="assembler-shelf__group">
      <span className="assembler-shelf__label">{label}</span>
      <div className="assembler-shelf__items">
        {documents.length ? (
          documents.map((document) => (
            <button
              key={document.documentKey}
              type="button"
              className={`assembler-shelf__item ${
                document.documentKey === activeDocumentKey ? "is-active" : ""
              }`}
              onClick={() => onSelect(document.documentKey)}
            >
              {document.isAssembly ? (
                <span className="assembler-shelf__dot" aria-hidden="true" />
              ) : null}
              <span>{document.title}</span>
              {loadingDocumentKey === document.documentKey ? (
                <span className="assembler-shelf__loading">loading</span>
              ) : null}
            </button>
          ))
        ) : (
          <span className="assembler-shelf__empty">{emptyMessage}</span>
        )}
      </div>
    </div>
  );
}

function WorkspaceShelf({
  activeProject,
  documents,
  activeDocumentKey,
  projectHomeActive = false,
  loadingDocumentKey,
  onOpenProjectHome,
  onSelect,
  onUpload,
  uploading = false,
}) {
  const grouped = groupedDocuments(documents);
  const currentAssembly =
    (activeProject?.currentAssemblyDocumentKey &&
      grouped.assemblies.find(
        (document) => document.documentKey === activeProject.currentAssemblyDocumentKey,
      )) ||
    grouped.assemblies[0] ||
    null;
  const priorAssemblies = grouped.assemblies.filter(
    (document) => document.documentKey !== currentAssembly?.documentKey,
  );

  return (
    <div className="assembler-shelf">
      <button
        type="button"
        className={`assembler-shelf__home ${projectHomeActive ? "is-active" : ""}`}
        onClick={onOpenProjectHome}
      >
        <span className="assembler-shelf__label">Project home</span>
        <span className="assembler-shelf__project-name">{activeProject?.title || "Main Project"}</span>
        <span className="assembler-shelf__home-detail">
          {currentAssembly ? `Current assembly: ${currentAssembly.title}` : "No assembly yet"}
        </span>
      </button>

      <ShelfGroup
        label="Current assembly"
        documents={currentAssembly ? [currentAssembly] : []}
        activeDocumentKey={activeDocumentKey}
        loadingDocumentKey={loadingDocumentKey}
        onSelect={onSelect}
        emptyMessage="Assemble from the clipboard to create one."
      />

      <ShelfGroup
        label="Sources"
        documents={grouped.sources}
        activeDocumentKey={activeDocumentKey}
        loadingDocumentKey={loadingDocumentKey}
        onSelect={onSelect}
        emptyMessage="Import or keep a source here."
      />

      <ShelfGroup
        label="Earlier assemblies"
        documents={priorAssemblies}
        activeDocumentKey={activeDocumentKey}
        loadingDocumentKey={loadingDocumentKey}
        onSelect={onSelect}
        emptyMessage="No earlier assemblies yet."
      />

      <button
        type="button"
        className="assembler-shelf__upload"
        onClick={onUpload}
        disabled={uploading}
      >
        {uploading ? "Importing..." : "+ Upload"}
      </button>
    </div>
  );
}

function WorkspaceLaunchpad({
  activeProject,
  activeProjectKey,
  projects,
  activeDocument,
  documents,
  projectDrafts = [],
  projectActionPending = "",
  loadingDocumentKey,
  onContinue,
  onCreateProject,
  onOpenDocument,
  onOpenProject,
  onPasteClipboard,
  onPasteSource,
  onUpload,
  uploading = false,
  pastePendingMode = "",
  clipboardCount = 0,
}) {
  const grouped = groupedDocuments(documents);
  const projectEntryDocumentKey = getProjectEntryDocumentKey(activeProject);
  const entryDocument =
    documents.find((document) => document.documentKey === projectEntryDocumentKey) || null;
  const currentAssemblyDocument =
    (activeProject?.currentAssemblyDocumentKey &&
      documents.find((document) => document.documentKey === activeProject.currentAssemblyDocumentKey)) ||
    grouped.assemblies[0] ||
    null;
  const sourceDocuments = grouped.sources;
  const sourceCount = activeProject?.sourceCount ?? sourceDocuments.length;
  const assemblyCount = activeProject?.assemblyCount ?? grouped.assemblies.length;
  const continueDocument = currentAssemblyDocument || entryDocument || activeDocument || sourceDocuments[0] || null;
  const busy = uploading || Boolean(pastePendingMode);

  return (
    <div className="assembler-launchpad">
      <div className="assembler-launchpad__panel">
        <div className="assembler-launchpad__copy">
          <div className="assembler-launchpad__brand">
            <span className="assembler-launchpad__mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <div className="assembler-launchpad__brand-copy">
              <h1 className="assembler-launchpad__name">{activeProject?.title || "Main Project"}</h1>
              <div className="assembler-launchpad__meta-line">
                <span>{sourceCount} src</span>
                <span>{assemblyCount} asm</span>
                <span>{projectDrafts.length} rcpt</span>
                <Link href="/account">Settings</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="assembler-launchpad__actions">
          <button
            type="button"
            className="assembler-launchpad__action is-primary"
            onClick={() => onContinue(continueDocument?.documentKey || projectEntryDocumentKey)}
            disabled={!continueDocument || busy}
          >
            <span className="assembler-launchpad__action-icon" aria-hidden="true">
              <WorkspaceActionIcon kind="continue" />
            </span>
            <span className="assembler-launchpad__action-label">Open</span>
            <span className="assembler-launchpad__action-value">
              Continue
            </span>
            {continueDocument?.title ? (
              <span className="assembler-launchpad__action-detail">{continueDocument.title}</span>
            ) : null}
          </button>

          <button
            type="button"
            className="assembler-launchpad__action"
            onClick={onUpload}
            disabled={busy}
          >
            <span className="assembler-launchpad__action-icon" aria-hidden="true">
              <WorkspaceActionIcon kind="upload" />
            </span>
            <span className="assembler-launchpad__action-label">File</span>
            <span className="assembler-launchpad__action-value">
              {uploading ? "Importing..." : "Upload"}
            </span>
            <span className="assembler-launchpad__action-detail">PDF DOCX MD TXT</span>
          </button>

          <button
            type="button"
            className="assembler-launchpad__action"
            onClick={onPasteSource}
            disabled={busy}
          >
            <span className="assembler-launchpad__action-icon" aria-hidden="true">
              <WorkspaceActionIcon kind="paste-source" />
            </span>
            <span className="assembler-launchpad__action-label">Clipboard</span>
            <span className="assembler-launchpad__action-value">
              {pastePendingMode === "source" ? "Pasting..." : "Paste source"}
            </span>
            <span className="assembler-launchpad__action-detail">Create source</span>
          </button>

          <button
            type="button"
            className="assembler-launchpad__action"
            onClick={onPasteClipboard}
            disabled={busy}
          >
            <span className="assembler-launchpad__action-icon" aria-hidden="true">
              <WorkspaceActionIcon kind="clipboard" />
            </span>
            <span className="assembler-launchpad__action-label">Stage</span>
            <span className="assembler-launchpad__action-value">
              {pastePendingMode === "clipboard" ? "Pasting..." : "Clipboard"}
            </span>
            <span className="assembler-launchpad__action-detail">
              {clipboardCount ? `${clipboardCount} staged` : "Paste blocks"}
            </span>
          </button>
        </div>

        <div className="assembler-launchpad__sections">
          <div className="assembler-launchpad__section">
            <div className="assembler-launchpad__section-head">
              <span>Projects</span>
              <button
                type="button"
                className="assembler-launchpad__section-action"
                onClick={onCreateProject}
                disabled={projectActionPending === "__create__"}
              >
                {projectActionPending === "__create__" ? "Creating..." : "New"}
              </button>
            </div>

            <div className="assembler-launchpad__section-list">
              {projects.slice(0, 6).map((project) => (
                <button
                  key={project.projectKey}
                  type="button"
                  className={`assembler-launchpad__recent-row ${
                    project.projectKey === activeProjectKey ? "is-active" : ""
                  }`}
                  onClick={() => onOpenProject(project.projectKey)}
                  disabled={projectActionPending === project.projectKey}
                >
                  <div className="assembler-launchpad__recent-main">
                    <span className="assembler-launchpad__recent-title">{project.title}</span>
                  </div>
                  <span className="assembler-launchpad__recent-meta">
                    {projectActionPending === project.projectKey
                      ? "opening"
                      : `${project.sourceCount} src · ${project.assemblyCount} asm`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="assembler-launchpad__section">
            <div className="assembler-launchpad__section-head">
              <span>Sources</span>
              <span>{sourceCount}</span>
            </div>

            <div className="assembler-launchpad__section-list">
              {sourceDocuments.length ? (
                sourceDocuments.slice(0, 6).map((document) => (
                  <button
                    key={document.documentKey}
                    type="button"
                    className="assembler-launchpad__recent-row"
                    onClick={() => onOpenDocument(document.documentKey)}
                  >
                    <div className="assembler-launchpad__recent-main">
                      <span className="assembler-launchpad__recent-title">{document.title}</span>
                    </div>
                    <span className="assembler-launchpad__recent-meta">
                      {loadingDocumentKey === document.documentKey
                        ? "loading"
                        : document.documentType === "builtin"
                          ? "builtin"
                          : document.formatLabel || "source"}
                    </span>
                  </button>
                ))
              ) : (
                <p className="assembler-launchpad__empty">
                  No visible sources yet.
                </p>
              )}
            </div>
          </div>

          <div className="assembler-launchpad__section">
            <div className="assembler-launchpad__section-head">
              <span>Current assembly</span>
              <span>{currentAssemblyDocument ? "live" : "idle"}</span>
            </div>

            {currentAssemblyDocument ? (
              <button
                type="button"
                className="assembler-launchpad__recent-row"
                onClick={() => onOpenDocument(currentAssemblyDocument.documentKey)}
              >
                <div className="assembler-launchpad__recent-main">
                  <span className="assembler-launchpad__recent-title">{currentAssemblyDocument.title}</span>
                </div>
                <span className="assembler-launchpad__recent-meta">
                  {loadingDocumentKey === currentAssemblyDocument.documentKey ? "loading" : "assembly"}
                </span>
              </button>
            ) : (
              <p className="assembler-launchpad__empty">Nothing assembled yet.</p>
            )}

            <div className="assembler-launchpad__section-head assembler-launchpad__section-head--inline">
              <span>Receipts</span>
              <Link href="/account" className="assembler-launchpad__recent-link">
                Account
              </Link>
            </div>
            <p className="assembler-launchpad__empty">
              {projectDrafts.length ? `${projectDrafts.length} receipts` : "No receipts"}
            </p>
          </div>
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
}) {
  return (
    <div className="assembler-toolbar">
      <div className="assembler-toolbar__left">
        <button
          type="button"
          className={`assembler-tab ${viewMode === "doc" ? "is-active" : ""}`}
          onClick={() => onSetViewMode("doc")}
        >
          DOC
        </button>
        <button
          type="button"
          className={`assembler-tab ${viewMode === "log" ? "is-active is-log" : ""}`}
          onClick={() => onSetViewMode("log")}
        >
          LOG
        </button>

        {viewMode === "doc" ? (
          <button
            type="button"
            className={`assembler-tab ${editMode ? "is-active is-edit" : ""}`}
            onClick={onToggleEditMode}
            disabled={!activeDocument?.isEditable}
          >
            {editMode ? "EDITING" : "EDIT"}
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
          aria-label={aiOpen ? "Close AI prompt" : "Open AI prompt"}
        >
          {aiOpen ? "CLOSE" : "AI"}
        </button>
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
          CLIPBOARD
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

function PlayerBar({
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
  aiOpen,
  deviceVoiceSupported,
  onTogglePlayback,
  onSeekBack,
  onSeekForward,
  onPreviousBlock,
  onNextBlock,
  onCycleRate,
  onVoiceChange,
  onToggleAi,
}) {
  const selectedVoiceValue = voiceChoice
    ? `${voiceChoice.provider}:${voiceChoice.voiceId || "default"}`
    : "";

  return (
    <div className="assembler-player">
      <div className="assembler-player__controls">
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
        <button
          type="button"
          className={`assembler-player__button ${aiOpen ? "is-ai-active" : ""}`}
          onClick={onToggleAi}
        >
          {aiOpen ? "CLOSE AI" : "AI"}
        </button>
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
  voiceCatalog,
  defaultVoiceChoice,
  showLaunchpadInitially = false,
}) {
  const fileInputRef = useRef(null);
  const aiInputRef = useRef(null);
  const blockRefs = useRef({});
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const speechUtteranceRef = useRef(null);
  const speechRunIdRef = useRef(0);
  const playbackStateRef = useRef({ active: false, kind: null, paused: false });
  const storageHydratedRef = useRef(false);
  const pasteIntoWorkspaceRef = useRef(null);
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
  const [blockSaveStates, setBlockSaveStates] = useState({});
  const [projectDraftsState, setProjectDraftsState] = useState(projectDrafts);
  const [projectActionPending, setProjectActionPending] = useState("");
  const [launchpadOpen, setLaunchpadOpen] = useState(showLaunchpadInitially);

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
  const blocks = activeDocument?.blocks || [];
  const activeDocumentState = documentStates[activeDocumentKey] || null;
  const activeDocumentWarning = getPrimaryDiagnosticMessage({
    diagnostics: activeDocument?.intakeDiagnostics,
  });
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

  activeDocumentRef.current = activeDocument;
  blocksRef.current = blocks;
  rateRef.current = rate;
  voiceChoiceRef.current = resolvedVoiceChoice;
  documentLogsRef.current = documentLogs;

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

  }, [storageKey, voiceCatalog, defaultVoiceChoice, activeDocument.documentKey]);

  useEffect(() => {
    setDeviceVoiceSupported(browserSupportsDeviceVoice());
  }, []);

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
      const fallbackDocumentKey = getProjectEntryDocumentKey(activeProject);
      if (fallbackDocumentKey && fallbackDocumentKey !== activeDocumentKey) {
        startTransition(() => {
          setActiveDocumentKey(fallbackDocumentKey);
        });

        if (typeof window !== "undefined") {
          window.history.replaceState(
            {},
            "",
            buildWorkspaceUrl(fallbackDocumentKey, activeProject.projectKey),
          );
        }
      }
    }
  }, [activeProject, activeDocumentKey]);

  useEffect(() => {
    writeWorkspaceState(storageKey, {
      clipboard,
      documentLogs,
      rate,
    });
  }, [clipboard, documentLogs, rate, storageKey]);

  useEffect(() => {
    setFocusBlockId(firstBlockId);
    setPlayheadBlockId(firstBlockId);
    setEditMode(false);
    setBlockSaveStates({});
    setCleanupOpen(false);
    setCleanupFind("");
    setCleanupReplace("");
    setCleanupPendingAction("");
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
    function handleKeyDown(event) {
      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isTypingTarget(event.target)
      ) {
        event.preventDefault();
        setAiOpen(true);
        return;
      }

      if (event.key === "Escape" && aiOpen) {
        setAiOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [aiOpen]);

  useEffect(() => {
    function handlePaste(event) {
      if (pastePendingMode) return;
      if (isTypingTarget(event.target)) return;

      const payload = getClipboardPayloadFromPasteEvent(event);
      if (!payload) return;

      event.preventDefault();
      void pasteIntoWorkspaceRef.current?.("clipboard", payload);
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

  function updateUrl(documentKey, projectKey = activeProjectKey) {
    if (typeof window === "undefined") return;
    const nextUrl = buildWorkspaceUrl(documentKey, projectKey);
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
        buildWorkspaceUrl("", payload.project.projectKey, { launchpad: true }),
      );
    } catch (error) {
      setProjectActionPending("");
      setFeedback(error instanceof Error ? error.message : "Could not create the project.", "error");
    }
  }

  function openLaunchpad() {
    stopPlayback();
    setAiOpen(false);
    setEditMode(false);
    setViewMode("doc");
    setLaunchpadOpen(true);
    if (typeof window !== "undefined") {
      window.history.replaceState(
        {},
        "",
        buildWorkspaceUrl("", activeProjectKey, { launchpad: true }),
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

  async function loadDocument(documentKey) {
    if (!documentKey || documentKey === activeDocumentKey) return;

    stopPlayback({ keepPlayhead: false });
    setLoadingDocumentKey(documentKey);

    try {
      if (!documentCache[documentKey]) {
        upsertDocument(await fetchLatestDocument(documentKey), { replaceLogs: true });
      }

      startTransition(() => {
        setActiveDocumentKey(documentKey);
      });
      updateUrl(documentKey, activeProjectKey);
      setFeedback(`Opened ${documentsState.find((document) => document.documentKey === documentKey)?.title || "document"}.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not load the document.", "error");
    } finally {
      setLoadingDocumentKey("");
    }
  }

  async function enterWorkspace(documentKey = activeDocumentKey) {
    setLaunchpadOpen(false);

    if (!documentKey || documentKey === activeDocumentKey) {
      updateUrl(activeDocumentKey, activeProjectKey);
      return;
    }

    await loadDocument(documentKey);
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

  async function handleUpload(file) {
    if (!file) return;

    setUploading(true);
    setFeedback(`Importing ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectKey", activeProjectKey);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.document) {
        throw new Error(payload?.error || "The document could not be imported.");
      }

      upsertDocument(payload.document, { replaceLogs: true });
      attachDocumentToActiveProject(payload.document, { role: "SOURCE" });
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
      setLaunchpadOpen(false);
      await loadDocument(payload.document.documentKey);
      const intakeWarning = getPrimaryDiagnosticMessage(payload.intake);
      setFeedback(
        intakeWarning
          ? `Imported ${payload.document.title}. ${intakeWarning}`
          : `Imported ${payload.document.title}.`,
        intakeWarning ? "" : "success",
      );
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "The document could not be imported.",
        "error",
      );
    } finally {
      setUploading(false);
    }
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

  async function pasteIntoWorkspace(mode, payload = null) {
    if (pastePendingMode) return;

    setPastePendingMode(mode);
    setFeedback(mode === "source" ? "Pasting source..." : "Pasting to clipboard...");

    try {
      const clipboardPayload = payload || (await readClipboardPayloadFromNavigator());
      const response = await fetch("/api/workspace/paste", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey: activeProjectKey,
          mode,
          html: clipboardPayload?.html || "",
          text: clipboardPayload?.text || "",
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Could not paste into the workspace.");
      }

      if (mode === "source") {
        if (!result?.document?.documentKey) {
          throw new Error("The pasted source could not be created.");
        }

        upsertDocument(result.document, { replaceLogs: true });
        attachDocumentToActiveProject(result.document, { role: "SOURCE" });
        appendLog("PASTED", `${result.document.title} created from clipboard`, {
          documentKey: result.document.documentKey,
        });
        setLaunchpadOpen(false);
        setAiOpen(false);
        setViewMode("doc");
        await loadDocument(result.document.documentKey);

        const intakeWarning = getPrimaryDiagnosticMessage(result.intake);
        setFeedback(
          intakeWarning
            ? `Pasted ${result.document.title}. ${intakeWarning}`
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
          stopPlayback();
          setFeedback(`Finished ${documentAtStart.title}.`, "success");
          return;
        }

        playSequenceFromIndex(nextIndex);
      });
      audio.addEventListener("pause", () => {
        setIsPlaying(false);
      });
      audio.addEventListener("play", () => {
        setIsPlaying(true);
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
      };

      utterance.onresume = () => {
        if (runId !== speechRunIdRef.current) return;

        playbackStateRef.current = {
          ...playbackStateRef.current,
          active: true,
          paused: false,
        };
        setIsPlaying(true);
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

  return (
    <main className="assembler-page">
      <input
        ref={fileInputRef}
        className="terminal-file-input"
        type="file"
        accept=".txt,.md,.markdown,.doc,.docx,.pdf"
        onChange={(event) => {
          const [file] = event.target.files || [];
          if (!file) return;
          handleUpload(file);
          event.target.value = "";
        }}
      />

      <div className="assembler-shell">
        <header className="assembler-header">
          <div className="assembler-header__identity">
            <span className="assembler-header__name">Document Assembler</span>
            {activeProject ? (
              <span className="assembler-header__project">
                {activeProject.title}
              </span>
            ) : null}
          </div>

          <div className="assembler-header__actions">
            {!launchpadOpen ? (
              <button type="button" className="assembler-header__start" onClick={openLaunchpad}>
                Start
              </button>
            ) : null}

            <Link href="/account" className="assembler-header__account" aria-label="Account">
              [@]
            </Link>
          </div>
        </header>

        {launchpadOpen ? (
          <section className="assembler-surface assembler-surface--launchpad">
            <WorkspaceLaunchpad
              activeProject={activeProject}
              activeProjectKey={activeProjectKey}
              projects={hydratedProjects}
              activeDocument={activeDocument}
              documents={projectDocuments}
              projectDrafts={projectDraftsState}
              projectActionPending={projectActionPending}
              loadingDocumentKey={loadingDocumentKey}
              uploading={uploading}
              pastePendingMode={pastePendingMode}
              clipboardCount={clipboard.length}
              onContinue={enterWorkspace}
              onCreateProject={() => void createProject()}
              onOpenDocument={enterWorkspace}
              onOpenProject={openProject}
              onPasteSource={() => void pasteIntoWorkspace("source")}
              onPasteClipboard={() => void pasteIntoWorkspace("clipboard")}
              onUpload={() => fileInputRef.current?.click()}
            />
          </section>
        ) : (
          <>
            <WorkspaceShelf
              activeProject={activeProject}
              documents={projectDocuments}
              activeDocumentKey={activeDocumentKey}
              projectHomeActive={launchpadOpen}
              loadingDocumentKey={loadingDocumentKey}
              onOpenProjectHome={openLaunchpad}
              uploading={uploading}
              onSelect={loadDocument}
              onUpload={() => fileInputRef.current?.click()}
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
                        <span>{activeDocument.documentType}</span>
                        <span>{formatDocumentFormat(activeDocument.format, activeDocument.originalFilename)}</span>
                        {activeDocument.sourceFiles?.length ? (
                          <span>source: {activeDocument.sourceFiles.join(", ")}</span>
                        ) : null}
                      </div>
                      {canManageActiveSource ? (
                        <div className="assembler-document__actions">
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

            {clipboard.length || stagedAiBlocks.length ? (
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
              aiOpen={aiOpen}
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
              onToggleAi={() => setAiOpen((value) => !value)}
            />
          </>
        )}
      </div>
    </main>
  );
}
