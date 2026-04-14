import {
  buildDreamVersionRecord,
  DREAM_STORAGE_VERSION,
  getDreamQueueDurationMs,
  normalizeDreamFilename,
  normalizeDreamSourceKind,
} from "./dream.js";

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

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeIsoDate(value = "", fallback = new Date().toISOString()) {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? fallback : new Date(parsed).toISOString();
}

function normalizeDreamVersion(documentId = "", version = null, fallback = {}) {
  const nextVersion = version && typeof version === "object" ? version : {};
  const createdAt = normalizeIsoDate(nextVersion.createdAt || fallback.createdAt);
  const updatedAt = normalizeIsoDate(nextVersion.updatedAt || createdAt, createdAt);
  const rawMarkdown = String(nextVersion.rawMarkdown || "");
  const normalizedText = String(nextVersion.normalizedText || "");
  const chunkMap = Array.isArray(nextVersion.chunkMap) ? nextVersion.chunkMap : [];
  const totalDurationMs =
    Number(nextVersion.totalDurationMs) || getDreamQueueDurationMs(chunkMap);
  const compilerRead = nextVersion.compilerRead && typeof nextVersion.compilerRead === "object"
    ? {
        ...nextVersion.compilerRead,
        contentHash:
          normalizeText(nextVersion.compilerRead.contentHash) ||
          normalizeText(nextVersion.contentHash) ||
          null,
      }
    : null;

  return {
    versionId: normalizeText(nextVersion.versionId) || normalizeText(fallback.versionId),
    parentVersionId: normalizeText(nextVersion.parentVersionId),
    createdAt,
    updatedAt,
    contentHash: normalizeText(nextVersion.contentHash),
    rawMarkdown,
    normalizedText,
    chunkMap,
    wordCount: Number(nextVersion.wordCount) || 0,
    progressMs: Math.max(0, Number(nextVersion.progressMs) || 0),
    totalDurationMs,
    compilerRead,
    compilerReadRanAt: compilerRead ? normalizeIsoDate(nextVersion.compilerReadRanAt || updatedAt, updatedAt) : null,
    documentId,
  };
}

function buildLegacyDreamVersion(document = null) {
  const nextDocument = document && typeof document === "object" ? document : {};
  const createdAt = normalizeIsoDate(nextDocument.createdAt);
  const updatedAt = normalizeIsoDate(nextDocument.updatedAt || createdAt, createdAt);
  const rawMarkdown = String(nextDocument.rawMarkdown || "");
  const normalizedText = String(nextDocument.normalizedText || "");
  const chunkMap = Array.isArray(nextDocument.chunkMap) ? nextDocument.chunkMap : [];
  const contentHash =
    normalizeText(nextDocument.contentHash) ||
    normalizeText(nextDocument?.compilerRead?.contentHash) ||
    normalizeText(nextDocument.id);

  return normalizeDreamVersion(nextDocument.id, {
    versionId: normalizeText(nextDocument.currentVersionId || nextDocument.versionId || contentHash || nextDocument.id),
    parentVersionId: "",
    createdAt,
    updatedAt,
    contentHash,
    rawMarkdown,
    normalizedText,
    chunkMap,
    wordCount: Number(nextDocument.wordCount) || 0,
    progressMs: Math.max(0, Number(nextDocument.progressMs) || 0),
    totalDurationMs: Number(nextDocument.totalDurationMs) || getDreamQueueDurationMs(chunkMap),
    compilerRead: nextDocument.compilerRead || null,
    compilerReadRanAt: nextDocument.compilerReadRanAt || null,
  });
}

export function normalizeDreamStoredDocument(document = null) {
  if (!document?.id) {
    throw new Error("Dream Library document is incomplete.");
  }

  const createdAt = normalizeIsoDate(document.createdAt);
  const updatedAt = normalizeIsoDate(document.updatedAt || createdAt, createdAt);
  const lastOpenedAt = normalizeIsoDate(document.lastOpenedAt || updatedAt, updatedAt);
  const versions = Array.isArray(document.versions) && document.versions.length
    ? document.versions.map((version) => normalizeDreamVersion(document.id, version, { createdAt }))
    : [buildLegacyDreamVersion(document)];
  const currentVersionId =
    normalizeText(document.currentVersionId) ||
    normalizeText(versions[versions.length - 1]?.versionId);
  const currentVersion =
    versions.find((version) => version.versionId === currentVersionId) ||
    versions[versions.length - 1];

  return {
    id: normalizeText(document.id),
    filename: normalizeDreamFilename(document.filename, document.sourceKind),
    sourceKind: normalizeDreamSourceKind(document.sourceKind),
    createdAt,
    updatedAt,
    lastOpenedAt,
    currentVersionId: currentVersion?.versionId || currentVersionId,
    libraryStatus: normalizeText(document.libraryStatus) || "library_only",
    versions,
  };
}

