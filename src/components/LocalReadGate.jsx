"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ReadGate from "@/components/ReadGate";
import { parseDocument } from "@/lib/document-parser";
import {
  getBuiltinReaderStorageKey,
  getLocalReaderDocument,
  getLocalReaderState,
  getLocalReaderStorageKey,
} from "@/lib/local-reader-db";

function buildBuiltinDocumentData(documentData) {
  return {
    ...documentData,
    sourceType: documentData.sourceType || "builtin",
    format: documentData.format || "markdown",
    formatLabel: documentData.formatLabel || "Markdown",
    originalFilename: documentData.originalFilename || null,
    mimeType: documentData.mimeType || "",
    contentMarkdown: documentData.contentMarkdown || "",
    wordCount: documentData.wordCount || 0,
    sectionCount: documentData.sectionCount || documentData.sections?.length || 0,
    createdAt: documentData.createdAt || null,
    updatedAt: documentData.updatedAt || null,
  };
}

function buildLocalDocumentData(record) {
  const parsed = parseDocument(record.contentMarkdown, {
    documentKey: record.documentKey,
  });

  return {
    ...parsed,
    sourceType: "local",
    format: record.format || "markdown",
    formatLabel: record.formatLabel || "Markdown",
    originalFilename: record.originalFilename || null,
    mimeType: record.mimeType || "",
    contentMarkdown: record.contentMarkdown || "",
    wordCount: record.wordCount || 0,
    sectionCount: record.sectionCount || parsed.sections.length,
    createdAt: record.createdAt || null,
    updatedAt: record.updatedAt || null,
  };
}

export default function LocalReadGate({
  session,
  initialDocumentData = null,
  localDocumentId = null,
  voiceCatalog = [],
  sevenTextEnabled = false,
  sevenVoiceEnabled = false,
  sevenTextProvider = null,
  sevenVoiceProvider = null,
  homeHref = "/",
  homeLabel = "Home",
}) {
  const storageKey = localDocumentId
    ? getLocalReaderStorageKey(localDocumentId)
    : initialDocumentData?.documentKey
      ? getBuiltinReaderStorageKey(initialDocumentData.documentKey)
      : null;

  const [state, setState] = useState(() => ({
    loading: true,
    error: "",
    documentData: null,
    progress: null,
    listeningSession: null,
    voicePreferences: null,
  }));

  useEffect(() => {
    let active = true;

    async function loadLocalReader() {
      if (!storageKey) {
        setState({
          loading: false,
          error: "This listener entry is missing its local storage key.",
          documentData: null,
          progress: null,
          listeningSession: null,
          voicePreferences: null,
        });
        return;
      }

      try {
        const [record, readerState] = await Promise.all([
          localDocumentId ? getLocalReaderDocument(localDocumentId) : Promise.resolve(null),
          getLocalReaderState(storageKey),
        ]);

        if (!active) return;

        if (localDocumentId && !record) {
          setState({
            loading: false,
            error: "This local document is no longer available in this browser.",
            documentData: null,
            progress: null,
            listeningSession: null,
            voicePreferences: null,
          });
          return;
        }

        setState({
          loading: false,
          error: "",
          documentData: localDocumentId
            ? buildLocalDocumentData(record)
            : buildBuiltinDocumentData(initialDocumentData),
          progress: readerState?.progress || null,
          listeningSession: readerState?.listeningSession || null,
          voicePreferences: readerState?.voicePreferences || null,
        });
      } catch (error) {
        if (!active) return;

        setState({
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "The local reader could not be opened in this browser.",
          documentData: null,
          progress: null,
          listeningSession: null,
          voicePreferences: null,
        });
      }
    }

    void loadLocalReader();

    return () => {
      active = false;
    };
  }, [initialDocumentData, localDocumentId, storageKey]);

  if (state.loading) {
    return (
      <main className="library-shell library-shell--authenticated-reset">
        <div className="library-shell__inner">
          <section className="library-panel listener-home__loading">
            <h1 className="library-section-title">Preparing your listener…</h1>
            <p className="listener-home__panel-copy">
              Loading this document and its local playback state.
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (state.error || !state.documentData) {
    return (
      <main className="library-shell library-shell--authenticated-reset">
        <div className="library-shell__inner">
          <section className="library-panel listener-home__loading">
            <h1 className="library-section-title">Document unavailable</h1>
            <p className="listener-home__status listener-home__status--error">
              {state.error || "This document could not be opened."}
            </p>
            <div className="listener-home__actions">
              <Link href={homeHref} className="library-topbar__action is-primary">
                Return to {homeLabel}
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <ReadGate
      session={session}
      documentData={state.documentData}
      initialProgress={state.progress}
      initialListeningSession={state.listeningSession}
      initialVoicePreferences={state.voicePreferences}
      voiceCatalog={voiceCatalog}
      sevenTextEnabled={sevenTextEnabled}
      sevenVoiceEnabled={sevenVoiceEnabled}
      sevenTextProvider={sevenTextProvider}
      sevenVoiceProvider={sevenVoiceProvider}
      persistenceMode="local"
      localReaderStorageKey={storageKey}
      localDocumentId={localDocumentId}
      allowAdvancedFeatures={false}
      allowAnnotations={false}
      homeHref={homeHref}
      homeLabel={homeLabel}
      canSaveToAccount={Boolean(session?.user?.id && localDocumentId)}
    />
  );
}
