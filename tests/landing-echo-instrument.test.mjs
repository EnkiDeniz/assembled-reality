import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("landing positions Lakin as echo instrument with four-pane model", async () => {
  const landing = await read("src/components/IntroLanding.jsx");

  assert.match(landing, /Only returned evidence clears fog; mapped regions can become stale without renewed echoes\./);
  assert.match(landing, /title: "Ping"/);
  assert.match(landing, /title: "Listen"/);
  assert.match(landing, /title: "Echoes"/);
  assert.match(landing, /title: "Field"/);
  assert.match(landing, /Did I ping\?/);
  assert.match(landing, /Am I waiting\?/);
  assert.match(landing, /What came back, from where\?/);
  assert.match(landing, /How clear is this region\?/);
  assert.match(landing, /Lakin is an echo instrument for decisions\./);
});
