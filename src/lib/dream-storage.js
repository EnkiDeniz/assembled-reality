import { DREAM_STORAGE_VERSION } from "./dream.js";

const DB_NAME = "loegos-section-dream";
const STORE_NAME = "documents";
const DB_VERSION = 1;
const ACTIVE_DOCUMENT_KEY = `assembled-reality:dream-active-document:v${DREAM_STORAGE_VERSION}`;
const LEGACY_SESSION_KEY = `assembled-reality:dream-session:v${DREAM_STORAGE_VERSION}`;
const SESSIONS_KEY = `assembled-reality:dream-sessions:v${DREAM_STORAGE_VERSION}`;

function supportsIndexedDb() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!supportsIndexedDb()) {
      reject(new Error("This browser cannot preserve Dream Library documents locally."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error("Could not open Dream Library storage."));
  });
}

async function withStore(mode, callback) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);

    transaction.oncomplete = () => {
      database.close();
    };
    transaction.onerror = () => {
      reject(transaction.error || new Error("Dream Library storage failed."));
      database.close();
    };

    Promise.resolve()
      .then(() => callback(store, transaction))
      .then(resolve)
      .catch((error) => {
        reject(error);
        database.close();
      });
  });
}

function loadJson(key) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveJson(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function removeJson(key) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

function normalizeDocumentSort(document) {
  const updatedAt = Date.parse(document?.updatedAt || document?.lastOpenedAt || "") || 0;
  const createdAt = Date.parse(document?.createdAt || "") || 0;
  return Math.max(updatedAt, createdAt);
}

function loadDreamSessionsFromStorage() {
  const current = loadJson(SESSIONS_KEY);
  if (current && typeof current === "object") {
    return current;
  }

  const legacy = loadJson(LEGACY_SESSION_KEY);
  if (legacy?.documentId) {
    const migrated = { [legacy.documentId]: legacy };
    saveJson(SESSIONS_KEY, migrated);
    removeJson(LEGACY_SESSION_KEY);
    return migrated;
  }

  return {};
}

function saveDreamSessionsToStorage(sessions) {
  saveJson(SESSIONS_KEY, sessions);
  removeJson(LEGACY_SESSION_KEY);
}

export async function saveDreamDocument(document) {
  if (!document?.id) {
    throw new Error("Dream Library document is incomplete.");
  }

  await withStore("readwrite", (store) => {
    store.put({
      ...document,
      updatedAt: document.updatedAt || new Date().toISOString(),
    });
  });

  return document;
}

export async function listDreamDocuments() {
  return withStore("readonly", (store) => new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const results = Array.isArray(request.result) ? request.result : [];
      resolve(results.sort((left, right) => normalizeDocumentSort(right) - normalizeDocumentSort(left)));
    };
    request.onerror = () =>
      reject(request.error || new Error("Could not read Dream Library documents."));
  }));
}

export async function loadDreamDocument(documentId) {
  if (!documentId) return null;

  return withStore("readonly", (store) => new Promise((resolve, reject) => {
    const request = store.get(documentId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () =>
      reject(request.error || new Error("Could not read the Dream Library document."));
  }));
}

export async function deleteDreamDocument(documentId) {
  if (!documentId) return;

  await withStore("readwrite", (store) => {
    store.delete(documentId);
  });

  clearDreamSession(documentId);

  const reference = loadActiveDreamDocumentRef();
  if (String(reference?.documentId || "").trim() === String(documentId).trim()) {
    clearActiveDreamDocumentRef();
  }
}

export function loadDreamSession(documentId = "") {
  const sessions = loadDreamSessionsFromStorage();
  const normalizedDocumentId = String(documentId || "").trim();

  if (normalizedDocumentId) {
    return sessions[normalizedDocumentId] || null;
  }

  const activeDocumentId = String(loadActiveDreamDocumentRef()?.documentId || "").trim();
  if (activeDocumentId && sessions[activeDocumentId]) {
    return sessions[activeDocumentId];
  }

  return Object.values(sessions)[0] || null;
}

export function saveDreamSession(session) {
  if (typeof window === "undefined" || !session?.documentId) return;
  const sessions = loadDreamSessionsFromStorage();
  sessions[session.documentId] = session;
  saveDreamSessionsToStorage(sessions);
}

export function clearDreamSession(documentId = "") {
  if (typeof window === "undefined") return;

  if (!documentId) {
    removeJson(SESSIONS_KEY);
    removeJson(LEGACY_SESSION_KEY);
    return;
  }

  const sessions = loadDreamSessionsFromStorage();
  delete sessions[String(documentId).trim()];
  saveDreamSessionsToStorage(sessions);
}

export function loadActiveDreamDocumentRef() {
  return loadJson(ACTIVE_DOCUMENT_KEY);
}

export function saveActiveDreamDocumentRef(value) {
  if (typeof window === "undefined") return;
  saveJson(ACTIVE_DOCUMENT_KEY, value);
}

export function clearActiveDreamDocumentRef() {
  removeJson(ACTIVE_DOCUMENT_KEY);
}

export function setActiveDreamDocument(documentOrId, filename = "") {
  const documentId =
    typeof documentOrId === "string"
      ? String(documentOrId || "").trim()
      : String(documentOrId?.id || "").trim();
  if (!documentId) return;

  saveActiveDreamDocumentRef({
    version: DREAM_STORAGE_VERSION,
    documentId,
    filename:
      typeof documentOrId === "string"
        ? String(filename || "").trim()
        : documentOrId?.filename || String(filename || "").trim(),
    updatedAt:
      typeof documentOrId === "string"
        ? new Date().toISOString()
        : documentOrId?.updatedAt || new Date().toISOString(),
  });
}

export async function loadActiveDreamDocument() {
  const reference = loadActiveDreamDocumentRef();
  const documentId = String(reference?.documentId || "").trim();
  if (documentId) {
    return loadDreamDocument(documentId);
  }

  const documents = await listDreamDocuments();
  if (!documents.length) {
    return null;
  }

  setActiveDreamDocument(documents[0]);
  return documents[0];
}

export async function replaceActiveDreamDocument(document) {
  await saveDreamDocument(document);
  setActiveDreamDocument(document);
  return document;
}

export async function clearDreamPersistence() {
  const documents = await listDreamDocuments().catch(() => []);
  await Promise.all(documents.map((document) => deleteDreamDocument(document.id).catch(() => {})));
  clearActiveDreamDocumentRef();
  clearDreamSession();
}
