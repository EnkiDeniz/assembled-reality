"use client";

import { signIn } from "next-auth/react";
import AuthScreen from "@/components/AuthScreen";

export default function EntryGate({
  session,
  documentTitle,
  authCapabilities,
}) {
  if (session?.user?.id) return null;

  return (
    <AuthScreen
      documentTitle={documentTitle}
      authCapabilities={authCapabilities}
      onAppleSignIn={() =>
        signIn("apple", {
          callbackUrl: "/library",
        })
      }
      onMagicLinkSignIn={(email) =>
        signIn("email", {
          email,
          redirect: false,
          callbackUrl: "/library",
        })
      }
    />
  );
}
