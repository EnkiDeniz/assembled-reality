import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import LocalReadGate from "@/components/LocalReadGate";
import { authOptions } from "@/lib/auth";
import { appEnv } from "@/lib/env";
import { getVoiceCatalog } from "@/lib/listening";

export const dynamic = "force-dynamic";

export default async function LocalReaderDocumentPage({ params }) {
  const session = await getServerSession(authOptions);
  const resolvedParams = await params;
  const localDocumentId = String(resolvedParams?.localDocumentId || "").trim();

  if (!localDocumentId) {
    notFound();
  }

  return (
    <LocalReadGate
      session={session}
      localDocumentId={localDocumentId}
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
      homeHref="/"
      homeLabel="Home"
    />
  );
}
