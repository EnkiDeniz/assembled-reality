import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import EntryGate from "@/components/EntryGate";
import { authOptions } from "@/lib/auth";
import { appEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    redirect("/read");
  }

  return (
    <EntryGate
      session={session}
      documentTitle="Assembled Reality"
      authCapabilities={{
        appleEnabled: appEnv.apple.enabled,
        magicLinksEnabled: appEnv.magicLinksEnabled,
      }}
    />
  );
}
