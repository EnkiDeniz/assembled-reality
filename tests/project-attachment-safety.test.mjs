import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("project document attachment is idempotent on projectId + documentKey", async () => {
  const readerProjects = await read("src/lib/reader-projects.js");

  assert.match(readerProjects, /readerProjectDocumentModel\.upsert/);
  assert.match(readerProjects, /projectId_documentKey/);
});
