"use client";

import { useRef, useState } from "react";

function buildErrorMessage(payload, fallback) {
  return String(payload?.error || payload?.message || fallback).trim() || fallback;
}

export default function RealityAssemblyAddSourceDialog({
  open = false,
  projectKey = "",
  onClose,
  onImported,
}) {
  const fileInputRef = useRef(null);
  const [uploadPending, setUploadPending] = useState(false);
  const [pastePending, setPastePending] = useState(false);
  const [linkPending, setLinkPending] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [linkValue, setLinkValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  if (!open) return null;

  async function handleFilesSelected(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setUploadPending(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      if (projectKey) {
        formData.set("projectKey", projectKey);
      }
      formData.set("bundleName", "Lœgos intake");
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/workspace/folder", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(buildErrorMessage(payload, "Could not import these files."));
      }

      const firstResult = Array.isArray(payload?.results) ? payload.results[0] || null : null;
      const document = firstResult?.document || null;
      const project = payload?.project || null;

      if (!document?.documentKey || !project?.projectKey) {
        throw new Error("The files were imported, but the next witness could not be opened.");
      }

      onImported?.({
        projectKey: project.projectKey,
        documentKey: document.documentKey,
      });
      onClose?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not import these files.",
      );
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setUploadPending(false);
    }
  }

  async function handlePasteSubmit(event) {
    event.preventDefault();
    if (!String(pasteText || "").trim()) return;

    setPastePending(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/workspace/paste", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey,
          mode: "source",
          text: pasteText,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(buildErrorMessage(payload, "Could not add that source."));
      }

      const document = payload?.document || payload?.sourceDocument || null;
      if (!document?.documentKey) {
        throw new Error("The pasted source was saved, but could not be opened.");
      }

      onImported?.({
        projectKey,
        documentKey: document.documentKey,
      });
      setPasteText("");
      onClose?.();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not add that source.");
    } finally {
      setPastePending(false);
    }
  }

  async function handleLinkSubmit(event) {
    event.preventDefault();
    if (!String(linkValue || "").trim()) return;

    setLinkPending(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/workspace/link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectKey,
          url: linkValue,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(buildErrorMessage(payload, "Could not import that link."));
      }

      const document = payload?.document || null;
      const nextProjectKey = payload?.project?.projectKey || projectKey;
      if (!document?.documentKey || !nextProjectKey) {
        throw new Error("The link was imported, but the next witness could not be opened.");
      }

      onImported?.({
        projectKey: nextProjectKey,
        documentKey: document.documentKey,
      });
      setLinkValue("");
      onClose?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not import that link.",
      );
    } finally {
      setLinkPending(false);
    }
  }

  return (
    <div className="ra-dialog" role="presentation">
      <div className="ra-dialog__backdrop" onClick={() => onClose?.()} />
      <div
        className="ra-dialog__sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ra-add-source-title"
      >
        <div className="ra-dialog__head">
          <div className="ra-dialog__copy">
            <span className="ra-dialog__eyebrow">Reality</span>
            <strong id="ra-add-source-title" className="ra-dialog__title">
              Add source
            </strong>
            <p className="ra-dialog__lede">
              Bring one real thing into the box. Files, pasted text, and links all become witness material.
            </p>
          </div>
          <button
            type="button"
            className="founder-shell__quiet-action"
            onClick={() => onClose?.()}
          >
            Close
          </button>
        </div>

        <div className="ra-dialog__sections">
          <section className="ra-dialog__section">
            <span className="ra-dialog__section-label">Upload</span>
            <p className="ra-dialog__section-copy">
              Markdown, Word, PDFs, images, and voice memos are supported through the existing intake pipeline.
            </p>
            <div className="ra-dialog__actions">
              <input
                ref={fileInputRef}
                type="file"
                className="ra-dialog__file"
                multiple
                onChange={handleFilesSelected}
              />
              <button
                type="button"
                className="terminal-button is-primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadPending}
                data-testid="ra-add-source-upload"
              >
                {uploadPending ? "Importing…" : "Choose files"}
              </button>
            </div>
          </section>

          <section className="ra-dialog__section">
            <span className="ra-dialog__section-label">Paste text</span>
            <form className="ra-dialog__form" onSubmit={handlePasteSubmit}>
              <textarea
                className="ra-dialog__textarea"
                value={pasteText}
                onChange={(event) => setPasteText(event.target.value)}
                placeholder="Paste the source material here."
                rows={6}
              />
              <div className="ra-dialog__actions">
                <button
                  type="submit"
                  className="terminal-button is-primary"
                  disabled={pastePending || !String(pasteText || "").trim()}
                  data-testid="ra-add-source-paste"
                >
                  {pastePending ? "Saving…" : "Save witness"}
                </button>
              </div>
            </form>
          </section>

          <section className="ra-dialog__section">
            <span className="ra-dialog__section-label">Import link</span>
            <form className="ra-dialog__form" onSubmit={handleLinkSubmit}>
              <input
                className="ra-dialog__input"
                type="url"
                value={linkValue}
                onChange={(event) => setLinkValue(event.target.value)}
                placeholder="https://example.com/article"
              />
              <div className="ra-dialog__actions">
                <button
                  type="submit"
                  className="terminal-button is-primary"
                  disabled={linkPending || !String(linkValue || "").trim()}
                  data-testid="ra-add-source-link"
                >
                  {linkPending ? "Importing…" : "Import link"}
                </button>
              </div>
            </form>
          </section>
        </div>

        {errorMessage ? (
          <p className="ra-dialog__error" data-testid="ra-add-source-error">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
