"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useMemo, useRef, useState } from "react";

function ProgressBar({ value = 0 }) {
  return (
    <div className="library-card__progress">
      <div
        className="library-card__progress-fill"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function formatActivityLabel(document) {
  if (document.sourceType === "builtin") {
    return "Canonical manuscript";
  }

  const timestamp = document.updatedAt || document.createdAt;
  if (!timestamp) {
    return "Imported document";
  }

  try {
    return `Updated ${new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(timestamp))}`;
  } catch {
    return "Imported document";
  }
}

function DocumentCard({ document, featured = false }) {
  const activityLabel = formatActivityLabel(document);

  return (
    <Link href={document.href} className={`library-card ${featured ? "is-featured" : ""}`}>
      <div className="library-card__header">
        <div className="library-card__badges">
          <span className="library-card__badge">{document.formatLabel}</span>
          {document.sourceType === "builtin" ? (
            <span className="library-card__badge is-accent">Canonical</span>
          ) : null}
        </div>
        <span className="library-card__meta">
          {document.sectionCount} section{document.sectionCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className="library-card__body">
        <h2 className="library-card__title">{document.title}</h2>
        {document.subtitle ? (
          <p className="library-card__subtitle">{document.subtitle}</p>
        ) : null}
        <p className="library-card__excerpt">{document.excerpt || "Open this document in the reader."}</p>
      </div>

      <div className="library-card__footer">
        <div className="library-card__progress-copy">
          <span>{activityLabel}</span>
          <strong>{document.progressPercent || 0}%</strong>
        </div>
        <ProgressBar value={document.progressPercent || 0} />
        <div className="library-card__footer-meta">
          <span>
            {document.sectionCount} section{document.sectionCount === 1 ? "" : "s"}
          </span>
          {document.originalFilename ? <span>{document.originalFilename}</span> : null}
        </div>
      </div>
    </Link>
  );
}

function LibrarySectionHeader({ eyebrow, title, meta = "" }) {
  return (
    <div className="library-section-header">
      <div className="library-section-header__copy">
        <p className="library-section-eyebrow">{eyebrow}</p>
        <h2 className="library-section-title">{title}</h2>
      </div>
      {meta ? <p className="library-section-header__meta">{meta}</p> : null}
    </div>
  );
}

export default function DocumentLibraryScreen({
  documents = [],
  profile = null,
}) {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const accountName = profile?.displayName || "Reader";
  const canonicalDocuments = useMemo(
    () => documents.filter((document) => document.sourceType === "builtin"),
    [documents],
  );
  const uploadedDocuments = useMemo(
    () => documents.filter((document) => document.sourceType !== "builtin"),
    [documents],
  );
  const continueDocument = useMemo(() => {
    const ranked = [...documents].sort((left, right) => {
      const progressDelta = (right.progressPercent || 0) - (left.progressPercent || 0);
      if (progressDelta !== 0) return progressDelta;

      const rightTime = Date.parse(right.updatedAt || right.createdAt || "") || 0;
      const leftTime = Date.parse(left.updatedAt || left.createdAt || "") || 0;
      return rightTime - leftTime;
    });

    return ranked.find((document) => (document.progressPercent || 0) > 0) || ranked[0] || null;
  }, [documents]);

  const handleUpload = async (event) => {
    event.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a Markdown, Word, or PDF file first.");
      setMessage("");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok || !payload?.document?.href) {
        throw new Error(payload?.error || "The document could not be imported.");
      }

      setMessage(`Imported ${payload.document.title}. Opening it in the reader...`);
      startTransition(() => {
        router.push(payload.document.href);
      });
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "The document could not be imported.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="library-shell library-shell--authenticated-reset">
      <div className="library-shell__inner">
        <header className="library-header">
          <div className="library-header__copy">
            <p className="library-section-eyebrow">Library</p>
            <h1 className="library-header__title">Keep reading, then bring in the next document.</h1>
            <p className="library-header__lede">
              Canonical and imported texts now live in one authenticated library instead of a
              separate upload flow.
            </p>
          </div>

          <div className="library-header__actions">
            <Link
              href={continueDocument?.href || "/read"}
              className="library-header__action is-primary"
            >
              {continueDocument ? "Continue reading" : "Open reader"}
            </Link>
            <Link href="/account" className="library-header__action">
              {accountName}
            </Link>
          </div>
        </header>

        {continueDocument ? (
          <section className="library-panel">
            <LibrarySectionHeader eyebrow="Continue" title="Pick up where you left off" />
            <DocumentCard document={continueDocument} featured />
          </section>
        ) : null}

        <div className="library-stage">
          <section className="library-panel">
            <LibrarySectionHeader
              eyebrow="Canonical"
              title="Core reading"
              meta={`${canonicalDocuments.length} document${canonicalDocuments.length === 1 ? "" : "s"}`}
            />
            <div className="library-grid">
              {canonicalDocuments.map((document) => (
                <DocumentCard key={document.documentKey} document={document} />
              ))}
            </div>
          </section>

          <section className="library-panel library-panel--import">
            <LibrarySectionHeader eyebrow="Import" title="Bring a document into the reader" />
            <p className="library-upload__description">
              Upload `.md`, `.doc`, `.docx`, or `.pdf`. The importer normalizes each file into the
              same sectioned reading shape the app already uses.
            </p>

            <form className="library-upload__form" onSubmit={handleUpload}>
              <label className="library-upload__input-shell" htmlFor="library-upload-input">
                <span className="library-upload__input-label">Choose file</span>
                <input
                  id="library-upload-input"
                  ref={fileInputRef}
                  className="library-upload__input"
                  type="file"
                  accept=".md,.markdown,.doc,.docx,.pdf"
                  disabled={uploading}
                />
              </label>
              <button type="submit" className="library-upload__submit" disabled={uploading}>
                {uploading ? "Importing..." : "Import and open"}
              </button>
            </form>

            {message ? <p className="library-upload__message">{message}</p> : null}
            {error ? <p className="library-upload__error">{error}</p> : null}
          </section>
        </div>

        <section className="library-panel">
          <LibrarySectionHeader
            eyebrow="Your documents"
            title="Imported reading"
            meta={`${uploadedDocuments.length} document${uploadedDocuments.length === 1 ? "" : "s"}`}
          />

          {uploadedDocuments.length ? (
            <div className="library-grid">
              {uploadedDocuments.map((document) => (
                <DocumentCard key={document.documentKey} document={document} />
              ))}
            </div>
          ) : (
            <div className="library-empty">
              <p className="library-empty__title">No personal documents yet.</p>
              <p className="library-empty__copy">
                Import a Markdown, Word, or PDF file and it will appear here in the same reader as
                the canonical manuscript.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
