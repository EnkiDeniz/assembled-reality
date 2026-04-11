import { extractRoomMessageText, parseRoomJsonObject } from "../../src/lib/room-turn-service.js";

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function maskSecret(value = "") {
  const normalized = normalizeText(value);
  if (!normalized) return "(missing)";
  if (normalized.length <= 16) return `${normalized.slice(0, 4)}...${normalized.slice(-4)}`;
  return `${normalized.slice(0, 10)}...${normalized.slice(-8)}`;
}

export function resolveOpenAiApiKey() {
  return (
    normalizeText(process.env.OPENAI_API_KEY) ||
    normalizeText(process.env.OPENAI_API_KEY_PREVIEW) ||
    normalizeText(process.env.OPENAI_API_KEY_PROD)
  );
}

export function readBenchmarkPriceConfig() {
  const input = Number(process.env.ROOM_BENCHMARK_INPUT_USD_PER_1M_TOKENS);
  const output = Number(process.env.ROOM_BENCHMARK_OUTPUT_USD_PER_1M_TOKENS);

  return {
    configured: Number.isFinite(input) && Number.isFinite(output),
    inputUsdPer1MTokens: Number.isFinite(input) ? input : null,
    outputUsdPer1MTokens: Number.isFinite(output) ? output : null,
  };
}

export function estimateOpenAiCostUsd(usage = {}, priceConfig = readBenchmarkPriceConfig()) {
  if (!priceConfig?.configured) {
    return null;
  }

  const inputTokens = Number(usage?.inputTokens || 0);
  const outputTokens = Number(usage?.outputTokens || 0);

  return Number(
    (
      (inputTokens / 1_000_000) * Number(priceConfig.inputUsdPer1MTokens) +
      (outputTokens / 1_000_000) * Number(priceConfig.outputUsdPer1MTokens)
    ).toFixed(6),
  );
}

function shouldRetryStatus(status = 0) {
  return status === 429 || status >= 500;
}

function parseJsonSafe(text = "") {
  if (!normalizeText(text)) return null;
  return parseRoomJsonObject(text);
}

function extractUsage(payload = null) {
  const usage = payload?.usage || {};
  return {
    inputTokens:
      Number(usage?.input_tokens) ||
      Number(usage?.input_tokens_total) ||
      Number(usage?.prompt_tokens) ||
      0,
    outputTokens:
      Number(usage?.output_tokens) ||
      Number(usage?.output_tokens_total) ||
      Number(usage?.completion_tokens) ||
      0,
  };
}

function summarizeHeaders(headers) {
  return {
    requestId: headers?.get?.("x-request-id") || "",
    processingMs: headers?.get?.("openai-processing-ms") || "",
    ratelimitLimitRequests: headers?.get?.("x-ratelimit-limit-requests") || "",
    ratelimitRemainingRequests: headers?.get?.("x-ratelimit-remaining-requests") || "",
    ratelimitLimitTokens: headers?.get?.("x-ratelimit-limit-tokens") || "",
    ratelimitRemainingTokens: headers?.get?.("x-ratelimit-remaining-tokens") || "",
  };
}

function sanitizeOptions(options = {}) {
  const next = {
    method: options.method || "GET",
    cache: options.cache || "",
    headers: clone(options.headers || {}),
    body: options.body || "",
  };

  if (next.headers && typeof next.headers === "object") {
    for (const [key, value] of Object.entries(next.headers)) {
      if (String(key).toLowerCase() === "authorization") {
        next.headers[key] = "Bearer <redacted>";
      } else if (String(key).toLowerCase() === "x-api-key") {
        next.headers[key] = "<redacted>";
      } else {
        next.headers[key] = normalizeText(value);
      }
    }
  }

  const parsedBody = typeof next.body === "string" ? parseJsonSafe(next.body) : null;
  if (parsedBody) {
    next.body = parsedBody;
  }

  return next;
}