export function getDreamDocumentCurrentVersion(document = null) {
  const normalizedDocument =
    document && typeof document === "object" ? normalizeDreamStoredDocument(document) : null;
  if (!normalizedDocument) return null;
  return (
    normalizedDocument.versions.find((version) => version.versionId === normalizedDocument.currentVersionId) ||
    normalizedDocument.versions[normalizedDocument.versions.length - 1] ||
    null
  );
}

export function projectDreamDocument(document = null) {
  const normalizedDocument = normalizeDreamStoredDocument(document);
  const currentVersion = getDreamDocumentCurrentVersion(normalizedDocument);
  const versionCount = normalizedDocument.versions.length;

  return {
    ...normalizedDocument,
    rawMarkdown: currentVersion?.rawMarkdown || "",
    normalizedText: currentVersion?.normalizedText || "",
    chunkMap: Array.isArray(currentVersion?.chunkMap) ? currentVersion.chunkMap : [],
    wordCount: Number(currentVersion?.wordCount) || 0,
    progressMs: Math.max(0, Number(currentVersion?.progressMs) || 0),
    totalDurationMs:
      Number(currentVersion?.totalDurationMs) ||
      getDreamQueueDurationMs(currentVersion?.chunkMap || []),
    contentHash: normalizeText(currentVersion?.contentHash),
    compilerRead: currentVersion?.compilerRead || null,
    compilerReadRanAt: currentVersion?.compilerReadRanAt || null,
    currentVersion: currentVersion || null,
    currentVersionCreatedAt: currentVersion?.createdAt || "",
    versionCount,
    hasPreviousVersion: Boolean(currentVersion?.parentVersionId),
    libraryStatusLabel:
      normalizedDocument.libraryStatus === "library_only" ? "Library only" : normalizedDocument.libraryStatus,
  };
}

async function loadStoredDreamDocument(documentId = "") {
  if (!documentId) return null;

  return withStore("readonly", (store) => new Promise((resolve, reject) => {
    const request = store.get(documentId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () =>
      reject(request.error || new Error("Could not read the Dream Library document."));
  }));
}

async function persistStoredDreamDocument(document = null) {
  const normalizedDocument = normalizeDreamStoredDocument(document);

  await withStore("readwrite", (store) => {
    store.put(normalizedDocument);
  });

  return projectDreamDocument(normalizedDocument);
}

function withUpdatedHeadVersion(document = null, updater = (version) => version) {
  const normalizedDocument = normalizeDreamStoredDocument(document);
  const nextVersions = normalizedDocument.versions.map((version) => {
    if (version.versionId !== normalizedDocument.currentVersionId) {
      return version;
    }
    return normalizeDreamVersion(normalizedDocument.id, updater(version), {
      createdAt: version.createdAt,
      versionId: version.versionId,
    });
  });

  return {
    ...normalizedDocument,
    versions: nextVersions,
  };
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
  return persistStoredDreamDocument(document);
}

export async function listDreamDocuments() {
  return withStore("readonly", (store) => new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const results = Array.isArray(request.result) ? request.result : [];
      resolve(
        results
          .map((document) => projectDreamDocument(document))
          .sort((left, right) => normalizeDocumentSort(right) - normalizeDocumentSort(left)),
      );
    };
    request.onerror = () =>
      reject(request.error || new Error("Could not read Dream Library documents."));
  }));
}

export async function loadDreamDocument(documentId) {
  if (!documentId) return null;
  const document = await loadStoredDreamDocument(documentId);
  return document ? projectDreamDocument(document) : null;
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
  const savedDocument = await saveDreamDocument(document);
  setActiveDreamDocument(savedDocument);
  return savedDocument;
}

