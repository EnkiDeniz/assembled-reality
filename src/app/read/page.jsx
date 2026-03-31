import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import ReadGate from "@/components/ReadGate";
import { authOptions } from "@/lib/auth";
import { redirectToCanonicalHost } from "@/lib/canonical-host";
import { getParsedDocument } from "@/lib/document";
import { appEnv } from "@/lib/env";
import { loadReaderPageData } from "@/lib/reader-db";

export const dynamic = "force-dynamic";

export default async function ReadPage({ searchParams }) {
  await redirectToCanonicalHost("/read", await searchParams);
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  const documentData = getParsedDocument();
  const readerData = await loadReaderPageData(session.user.id);

  return (
    <ReadGate
      session={session}
      documentData={documentData}
      initialAnnotations={readerData?.annotations}
      initialProgress={readerData?.progress}
      profile={readerData?.profile}
      getReceiptsConnection={readerData?.getReceiptsConnection}
      sevenTextEnabled={appEnv.openai.enabled}
      sevenVoiceEnabled={appEnv.elevenlabs.enabled || appEnv.openai.enabled}
    />
  );
}
