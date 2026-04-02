"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useRef, useState } from "react";

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

function DocumentCard({ document }) {
  return (
    <Link href={document.href} className="library-card">
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
          <span>Progress</span>
          <strong>{document.progressPercent || 0}%</strong>
        </div>
        <ProgressBar value={document.progressPercent || 0} />
        {document.originalFilename ? (
          <p className="library-card__filename">{document.originalFilename}</p>
        ) : null}
      </div>
    </Link>
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
    <main className="library-shell">
      <section className="library-hero">
        <div className="library-hero__copy">
          <p className="library-hero__eyebrow">Living document library</p>
          <h1 className="library-hero__title">Read, hear, question, and keep working.</h1>
          <p className="library-hero__lede">
            Upload Markdown, Word, or PDF files and open them in the same reader, player,
            Seven, evidence, and receipt flow as the canonical manuscript.
          </p>
        </div>

        <div className="library-hero__actions">
          <Link href="/read" className="library-hero__link">
            Open canonical reader
          </Link>
          <Link href="/account" className="library-hero__link is-secondary">
            {accountName}
          </Link>
        </div>
      </section>

      <section className="library-upload">
        <div className="library-upload__copy">
          <p className="library-section-eyebrow">Upload</p>
          <h2 className="library-upload__title">Bring a document into the reader</h2>
          <p className="library-upload__description">
            Upload `.md`, `.doc`, `.docx`, or `.pdf`. The importer normalizes each file into the
            same sectioned reading shape the app already uses.
          </p>
        </div>

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

      <section className="library-collection">
        <div className="library-collection__header">
          <div>
            <p className="library-section-eyebrow">Library</p>
            <h2 className="library-collection__title">Available documents</h2>
          </div>
          <p className="library-collection__meta">
            {documents.length} document{documents.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="library-grid">
          {documents.map((document) => (
            <DocumentCard key={document.documentKey} document={document} />
          ))}
        </div>
      </section>
    </main>
  );
}
