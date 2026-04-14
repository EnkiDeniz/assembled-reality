import test from "node:test";
import assert from "node:assert/strict";

import {
  clearCompilerReadSelfCheck,
  loadCompilerReadSelfCheck,
  saveCompilerReadSelfCheck,
} from "../src/lib/compiler-read-self-check.js";

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
  const previousCustomEvent = global.CustomEvent;
  global.window = windowMock;
  if (typeof global.CustomEvent !== "function") {
    global.CustomEvent = class CustomEvent extends Event {
      constructor(type, init = {}) {
        super(type);
        this.detail = init.detail;
      }
    };
  }

  return () => {
    global.window = previousWindow;
    global.CustomEvent = previousCustomEvent;
  };
}

test("clearCompilerReadSelfCheck removes a stored calibration answer", () => {
  const restore = installMockWindow();

  try {
    saveCompilerReadSelfCheck("dream_doc_1", "yes");
    assert.equal(loadCompilerReadSelfCheck("dream_doc_1"), "yes");

    clearCompilerReadSelfCheck("dream_doc_1");
    assert.equal(loadCompilerReadSelfCheck("dream_doc_1"), "");
  } finally {
    restore();
  }
});
