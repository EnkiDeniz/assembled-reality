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
    return "Primary text";
  }

  const timestamp = document.updatedAt || document.createdAt;
  if (!timestamp) {
    return "Imported document";
  }

  try {
    return `Updated ${new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(new Date(timestamp))}`;
  } catch {
    return "Imported document";
  }
}

function DocumentCard({ document, featured = false }) {
  const activityLabel = formatActivityLabel(document);
  const kindLabel = document.sourceType === "builtin" ? "Core text" : "Personal document";

  return (
    <Link href={document.href} className={`library-card ${featured ? "is-featured" : ""}`}>
      <div className="library-card__eyebrow">
        <span>{kindLabel}</span>
        <span>{document.formatLabel}</span>
      </div>

      <div className="library-card__body">
        <h2 className="library-card__title">{document.title}</h2>
        {document.subtitle ? (
          <p className="library-card__subtitle">{document.subtitle}</p>
        ) : null}
        {document.excerpt ? <p className="library-card__excerpt">{document.excerpt}</p> : null}
      </div>

      <div className="library-card__footer">
        <div className="library-card__meta-row">
          <span>{activityLabel}</span>
          <span>
            {document.sectionCount} section{document.sectionCount === 1 ? "" : "s"}
          </span>
          <strong>{document.progressPercent || 0}%</strong>
        </div>
        <ProgressBar value={document.progressPercent || 0} />
      </div>
    </Link>
  );
}

function LibrarySectionHeader({ title, meta = "" }) {
  return (
    <div className="library-section-header">
      <h2 className="library-section-title">{title}</h2>
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

  const canonicalDocuments = useMemo(
    () => documents.filter((document) => document.sourceType === "builtin"),
    [documents],
  );
  const uploadedDocuments = useMemo(
    () => documents.filter((document) => document.sourceType !== "builtin"),
    [documents],
  );
  const coreDocument = canonicalDocuments[0] || null;
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
  const resumeDocument =
    continueDocument && (continueDocument.progressPercent || 0) > 0 ? continueDocument : null;

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const importDocument = async (file) => {
    if (!file) return;

    setUploading(true);
    setError("");

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

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0] || null;
    setError("");
    await importDocument(file);
    event.target.value = "";
  };

  return (
    <main className="library-shell library-shell--authenticated-reset">
      <div className="library-shell__inner">
        <header className="library-topbar">
          <div className="library-topbar__copy">
            <p className="library-section-eyebrow">Private library</p>
            <h1 className="library-topbar__title">Library</h1>
            <p className="library-topbar__supporting">
              Continue the work, return to the core text, or bring a personal document into the
              same reader and player.
            </p>
            {profile?.displayName ? (
              <p className="library-topbar__reader">Reader: {profile.displayName}</p>
            ) : null}
          </div>

          <div className="library-topbar__actions">
            <input
              id="library-upload-input"
              ref={fileInputRef}
              className="library-upload__native-input"
              type="file"
              accept=".txt,.md,.markdown,.doc,.docx,.pdf"
              disabled={uploading}
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="library-topbar__action is-primary"
              onClick={handleOpenFilePicker}
              disabled={uploading}
            >
              {uploading ? "Importing..." : "Import"}
            </button>
            <Link href="/account" className="library-topbar__action">Account</Link>
          </div>
        </header>

        {error ? <p className="library-status library-status--error">{error}</p> : null}

        {resumeDocument ? (
          <section id="continue" className="library-panel">
            <LibrarySectionHeader title="Continue" meta="Pick up where you left off" />
            <DocumentCard document={resumeDocument} featured />
          </section>
        ) : null}

        <section id="canonical" className="library-panel">
          <LibrarySectionHeader
            title="Assembled Reality"
            meta="Primary text"
          />

          {coreDocument ? (
            <DocumentCard document={coreDocument} featured />
          ) : (
            <div className="library-empty">
              <p className="library-empty__title">No core text available.</p>
              <p className="library-empty__copy">The primary work will appear here when it is ready.</p>
            </div>
          )}
        </section>

        <section id="documents" className="library-panel">
          <LibrarySectionHeader
            title="Personal documents"
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
                Use `Import` to bring a document into your private library.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
