function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function pickModel() {
  return (
    normalizeText(process.env.ROOM_AI_COLLAB_OPENAI_MODEL) ||
    normalizeText(process.env.OPENAI_SEVEN_MODEL) ||
    "gpt-5.4-mini"
  );
}

function buildMarker() {
  const now = new Date().toISOString();
  return `NIKI-LAUDA-LOG-CHECK ${now}`;
}

function extractOutputText(payload = null) {
  const output = Array.isArray(payload?.output) ? payload.output : [];
  const parts = [];

  output.forEach((item) => {
    const content = Array.isArray(item?.content) ? item.content : [];
    content.forEach((entry) => {
      if ((entry?.type === "output_text" || entry?.type === "text") && typeof entry?.text === "string") {
        parts.push(entry.text);
      }
    });
  });

  return parts.join("\n").trim();
}

async function main() {
  const apiKey = normalizeText(process.env.OPENAI_API_KEY);
  const model = pickModel();
  const marker = buildMarker();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  const input = `Return exactly this marker and nothing else: ${marker}`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      store: false,
      max_output_tokens: 32,
      input,
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.error?.type ||
      payload?.error?.code ||
      `HTTP ${response.status}`;
    throw new Error(message);
  }

  console.log(JSON.stringify({
    ok: true,
    marker,
    model,
    requestId: response.headers.get("x-request-id") || "",
    responseId: normalizeText(payload?.id),
    outputText: extractOutputText(payload),
    usage: payload?.usage || null,
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exitCode = 1;
});
