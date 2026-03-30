"use client";

import { SessionProvider } from "next-auth/react";

export default function Providers({ children, session = null }) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
