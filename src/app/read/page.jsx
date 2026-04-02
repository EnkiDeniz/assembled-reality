import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import ReadGate from "@/components/ReadGate";
import { authOptions } from "@/lib/auth";
import { getParsedDocument } from "@/lib/document";
import { appEnv } from "@/lib/env";
import { loadReaderPageData } from "@/lib/reader-db";
import { loadReaderWorkspaceForUser } from "@/lib/reader-workspace";

export const dynamic = "force-dynamic";

export default async function ReadPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  const documentData = getParsedDocument();
  const [readerData, workspace] = await Promise.all([
    loadReaderPageData(session.user.id, documentData.documentKey),
    loadReaderWorkspaceForUser(session.user.id, documentData.documentKey),
  ]);

  return (
    <ReadGate
      session={session}
      documentData={documentData}
      initialAnnotations={readerData?.annotations}
      initialProgress={readerData?.progress}
      profile={readerData?.profile}
      getReceiptsConnection={readerData?.getReceiptsConnection}
      initialConversationThread={workspace?.thread || null}
      initialEvidenceSet={workspace?.evidenceSet || null}
      sevenTextEnabled={appEnv.openai.enabled}
      sevenVoiceEnabled={appEnv.elevenlabs.enabled || appEnv.openai.enabled}
      sevenTextProvider={appEnv.openai.enabled ? "openai" : null}
      sevenVoiceProvider={
        appEnv.openai.enabled ? "openai" : appEnv.elevenlabs.enabled ? "elevenlabs" : null
      }
    />
  );
}
