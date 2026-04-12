import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("landing positions Lakin around returned signal and the current hero sequence", async () => {
  const landing = await read("src/components/IntroLanding.jsx");

  assert.match(landing, /Lœgos is an echo instrument for decisions\./);
  assert.match(landing, /Send pings into reality,[\s\S]*navigate only returned signal\./);
  assert.match(landing, /mapped where returns are strong,[\s\S]*stale where surfaces need renewed echoes\./);
  assert.match(landing, /Send a ping\./);
  assert.match(landing, /Wait in listening mode\./);
  assert.match(landing, /Receive echoes\./);
  assert.match(landing, /Navigate the field\./);
  assert.match(landing, /Seven reads signal\. Returns stay attributed\./);
});
