import { getServerSession } from "next-auth";
import EntryGate from "@/components/EntryGate";
import { authOptions } from "@/lib/auth";
import { appEnv } from "@/lib/env";
import { redirectToCanonicalHost } from "@/lib/canonical-host";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }) {
  await redirectToCanonicalHost("/", await searchParams);
  const session = await getServerSession(authOptions);

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
