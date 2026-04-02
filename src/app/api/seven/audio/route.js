import { NextResponse } from "next/server";
import { appEnv } from "@/lib/env";
import {
  buildSevenIssueMessage,
  getSevenReasonCode,
  getSevenRetryAfterSeconds,
} from "@/lib/seven";
import { getRequiredSession } from "@/lib/server-session";

export const runtime = "nodejs";

const VOICE_UNAVAILABLE_MESSAGE = "Seven's voice is unavailable right now.";

function createAudioSuccessResponse(providerResponse, metadata = {}) {
  const headers = new Headers();
  headers.set("Content-Type", "audio/mpeg");
  headers.set("Cache-Control", "no-store");
  headers.set("X-Seven-Provider", metadata.provider || "");

  if (metadata.fallbackFrom) {
    headers.set("X-Seven-Fallback-From", metadata.fallbackFrom);
  }

  if (metadata.fallbackReasonCode) {
    headers.set("X-Seven-Fallback-Reason-Code", metadata.fallbackReasonCode);
  }

  return new Response(providerResponse.body, {
    status: 200,
    headers,
  });
}

function buildVoiceErrorResponse({
  provider,
  status = 503,
  reasonCode = "provider_unavailable",
  retryAfterSeconds = null,
  fallbackFrom = null,
  fallbackReasonCode = "",
}) {
  return NextResponse.json(
    {
      ok: false,
      error: buildSevenIssueMessage({
        feature: "voice",
        provider,
        reasonCode,
        retryAfterSeconds,
      }),
      provider,
      reasonCode,
      retryable: reasonCode === "rate_limited" || reasonCode === "provider_unavailable",
      retryAfterSeconds,
      fallbackFrom,
      fallbackReasonCode,
    },
    { status },
  );
}

async function parseProviderFailure(response) {
  const payload = await response.json().catch(() => null);
  const detail =
    payload?.detail?.status ||
    payload?.detail?.message ||
    payload?.error?.message ||
    payload?.error?.code ||
    payload?.error?.type ||
    payload?.message ||
    "";
  const reasonCode = getSevenReasonCode({
    status: response.status,
    detail,
    code: payload?.error?.code,
    type: payload?.error?.type,
  });

  return {
    status: response.status,
    detail,
    reasonCode,
    retryAfterSeconds: getSevenRetryAfterSeconds(response.headers),
  };
}

async function requestOpenAiSpeech(text) {
  if (!appEnv.openai.enabled) {
    return {
      ok: false,
      provider: "openai",
      error: {
        status: 503,
        detail: VOICE_UNAVAILABLE_MESSAGE,
        reasonCode: "provider_unavailable",
        retryAfterSeconds: null,
      },
    };
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
    return {
      ok: false,
      provider: "openai",
      error: await parseProviderFailure(response),
    };
  }

  return {
    ok: true,
    provider: "openai",
    response,
  };
}

async function requestElevenLabsSpeech(text) {
  if (!appEnv.elevenlabs.enabled) {
    return {
      ok: false,
      provider: "elevenlabs",
      error: {
        status: 503,
        detail: VOICE_UNAVAILABLE_MESSAGE,
        reasonCode: "provider_unavailable",
        retryAfterSeconds: null,
      },
    };
  }

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
    return {
      ok: false,
      provider: "elevenlabs",
      error: await parseProviderFailure(response),
    };
  }

  return {
    ok: true,
    provider: "elevenlabs",
    response,
  };
}

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const text = String(body?.text || "").trim();

  if (!text) {
    return NextResponse.json(
      {
        ok: false,
        error: "Seven needs text before it can speak.",
      },
      { status: 400 },
    );
  }

  if (text.length > 4096) {
    return NextResponse.json(
      {
        ok: false,
        error: "This audio chunk is too long for a single speech request.",
      },
      { status: 400 },
    );
  }

  let initialFailure = null;

  if (appEnv.openai.enabled) {
    try {
      const openai = await requestOpenAiSpeech(text);
      if (openai.ok) {
        return createAudioSuccessResponse(openai.response, {
          provider: "openai",
        });
      }

      initialFailure = openai.error;
      console.error("Seven voice request failed.", {
        provider: "openai",
        status: openai.error.status,
        reasonCode: openai.error.reasonCode,
        detail: openai.error.detail || undefined,
      });
    } catch (error) {
      initialFailure = {
        status: 503,
        detail: error instanceof Error ? error.message : String(error),
        reasonCode: "provider_unavailable",
        retryAfterSeconds: null,
      };
      console.error("Seven voice request crashed.", {
        provider: "openai",
        detail: initialFailure.detail,
      });
    }
  }

  try {
    const elevenlabs = await requestElevenLabsSpeech(text);
    if (elevenlabs.ok) {
      return createAudioSuccessResponse(elevenlabs.response, {
        provider: "elevenlabs",
        fallbackFrom: initialFailure ? "openai" : null,
        fallbackReasonCode: initialFailure?.reasonCode || "",
      });
    }

    console.error("Seven voice request failed.", {
      provider: "elevenlabs",
      status: elevenlabs.error.status,
      reasonCode: elevenlabs.error.reasonCode,
      detail: elevenlabs.error.detail || undefined,
      fallbackFrom: initialFailure ? "openai" : undefined,
    });

    return buildVoiceErrorResponse({
      provider: "elevenlabs",
      status: elevenlabs.error.status,
      reasonCode: elevenlabs.error.reasonCode,
      retryAfterSeconds: elevenlabs.error.retryAfterSeconds,
      fallbackFrom: initialFailure ? "openai" : null,
      fallbackReasonCode: initialFailure?.reasonCode || "",
    });
  } catch (error) {
    console.error("Seven voice request crashed.", {
      provider: "elevenlabs",
      detail: error instanceof Error ? error.message : String(error),
      fallbackFrom: initialFailure ? "openai" : undefined,
    });

    return buildVoiceErrorResponse({
      provider: "elevenlabs",
      status: 503,
      reasonCode: "provider_unavailable",
      fallbackFrom: initialFailure ? "openai" : null,
      fallbackReasonCode: initialFailure?.reasonCode || "",
    });
  }
}
