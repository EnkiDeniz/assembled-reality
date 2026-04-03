"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import UnlockScreen from "@/components/UnlockScreen";
import AuthScreen from "@/components/AuthScreen";
import {
  loadUnlockState,
  saveUnlockState,
  subscribeUnlockState,
} from "@/lib/storage";

const DEFAULT_UNLOCK = { unlocked: false, method: null };

export default function EntryGate({
  session,
  documentTitle,
  authCapabilities,
}) {
  const router = useRouter();
  const unlockSnapshot = useSyncExternalStore(
    subscribeUnlockState,
    () => JSON.stringify(loadUnlockState() || DEFAULT_UNLOCK),
    () => JSON.stringify(DEFAULT_UNLOCK),
  );
  const unlockState = useMemo(() => JSON.parse(unlockSnapshot), [unlockSnapshot]);

  useEffect(() => {
    if (session?.user?.id) {
      router.replace("/library");
    }
  }, [router, session?.user?.id]);

  if (session?.user?.id) return null;

  const handleUnlock = (method) => {
    const nextState = { unlocked: true, method };
    saveUnlockState(nextState);

    if (session?.user?.id) {
      router.replace("/library");
    }
  };

  if (!unlockState.unlocked) {
    return <UnlockScreen onUnlock={handleUnlock} variant="landing" />;
  }

  return (
    <AuthScreen
      documentTitle={documentTitle}
      authCapabilities={authCapabilities}
      onAppleSignIn={() =>
        signIn("apple", {
          callbackUrl: "/",
        })
      }
      onMagicLinkSignIn={(email) =>
        signIn("email", {
          email,
          redirect: false,
          callbackUrl: "/",
        })
      }
    />
  );
}
