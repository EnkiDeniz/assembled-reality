import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import ReadGate from "@/components/ReadGate";
import { authOptions } from "@/lib/auth";
import { getParsedDocument } from "@/lib/document";
import { appEnv } from "@/lib/env";
import { loadReaderPageData, loadSevenAggregate } from "@/lib/reader-db";

export const dynamic = "force-dynamic";

export default async function ReadPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  const [documentData, readerData, aggregateAnnotations] = await Promise.all([
    Promise.resolve(getParsedDocument()),
    loadReaderPageData(session.user.id),
    loadSevenAggregate(),
  ]);

  return (
    <ReadGate
      session={session}
      documentData={documentData}
      initialAnnotations={readerData?.annotations}
      initialProgress={readerData?.progress}
      aggregateAnnotations={aggregateAnnotations}
      profile={readerData?.profile}
      getReceiptsConnection={readerData?.getReceiptsConnection}
      sevenTextEnabled={appEnv.openai.enabled}
      sevenVoiceEnabled={appEnv.elevenlabs.enabled || appEnv.openai.enabled}
    />
  );
}
