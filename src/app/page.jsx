import { getServerSession } from "next-auth";
import EntryGate from "@/components/EntryGate";
import { authOptions } from "@/lib/auth";
import { getParsedDocument } from "@/lib/document";
import { appEnv } from "@/lib/env";
import { FOUNDING_READER_NAMES } from "@/lib/founding-readers";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [session, documentData] = await Promise.all([
    getServerSession(authOptions),
    Promise.resolve(getParsedDocument()),
  ]);

  return (
    <EntryGate
      session={session}
      documentData={documentData}
      foundingReaders={FOUNDING_READER_NAMES}
      authCapabilities={{
        appleEnabled: appEnv.apple.enabled,
        magicLinksEnabled: appEnv.magicLinksEnabled,
      }}
    />
  );
}