async function performOpenAiRequest({
  calls,
  label = "",
  url = "https://api.openai.com/v1/responses",
  options = {},
  maxRetries = 2,
  priceConfig = readBenchmarkPriceConfig(),
}) {
  const attempts = [];
  let finalResponse = null;
  let finalText = "";
  let finalPayload = null;
  let finalError = null;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
    const startedAt = new Date().toISOString();
    const startedAtMs = Date.now();

    try {
      const response = await fetch(url, options);
      const text = await response.text();
      const latencyMs = Date.now() - startedAtMs;
      const payload = parseJsonSafe(text);
      const usage = extractUsage(payload);
      const headers = summarizeHeaders(response.headers);
      const retryable = shouldRetryStatus(response.status);

      attempts.push({
        attempt,
        startedAt,
        endedAt: new Date().toISOString(),
        latencyMs,
        ok: response.ok,
        status: response.status,
        retryable,
        requestId: headers.requestId,
        error:
          payload?.error?.message ||
          payload?.error?.type ||
          payload?.error?.code ||
          "",
      });

      finalResponse = response;
      finalText = text;
      finalPayload = payload;

      if (retryable && attempt <= maxRetries) {
        continue;
      }

      break;
    } catch (error) {
      const latencyMs = Date.now() - startedAtMs;
      const message = error instanceof Error ? error.message : String(error);
      attempts.push({
        attempt,
        startedAt,
        endedAt: new Date().toISOString(),
        latencyMs,
        ok: false,
        status: 0,
        retryable: true,
        requestId: "",
        error: message,
      });
      finalError = message;
      if (attempt > maxRetries) {
        break;
      }
    }
  }

  const requestBody =
    typeof options?.body === "string" ? parseJsonSafe(options.body) : clone(options?.body || null);
  const usage = extractUsage(finalPayload);
  const model = normalizeText(requestBody?.model);
  const call = {
    label: normalizeText(label),
    url,
    request: {
      model,
      options: sanitizeOptions(options),
    },
    attempts,
    ok: Boolean(finalResponse?.ok),
    status: Number(finalResponse?.status || 0),
    headers: summarizeHeaders(finalResponse?.headers),
    responseId: normalizeText(finalPayload?.id),
    usage,
    costEstimateUsd: estimateOpenAiCostUsd(usage, priceConfig),
    outputText: extractRoomMessageText(finalPayload),
    payload: clone(finalPayload),
    finalError:
      finalPayload?.error?.message ||
      finalPayload?.error?.type ||
      finalPayload?.error?.code ||
      normalizeText(finalError),
  };
  calls.push(call);

  if (finalError && !finalResponse) {
    const error = new Error(finalError);
    error.call = call;
    throw error;
  }

  if (!finalResponse) {
    const error = new Error("OpenAI request failed before a response was received.");
    error.call = call;
    throw error;
  }

  return {
    call,
    response: new Response(finalText, {
      status: finalResponse.status,
      statusText: finalResponse.statusText,
      headers: finalResponse.headers,
    }),
    payload: finalPayload,
  };
}

export function buildOpenAiCallSummary(call = null) {
  if (!call) return null;

  const totalLatencyMs = Array.isArray(call.attempts)
    ? call.attempts.reduce((sum, attempt) => sum + Number(attempt?.latencyMs || 0), 0)
    : 0;

  return {
    requestId: normalizeText(call?.headers?.requestId),
    model: normalizeText(call?.request?.model),
    latencyMs: totalLatencyMs,
    inputTokens: Number(call?.usage?.inputTokens || 0),
    outputTokens: Number(call?.usage?.outputTokens || 0),
  };
}

export function createOpenAiTelemetryCollector({
  apiKey = resolveOpenAiApiKey(),
  defaultModel = "gpt-5.4-mini",
  priceConfig = readBenchmarkPriceConfig(),
} = {}) {
  const calls = [];

  function buildHeaders(extra = {}) {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...extra,
    };
  }

  return {
    apiKeyPresent: Boolean(apiKey),
    apiKeyMasked: maskSecret(apiKey),
    defaultModel,
    priceConfig,
    calls,
    async callResponses({
      label = "",
      body = {},
      maxRetries = 2,
      headers = {},
    } = {}) {
      const requestBody = {
        model: defaultModel,
        ...clone(body),
      };

      return performOpenAiRequest({
        calls,
        label,
        options: {
          method: "POST",
          headers: buildHeaders(headers),
          body: JSON.stringify(requestBody),
          cache: "no-store",
        },
        maxRetries,
        priceConfig,
      });
    },
    createFetchImpl({ label = "", maxRetries = 2 } = {}) {
      return async (url, options = {}) => {
        const requestHeaders = {
          ...(options?.headers || {}),
          Authorization: `Bearer ${apiKey}`,
        };

        const result = await performOpenAiRequest({
          calls,
          label,
          url,
          options: {
            ...options,
            headers: requestHeaders,
          },
          maxRetries,
          priceConfig,
        });

        return result.response;
      };
    },
  };
}
