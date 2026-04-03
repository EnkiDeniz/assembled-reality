import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import ReadGate from "@/components/ReadGate";
import { authOptions } from "@/lib/auth";
import { appEnv } from "@/lib/env";
import { getVoiceCatalog } from "@/lib/listening";
import { loadReaderPageData } from "@/lib/reader-db";
import { getReaderDocumentDataForUser } from "@/lib/reader-documents";
import { loadReaderWorkspaceForUser } from "@/lib/reader-workspace";

export const dynamic = "force-dynamic";

export default async function ReaderDocumentPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  const resolvedParams = await params;
  const documentKey = String(resolvedParams?.documentKey || "").trim();
  const documentData = await getReaderDocumentDataForUser(session.user.id, documentKey);
  if (!documentData) {
    notFound();
  }

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
      initialListeningSession={workspace?.listeningSession || null}
      initialVoicePreferences={workspace?.voicePreferences || null}
      voiceCatalog={getVoiceCatalog({
        openAiEnabled: appEnv.openai.enabled,
        openAiVoice: appEnv.openai.voice,
        elevenLabsEnabled: appEnv.elevenlabs.enabled,
        elevenLabsVoiceId: appEnv.elevenlabs.voiceId,
      })}
      sevenTextEnabled={appEnv.openai.enabled}
      sevenVoiceEnabled={appEnv.elevenlabs.enabled || appEnv.openai.enabled}
      sevenTextProvider={appEnv.openai.enabled ? "openai" : null}
      sevenVoiceProvider={
        appEnv.elevenlabs.enabled ? "elevenlabs" : appEnv.openai.enabled ? "openai" : null
      }
      homeHref="/library"
      homeLabel="Library"
    />
  );
}
