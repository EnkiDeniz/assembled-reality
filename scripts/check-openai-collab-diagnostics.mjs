import { pathToFileURL } from "node:url";

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function maskSecret(value = "") {
  const normalized = normalizeText(value);
  if (!normalized) return "(missing)";
  if (normalized.length <= 16) return `${normalized.slice(0, 4)}...${normalized.slice(-4)}`;
  return `${normalized.slice(0, 10)}...${normalized.slice(-8)}`;
}

function pickModel() {
  return (
    normalizeText(process.env.ROOM_AI_COLLAB_OPENAI_MODEL) ||
    normalizeText(process.env.OPENAI_SEVEN_MODEL) ||
    "gpt-5.4-mini"
  );
}

function buildHeaders(apiKey) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

async function parseJsonSafe(response) {
  return response.json().catch(() => null);
}

function summarizeHeaders(response) {
  return {
    requestId: response.headers.get("x-request-id") || "",
    processingMs: response.headers.get("openai-processing-ms") || "",
    ratelimitLimitRequests: response.headers.get("x-ratelimit-limit-requests") || "",
    ratelimitRemainingRequests: response.headers.get("x-ratelimit-remaining-requests") || "",
    ratelimitLimitTokens: response.headers.get("x-ratelimit-limit-tokens") || "",
    ratelimitRemainingTokens: response.headers.get("x-ratelimit-remaining-tokens") || "",
  };
}

async function checkModelEndpoint({ apiKey, model }) {
  const response = await fetch(`https://api.openai.com/v1/models/${encodeURIComponent(model)}`, {
    method: "GET",
    headers: buildHeaders(apiKey),
  });

  const payload = await parseJsonSafe(response);

  return {
    ok: response.ok,
    status: response.status,
    headers: summarizeHeaders(response),
    payload,
  };
}

async function checkResponsesEndpoint({ apiKey, model }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: buildHeaders(apiKey),
    body: JSON.stringify({
      model,
      store: false,
      max_output_tokens: 16,
      input: "Reply with exactly: OK",
    }),
  });

  const payload = await parseJsonSafe(response);

  return {
    ok: response.ok,
    status: response.status,
    headers: summarizeHeaders(response),
    payload,
  };
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

function printSection(title, value) {
  console.log(`\n=== ${title} ===`);
  if (typeof value === "string") {
    console.log(value);
    return;
  }
  console.log(JSON.stringify(value, null, 2));
}

export async function runOpenAiCollabDiagnostics() {
  const apiKey = normalizeText(process.env.OPENAI_API_KEY);
  const model = pickModel();
  const config = {
    openaiApiKeyPresent: Boolean(apiKey),
    openaiApiKeyMasked: maskSecret(apiKey),
    roomAiCollabOpenAiModel: normalizeText(process.env.ROOM_AI_COLLAB_OPENAI_MODEL),
    openaiSevenModel: normalizeText(process.env.OPENAI_SEVEN_MODEL),
    chosenModel: model,
  };

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing from the environment.");
  }

  const modelCheck = await checkModelEndpoint({ apiKey, model });
  const responseCheck = await checkResponsesEndpoint({ apiKey, model });

  if (!responseCheck.ok) {
    throw new Error(
      normalizeText(responseCheck.payload?.error?.message) ||
        normalizeText(responseCheck.payload?.error?.type) ||
        `Responses probe failed with status ${responseCheck.status}.`,
    );
  }

  return {
    ok: true,
    config,
    modelCheck: {
      ok: modelCheck.ok,
      status: modelCheck.status,
      headers: modelCheck.headers,
      error: modelCheck.payload?.error || null,
      id: modelCheck.payload?.id || "",
      ownedBy: modelCheck.payload?.owned_by || "",
    },
    responseCheck: {
      ok: responseCheck.ok,
      status: responseCheck.status,
      headers: responseCheck.headers,
      error: responseCheck.payload?.error || null,
      outputText: extractOutputText(responseCheck.payload),
      usage: responseCheck.payload?.usage || null,
    },
  };
}

function renderDiagnostics(result) {
  printSection("Config", result.config);
  printSection("Model Lookup", result.modelCheck);
  printSection("Responses Probe", result.responseCheck);
}

async function main() {
  const result = await runOpenAiCollabDiagnostics();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  renderDiagnostics(result);
  console.log("\nopenai-collab-diagnostics: ok");
}

const isDirectExecution =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main().catch((error) => {
    if (process.argv.includes("--json")) {
      console.error(
        JSON.stringify(
          {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          },
          null,
          2,
        ),
      );
      process.exitCode = 1;
      return;
    }
    console.error("\nopenai-collab-diagnostics: failed");
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
