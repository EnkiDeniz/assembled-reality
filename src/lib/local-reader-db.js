"use client";

const DB_NAME = "assembled-reality-local-reader";
const DB_VERSION = 1;
const DOCUMENTS_STORE = "documents";
const STATES_STORE = "states";

function getGlobalCrypto() {
  if (typeof globalThis !== "undefined" && globalThis.crypto) {
    return globalThis.crypto;
  }

  return null;
}

function createId() {
  const cryptoApi = getGlobalCrypto();
  if (typeof cryptoApi?.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getIndexedDb() {
  if (typeof window === "undefined") return null;
  return window.indexedDB || null;
}

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed."));
  });
}

let dbPromise = null;

async function getDb() {
  if (dbPromise) return dbPromise;

  const indexedDb = getIndexedDb();
  if (!indexedDb) {
    throw new Error("This browser cannot store local reader documents.");
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(DOCUMENTS_STORE)) {
        db.createObjectStore(DOCUMENTS_STORE, { keyPath: "localDocumentId" });
      }

      if (!db.objectStoreNames.contains(STATES_STORE)) {
        db.createObjectStore(STATES_STORE, { keyPath: "storageKey" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error("Could not open the local reader database."));
  });

  return dbPromise;
}

function withStore(db, storeName, mode, callback) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    let settled = false;

    const settle = (fn, value) => {
      if (settled) return;
      settled = true;
      fn(value);
    };

    transaction.oncomplete = () => settle(resolve);
    transaction.onerror = () =>
      settle(reject, transaction.error || new Error(`IndexedDB ${storeName} transaction failed.`));
    transaction.onabort = () =>
      settle(reject, transaction.error || new Error(`IndexedDB ${storeName} transaction aborted.`));

    Promise.resolve()
      .then(() => callback(store, transaction))
      .then((value) => {
        if (value !== undefined) {
          settle(resolve, value);
        }
      })
      .catch((error) => settle(reject, error));
  });
}

function formatDocumentFormat(value = "markdown") {
  const normalized = String(value || "markdown").toLowerCase();
  if (normalized === "docx") return "DOCX";
  if (normalized === "doc") return "DOC";
  if (normalized === "pdf") return "PDF";
  if (normalized === "txt") return "TXT";
  return "Markdown";
}

function normalizeListeningSession(value) {
  if (!value || typeof value !== "object") return null;
  return {
    id: value.id || null,
    documentKey: value.documentKey || null,
    mode: value.mode || "flow",
    scopeStartNodeId: value.scopeStartNodeId || null,
    scopeEndNodeId: value.scopeEndNodeId || null,
    activeNodeId: value.activeNodeId || null,
    activeSectionSlug: value.activeSectionSlug || null,
    nodeOffsetMs: Math.max(0, Math.round(Number(value.nodeOffsetMs) || 0)),
    rate: Number(value.rate) || 1,
    provider: value.provider || null,
    voiceId: value.voiceId || null,
    status: value.status || "idle",
    createdAt: value.createdAt || null,
    updatedAt: value.updatedAt || null,
  };
}

function normalizeProgress(value) {
  if (!value || typeof value !== "object" || !value.sectionSlug) return null;
  return {
    documentKey: value.documentKey || null,
    sectionSlug: value.sectionSlug,
    progressPercent: Math.max(0, Math.min(100, Number(value.progressPercent) || 0)),
    updatedAt: value.updatedAt || null,
  };
}

function normalizeVoicePreferences(value) {
  if (!value || typeof value !== "object") return null;
  return {
    preferredVoiceProvider: value.preferredVoiceProvider || null,
    preferredVoiceId: value.preferredVoiceId || null,
    preferredListeningRate: Number(value.preferredListeningRate) || 1,
  };
}

function normalizeStateRecord(value, storageKey) {
  if (!value || typeof value !== "object") {
    return {
      storageKey,
      localDocumentId: null,
      progress: null,
      listeningSession: null,
      voicePreferences: null,
      lastOpenedAt: null,
      updatedAt: null,
    };
  }

  return {
    storageKey,
    localDocumentId: value.localDocumentId || null,
    progress: normalizeProgress(value.progress),
    listeningSession: normalizeListeningSession(value.listeningSession),
    voicePreferences: normalizeVoicePreferences(value.voicePreferences),
    lastOpenedAt: value.lastOpenedAt || null,
    updatedAt: value.updatedAt || null,
  };
}

function normalizeDocumentRecord(record) {
  return {
    ...record,
    href: getLocalReaderHref(record.localDocumentId),
    progressPercent: Math.max(0, Math.min(100, Number(record.progressPercent) || 0)),
  };
}

