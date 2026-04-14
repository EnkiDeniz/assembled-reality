import test from "node:test";
import assert from "node:assert/strict";

import {
  clearRuntimeSurfaceResumeLibrary,
  loadRuntimeSurfaceResumeState,
  saveRuntimeSurfaceResumeState,
} from "../src/lib/runtime-surface-resume.js";

function installMockWindow() {
  const store = new Map();
  const target = new EventTarget();
  const windowMock = Object.assign(target, {
    localStorage: {
      getItem(key) {
        return store.has(key) ? store.get(key) : null;
      },
      setItem(key, value) {
        store.set(key, String(value));
      },
      removeItem(key) {
        store.delete(key);
      },
    },
  });

  const previousWindow = global.window;
  global.window = windowMock;

  return () => {
    global.window = previousWindow;
  };
}

test("clearRuntimeSurfaceResumeLibrary preserves room state while removing stale library state", () => {
  const restore = installMockWindow();

  try {
    saveRuntimeSurfaceResumeState({
      surface: "dream",
      room: {
        projectKey: "alpha-box",
        sessionId: "session_alpha",
        title: "Conversation",
        updatedAt: "2026-04-14T12:00:00.000Z",
      },
      library: {
        documentId: "dream_doc_1",
        title: "Field Notes",
        anchor: "block_1",
        updatedAt: "2026-04-14T12:05:00.000Z",
      },
    });

    clearRuntimeSurfaceResumeLibrary();

    const state = loadRuntimeSurfaceResumeState();
    assert.equal(state.room.projectKey, "alpha-box");
    assert.equal(state.room.sessionId, "session_alpha");
    assert.equal(state.library, null);
  } finally {
    restore();
  }
});
