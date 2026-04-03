"use client";

import { useState } from "react";
import ReaderShell from "@/components/ReaderShell";
import {
  DEFAULT_READER_PREFERENCES,
  loadReaderPreferences,
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
}) {
  const [preferences, setPreferences] = useState(() => {
    if (typeof window === "undefined") {
      return DEFAULT_READER_PREFERENCES;
    }

    return loadReaderPreferences();
  });

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
    />
  );
}
