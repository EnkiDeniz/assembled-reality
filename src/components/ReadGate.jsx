"use client";

import { useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import ReaderShell from "@/components/ReaderShell";
import UnlockScreen from "@/components/UnlockScreen";
import {
  clearUnlockState,
  DEFAULT_READER_PREFERENCES,
  loadReaderPreferences,
  loadUnlockState,
  saveUnlockState,
} from "@/lib/storage";

const DEFAULT_UNLOCK = { unlocked: false, method: null };

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
  const [unlockState, setUnlockState] = useState(() => loadUnlockState() || DEFAULT_UNLOCK);
  const [preferences, setPreferences] = useState(() => {
    if (typeof window === "undefined") {
      return DEFAULT_READER_PREFERENCES;
    }

    return loadReaderPreferences();
  });

  const readerProps = useMemo(
    () => ({
      documentData,
      preferences,
      setPreferences,
      initialReaderAnnotations: initialAnnotations,
      initialReadingProgress: initialProgress,
      aggregateAnnotations,
      profile,
      getReceiptsConnection,
      sevenTextEnabled,
      sevenVoiceEnabled,
    }),
    [
      aggregateAnnotations,
      documentData,
      getReceiptsConnection,
      initialAnnotations,
      initialProgress,
      preferences,
      profile,
      sevenTextEnabled,
      sevenVoiceEnabled,
    ],
  );

  if (!unlockState.unlocked) {
    return (
      <UnlockScreen
        onUnlock={(method) => {
          const nextState = { unlocked: true, method };
          saveUnlockState(nextState);
          setUnlockState(nextState);
        }}
        userName={session?.user?.readerName || session?.user?.name || session?.user?.email}
        onSignOut={() => {
          clearUnlockState();
          signOut({ callbackUrl: "/" });
        }}
      />
    );
  }

  return <ReaderShell {...readerProps} />;
}
