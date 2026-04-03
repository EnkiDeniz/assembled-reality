import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AuthTerminal from "@/components/AuthTerminal";
import { authOptions } from "@/lib/auth";
import { appEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    redirect("/workspace");
  }

  return (
    <AuthTerminal
      authCapabilities={{
        appleEnabled: appEnv.apple.enabled,
        magicLinksEnabled: appEnv.magicLinksEnabled,
      }}
    />
  );
}
