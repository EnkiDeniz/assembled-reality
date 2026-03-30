"use client";

import { useEffect, useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import UnlockScreen from "@/components/UnlockScreen";
import AuthScreen from "@/components/AuthScreen";
import { loadUnlockState, saveUnlockState } from "@/lib/storage";

const DEFAULT_UNLOCK = { unlocked: false, method: null };

export default function EntryGate({
  session,
  documentData,
  foundingReaders,
  authCapabilities,
}) {
  const router = useRouter();
  const [unlockState, setUnlockState] = useState(() => loadUnlockState() || DEFAULT_UNLOCK);

  useEffect(() => {
    if (session?.user?.id && unlockState.unlocked) {
      router.replace("/read");
    }
  }, [router, session?.user?.id, unlockState.unlocked]);

  const handleUnlock = (method) => {
    const nextState = { unlocked: true, method };
    setUnlockState(nextState);
    saveUnlockState(nextState);
    router.replace("/read");
  };

  if (!session?.user?.id) {
    return (
      <AuthScreen
        documentTitle={documentData.title}
        foundingReaders={foundingReaders}
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
        onSignIn={(credentials) =>
          signIn("credentials", {
            ...credentials,
            redirect: false,
          })
        }
      />
    );
  }

  return (
    <UnlockScreen
      onUnlock={handleUnlock}
      userName={session.user.readerName || session.user.name || session.user.email}
      onSignOut={() => signOut({ callbackUrl: "/" })}
    />
  );
}
