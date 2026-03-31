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
  aggregateAnnotations,
  profile,
  getReceiptsConnection,
  sevenTextEnabled = false,
  sevenVoiceEnabled = false,
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
      aggregateAnnotations={aggregateAnnotations}
      profile={profile}
      sessionUser={session?.user || null}
      getReceiptsConnection={getReceiptsConnection}
      sevenTextEnabled={sevenTextEnabled}
      sevenVoiceEnabled={sevenVoiceEnabled}
    />
  );
}
