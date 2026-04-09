import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import { compileSource } from "../src/index.mjs";

function readJson(relativePath) {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), "utf8"));
}

test("compile output satisfies compile-report schema contract", () => {
  const schema = readJson("../../schemas/compile-report.schema.json");
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  const artifact = compileSource({
    filename: "schema-contract.loe",
    source: `GND box @schema_window
DIR aim lock_contract
GND witness @spec from "spec.md" with v_phase2
MOV move run_contract_check via manual
TST test schema_validate
`,
  });

  const valid = validate(artifact);
  assert.equal(valid, true, JSON.stringify(validate.errors, null, 2));
});
