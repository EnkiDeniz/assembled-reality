import test from "node:test";
import assert from "node:assert/strict";

import {
  attachCompilerReadToDreamDocument,
  clearActiveDreamDocumentRef,
  clearDreamSession,
  createNextDreamDocumentVersion,
  deleteDreamDocument,
  listDreamDocuments,
  loadDreamDocument,
  normalizeDreamStoredDocument,
  projectDreamDocument,
  saveDreamDocument,
  saveDreamSession,
  setActiveDreamDocument,
  restorePreviousDreamDocumentVersion,
} from "../src/lib/dream-storage.js";
import { buildDreamDocumentRecord } from "../src/lib/dream.js";

function installMockWindow() {
  const localStore = new Map();
  const documentStore = new Map();

  function clone(value) {
    return structuredClone(value);
  }

  function makeRequest(produceResult) {
    const request = {
      result: undefined,
      error: null,
      onsuccess: null,
      onerror: null,
    };

    queueMicrotask(() => {
      try {
        request.result = produceResult();
        request.onsuccess?.();
      } catch (error) {
        request.error = error;
        request.onerror?.();
      }
    });

    return request;
  }

  const db = {
    objectStoreNames: {
      contains(name) {
        return name === "documents";
      },
    },
    createObjectStore() {},
    transaction() {
      const transaction = {
        oncomplete: null,
        onerror: null,
        objectStore() {
          return {
            put(value) {
              documentStore.set(value.id, clone(value));
            },
            getAll() {
              return makeRequest(() => Array.from(documentStore.values()).map(clone));
            },
            get(key) {
              return makeRequest(() => (documentStore.has(key) ? clone(documentStore.get(key)) : undefined));
            },
            delete(key) {
              documentStore.delete(key);
            },
          };
        },
      };

      queueMicrotask(() => {
        transaction.oncomplete?.();
      });

      return transaction;
    },
    close() {},
  };

  const windowMock = {
    indexedDB: {
      open() {
        const request = {
          result: db,
          error: null,
          onsuccess: null,
          onerror: null,
          onupgradeneeded: null,
        };

        queueMicrotask(() => {
          request.onupgradeneeded?.();
          request.onsuccess?.();
        });

        return request;
      },
    },
    localStorage: {
      getItem(key) {
        return localStore.has(key) ? localStore.get(key) : null;
      },
      setItem(key, value) {
        localStore.set(key, String(value));
      },
      removeItem(key) {
        localStore.delete(key);
      },
    },
  };

  const previousWindow = global.window;
  global.window = windowMock;

  return () => {
    global.window = previousWindow;
  };
}

test("normalizeDreamStoredDocument wraps a legacy flat document into a version-aware projection", async () => {
  const legacy = await buildDreamDocumentRecord({
    filename: "legacy.md",
    rawMarkdown: "# Legacy\n\nStill a source.",
    sourceKind: "upload",
  });
  delete legacy.versions;
  delete legacy.currentVersionId;
  legacy.compilerRead = {
    verdict: {
      primaryFinding: "Legacy read survives.",
    },
  };
  legacy.compilerReadRanAt = legacy.updatedAt;

  const normalized = normalizeDreamStoredDocument(legacy);
  const projected = projectDreamDocument(legacy);

  assert.equal(normalized.versions.length, 1);
  assert.equal(Boolean(normalized.currentVersionId), true);
  assert.equal(projected.compilerRead?.verdict?.primaryFinding, "Legacy read survives.");
  assert.equal(projected.libraryStatusLabel, "Library only");
});

test("dream storage saves documents, creates new versions, persists compiler reads, and restores previous versions", async () => {
  const restore = installMockWindow();

  try {
    const initial = await buildDreamDocumentRecord({
      filename: "memo.md",
      rawMarkdown: "# Memo\n\nVersion one.",
      sourceKind: "upload",
    });
    const saved = await saveDreamDocument(initial);

    assert.equal(saved.versionCount, 1);
    assert.equal((await listDreamDocuments()).length, 1);

    const nextVersion = await createNextDreamDocumentVersion(saved, {
      rawMarkdown: "# Memo\n\nVersion two.",
      filename: saved.filename,
      sourceKind: saved.sourceKind,
    });

    assert.equal(nextVersion.versionCount, 2);
    assert.equal(nextVersion.hasPreviousVersion, true);
    assert.notEqual(nextVersion.currentVersionId, saved.currentVersionId);

    const withRead = await attachCompilerReadToDreamDocument(nextVersion, {
      verdict: {
        primaryFinding: "Version two has a clearer split.",
        readDisposition: "mixed_needs_more_witness",
      },
      claimSet: [{ id: "claim-1", text: "Carry the split." }],
      nextMoves: ["Test the split in one real memo."],
    });

    assert.equal(withRead.compilerRead?.verdict?.primaryFinding, "Version two has a clearer split.");
    assert.equal(withRead.compilerRead?.contentHash, withRead.contentHash);

    const restored = await restorePreviousDreamDocumentVersion(withRead);
    assert.equal(restored.versionCount, 3);
    assert.equal(restored.hasPreviousVersion, true);
    assert.equal(restored.rawMarkdown.includes("Version one."), true);
    assert.equal(restored.currentVersion?.parentVersionId, withRead.currentVersionId);

    const loaded = await loadDreamDocument(saved.id);
    assert.equal(loaded.rawMarkdown.includes("Version one."), true);
    assert.equal(Array.isArray(loaded.versions), true);
    assert.equal(loaded.versions.length, 3);
  } finally {
    restore();
  }
});

test("deleting from Library removes the document chain and clears active refs and sessions", async () => {
  const restore = installMockWindow();

  try {
    const initial = await buildDreamDocumentRecord({
      filename: "delete-me.md",
      rawMarkdown: "# Delete me\n\nOne source.",
      sourceKind: "upload",
    });
    const saved = await saveDreamDocument(initial);
    setActiveDreamDocument(saved);
    saveDreamSession({ documentId: saved.id, status: "paused" });

    await deleteDreamDocument(saved.id);

    assert.equal(await loadDreamDocument(saved.id), null);
    assert.equal((await listDreamDocuments()).length, 0);
  } finally {
    clearActiveDreamDocumentRef();
    clearDreamSession();
    restore();
  }
});
