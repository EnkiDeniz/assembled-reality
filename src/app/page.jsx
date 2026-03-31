import { getServerSession } from "next-auth";
import EntryGate from "@/components/EntryGate";
import { authOptions } from "@/lib/auth";
import { appEnv } from "@/lib/env";
import { FOUNDING_READER_NAMES } from "@/lib/founding-readers";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <EntryGate
      session={session}
      documentTitle="Assembled Reality"
      foundingReaders={FOUNDING_READER_NAMES}
      authCapabilities={{
        appleEnabled: appEnv.apple.enabled,
        magicLinksEnabled: appEnv.magicLinksEnabled,
      }}
    />
  );
}
