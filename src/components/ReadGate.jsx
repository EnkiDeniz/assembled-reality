"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import ReaderShell from "@/components/ReaderShell";
import {
  DEFAULT_READER_PREFERENCES,
  loadReaderPreferences,
  saveReaderPreferences,
  subscribeReaderPreferences,
} from "@/lib/storage";

export default function ReadGate({
  session,
  documentData,
  initialAnnotations,
  initialProgress,
  profile,
  getReceiptsConnection,
  initialConversationThread,
  initialEvidenceSet,
  initialListeningSession,
  initialVoicePreferences,
  voiceCatalog,
  sevenTextEnabled = false,
  sevenVoiceEnabled = false,
  sevenTextProvider = null,
  sevenVoiceProvider = null,
  persistenceMode = "remote",
  localReaderStorageKey = null,
  localDocumentId = null,
  allowAdvancedFeatures = true,
  allowAnnotations = true,
  homeHref = "/",
  homeLabel = "Home",
  canSaveToAccount = false,
}) {
  const preferencesSnapshot = useSyncExternalStore(
    subscribeReaderPreferences,
    () => JSON.stringify(loadReaderPreferences()),
    () => JSON.stringify(DEFAULT_READER_PREFERENCES),
  );
  const preferences = useMemo(() => JSON.parse(preferencesSnapshot), [preferencesSnapshot]);
  const setPreferences = useCallback((nextValue) => {
    const nextPreferences =
      typeof nextValue === "function" ? nextValue(loadReaderPreferences()) : nextValue;
    saveReaderPreferences(nextPreferences);
  }, []);

  return (
    <ReaderShell
      documentData={documentData}
      preferences={preferences}
      setPreferences={setPreferences}
      initialReaderAnnotations={initialAnnotations}
      initialReadingProgress={initialProgress}
      profile={profile}
      sessionUser={session?.user || null}
      getReceiptsConnection={getReceiptsConnection}
      initialConversationThread={initialConversationThread}
      initialEvidenceSet={initialEvidenceSet}
      initialListeningSession={initialListeningSession}
      initialVoicePreferences={initialVoicePreferences}
      voiceCatalog={voiceCatalog}
      sevenTextEnabled={sevenTextEnabled}
      sevenVoiceEnabled={sevenVoiceEnabled}
      sevenTextProvider={sevenTextProvider}
      sevenVoiceProvider={sevenVoiceProvider}
      persistenceMode={persistenceMode}
      localReaderStorageKey={localReaderStorageKey}
      localDocumentId={localDocumentId}
      allowAdvancedFeatures={allowAdvancedFeatures}
      allowAnnotations={allowAnnotations}
      homeHref={homeHref}
      homeLabel={homeLabel}
      canSaveToAccount={canSaveToAccount}
    />
  );
}
