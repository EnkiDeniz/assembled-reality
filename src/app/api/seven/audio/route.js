import { appEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json();
  const text = String(body?.text || "").trim();

  if (!text) {
    return Response.json(
      {
        ok: false,
        error: "Seven needs text before it can speak.",
      },
      { status: 400 },
    );
  }

  if (text.length > 4096) {
    return Response.json(
      {
        ok: false,
        error: "This audio chunk is too long for a single speech request.",
      },
      { status: 400 },
    );
  }

  if (appEnv.elevenlabs.enabled) {
    const url = new URL(
      `https://api.elevenlabs.io/v1/text-to-speech/${appEnv.elevenlabs.voiceId}`,
    );
    url.searchParams.set("output_format", appEnv.elevenlabs.outputFormat);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": appEnv.elevenlabs.apiKey,
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: appEnv.elevenlabs.modelId,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      return Response.json(
        {
          ok: false,
          error:
            payload?.detail?.message ||
            payload?.detail?.status ||
            payload?.message ||
            "ElevenLabs could not generate Seven's voice right now.",
        },
        { status: response.status },
      );
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  }

  if (!appEnv.openai.enabled) {
    return Response.json(
      {
        ok: false,
        error:
          "Seven's voice is not configured. Add `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`.",
      },
      { status: 503 },
    );
  }

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${appEnv.openai.apiKey}`,
    },
    body: JSON.stringify({
      model: appEnv.openai.speechModel,
      voice: appEnv.openai.voice,
      input: text,
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    return Response.json(
      {
        ok: false,
        error:
          payload?.error?.message ||
          "OpenAI fallback voice could not generate Seven's audio right now.",
      },
      { status: response.status },
    );
  }

  return new Response(response.body, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
