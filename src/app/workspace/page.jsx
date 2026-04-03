import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import WorkspaceShell from "@/components/WorkspaceShell";
import { authOptions } from "@/lib/auth";
import { appEnv } from "@/lib/env";
import {
  getVoiceCatalog,
  resolvePreferredVoiceChoice,
} from "@/lib/listening";
import {
  getReaderDocumentDataForUser,
  listReaderDocumentsForUser,
} from "@/lib/reader-documents";
import { getReaderProfileByUserId } from "@/lib/reader-db";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  const resolvedSearchParams = await searchParams;
  const requestedDocumentKey = String(resolvedSearchParams?.document || "").trim();

  const [documents, readerData] = await Promise.all([
    listReaderDocumentsForUser(session.user.id),
    getReaderProfileByUserId(session.user.id),
  ]);

  const fallbackDocumentKey = requestedDocumentKey || documents[0]?.documentKey || "";
  const initialDocument = await getReaderDocumentDataForUser(
    session.user.id,
    fallbackDocumentKey,
  );

  if (!initialDocument) {
    redirect("/");
  }

  const voiceCatalog = getVoiceCatalog({
    openAiEnabled: appEnv.openai.enabled,
    openAiVoice: appEnv.openai.voice,
    elevenLabsEnabled: appEnv.elevenlabs.enabled,
    elevenLabsVoiceId: appEnv.elevenlabs.voiceId,
    includeDevice: true,
  });
  const preferredVoiceChoice = resolvePreferredVoiceChoice(
    voiceCatalog,
    String(readerData?.profile?.preferredVoiceProvider || "").toLowerCase(),
    readerData?.profile?.preferredVoiceId || null,
  );

  return (
    <WorkspaceShell
      userId={session.user.id}
      documents={documents}
      initialDocument={initialDocument}
      voiceCatalog={voiceCatalog}
      defaultVoiceChoice={preferredVoiceChoice}
      voiceEnabled={appEnv.elevenlabs.enabled || appEnv.openai.enabled}
    />
  );
}
