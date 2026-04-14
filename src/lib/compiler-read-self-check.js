const SELF_CHECK_KEY = "assembled-reality:compiler-read-self-check:v1";

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function getCompilerReadSelfCheckStorageKey(documentId = "") {
  return `${SELF_CHECK_KEY}:${normalizeText(documentId) || "unknown"}`;
}

export function loadCompilerReadSelfCheck(documentId = "") {
  if (typeof window === "undefined" || !normalizeText(documentId)) return "";
  try {
    return normalizeText(window.localStorage.getItem(getCompilerReadSelfCheckStorageKey(documentId)));
  } catch {
    return "";
  }
}

export function saveCompilerReadSelfCheck(documentId = "", value = "") {
  if (typeof window === "undefined" || !normalizeText(documentId)) return;
  try {
    if (!normalizeText(value)) {
      window.localStorage.removeItem(getCompilerReadSelfCheckStorageKey(documentId));
      window.dispatchEvent(new CustomEvent("compiler-read-self-check-change", { detail: { documentId } }));
      return;
    }
    window.localStorage.setItem(
      getCompilerReadSelfCheckStorageKey(documentId),
      normalizeText(value),
    );
    window.dispatchEvent(new CustomEvent("compiler-read-self-check-change", { detail: { documentId } }));
  } catch {
    // Ignore local persistence failures and keep the read usable.
  }
}

export function clearCompilerReadSelfCheck(documentId = "") {
  saveCompilerReadSelfCheck(documentId, "");
}

export function subscribeToCompilerReadSelfCheck(documentId = "", callback = () => {}) {
  if (typeof window === "undefined" || !normalizeText(documentId)) {
    return () => {};
  }

  function handleStorage(event) {
    if (event.key && event.key !== getCompilerReadSelfCheckStorageKey(documentId)) return;
    callback();
  }

  function handleChange(event) {
    if (normalizeText(event?.detail?.documentId) !== normalizeText(documentId)) return;
    callback();
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener("compiler-read-self-check-change", handleChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("compiler-read-self-check-change", handleChange);
  };
}
