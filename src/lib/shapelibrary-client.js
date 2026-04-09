const DEFAULT_API_BASE = "/api/shapelibrary";

async function callJson(path, options = {}) {
  const response = await fetch(`${DEFAULT_API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) {
    const error = payload?.error || {};
    const message = error.message || `Request failed (${response.status})`;
    const wrapped = new Error(message);
    wrapped.status = response.status;
    wrapped.details = error.details || [];
    wrapped.payload = payload;
    throw wrapped;
  }
  return payload;
}

export async function analyzeShape(payload) {
  return callJson("/analyze", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listCandidates() {
  return callJson("/candidates");
}

export async function promoteCandidate(payload) {
  return callJson("/promote", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
