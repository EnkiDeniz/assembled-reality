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
} from "@/lib/document-blocks";
import { clampListeningRate } from "@/lib/listening";
import { parseSevenAudioHeaders } from "@/lib/seven";

const STORAGE_VERSION = 1;
const RATE_STEPS = [0.75, 1, 1.25, 1.5, 2];
const STATUS_TIMEOUT_MS = 5000;

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
  return {
    sources: documents.filter(
      (document) =>
        document.documentType === "builtin" ||
        (!document.isAssembly && document.documentType !== "assembly"),
    ),
    assemblies: documents.filter(
      (document) => document.isAssembly || document.documentType === "assembly",
    ),
  };
}

function ShelfGroup({ label, documents, activeDocumentKey, onSelect, loadingDocumentKey }) {
  return (
    <div className="assembler-shelf__group">
      <span className="assembler-shelf__label">{label}</span>
      <div className="assembler-shelf__items">
        {documents.map((document) => (
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
        ))}
      </div>
    </div>
  );
}

function WorkspaceShelf({
  documents,
  activeDocumentKey,
  loadingDocumentKey,
  onSelect,
  onUpload,
}) {
  const grouped = groupedDocuments(documents);

  return (
    <div className="assembler-shelf">
      <ShelfGroup
        label="Sources"
        documents={grouped.sources}
        activeDocumentKey={activeDocumentKey}
        loadingDocumentKey={loadingDocumentKey}
        onSelect={onSelect}
      />

      <ShelfGroup
        label="Assemblies"
        documents={
          grouped.assemblies.length
            ? grouped.assemblies
            : [
                {
                  documentKey: "__assemblies-placeholder__",
                  title: "No assemblies yet",
                  isAssembly: true,
                },
              ]
        }
        activeDocumentKey={activeDocumentKey}
        loadingDocumentKey={loadingDocumentKey}
        onSelect={(documentKey) => {
          if (documentKey.startsWith("__")) return;
          onSelect(documentKey);
        }}
      />

      <button type="button" className="assembler-shelf__upload" onClick={onUpload}>
        + Upload
      </button>
    </div>
  );
}

