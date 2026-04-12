import { DREAM_STORAGE_VERSION } from "./dream.js";

const DB_NAME = "loegos-section-dream";
const STORE_NAME = "documents";
const DB_VERSION = 1;
const ACTIVE_DOCUMENT_KEY = `assembled-reality:dream-active-document:v${DREAM_STORAGE_VERSION}`;
const SESSION_KEY = `assembled-reality:dream-session:v${DREAM_STORAGE_VERSION}`;

function supportsIndexedDb() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!supportsIndexedDb()) {
      reject(new Error("This browser cannot preserve Section Dream documents locally."));
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
      reject(request.error || new Error("Could not open Section Dream storage."));
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
      reject(transaction.error || new Error("Section Dream storage failed."));
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

export async function saveDreamDocument(document) {
  if (!document?.id) {
    throw new Error("Section Dream document is incomplete.");
  }

  await withStore("readwrite", (store) => {
    store.put({
      ...document,
      updatedAt: document.updatedAt || new Date().toISOString(),
    });
  });

  return document;
}

export async function loadDreamDocument(documentId) {
  if (!documentId) return null;

  return withStore("readonly", (store) => new Promise((resolve, reject) => {
    const request = store.get(documentId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () =>
      reject(request.error || new Error("Could not read the Section Dream document."));
  }));
}

export async function deleteDreamDocument(documentId) {
  if (!documentId) return;

  await withStore("readwrite", (store) => {
    store.delete(documentId);
  });
}

export function loadDreamSession() {
  return loadJson(SESSION_KEY);
}

export function saveDreamSession(session) {
  if (typeof window === "undefined" || !session?.documentId) return;
  saveJson(SESSION_KEY, session);
}

export function clearDreamSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function loadActiveDreamDocumentRef() {
  return loadJson(ACTIVE_DOCUMENT_KEY);
}

export function saveActiveDreamDocumentRef(value) {
  if (typeof window === "undefined") return;
  saveJson(ACTIVE_DOCUMENT_KEY, value);
}

export function clearActiveDreamDocumentRef() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACTIVE_DOCUMENT_KEY);
}

export async function loadActiveDreamDocument() {
  const reference = loadActiveDreamDocumentRef();
  const documentId = String(reference?.documentId || "").trim();
  if (!documentId) {
    return null;
  }

  return loadDreamDocument(documentId);
}

export async function replaceActiveDreamDocument(document) {
  const previous = loadActiveDreamDocumentRef();
  const previousDocumentId = String(previous?.documentId || "").trim();

  await saveDreamDocument(document);
  saveActiveDreamDocumentRef({
    version: DREAM_STORAGE_VERSION,
    documentId: document.id,
    filename: document.filename,
    updatedAt: document.updatedAt || new Date().toISOString(),
  });

  if (previousDocumentId && previousDocumentId !== document.id) {
    await deleteDreamDocument(previousDocumentId).catch(() => {});
  }

  return document;
}

export async function clearDreamPersistence() {
  const reference = loadActiveDreamDocumentRef();
  const documentId = String(reference?.documentId || "").trim();

  if (documentId) {
    await deleteDreamDocument(documentId).catch(() => {});
  }

  clearActiveDreamDocumentRef();
  clearDreamSession();
}
