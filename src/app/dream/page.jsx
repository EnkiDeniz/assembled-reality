import { redirect } from "next/navigation";
import SectionDreamScreen from "@/components/dream/SectionDreamScreen";
import { appEnv } from "@/lib/env";
import { getReaderProfileByUserId } from "@/lib/reader-db";
import { getRequiredSession } from "@/lib/server-session";
import {
  clampListeningRate,
  getVoiceCatalog,
  resolvePreferredVoiceChoice,
} from "@/lib/listening";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dream Library",
};

export default async function DreamPage() {
  const session = await getRequiredSession();
  if (!session?.user?.id) {
    redirect("/");
  }

  const readerData = await getReaderProfileByUserId(session.user.id);
  const voiceCatalog = getVoiceCatalog({
    openAiEnabled: appEnv.openai.enabled,
    openAiVoice: appEnv.openai.voice,
    elevenLabsEnabled: appEnv.elevenlabs.enabled,
    elevenLabsVoiceId: appEnv.elevenlabs.voiceId,
    includeDevice: false,
  });
  const initialVoiceChoice = resolvePreferredVoiceChoice(
    voiceCatalog,
    readerData?.profile?.preferredVoiceProvider,
    readerData?.profile?.preferredVoiceId,
  );
  const initialRate = clampListeningRate(readerData?.profile?.preferredListeningRate, 1);

  return (
    <SectionDreamScreen
      voiceCatalog={voiceCatalog}
      initialVoiceChoice={initialVoiceChoice}
      initialRate={initialRate}
    />
  );
}