export async function createNextDreamDocumentVersion(documentOrId, {
  rawMarkdown = "",
  filename = "",
  sourceKind = "",
} = {}) {
  const documentId =
    typeof documentOrId === "string"
      ? normalizeText(documentOrId)
      : normalizeText(documentOrId?.id);
  const existingDocument =
    typeof documentOrId === "string"
      ? await loadStoredDreamDocument(documentId)
      : documentOrId;

  if (!existingDocument?.id) {
    throw new Error("Library could not find that document.");
  }

  const normalizedDocument = normalizeDreamStoredDocument(existingDocument);
  const currentVersion = getDreamDocumentCurrentVersion(normalizedDocument);
  const createdAt = new Date().toISOString();
  const nextVersion = await buildDreamVersionRecord({
    documentId: normalizedDocument.id,
    rawMarkdown,
    createdAt,
  });

  nextVersion.parentVersionId = currentVersion?.versionId || null;

  return persistStoredDreamDocument({
    ...normalizedDocument,
    filename: normalizeDreamFilename(filename || normalizedDocument.filename, sourceKind || normalizedDocument.sourceKind),
    sourceKind: normalizeDreamSourceKind(sourceKind || normalizedDocument.sourceKind),
    updatedAt: createdAt,
    lastOpenedAt: createdAt,
    currentVersionId: nextVersion.versionId,
    versions: [...normalizedDocument.versions, nextVersion],
  });
}

export async function attachCompilerReadToDreamDocument(documentOrId, compilerRead = null) {
  const documentId =
    typeof documentOrId === "string"
      ? normalizeText(documentOrId)
      : normalizeText(documentOrId?.id);
  const existingDocument =
    typeof documentOrId === "string"
      ? await loadStoredDreamDocument(documentId)
      : documentOrId;

  if (!existingDocument?.id) {
    throw new Error("Library could not find that document.");
  }

  const normalizedDocument = normalizeDreamStoredDocument(existingDocument);
  const currentVersion = getDreamDocumentCurrentVersion(normalizedDocument);
  if (!currentVersion?.versionId) {
    throw new Error("Library could not resolve the current document version.");
  }

  const nextTimestamp = new Date().toISOString();
  const nextDocument = withUpdatedHeadVersion(normalizedDocument, (version) => ({
    ...version,
    updatedAt: nextTimestamp,
    compilerRead: compilerRead
      ? {
          ...compilerRead,
          contentHash: version.contentHash || normalizeText(compilerRead?.contentHash) || null,
        }
      : null,
    compilerReadRanAt: compilerRead ? nextTimestamp : null,
  }));

  return persistStoredDreamDocument({
    ...nextDocument,
    updatedAt: nextTimestamp,
    lastOpenedAt: nextTimestamp,
  });
}

export async function restorePreviousDreamDocumentVersion(documentOrId) {
  const documentId =
    typeof documentOrId === "string"
      ? normalizeText(documentOrId)
      : normalizeText(documentOrId?.id);
  const existingDocument =
    typeof documentOrId === "string"
      ? await loadStoredDreamDocument(documentId)
      : documentOrId;

  if (!existingDocument?.id) {
    throw new Error("Library could not find that document.");
  }

  const normalizedDocument = normalizeDreamStoredDocument(existingDocument);
  const currentVersion = getDreamDocumentCurrentVersion(normalizedDocument);
  if (!currentVersion?.parentVersionId) {
    return projectDreamDocument(normalizedDocument);
  }

  return persistStoredDreamDocument({
    ...normalizedDocument,
    currentVersionId: currentVersion.parentVersionId,
    updatedAt: new Date().toISOString(),
    lastOpenedAt: new Date().toISOString(),
  });
}

export async function updateDreamDocumentProgress(documentOrId, {
  progressMs = 0,
  lastOpenedAt = new Date().toISOString(),
} = {}) {
  const existingDocument =
    typeof documentOrId === "string"
      ? await loadStoredDreamDocument(documentOrId)
      : documentOrId;

  if (!existingDocument?.id) {
    throw new Error("Library could not find that document.");
  }

  const normalizedDocument = normalizeDreamStoredDocument(existingDocument);
  const nextDocument = withUpdatedHeadVersion(normalizedDocument, (version) => ({
    ...version,
    progressMs: Math.max(0, Number(progressMs) || 0),
  }));

  return persistStoredDreamDocument({
    ...nextDocument,
    lastOpenedAt: normalizeIsoDate(lastOpenedAt),
  });
}

export async function getDreamDocumentCurrentVersionContentHash(documentOrId) {
  const document =
    typeof documentOrId === "string"
      ? await loadStoredDreamDocument(documentOrId)
      : documentOrId;
  const currentVersion = document ? getDreamDocumentCurrentVersion(document) : null;
  return normalizeText(currentVersion?.contentHash);
}

export async function clearDreamPersistence() {
  const documents = await listDreamDocuments().catch(() => []);
  await Promise.all(documents.map((document) => deleteDreamDocument(document.id).catch(() => {})));
  clearActiveDreamDocumentRef();
  clearDreamSession();
}