export function getLocalReaderHref(localDocumentId) {
  return `/read/local/${encodeURIComponent(localDocumentId)}`;
}

export function getLocalReaderStorageKey(localDocumentId) {
  return `local:${localDocumentId}`;
}

export function getBuiltinReaderStorageKey(documentKey) {
  return `builtin:${documentKey}`;
}

export async function createLocalReaderDocument({
  title,
  subtitle = "",
  format = "markdown",
  originalFilename = null,
  mimeType = "",
  contentMarkdown,
  wordCount = 0,
  sectionCount = 0,
  preview = "",
} = {}) {
  const now = new Date().toISOString();
  const localDocumentId = createId();
  const normalizedFormat = String(format || "markdown").toLowerCase();
  const record = normalizeDocumentRecord({
    localDocumentId,
    documentKey: `local-${localDocumentId}`,
    sourceType: "local",
    title: title || "Untitled document",
    subtitle,
    excerpt: preview || "",
    format: normalizedFormat,
    formatLabel: formatDocumentFormat(normalizedFormat),
    originalFilename: originalFilename || null,
    mimeType: mimeType || "",
    contentMarkdown: String(contentMarkdown || "").trim(),
    wordCount: Math.max(0, Number(wordCount) || 0),
    sectionCount: Math.max(0, Number(sectionCount) || 0),
    progressPercent: 0,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  });

  const db = await getDb();
  await withStore(db, DOCUMENTS_STORE, "readwrite", async (store) => {
    await promisifyRequest(store.put(record));
  });

  return record;
}

export async function listLocalReaderDocuments() {
  const db = await getDb();
  const records = await withStore(db, DOCUMENTS_STORE, "readonly", (store) =>
    promisifyRequest(store.getAll()),
  );

  return (Array.isArray(records) ? records : [])
    .map(normalizeDocumentRecord)
    .toSorted((left, right) => {
      const rightTime = Date.parse(right.lastOpenedAt || right.updatedAt || right.createdAt || "") || 0;
      const leftTime = Date.parse(left.lastOpenedAt || left.updatedAt || left.createdAt || "") || 0;
      return rightTime - leftTime;
    });
}

export async function getLocalReaderDocument(localDocumentId) {
  if (!localDocumentId) return null;

  const db = await getDb();
  const record = await withStore(db, DOCUMENTS_STORE, "readonly", (store) =>
    promisifyRequest(store.get(localDocumentId)),
  );

  return record ? normalizeDocumentRecord(record) : null;
}

export async function getLocalReaderState(storageKey) {
  if (!storageKey) return normalizeStateRecord(null, "");

  const db = await getDb();
  const record = await withStore(db, STATES_STORE, "readonly", (store) =>
    promisifyRequest(store.get(storageKey)),
  );

  return normalizeStateRecord(record, storageKey);
}

export async function saveLocalReaderState(
  storageKey,
  {
    localDocumentId = null,
    progress = undefined,
    listeningSession = undefined,
    voicePreferences = undefined,
    lastOpenedAt = undefined,
  } = {},
) {
  if (!storageKey) {
    throw new Error("A local reader storage key is required.");
  }

  const current = await getLocalReaderState(storageKey);
  const timestamp = new Date().toISOString();
  const next = normalizeStateRecord(
    {
      ...current,
      localDocumentId: localDocumentId ?? current.localDocumentId,
      progress: progress === undefined ? current.progress : progress,
      listeningSession:
        listeningSession === undefined ? current.listeningSession : listeningSession,
      voicePreferences:
        voicePreferences === undefined ? current.voicePreferences : voicePreferences,
      lastOpenedAt: lastOpenedAt === undefined ? current.lastOpenedAt || timestamp : lastOpenedAt,
      updatedAt: timestamp,
    },
    storageKey,
  );

  const db = await getDb();
  await withStore(db, STATES_STORE, "readwrite", async (store) => {
    await promisifyRequest(store.put(next));
  });

  if (next.localDocumentId) {
    await withStore(db, DOCUMENTS_STORE, "readwrite", async (store) => {
      const currentDocument = await promisifyRequest(store.get(next.localDocumentId));
      if (!currentDocument) return;

      const updatedDocument = normalizeDocumentRecord({
        ...currentDocument,
        progressPercent:
          next.progress?.progressPercent ??
          Math.max(0, Math.min(100, Number(currentDocument.progressPercent) || 0)),
        updatedAt: timestamp,
        lastOpenedAt: next.lastOpenedAt || timestamp,
      });

      await promisifyRequest(store.put(updatedDocument));
    });
  }

  return next;
}
