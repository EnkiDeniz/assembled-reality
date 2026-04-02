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
          <span className="library-card__badge is-accent">
            {document.sourceType === "builtin" ? "Canonical" : "Imported"}
          </span>
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
        <span className="library-card__cta">Open document</span>
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
  const [selectedFileName, setSelectedFileName] = useState("");

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

  const sectionLinks = useMemo(
    () =>
      [
        continueDocument ? { id: "continue", label: "Continue" } : null,
        { id: "documents", label: "Your documents" },
        { id: "canonical", label: "Assembled Reality" },
        { id: "import", label: "Import" },
      ].filter(Boolean),
    [continueDocument],
  );

  const handleOpenFilePicker = () => {
    document.getElementById("import")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFileName(file?.name || "");
    setError("");
    setMessage("");
  };

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
      setSelectedFileName(file.name);
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
        <header className="library-topbar">
          <div className="library-topbar__copy">
            <h1 className="library-topbar__title">Library</h1>
            <p className="library-topbar__meta">
              <span>{canonicalDocuments.length} canonical</span>
              <span>{uploadedDocuments.length} imported</span>
            </p>
          </div>

          <div className="library-topbar__actions">
            <button
              type="button"
              className="library-topbar__action is-primary"
              onClick={handleOpenFilePicker}
            >
              Import
            </button>
            <Link href="/account" className="library-topbar__action">
              {accountName}
            </Link>
          </div>
        </header>

        <nav className="library-nav" aria-label="Library sections">
          {sectionLinks.map((link) => (
            <a key={link.id} href={`#${link.id}`} className="library-nav__button">
              {link.label}
            </a>
          ))}
        </nav>

        {continueDocument ? (
          <section id="continue" className="library-panel">
            <LibrarySectionHeader eyebrow="Continue" title="Pick up where you left off" />
            <DocumentCard document={continueDocument} featured />
          </section>
        ) : null}

        <div className="library-stage">
          <section id="documents" className="library-panel">
            <LibrarySectionHeader
              eyebrow="Imported"
              title="Your documents"
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
                <p className="library-empty__title">Nothing imported yet.</p>
                <p className="library-empty__copy">Choose a file and it will show up here.</p>
              </div>
            )}
          </section>

          <section id="import" className="library-panel library-panel--import">
            <LibrarySectionHeader eyebrow="Import" title="Import" />

            <form className="library-upload__form" onSubmit={handleUpload}>
              <input
                id="library-upload-input"
                ref={fileInputRef}
                className="library-upload__native-input"
                type="file"
                accept=".md,.markdown,.doc,.docx,.pdf"
                disabled={uploading}
                onChange={handleFileChange}
              />

              <div className="library-upload__controls">
                <button
                  type="button"
                  className="library-upload__picker"
                  onClick={handleOpenFilePicker}
                  disabled={uploading}
                >
                  Choose file
                </button>
                <p className={`library-upload__selected ${selectedFileName ? "has-file" : ""}`}>
                  {selectedFileName || "No file selected"}
                </p>
              </div>
              <button type="submit" className="library-upload__submit" disabled={uploading}>
                {uploading ? "Importing..." : "Import and open"}
              </button>
            </form>

            <p className="library-upload__formats">Markdown, Word, and PDF</p>
            {message ? <p className="library-upload__message">{message}</p> : null}
            {error ? <p className="library-upload__error">{error}</p> : null}
          </section>
        </div>

        <section id="canonical" className="library-panel">
          <LibrarySectionHeader
            eyebrow="Canonical"
            title="Assembled Reality"
            meta={`${canonicalDocuments.length} document${canonicalDocuments.length === 1 ? "" : "s"}`}
          />

          {canonicalDocuments.length ? (
            <div className="library-grid">
              {canonicalDocuments.map((document) => (
                <DocumentCard key={document.documentKey} document={document} />
              ))}
            </div>
          ) : (
            <div className="library-empty">
              <p className="library-empty__title">No canonical document available.</p>
              <p className="library-empty__copy">The core text will appear here when it is ready.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
