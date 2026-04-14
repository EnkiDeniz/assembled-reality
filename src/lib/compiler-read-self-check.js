const SELF_CHECK_KEY = "assembled-reality:compiler-read-self-check:v1";

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeVersionKey(value = "") {
  return normalizeText(value) || "current";
}

function resolveSaveArgs(versionKeyOrValue = "", maybeValue = undefined) {
  if (typeof maybeValue === "undefined") {
    return {
      versionKey: "",
      value: versionKeyOrValue,
    };
  }

  return {
    versionKey: versionKeyOrValue,
    value: maybeValue,
  };
}

export function getCompilerReadSelfCheckStorageKey(documentId = "", versionKey = "") {
  return `${SELF_CHECK_KEY}:${normalizeText(documentId) || "unknown"}:${normalizeVersionKey(versionKey)}`;
}

export function loadCompilerReadSelfCheck(documentId = "", versionKey = "") {
  if (typeof window === "undefined" || !normalizeText(documentId)) return "";
  try {
    return normalizeText(
      window.localStorage.getItem(getCompilerReadSelfCheckStorageKey(documentId, versionKey)),
    );
  } catch {
    return "";
  }
}

export function saveCompilerReadSelfCheck(documentId = "", versionKeyOrValue = "", maybeValue = undefined) {
  if (typeof window === "undefined" || !normalizeText(documentId)) return;
  const { versionKey, value } = resolveSaveArgs(versionKeyOrValue, maybeValue);

  try {
    if (!normalizeText(value)) {
      window.localStorage.removeItem(getCompilerReadSelfCheckStorageKey(documentId, versionKey));
      window.dispatchEvent(new CustomEvent("compiler-read-self-check-change", { detail: { documentId, versionKey } }));
      return;
    }
    window.localStorage.setItem(
      getCompilerReadSelfCheckStorageKey(documentId, versionKey),
      normalizeText(value),
    );
    window.dispatchEvent(new CustomEvent("compiler-read-self-check-change", { detail: { documentId, versionKey } }));
  } catch {
    // Ignore local persistence failures and keep the read usable.
  }
}

export function clearCompilerReadSelfCheck(documentId = "", versionKey = "") {
  saveCompilerReadSelfCheck(documentId, versionKey, "");
}

export function subscribeToCompilerReadSelfCheck(documentId = "", versionKey = "", callback = () => {}) {
  let resolvedVersionKey = versionKey;
  let resolvedCallback = callback;

  if (typeof versionKey === "function") {
    resolvedCallback = versionKey;
    resolvedVersionKey = "";
  }

  if (typeof window === "undefined" || !normalizeText(documentId)) {
    return () => {};
  }

  function handleStorage(event) {
    if (event.key && event.key !== getCompilerReadSelfCheckStorageKey(documentId, resolvedVersionKey)) return;
    resolvedCallback();
  }

  function handleChange(event) {
    if (normalizeText(event?.detail?.documentId) !== normalizeText(documentId)) return;
    if (normalizeVersionKey(event?.detail?.versionKey) !== normalizeVersionKey(resolvedVersionKey)) return;
    resolvedCallback();
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener("compiler-read-self-check-change", handleChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("compiler-read-self-check-change", handleChange);
  };
}
