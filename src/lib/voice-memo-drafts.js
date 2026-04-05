"use client";

const DB_NAME = "loegos-workspace";
const STORE_NAME = "voice-memo-drafts";
const STORE_VERSION = 1;

function supportsIndexedDb() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!supportsIndexedDb()) {
      reject(new Error("This browser cannot preserve voice memos locally."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, STORE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error("Could not open local voice memo storage."));
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
      reject(transaction.error || new Error("Local voice memo storage failed."));
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

export async function saveVoiceMemoDraft(draft) {
  if (!draft?.id || !draft?.file) {
    throw new Error("Voice memo draft is incomplete.");
  }

  await withStore("readwrite", (store) => {
    store.put({
      id: draft.id,
      file: draft.file,
      createdAt: draft.createdAt || new Date().toISOString(),
      errorMessage: draft.errorMessage || "",
    });
  });

  return draft;
}

export async function loadVoiceMemoDraft(id) {
  if (!id) return null;

  return withStore("readonly", (store) => new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () =>
      reject(request.error || new Error("Could not read the local voice memo draft."));
  }));
}

export async function deleteVoiceMemoDraft(id) {
  if (!id) return;

  await withStore("readwrite", (store) => {
    store.delete(id);
  });
}
