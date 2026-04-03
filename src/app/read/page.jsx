import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import AuthenticatedAppFallback from "@/components/AuthenticatedAppFallback";
import HydrationBoundary from "@/components/HydrationBoundary";
import ReadGate from "@/components/ReadGate";
import { authOptions } from "@/lib/auth";
import { getParsedDocument } from "@/lib/document";
import { appEnv } from "@/lib/env";
import { getVoiceCatalog } from "@/lib/listening";
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
    <HydrationBoundary fallback={<AuthenticatedAppFallback variant="reader" />}>
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
      />
    </HydrationBoundary>
  );
}
