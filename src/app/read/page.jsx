import { getServerSession } from "next-auth";
import LocalReadGate from "@/components/LocalReadGate";
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
  const documentData = getParsedDocument();
  const voiceCatalog = getVoiceCatalog({
    openAiEnabled: appEnv.openai.enabled,
    openAiVoice: appEnv.openai.voice,
    elevenLabsEnabled: appEnv.elevenlabs.enabled,
    elevenLabsVoiceId: appEnv.elevenlabs.voiceId,
  });
  const sevenVoiceEnabled = appEnv.elevenlabs.enabled || appEnv.openai.enabled;
  const sevenVoiceProvider = appEnv.elevenlabs.enabled
    ? "elevenlabs"
    : appEnv.openai.enabled
      ? "openai"
      : null;

  if (!session?.user?.id) {
    return (
      <LocalReadGate
        session={session}
        initialDocumentData={{
          ...documentData,
          sourceType: "builtin",
          format: "markdown",
          formatLabel: "Markdown",
          originalFilename: null,
          mimeType: "text/markdown",
          contentMarkdown: "",
          wordCount: 0,
          sectionCount: documentData.sections.length,
          createdAt: null,
          updatedAt: null,
        }}
        voiceCatalog={voiceCatalog}
        sevenTextEnabled={appEnv.openai.enabled}
        sevenVoiceEnabled={sevenVoiceEnabled}
        sevenTextProvider={appEnv.openai.enabled ? "openai" : null}
        sevenVoiceProvider={sevenVoiceProvider}
        homeHref="/"
        homeLabel="Home"
      />
    );
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
      voiceCatalog={voiceCatalog}
      sevenTextEnabled={appEnv.openai.enabled}
      sevenVoiceEnabled={sevenVoiceEnabled}
      sevenTextProvider={appEnv.openai.enabled ? "openai" : null}
      sevenVoiceProvider={sevenVoiceProvider}
      homeHref="/library"
      homeLabel="Library"
    />
  );
}
