function normalizeError(payload, fallbackMessage) {
  return String(payload?.error || payload?.message || fallbackMessage).trim() || fallbackMessage;
}

async function parseJson(response) {
  return response.json().catch(() => null);
}

export async function requestVoiceAudio({
  text = "",
  preferredProvider = "",
  voiceId = "",
  rate = 1,
  endpoint = "/api/seven/audio",
} = {}) {
  const normalizedText = String(text || "").trim();
  if (!normalizedText) {
    throw new Error("Audio requires text.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: normalizedText,
      preferredProvider: preferredProvider || undefined,
      voiceId: voiceId || undefined,
      rate,
    }),
  });

  if (!response.ok) {
    const payload = await parseJson(response);
    throw new Error(normalizeError(payload, "Voice is unavailable right now."));
  }

  return {
    blob: await response.blob(),
    headers: {
      provider: String(response.headers.get("X-Seven-Provider") || "").trim() || null,
      voiceId: String(response.headers.get("X-Seven-Voice-Id") || "").trim() || null,
      requestedProvider:
        String(response.headers.get("X-Seven-Requested-Provider") || "").trim() || null,
    },
  };
}

export async function loadListeningSession({
  documentKey = "",
  endpoint = "/api/reader/listening-session",
} = {}) {
  const key = String(documentKey || "").trim();
  const url = key ? `${endpoint}?documentKey=${encodeURIComponent(key)}` : endpoint;
  const response = await fetch(url, { method: "GET" });
  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(normalizeError(payload, "Could not load listening session."));
  }
  return payload || { listeningSession: null, voicePreferences: null };
}

export async function saveListeningSession({
  documentKey = "",
  mode = "flow",
  activeNodeId = null,
  activeSectionSlug = null,
  rate = 1,
  provider = null,
  voiceId = null,
  status = "paused",
  endpoint = "/api/reader/listening-session",
} = {}) {
  const response = await fetch(endpoint, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documentKey,
      mode,
      activeNodeId,
      activeSectionSlug,
      rate,
      provider,
      voiceId,
      status,
      preferredVoiceProvider: provider || undefined,
      preferredVoiceId: voiceId || undefined,
      preferredListeningRate: rate,
    }),
  });
  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(normalizeError(payload, "Could not save listening session."));
  }
  return payload || { ok: true, listeningSession: null, voicePreferences: null };
}
