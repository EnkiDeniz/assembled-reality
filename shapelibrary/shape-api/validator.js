import fs from "node:fs";
import path from "node:path";
import Ajv from "ajv";
import { ERROR_CODES } from "../shape-core/contracts.js";
import { validateMythPayload } from "../shape-core/myth.js";

const ajv = new Ajv({ allErrors: true, strict: false });

function readJson(fileName) {
  const filePath = path.resolve(process.cwd(), "schema", fileName);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const validators = {
  ir: ajv.compile(readJson("ir.schema.json")),
  analyzeResult: ajv.compile(readJson("analyze-result.schema.json")),
  evaluateResult: ajv.compile(readJson("evaluate-result.schema.json")),
  promote: ajv.compile(readJson("promote.schema.json")),
  bat: ajv.compile(readJson("bat.schema.json")),
};

export function validateIR(ir) {
  const valid = validators.ir(ir);
  if (valid) return { ok: true };
  return {
    ok: false,
    error: {
      code: ERROR_CODES.INVALID_INPUT,
      message: "IR validation failed",
      details: validators.ir.errors || [],
    },
  };
}

/** When myth mode is enabled, require myth decomposition fields (v0.2). */
export function validateMythIrSemantics(ir, features = {}) {
  if (!features.enableMyth || ir.inputMode !== "myth") return { ok: true };
  const r = validateMythPayload(ir);
  if (r.ok) return { ok: true };
  return {
    ok: false,
    error: {
      code: ERROR_CODES.INVALID_INPUT,
      message: r.message,
      details: [],
    },
  };
}

export function validatePromote(payload) {
  const valid = validators.promote(payload);
  if (valid) return { ok: true };
  return {
    ok: false,
    error: {
      code: ERROR_CODES.INVALID_INPUT,
      message: "Promotion request validation failed",
      details: validators.promote.errors || [],
    },
  };
}

export function assertAnalyzeResultShape(result) {
  return validators.analyzeResult(result);
}

export function assertEvaluateResultShape(result) {
  return validators.evaluateResult(result);
}

export function assertBatShape(result) {
  return validators.bat(result);
}
