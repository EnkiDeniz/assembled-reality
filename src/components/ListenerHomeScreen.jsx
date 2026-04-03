"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import {
  createLocalReaderDocument,
  getBuiltinReaderStorageKey,
  getLocalReaderState,
  listLocalReaderDocuments,
} from "@/lib/local-reader-db";

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
    return (document.progressPercent || 0) > 0 ? "Resume sample" : "Sample document";
  }

  const timestamp = document.lastOpenedAt || document.updatedAt || document.createdAt;
  if (!timestamp) {
    return "Stored in this browser";
  }

  try {
    return `Opened ${new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(new Date(timestamp))}`;
  } catch {
    return "Stored in this browser";
  }
}

function LibrarySectionHeader({ title, meta = "" }) {
  return (
    <div className="library-section-header">
      <h2 className="library-section-title">{title}</h2>
      {meta ? <p className="library-section-header__meta">{meta}</p> : null}
    </div>
  );
}

function DocumentCard({ document, featured = false }) {
  const activityLabel = formatActivityLabel(document);
  const kindLabel = document.sourceType === "builtin" ? "Sample" : "Local";

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

export default function ListenerHomeScreen({
  session,
  authCapabilities,
  sampleDocument,
  savedLibraryCount = 0,
}) {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [localDocuments, setLocalDocuments] = useState([]);
  const [sampleProgress, setSampleProgress] = useState(0);
  const [sampleLastOpenedAt, setSampleLastOpenedAt] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState("");
  const [importError, setImportError] = useState("");
  const [emailOnly, setEmailOnly] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadLocalLibrary() {
      try {
        const [documents, sampleState] = await Promise.all([
          listLocalReaderDocuments(),
          getLocalReaderState(getBuiltinReaderStorageKey(sampleDocument.documentKey)),
        ]);

        if (!active) return;
        setLocalDocuments(documents);
        setSampleProgress(sampleState?.progress?.progressPercent || 0);
        setSampleLastOpenedAt(sampleState?.lastOpenedAt || sampleState?.updatedAt || null);
        setLocalError("");
      } catch (error) {
        if (!active) return;

        setLocalError(
          error instanceof Error
            ? error.message
            : "Local storage is unavailable in this browser.",
        );
      }
    }

    void loadLocalLibrary();

    return () => {
      active = false;
    };
  }, [sampleDocument.documentKey]);

  const sampleCard = useMemo(
    () => ({
      ...sampleDocument,
      progressPercent: sampleProgress,
      lastOpenedAt: sampleLastOpenedAt,
      updatedAt: sampleLastOpenedAt || sampleDocument.updatedAt || null,
    }),
    [sampleDocument, sampleLastOpenedAt, sampleProgress],
  );

  const resumeDocument = useMemo(() => {
    const candidates = [...localDocuments, sampleCard].filter(
      (document) => (document.progressPercent || 0) > 0,
    );

    return (
      candidates
        .toSorted((left, right) => {
          const progressDelta = (right.progressPercent || 0) - (left.progressPercent || 0);
          if (progressDelta !== 0) return progressDelta;

          const rightTime =
            Date.parse(right.lastOpenedAt || right.updatedAt || right.createdAt || "") || 0;
          const leftTime =
            Date.parse(left.lastOpenedAt || left.updatedAt || left.createdAt || "") || 0;
          return rightTime - leftTime;
        })[0] || null
    );
  }, [localDocuments, sampleCard]);

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const importDocument = async (file) => {
    if (!file) return;

    setUploading(true);
    setImportError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/documents/ingest", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok || !payload?.imported?.contentMarkdown) {
        throw new Error(payload?.error || "The document could not be imported.");
      }

      const localDocument = await createLocalReaderDocument({
        title: payload.imported.title,
        subtitle: payload.imported.subtitle || "",
        format: payload.imported.format || "markdown",
        originalFilename: file.name,
        mimeType: file.type || "",
        contentMarkdown: payload.imported.contentMarkdown,
        wordCount: payload.imported.wordCount || 0,
        sectionCount: payload.imported.sectionCount || 0,
        preview: payload.imported.preview || "",
      });

      startTransition(() => {
        router.push(localDocument.href);
      });
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : "The document could not be imported.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0] || null;
    await importDocument(file);
    event.target.value = "";
  };

  const handleAppleSignIn = () => {
    void signIn("apple", { callbackUrl: "/" });
  };

  const handleMagicLink = async (event) => {
    event.preventDefault();
    if (!emailOnly.trim() || emailSubmitting) {
      return;
    }

    setEmailSubmitting(true);
    setAuthError("");
    setEmailMessage("");

    const result = await signIn("email", {
      email: emailOnly.trim(),
      redirect: false,
      callbackUrl: "/",
    });

    if (!result?.ok) {
      setAuthError("We could not send the sign-in link.");
      setEmailSubmitting(false);
      return;
    }

    setEmailMessage("Check your inbox for the sign-in link.");
    setEmailSubmitting(false);
  };

  return (
    <main className="library-shell library-shell--authenticated-reset">
      <div className="library-shell__inner">
        <header className="library-topbar">
          <div className="listener-home__hero">
            <p className="library-section-eyebrow">Listener-first</p>
            <h1 className="library-topbar__title">Import text. Press play.</h1>
            <p className="listener-home__lede">
              Drop in `.txt`, `.md`, `.markdown`, `.doc`, `.docx`, or `.pdf` and start
              listening immediately. Sign in only if you want save, sync, or advanced tools.
            </p>
            <p className="listener-home__formats">
              Local documents stay in this browser until you choose to save one to your account.
            </p>
          </div>

          <div className="library-topbar__actions">
            <input
              id="listener-home-upload-input"
              ref={fileInputRef}
              className="library-upload__native-input"
              type="file"
              accept=".txt,.md,.markdown,.doc,.docx,.pdf"
              disabled={uploading || Boolean(localError)}
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="library-topbar__action is-primary"
              onClick={handleOpenFilePicker}
              disabled={uploading || Boolean(localError)}
            >
              {uploading ? "Importing..." : "Import a Document"}
            </button>

            {session?.user?.id ? (
              <>
                <Link href="/library" className="library-topbar__action">
                  Saved Library{savedLibraryCount ? ` (${savedLibraryCount})` : ""}
                </Link>
                <Link href="/account" className="library-topbar__action">
                  Account
                </Link>
              </>
            ) : (
              <a href="#save-sync" className="library-topbar__action">
                Save & Sync
              </a>
            )}
          </div>
        </header>

        {uploading ? (
          <p className="library-status">Preparing your document for listening…</p>
        ) : null}
        {!uploading && importError ? (
          <p className="library-status library-status--error">{importError}</p>
        ) : null}
        {!uploading && !importError && localError ? (
          <p className="library-status library-status--error">{localError}</p>
        ) : null}

        {resumeDocument ? (
          <section id="continue" className="library-panel">
            <LibrarySectionHeader title="Continue listening" />
            <DocumentCard document={resumeDocument} featured />
          </section>
        ) : null}

        <section id="local-documents" className="library-panel">
          <LibrarySectionHeader
            title="Local documents"
            meta={`${localDocuments.length} document${localDocuments.length === 1 ? "" : "s"} in this browser`}
          />

          {localDocuments.length ? (
            <div className="library-grid">
              {localDocuments.map((document) => (
                <DocumentCard key={document.localDocumentId} document={document} />
              ))}
            </div>
          ) : (
            <div className="library-empty">
              <p className="library-empty__title">No local documents yet.</p>
              <p className="library-empty__copy">
                Import a file and it will appear here with its listening progress.
              </p>
            </div>
          )}
        </section>

        <section id="sample" className="library-panel">
          <LibrarySectionHeader title="Sample document" meta="Built into the app" />
          <DocumentCard document={sampleCard} />
        </section>

        <section id="save-sync" className="library-panel">
          <LibrarySectionHeader
            title="Save, sync, and advanced"
            meta={session?.user?.id ? "Optional account features" : "Optional sign-in"}
          />

          {session?.user?.id ? (
            <>
              <p className="listener-home__panel-copy">
                Signed in as {session.user.email || session.user.name || "reader"}. Keep using the
                import-and-listen flow locally, then save any document to your account from inside
                the reader when you want sync, receipts, notes, or Seven.
              </p>
              <div className="listener-home__actions">
                <Link href="/library" className="library-topbar__action is-primary">
                  Open Saved Library
                </Link>
                <Link href="/account" className="library-topbar__action">
                  Open Account
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="listener-home__panel-copy">
                Sign in only when you want to save documents to your account, sync across devices,
                and unlock the advanced surfaces.
              </p>

              <div className="listener-home__actions">
                {authCapabilities?.appleEnabled ? (
                  <button
                    type="button"
                    className="library-topbar__action"
                    onClick={handleAppleSignIn}
                  >
                    Continue with Apple
                  </button>
                ) : null}
              </div>

              {authCapabilities?.magicLinksEnabled ? (
                <form className="listener-home__auth-form" onSubmit={handleMagicLink}>
                  <div className="listener-home__email-row">
                    <input
                      className="listener-home__email-input"
                      type="email"
                      name="email"
                      autoComplete="email"
                      spellCheck={false}
                      placeholder="Email for sign-in link"
                      value={emailOnly}
                      onChange={(event) => setEmailOnly(event.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      className="library-topbar__action is-primary"
                      disabled={emailSubmitting}
                    >
                      {emailSubmitting ? "Sending..." : "Send Link"}
                    </button>
                  </div>
                </form>
              ) : null}

              {!authCapabilities?.appleEnabled && !authCapabilities?.magicLinksEnabled ? (
                <p className="listener-home__status">Sign-in is not available right now.</p>
              ) : null}
              {emailMessage ? <p className="listener-home__status">{emailMessage}</p> : null}
              {authError ? (
                <p className="listener-home__status listener-home__status--error">{authError}</p>
              ) : null}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
