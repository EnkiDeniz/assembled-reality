"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import AuthScreen from "@/components/AuthScreen";

export default function EntryGate({
  session,
  documentTitle,
  authCapabilities,
}) {
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.id) {
      router.replace("/read");
    }
  }, [router, session?.user?.id]);

  if (session?.user?.id) return null;

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
