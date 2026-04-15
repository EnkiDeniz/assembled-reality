"use client";

import { useEffect, useRef, useState } from "react";
import {
  attachCompilerReadToDreamDocument,
  createNextDreamDocumentVersion,
  getDreamDocumentCurrentVersion,
  getDreamDocumentCurrentVersionLabel,
  loadDreamDocument,
  restorePreviousDreamDocumentVersion,
} from "@/lib/dream-storage";
import { buildCompilerReadDelta } from "@/lib/compiler-read-delta";
import { clearCompilerReadSelfCheck } from "@/lib/compiler-read-self-check";
import CompilerReadPanel from "@/components/dream/CompilerReadPanel";
import styles from "@/components/workspace/LibraryArtifactPane.module.css";

function normalizeLongForm(value = "") {
  return String(value || "").trim();
}

export default function LibraryArtifactPane({
  documents = [],
  activeDocument = null,
  onDocumentChange = null,
  _requestedArtifactId = "",
  _errorMessage = "",
}) {
  const compilerReadSummaryRef = useRef(null);
  const compilerReadAbortRef = useRef(null);
  const compilerReadRequestIdRef = useRef(0);
  const [mode, setMode] = useState("document");
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [compilerReadPending, setCompilerReadPending] = useState(false);
  const [compilerReadError, setCompilerReadError] = useState("");

  const currentVersion = activeDocument?.currentVersion || getDreamDocumentCurrentVersion(activeDocument);
  const currentVersionLabel =
    activeDocument?.currentVersionLabel || getDreamDocumentCurrentVersionLabel(activeDocument);
  const previousVersion =
    activeDocument?.versions?.find((version) => version.versionId === currentVersion?.parentVersionId) || null;
  const compilerRead = activeDocument?.compilerRead || null;
  const compilerReadDelta =
    compilerRead && previousVersion?.compilerRead
      ? buildCompilerReadDelta(compilerRead, previousVersion.compilerRead)
      : null;
  const hasUnsavedEdits =
    normalizeLongForm(draft) !== normalizeLongForm(activeDocument?.rawMarkdown || "");

  useEffect(() => {
    setDraft(activeDocument?.rawMarkdown || "");
    setMode((current) => (activeDocument?.compilerRead && current === "read" ? current : "document"));
    setError("");
    setNotice("");
    setCompilerReadError("");
    setCompilerReadPending(false);
  }, [activeDocument]);

  useEffect(() => () => {
    compilerReadRequestIdRef.current += 1;
    compilerReadAbortRef.current?.abort();
  }, []);

  async function commitDocument(nextDocument, nextNotice = "") {
    if (!nextDocument?.id) return;
    const latestDocument = await loadDreamDocument(nextDocument.id).catch(() => nextDocument);
    onDocumentChange?.(latestDocument || nextDocument);
    if (nextNotice) {
      setNotice(nextNotice);
    }
  }

  async function handleSaveVersion({ runCompilerRead = false } = {}) {
    if (!activeDocument?.id || !normalizeLongForm(draft) || pending) return;

    setPending(true);
    setError("");
    setNotice("");
    try {
      clearCompilerReadSelfCheck(
        activeDocument.id,
        currentVersion?.versionId || activeDocument?.contentHash || "",
      );
      const replacement = await createNextDreamDocumentVersion(activeDocument, {
        filename: activeDocument.filename,
        rawMarkdown: draft,
        sourceKind: activeDocument.sourceKind,
      });
      await commitDocument(replacement, "Saved new version.");
      setMode(runCompilerRead ? "read" : "document");
      if (runCompilerRead) {
        await handleRunCompilerRead(replacement);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not save the new version.");
    } finally {
      setPending(false);
    }
  }

  async function handleRestorePreviousVersion() {
    if (!activeDocument?.id || !activeDocument?.hasPreviousVersion || pending) return;
    setPending(true);
    setError("");
    try {
      const restored = await restorePreviousDreamDocumentVersion(activeDocument);
      await commitDocument(restored, "Previous version restored.");
      setMode("document");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not restore the previous version.");
    } finally {
      setPending(false);
    }
  }

  async function handleRunCompilerRead(targetDocument = activeDocument) {
    if (!targetDocument?.id || compilerReadPending) return;

    compilerReadRequestIdRef.current += 1;
    const requestId = compilerReadRequestIdRef.current;
    compilerReadAbortRef.current?.abort();
    const controller = new AbortController();
    compilerReadAbortRef.current = controller;
    setMode("read");
    setCompilerReadPending(true);
    setCompilerReadError("");
    setError("");
    try {
      const response = await fetch("/api/compiler-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: targetDocument.id,
          title: targetDocument.filename,
          text: targetDocument.rawMarkdown || targetDocument.normalizedText || "",
          focus: null,
          strictness: "soft",
          question: null,
        }),
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.compilerRead) {
        throw new Error(payload?.error || "Compiler Read is unavailable right now.");
      }
      if (compilerReadRequestIdRef.current !== requestId) return;
      const persistedDocument = await attachCompilerReadToDreamDocument(targetDocument.id, payload.compilerRead);
      await commitDocument(persistedDocument, "Compiler Read ready.");
    } catch (nextError) {
      if (nextError?.name === "AbortError") return;
      if (compilerReadRequestIdRef.current !== requestId) return;
      setCompilerReadError(
        nextError instanceof Error ? nextError.message : "Compiler Read is unavailable right now.",
      );
    } finally {
      if (compilerReadAbortRef.current === controller) {
        compilerReadAbortRef.current = null;
      }
      if (compilerReadRequestIdRef.current === requestId) {
        setCompilerReadPending(false);
      }
    }
  }

  if (!activeDocument?.id) {
    return null;
  }

  return (
    <div className={styles.root} data-testid="library-artifact-pane">
      <div className={styles.head}>
        <strong>{activeDocument.filename || "Untitled document"}</strong>
      </div>

      <div className={styles.versionMeta}>
        <span>{activeDocument.wordCount || 0} words</span>
        <span>{activeDocument.libraryStatusLabel || "Library only"}</span>
        {currentVersionLabel ? <span>{currentVersionLabel}</span> : null}
        {activeDocument.versionCount > 1 ? <span>{activeDocument.versionCount} versions</span> : null}
      </div>

      <div className={styles.modeRow}>
        <button type="button" className={mode === "document" ? styles.modeActive : styles.modeButton} onClick={() => setMode("document")}>
          Document
        </button>
        <button type="button" className={mode === "edit" ? styles.modeActive : styles.modeButton} onClick={() => setMode("edit")}>
          Revise
        </button>
        <button
          type="button"
          className={mode === "read" ? styles.modeActive : styles.modeButton}
          onClick={() => setMode("read")}
        >
          Compiler Read
        </button>
        <button
          type="button"
          className={mode === "compare" ? styles.modeActive : styles.modeButton}
          onClick={() => setMode("compare")}
          disabled={!previousVersion}
        >
          Compare
        </button>
      </div>

      {notice ? <p className={styles.notice}>{notice}</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      {compilerReadError ? <p className={styles.error}>{compilerReadError}</p> : null}

      {mode === "edit" ? (
        <div className={styles.editor}>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className={styles.textarea}
            data-testid="library-artifact-editor"
          />
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={() => void handleSaveVersion({ runCompilerRead: false })}
              disabled={pending || !normalizeLongForm(draft) || !hasUnsavedEdits}
            >
              {pending ? "Saving..." : "Save version"}
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => void handleSaveVersion({ runCompilerRead: true })}
              disabled={pending || !normalizeLongForm(draft) || !hasUnsavedEdits}
            >
              Save and reread
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => {
                setDraft(activeDocument.rawMarkdown || "");
                setMode("document");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {mode === "document" ? (
        <div className={styles.document}>
          <pre className={styles.documentBody}>{activeDocument.rawMarkdown || ""}</pre>
          <div className={styles.actions}>
            <button type="button" className={styles.primaryAction} onClick={() => setMode("edit")}>
              Revise
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => void handleRunCompilerRead(activeDocument)}
              disabled={compilerReadPending || hasUnsavedEdits}
            >
              {compilerReadPending ? "Reading..." : "Run Compiler Read"}
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => void handleRestorePreviousVersion()}
              disabled={!activeDocument.hasPreviousVersion || pending}
            >
              Restore previous
            </button>
          </div>
        </div>
      ) : null}

      {mode === "read" ? (
        <div className={styles.readPane}>
          <CompilerReadPanel
            documentId={activeDocument.id}
            compilerReadKey={currentVersion?.versionId || activeDocument?.contentHash || ""}
            documentTitle={activeDocument.filename}
            versionLabel={currentVersionLabel}
            versionCreatedAt={currentVersion?.createdAt || ""}
            compilerRead={compilerRead}
            pending={compilerReadPending}
            error={compilerReadError}
            stale={hasUnsavedEdits}
            delta={compilerReadDelta}
            summaryRef={compilerReadSummaryRef}
          />
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => void handleRunCompilerRead(activeDocument)}
              disabled={compilerReadPending || hasUnsavedEdits}
            >
              {compilerReadPending ? "Reading..." : compilerRead ? "Refresh read" : "Run read"}
            </button>
            <button type="button" className={styles.secondaryAction} onClick={() => setMode("edit")}>
              Revise and reread
            </button>
          </div>
        </div>
      ) : null}

      {mode === "compare" ? (
        <div className={styles.comparePane}>
          {!previousVersion ? (
            <p className={styles.emptyCopy}>No earlier version is available for comparison yet.</p>
          ) : (
            <div className={styles.compareGrid}>
              <article className={styles.compareCard}>
                <span className={styles.compareLabel}>Previous</span>
                <strong>{`v${Math.max(1, (activeDocument.currentVersionNumber || 1) - 1)}`}</strong>
                <pre>{previousVersion.rawMarkdown || ""}</pre>
              </article>
              <article className={styles.compareCard}>
                <span className={styles.compareLabel}>Current</span>
                <strong>{currentVersionLabel || "Current"}</strong>
                <pre>{activeDocument.rawMarkdown || ""}</pre>
              </article>
            </div>
          )}
        </div>
      ) : null}

      {documents.length > 1 ? (
        <div className={styles.relatedList}>
          <span className={styles.relatedLabel}>Other Library artifacts</span>
          <div className={styles.relatedItems}>
            {documents
              .filter((document) => document.id !== activeDocument.id)
              .slice(0, 6)
              .map((document) => (
                <button
                  key={document.id}
                  type="button"
                  className={styles.relatedItem}
                  onClick={() => onDocumentChange?.(document, { focusOnly: true })}
                >
                  <strong>{document.filename}</strong>
                  <span>{document.currentVersionLabel || "v1"}</span>
                </button>
              ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
