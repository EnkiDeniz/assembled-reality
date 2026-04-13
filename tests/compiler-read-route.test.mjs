import test from "node:test";
import assert from "node:assert/strict";
import { CompilerReadError } from "../src/lib/compiler-read.js";
import { createCompilerReadHandler } from "../src/app/api/compiler-read/route.js";

function buildRequest(body) {
  return new Request("http://localhost/api/compiler-read", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

test("compiler read route rejects unauthorized requests", async () => {
  const POST = createCompilerReadHandler({
    getSession: async () => null,
    runRead: async () => ({ ok: true }),
  });

  const response = await POST(buildRequest({ documentId: "doc", text: "hello" }));
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Unauthorized" });
});

test("compiler read route rejects missing input", async () => {
  const POST = createCompilerReadHandler({
    getSession: async () => ({ user: { id: "user_1" } }),
    runRead: async () => ({ ok: true }),
  });

  const response = await POST(buildRequest({ documentId: "", text: "" }));
  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.match(payload.error, /Document id is required/);
});

test("compiler read route returns compilerRead payload on success", async () => {
  const compilerRead = {
    documentSummary: { title: "Doc", documentType: "protocol", dominantMode: "proposal", summary: "Summary" },
    claimSet: [],
    loeCandidate: { source: "", translationStrategy: "None", omittedClaims: [] },
    compileResult: {
      executed: true,
      compileState: "clean",
      runtimeState: "open",
      closureType: null,
      mergedWindowState: "open",
      diagnostics: [],
    },
    verdict: { overall: "lawful_subset_compiles", primaryFinding: "Found it.", failureClass: "mixed", readDisposition: "needs_more_witness" },
    nextMoves: ["Add witness."],
  };
  const POST = createCompilerReadHandler({
    getSession: async () => ({ user: { id: "user_1" } }),
    runRead: async () => compilerRead,
  });

  const response = await POST(buildRequest({ documentId: "doc", text: "hello", strictness: "soft" }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, compilerRead });
});

test("compiler read route maps unavailable helper failures to 503", async () => {
  const POST = createCompilerReadHandler({
    getSession: async () => ({ user: { id: "user_1" } }),
    runRead: async () => {
      throw new CompilerReadError("Compiler Read is unavailable right now.", {
        status: 503,
        unavailable: true,
      });
    },
  });

  const response = await POST(buildRequest({ documentId: "doc", text: "hello", strictness: "soft" }));
  assert.equal(response.status, 503);
  const payload = await response.json();
  assert.equal(payload.unavailable, true);
  assert.match(payload.error, /unavailable/i);
});