function WorkspaceLaunchpad({
  activeDocument,
  documents,
  loadingDocumentKey,
  onContinue,
  onOpenDocument,
  onUpload,
}) {
  const latestAssembly =
    documents.find((document) => document.isAssembly || document.documentType === "assembly") || null;
  const recentDocuments = documents.slice(0, 6);
  const sourceCount = documents.filter(
    (document) =>
      document.documentType === "builtin" ||
      (!document.isAssembly && document.documentType !== "assembly"),
  ).length;
  const assemblyCount = documents.filter(
    (document) => document.isAssembly || document.documentType === "assembly",
  ).length;

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
              <h1 className="assembler-launchpad__name">Document Assembler</h1>
              <div className="assembler-launchpad__meta-line">
                <span>Workspace</span>
                <span>Receipts</span>
                <Link href="/account">Settings</Link>
              </div>
            </div>
          </div>

          <p className="assembler-launchpad__body">
            Compile source material into something you can actually use in life.
          </p>

          <div className="assembler-launchpad__stats">
            <span className="assembler-pill is-green">{sourceCount} source{sourceCount === 1 ? "" : "s"}</span>
            <span className="assembler-pill is-cyan">{assemblyCount} assembl{assemblyCount === 1 ? "y" : "ies"}</span>
            <span className="assembler-pill">{documents.length} total docs</span>
          </div>
        </div>

        <div className="assembler-launchpad__actions">
          <button type="button" className="assembler-launchpad__action is-primary" onClick={onContinue}>
            <span className="assembler-launchpad__action-icon" aria-hidden="true">
              ▣
            </span>
            <span className="assembler-launchpad__action-label">Continue</span>
            <span className="assembler-launchpad__action-value">{activeDocument?.title || "Open workspace"}</span>
            <span className="assembler-launchpad__action-detail">Resume the current working document</span>
          </button>

          <button type="button" className="assembler-launchpad__action" onClick={onUpload}>
            <span className="assembler-launchpad__action-icon" aria-hidden="true">
              ↥
            </span>
            <span className="assembler-launchpad__action-label">Upload</span>
            <span className="assembler-launchpad__action-value">Import a new source document</span>
            <span className="assembler-launchpad__action-detail">PDF, Word, markdown, or plain text</span>
          </button>

          {latestAssembly ? (
            <button
              type="button"
              className="assembler-launchpad__action"
              onClick={() => onOpenDocument(latestAssembly.documentKey)}
            >
              <span className="assembler-launchpad__action-icon" aria-hidden="true">
                ≣
              </span>
              <span className="assembler-launchpad__action-label">Latest assembly</span>
              <span className="assembler-launchpad__action-value">{latestAssembly.title}</span>
              <span className="assembler-launchpad__action-detail">Open the newest assembled document</span>
            </button>
          ) : (
            <Link href="/account" className="assembler-launchpad__action">
              <span className="assembler-launchpad__action-icon" aria-hidden="true">
                ⌘
              </span>
              <span className="assembler-launchpad__action-label">Account</span>
              <span className="assembler-launchpad__action-value">Receipts, connection, profile</span>
              <span className="assembler-launchpad__action-detail">Manage your settings and integrations</span>
            </Link>
          )}
        </div>

        <div className="assembler-launchpad__recent">
          <div className="assembler-launchpad__recent-head">
            <span>Recent documents</span>
            <Link href="/account" className="assembler-launchpad__recent-link">
              Account
            </Link>
          </div>

          <div className="assembler-launchpad__recent-list">
            {recentDocuments.map((document) => (
              <button
                key={document.documentKey}
                type="button"
                className="assembler-launchpad__recent-row"
                onClick={() => onOpenDocument(document.documentKey)}
              >
                <div className="assembler-launchpad__recent-main">
                  <span className="assembler-launchpad__recent-title">{document.title}</span>
                  <span className="assembler-launchpad__recent-subtitle">
                    {document.isAssembly
                      ? "assembled document"
                      : document.documentType === "builtin"
                        ? "built-in source text"
                        : `source · ${document.formatLabel || "markdown"}`}
                  </span>
                </div>
                <span className="assembler-launchpad__recent-meta">
                  {loadingDocumentKey === document.documentKey
                    ? "loading"
                    : document.isAssembly
                      ? "assembly"
                      : document.documentType === "builtin"
                        ? "builtin"
                        : "source"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkspaceToolbar({
  activeDocument,
  viewMode,
  editMode,
  aiOpen,
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
  saveState,
  onFocus,
  onAdd,
  onRemove,
  onEdit,
  blockRef,
}) {
  const [draftText, setDraftText] = useState(block.text);

  useEffect(() => {
    setDraftText(block.text);
  }, [block.id, block.text]);

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
      </div>

      <div className="assembler-block__body">
        <div className="assembler-block__meta">
          <span>{String(block.sourcePosition + 1).padStart(3, "0")}</span>
          <span>{block.sectionLabel || block.sourceTitle || block.sourceDocumentKey}</span>
          <span>{block.author === "ai" ? "AI" : block.operation}</span>
        </div>

        {editMode && block.isEditable ? (
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
                  : saveState === "error"
                    ? "Not saved"
                    : "Blur or Cmd/Ctrl+Enter to save"}
            </div>
          </div>
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
  pending,
  onChange,
  onSubmit,
  onPreset,
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
          placeholder={pending ? "thinking..." : "ask something about the current document..."}
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
    </div>
  );
}

function ClipboardTray({
  stagedBlocks,
  clipboard,
  documents,
  onAcceptStagedBlock,
  onAcceptAllStagedBlocks,
  onClearStagedBlocks,
  onRemoveClipboardIndex,
  onReorderClipboard,
  onClearClipboard,
  onAssemble,
}) {
  const [expanded, setExpanded] = useState(true);
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
      <div className="assembler-clipboard__header" onClick={() => setExpanded((value) => !value)}>
        <span>
          CLIPBOARD · {clipboard.length} block{clipboard.length === 1 ? "" : "s"} from{" "}
          {sourceCount} doc{sourceCount === 1 ? "" : "s"}
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
  rate,
  voiceCatalog,
  voiceChoice,
  providerLabel,
  progress,
  aiOpen,
  onTogglePlayback,
  onSeekBack,
  onSeekForward,
  onPreviousBlock,
  onNextBlock,
  onCycleRate,
  onVoiceChange,
  onToggleAi,
}) {
  return (
    <div className="assembler-player">
      <div className="assembler-player__controls">
        <button type="button" className="assembler-player__button" onClick={onSeekBack}>
          ◄10
        </button>
        <button
          type="button"
          className={`assembler-player__button is-primary ${isPlaying ? "is-playing" : ""}`}
          onClick={onTogglePlayback}
        >
          {loadingAudio ? "..." : isPlaying ? "PAUSE" : "PLAY"}
        </button>
        <button type="button" className="assembler-player__button" onClick={onSeekForward}>
          10►
        </button>
        <button type="button" className="assembler-player__button" onClick={onPreviousBlock}>
          PREV
        </button>
        <button type="button" className="assembler-player__button" onClick={onNextBlock}>
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
          value={`${voiceChoice.provider}:${voiceChoice.voiceId || "default"}`}
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
        >
          {voiceCatalog.map((entry) => (
            <option key={`${entry.provider}:${entry.voiceId || "default"}`} value={`${entry.provider}:${entry.voiceId || "default"}`}>
              {entry.label}
            </option>
          ))}
        </select>

        <span className="assembler-player__status">
          {providerLabel} · {currentBlock ? `block ${currentBlock.sourcePosition + 1}` : "idle"}
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
  initialDocument,
  voiceCatalog,
  defaultVoiceChoice,
  voiceEnabled,
  showLaunchpadInitially = false,
}) {
  const fileInputRef = useRef(null);
  const aiInputRef = useRef(null);
  const blockRefs = useRef({});
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const playbackStateRef = useRef({ active: false });
  const storageHydratedRef = useRef(false);
  const activeDocumentRef = useRef(initialDocument);
  const blocksRef = useRef(initialDocument.blocks || []);
  const rateRef = useRef(1);
  const voiceChoiceRef = useRef(defaultVoiceChoice);

  const storageKey = `document-assembler:${userId}:workspace`;

  const [documentsState, setDocumentsState] = useState(() => sortDocuments(documents));
  const [documentCache, setDocumentCache] = useState({
    [initialDocument.documentKey]: initialDocument,
  });
  const [activeDocumentKey, setActiveDocumentKey] = useState(initialDocument.documentKey);
  const [viewMode, setViewMode] = useState("doc");
  const [editMode, setEditMode] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [clipboard, setClipboard] = useState([]);
  const [stagedAiBlocks, setStagedAiBlocks] = useState([]);
  const [sessionLog, setSessionLog] = useState(
    normalizeWorkspaceLogEntries(initialDocument.logEntries, initialDocument.documentKey),
  );
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
  const [aiInput, setAiInput] = useState("");
  const [aiPending, setAiPending] = useState(false);
  const [receiptPending, setReceiptPending] = useState(false);
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState("");
  const [blockSaveStates, setBlockSaveStates] = useState({});
  const [launchpadOpen, setLaunchpadOpen] = useState(showLaunchpadInitially);

  const activeDocument = documentCache[activeDocumentKey] || initialDocument;
  const blocks = activeDocument?.blocks || [];
  const focusedBlock =
    blocks.find((block) => block.id === focusBlockId) || blocks[0] || null;
  const playbackBlockId = playheadBlockId || focusBlockId || blocks[0]?.id || null;
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
  voiceChoiceRef.current = voiceChoice;

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
    setSessionLog((previous) =>
      mergeLogs(previous, normalizeWorkspaceLogEntries(stored.sessionLog)),
    );
    setRate(clampListeningRate(stored.rate, 1));

    if (stored.voiceChoice?.provider) {
      const matched =
        voiceCatalog.find(
          (entry) =>
            entry.provider === stored.voiceChoice.provider &&
            String(entry.voiceId || "") === String(stored.voiceChoice.voiceId || ""),
        ) || defaultVoiceChoice;

      if (matched) {
        setVoiceChoice(matched);
        setProviderLabel(matched.label);
      }
    }
  }, [storageKey, voiceCatalog, defaultVoiceChoice, activeDocument.documentKey]);

  useEffect(() => {
    writeWorkspaceState(storageKey, {
      clipboard,
      sessionLog,
      rate,
      voiceChoice,
    });
  }, [clipboard, rate, sessionLog, storageKey, voiceChoice]);

  useEffect(() => {
    const nextBlockId = blocks[0]?.id || null;
    setFocusBlockId(nextBlockId);
    setPlayheadBlockId(nextBlockId);
    setEditMode(false);
    setBlockSaveStates({});
  }, [activeDocumentKey]);

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
      const target = event.target;
      const tagName = target?.tagName?.toLowerCase?.() || "";
      const isTypingTarget =
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable;

      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isTypingTarget
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

  function setFeedback(message, tone = "") {
    setStatus(message);
    setStatusTone(tone);
  }

  function updateUrl(documentKey) {
    if (typeof window === "undefined") return;
    const nextUrl =
      documentKey === "assembled-reality-v07-final"
        ? "/workspace"
        : `/workspace?document=${encodeURIComponent(documentKey)}`;
    window.history.replaceState({}, "", nextUrl);
  }

  function openLaunchpad() {
    stopPlayback();
    setAiOpen(false);
    setEditMode(false);
    setViewMode("doc");
    setLaunchpadOpen(true);
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/workspace");
    }
  }

  function stopPlayback({ keepPlayhead = true } = {}) {
    playbackStateRef.current.active = false;
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

    if (!keepPlayhead) {
      setPlayheadBlockId(null);
    }
  }

  function pausePlayback() {
    playbackStateRef.current.active = false;
    setIsPlaying(false);
    setLoadingAudio(false);

    if (audioRef.current) {
      audioRef.current.pause();
    }
  }

  function appendLog(action, detail, options = {}) {
    const entry = createWorkspaceLogEntry({
      time: new Date().toISOString(),
      action,
      detail,
      documentKey: options.documentKey || activeDocumentRef.current?.documentKey || "",
      blockIds: options.blockIds || [],
    });

    setSessionLog((previous) => mergeLogs(previous, [entry]));
    return entry;
  }

  function upsertDocument(document) {
    setDocumentCache((previous) => ({
      ...previous,
      [document.documentKey]: document,
    }));
    setDocumentsState((previous) => mergeDocumentSummary(previous, document));
  }

  async function loadDocument(documentKey) {
    if (!documentKey || documentKey === activeDocumentKey) return;

    stopPlayback({ keepPlayhead: false });
    setLoadingDocumentKey(documentKey);

    try {
      if (!documentCache[documentKey]) {
        const response = await fetch(
          `/api/workspace/document?documentKey=${encodeURIComponent(documentKey)}`,
          { cache: "no-store" },
        );
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.document) {
          throw new Error(payload?.error || "Could not load the document.");
        }

        upsertDocument(payload.document);
      }

      startTransition(() => {
        setActiveDocumentKey(documentKey);
      });
      updateUrl(documentKey);
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
      updateUrl(activeDocumentKey);
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
        blocks: nextDocument.blocks,
        logEntries: sessionLog.filter((entry) => entry.documentKey === nextDocument.documentKey),
      }),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.document) {
      throw new Error(payload?.error || "Could not save the document.");
    }

    upsertDocument(payload.document);
    return payload.document;
  }

  async function handleUpload(file) {
    if (!file) return;

    setUploading(true);
    setFeedback(`Importing ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.document) {
        throw new Error(payload?.error || "The document could not be imported.");
      }

      setDocumentsState((previous) => sortDocuments([...previous, payload.document]));
      appendLog("UPLOADED", `${payload.document.title} (${payload.document.formatLabel || "imported"})`, {
        documentKey: payload.document.documentKey,
      });
      setLaunchpadOpen(false);
      await loadDocument(payload.document.documentKey);
      setFeedback(`Imported ${payload.document.title}.`, "success");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "The document could not be imported.",
        "error",
      );
    } finally {
      setUploading(false);
    }
  }

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
      return;
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
      setFeedback(`Saved edit to block ${originalBlock.sourcePosition + 1}.`, "success");
    } catch (error) {
      upsertDocument(activeDocument);
      setBlockSaveStates((previous) => ({
        ...previous,
        [blockId]: "error",
      }));
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
    if (!voiceEnabled) {
      throw new Error("Voice is unavailable right now.");
    }

    const response = await fetch("/api/seven/audio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: block.plainText || block.text,
        preferredProvider: voiceChoiceRef.current?.provider || undefined,
        voiceId:
          voiceChoiceRef.current?.provider === "device"
            ? undefined
            : voiceChoiceRef.current?.voiceId || undefined,
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

  async function playSequenceFromIndex(index) {
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

      const { blob, headers } = await requestAudioForBlock(block);
      const nextAudioUrl = URL.createObjectURL(blob);
      const audio = new Audio(nextAudioUrl);

      audio.playbackRate = rateRef.current;
      audioRef.current = audio;
      audioUrlRef.current = nextAudioUrl;

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

      setProviderLabel(headers.provider || voiceChoiceRef.current?.label || "Voice");
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

  async function togglePlayback() {
    if (!blocks.length) return;

    if (audioRef.current && !audioRef.current.paused) {
      pausePlayback();
      setFeedback("Playback paused.");
      return;
    }

    if (audioRef.current && audioRef.current.paused && playbackStateRef.current.documentKey === activeDocument.documentKey) {
      playbackStateRef.current.active = true;
      await audioRef.current.play();
      setIsPlaying(true);
      setFeedback("Playback resumed.");
      return;
    }

    playbackStateRef.current = {
      active: true,
      documentKey: activeDocument.documentKey,
    };

    const startIndex = Math.max(
      0,
      blocks.findIndex((block) => block.id === (focusBlockId || blocks[0]?.id)),
    );
    await playSequenceFromIndex(startIndex === -1 ? 0 : startIndex);
  }

  function seekAudio(deltaSeconds) {
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

    if (isPlaying || playbackStateRef.current.active) {
      stopPlayback();
      playbackStateRef.current = {
        active: true,
        documentKey: activeDocument.documentKey,
      };
      await playSequenceFromIndex(clampedIndex);
      return;
    }

    setFeedback(`Moved to block ${block.sourcePosition + 1}.`);
  }

  function cycleRate() {
    const currentRate = clampListeningRate(rate, 1);
    const currentIndex = RATE_STEPS.indexOf(currentRate);
    const nextRate = RATE_STEPS[(currentIndex + 1) % RATE_STEPS.length];
    setRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
    setFeedback(`Playback rate ${nextRate.toFixed(2)}x.`);
  }

  async function runAiOperation() {
    const prompt = aiInput.trim();
    if (!prompt) return;

    setAiPending(true);
    appendLog("AI_QUERY", `"${prompt}"`, {
      documentKey: activeDocument.documentKey,
      blockIds: focusedBlock ? [focusedBlock.id] : [],
    });

    try {
      const response = await fetch("/api/workspace/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          documentKey: activeDocument.documentKey,
          title: activeDocument.title,
          blocks: activeDocument.blocks,
          selectedBlocks: focusedBlock ? [focusedBlock] : [],
          clipboardBlocks: clipboard,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !Array.isArray(payload?.blocks)) {
        throw new Error(payload?.error || "The workspace AI operation failed.");
      }

      setStagedAiBlocks(payload.blocks);
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
          logEntries: sessionLog,
          createReceipt: true,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.document) {
        throw new Error(payload?.error || "Could not assemble the document.");
      }

      upsertDocument(payload.document);
      setDocumentsState(sortDocuments(payload.documents || mergeDocumentSummary(documentsState, payload.document)));
      setClipboard([]);
      setStagedAiBlocks([]);
      appendLog(
        "ASSEMBLED",
        `New document "${payload.document.title}" from ${payload.document.blocks.length} blocks`,
        {
          documentKey: payload.document.documentKey,
          blockIds: payload.document.blocks.map((block) => block.id),
        },
      );
      if (payload?.draft?.id) {
        appendLog("RECEIPT", `Drafted receipt for "${payload.document.title}"`, {
          documentKey: payload.document.documentKey,
        });
      }
      await loadDocument(payload.document.documentKey);
      setFeedback(`Assembled ${payload.document.title}.`, "success");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not assemble the document.", "error");
    }
  }

  async function createReceiptDraft() {
    setReceiptPending(true);

    try {
      const response = await fetch("/api/workspace/receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document: activeDocument,
          blocks: activeDocument.blocks,
          logEntries: sessionLog,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.draft?.id) {
        throw new Error(payload?.error || "Could not draft the receipt.");
      }

      appendLog("RECEIPT", `Drafted receipt for "${activeDocument.title}"`, {
        documentKey: activeDocument.documentKey,
      });
      setFeedback(
        payload.remoteReceipt
          ? `Drafted receipt and pushed it to GetReceipts.`
          : `Drafted receipt locally.`,
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
    downloadFile(
      `${activeDocument.documentKey}-receipt.json`,
      JSON.stringify(
        {
          documentKey: activeDocument.documentKey,
          title: activeDocument.title,
          logEntries: sessionLog,
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
          <span className="assembler-header__name">Document Assembler</span>

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
              activeDocument={activeDocument}
              documents={documentsState}
              loadingDocumentKey={loadingDocumentKey}
              onContinue={() => enterWorkspace(activeDocumentKey)}
              onOpenDocument={enterWorkspace}
              onUpload={() => fileInputRef.current?.click()}
            />
          </section>
        ) : (
          <>
            <WorkspaceShelf
              documents={documentsState}
              activeDocumentKey={activeDocumentKey}
              loadingDocumentKey={loadingDocumentKey}
              onSelect={loadDocument}
              onUpload={() => fileInputRef.current?.click()}
            />

            <WorkspaceToolbar
              activeDocument={activeDocument}
              viewMode={viewMode}
              editMode={editMode}
              aiOpen={aiOpen}
              status={status}
              statusTone={statusTone}
              onSetViewMode={setViewMode}
              onToggleEditMode={() => setEditMode((value) => !value)}
              onToggleAi={() => setAiOpen((value) => !value)}
            />

            <section className="assembler-surface">
              {viewMode === "log" ? (
                <LogView
                  logEntries={sessionLog}
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

                    <div className="assembler-document__meta">
                      <span>{activeDocument.documentType}</span>
                      <span>{formatDocumentFormat(activeDocument.format, activeDocument.originalFilename)}</span>
                      {activeDocument.sourceFiles?.length ? (
                        <span>source: {activeDocument.sourceFiles.join(", ")}</span>
                      ) : null}
                    </div>
                  </div>

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
                        saveState={blockSaveStates[block.id] || ""}
                        onFocus={focusBlock}
                        onAdd={addBlockToClipboard}
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
                stagedBlocks={stagedAiBlocks}
                clipboard={clipboard}
                documents={documentsState}
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
                pending={aiPending}
                onChange={setAiInput}
                onSubmit={runAiOperation}
                onPreset={(preset) => setAiInput(`${preset} `)}
                onClose={() => setAiOpen(false)}
              />
            ) : null}

            <PlayerBar
              currentBlock={currentBlock}
              currentIndex={currentIndex}
              totalBlocks={blocks.length}
              isPlaying={isPlaying}
              loadingAudio={loadingAudio}
              rate={rate}
              voiceCatalog={voiceCatalog}
              voiceChoice={voiceChoice || voiceCatalog[0]}
              providerLabel={providerLabel}
              progress={progress}
              aiOpen={aiOpen}
              onTogglePlayback={togglePlayback}
              onSeekBack={() => seekAudio(-10)}
              onSeekForward={() => seekAudio(10)}
              onPreviousBlock={() => jumpToIndex(currentIndex - 1)}
              onNextBlock={() => jumpToIndex(currentIndex + 1)}
              onCycleRate={cycleRate}
              onVoiceChange={(choice) => {
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
