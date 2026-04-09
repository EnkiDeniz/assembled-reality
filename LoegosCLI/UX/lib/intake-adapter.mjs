function toError(payload, fallbackMessage) {
  const message = String(payload?.error || payload?.message || fallbackMessage).trim();
  return new Error(message || fallbackMessage);
}

async function toJson(response) {
  return response.json().catch(() => null);
}

export async function uploadSources({
  files = [],
  projectKey = "",
  bundleName = "Loegos intake",
  endpoint = "/api/workspace/folder",
} = {}) {
  const normalizedFiles = Array.from(files || []).filter(Boolean);
  if (!normalizedFiles.length) {
    throw new Error("Choose at least one file to import.");
  }

  const formData = new FormData();
  if (projectKey) formData.set("projectKey", projectKey);
  formData.set("bundleName", bundleName);
  normalizedFiles.forEach((file) => formData.append("files", file));

  const response = await fetch(endpoint, { method: "POST", body: formData });
  const payload = await toJson(response);
  if (!response.ok) {
    throw toError(payload, "Could not import files.");
  }

  const firstResult = Array.isArray(payload?.results) ? payload.results[0] || null : null;
  return {
    payload,
    projectKey: payload?.project?.projectKey || projectKey || "",
    documentKey: firstResult?.document?.documentKey || "",
  };
}

export async function pasteSource({
  text = "",
  projectKey = "",
  mode = "source",
  endpoint = "/api/workspace/paste",
} = {}) {
  const value = String(text || "").trim();
  if (!value) {
    throw new Error("Paste text is empty.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectKey,
      mode,
      text: value,
    }),
  });
  const payload = await toJson(response);
  if (!response.ok) {
    throw toError(payload, "Could not create source from pasted text.");
  }

  const document = payload?.document || payload?.sourceDocument || null;
  return {
    payload,
    projectKey,
    documentKey: document?.documentKey || "",
  };
}

export async function importSourceLink({
  url = "",
  projectKey = "",
  endpoint = "/api/workspace/link",
} = {}) {
  const normalizedUrl = String(url || "").trim();
  if (!normalizedUrl) {
    throw new Error("Link URL is empty.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectKey,
      url: normalizedUrl,
    }),
  });
  const payload = await toJson(response);
  if (!response.ok) {
    throw toError(payload, "Could not import source link.");
  }

  return {
    payload,
    projectKey: payload?.project?.projectKey || projectKey || "",
    documentKey: payload?.document?.documentKey || "",
  };
}
