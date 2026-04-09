#!/usr/bin/env node
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { compileSource } from "../../../packages/compiler/src/index.mjs";
import {
  appendEvent,
  appendReceipt,
  applyClosureState,
  createWindowState,
} from "../../../packages/runtime/src/index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "../../..");
const STATE_DIR = join(PROJECT_ROOT, ".loe-state");
const FIXTURES_DIR = join(PROJECT_ROOT, "packages/fixtures");

function usage() {
  console.log(`Loegos CLI

Usage:
  loe compile <file.loe> [--json <output.json>]
  loe run <file.loe>
  loe return <file.loe> --verb <verb> --channel <channel> --value <text>
  loe status <file.loe>
  loe fixtures
`);
}

function normalizeFilePath(inputPath = "") {
  const value = String(inputPath || "").trim();
  if (!value) return "";
  return isAbsolute(value) ? value : resolve(process.cwd(), value);
}

function windowIdForPath(filePath) {
  const digest = createHash("sha256").update(filePath, "utf8").digest("hex").slice(0, 16);
  return `win_${digest}`;
}

function stateFileForPath(filePath) {
  return join(STATE_DIR, `${windowIdForPath(filePath)}.json`);
}

async function ensureStateDir() {
  await mkdir(STATE_DIR, { recursive: true });
}

async function readWindowState(filePath) {
  await ensureStateDir();
  const statePath = stateFileForPath(filePath);
  try {
    const text = await readFile(statePath, "utf8");
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function saveWindowState(filePath, state) {
  await ensureStateDir();
  const statePath = stateFileForPath(filePath);
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function readSourceFile(filePath) {
  const text = await readFile(filePath, "utf8");
  return text;
}

function diagnosticsSummaryText(result) {
  return `ok=${result.summary.ok} errors=${result.summary.hardErrorCount} warnings=${result.summary.warningCount}`;
}

function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith("--")) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    flags[key] = next && !next.startsWith("--") ? next : "1";
    if (flags[key] !== "1") i += 1;
  }
  return flags;
}

async function runCompileCommand(fileArg, flags) {
  const filePath = normalizeFilePath(fileArg);
  if (!filePath) throw new Error("compile requires a .loe file path");
  const source = await readSourceFile(filePath);
  const result = compileSource({ source, filename: filePath });
  console.log(JSON.stringify(result, null, 2));
  if (flags.json) {
    const outPath = normalizeFilePath(flags.json);
    await writeFile(outPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    console.log(`\nWrote ${outPath}`);
  }
  if (!result.summary.ok) process.exitCode = 1;
}

async function runRunCommand(fileArg) {
  const filePath = normalizeFilePath(fileArg);
  if (!filePath) throw new Error("run requires a .loe file path");
  const source = await readSourceFile(filePath);
  const result = compileSource({ source, filename: filePath });

  if (!result.summary.ok) {
    console.log(JSON.stringify(result, null, 2));
    console.error("\nRun aborted: compile has hard errors.");
    process.exitCode = 1;
    return;
  }

  let state =
    (await readWindowState(filePath)) ||
    createWindowState({
      windowId: windowIdForPath(filePath),
      filePath,
      compileResult: result,
    });

  state.compile = {
    compilationId: result.compilationId,
    artifactVersion: result.artifactVersion,
    diagnostics: result.diagnostics,
    summary: result.summary,
    closureVerb: result.metadata.activeClosureVerb,
    compileState: result.compileState,
    runtimeState: result.runtimeState,
    mergedWindowState: result.mergedWindowState,
  };
  state.state = result.mergedWindowState || state.state || "open";
  state.updatedAt = new Date().toISOString();

  state = appendEvent(state, {
    eventType: "compile_success",
    payload: {
      compilationId: result.compilationId,
      summary: result.summary,
    },
  });

  if (result.ast.some((clause) => clause.head === "MOV")) {
    state = appendEvent(state, {
      eventType: "move_issued",
      payload: { adapter: "manual" },
    });
  }

  if (result.ast.some((clause) => clause.head === "MOV") && result.ast.some((clause) => clause.head === "TST")) {
    state.state = "awaiting";
  }

  await saveWindowState(filePath, state);
  console.log(
    JSON.stringify(
      {
        windowId: state.windowId,
        filePath,
        state: state.state,
        summary: diagnosticsSummaryText(result),
      },
      null,
      2,
    ),
  );
}

async function runReturnCommand(fileArg, flags) {
  const filePath = normalizeFilePath(fileArg);
  if (!filePath) throw new Error("return requires a .loe file path");
  const verb = String(flags.verb || "receipt").trim();
  const channel = String(flags.channel || "user").trim();
  const value = String(flags.value || "").trim();
  if (!value) throw new Error(`return requires --value`);

  let state = await readWindowState(filePath);
  if (!state) {
    throw new Error("window state not found. Run `loe run <file>` first.");
  }

  const source = await readSourceFile(filePath);
  const result = compileSource({ source, filename: filePath });
  state.compile = {
    compilationId: result.compilationId,
    artifactVersion: result.artifactVersion,
    diagnostics: result.diagnostics,
    summary: result.summary,
    closureVerb: result.metadata.activeClosureVerb,
    compileState: result.compileState,
    runtimeState: result.runtimeState,
    mergedWindowState: result.mergedWindowState,
  };

  state = appendEvent(state, {
    eventType: "return_recorded",
    payload: {
      verb,
      channel,
      value,
    },
  });

  state = appendReceipt(state, {
    returnVerb: verb,
    channel,
    valueText: value,
  });

  state = applyClosureState(state, result.metadata.activeClosureVerb);
  await saveWindowState(filePath, state);
  console.log(
    JSON.stringify(
      {
        windowId: state.windowId,
        state: state.state,
        receipts: state.receipts.length,
      },
      null,
      2,
    ),
  );
}

async function runStatusCommand(fileArg) {
  const filePath = normalizeFilePath(fileArg);
  if (!filePath) throw new Error("status requires a .loe file path");
  const state = await readWindowState(filePath);
  if (!state) {
    console.log(
      JSON.stringify(
        {
          filePath,
          state: "missing",
          note: "No local state yet. Run `loe run <file>` first.",
        },
        null,
        2,
      ),
    );
    return;
  }
  console.log(JSON.stringify(state, null, 2));
}

async function runFixturesCommand() {
  const files = (await readdir(FIXTURES_DIR)).filter((name) => extname(name) === ".loe").sort();
  const results = [];
  for (const file of files) {
    const filePath = join(FIXTURES_DIR, file);
    const source = await readSourceFile(filePath);
    const result = compileSource({ source, filename: filePath });
    results.push({
      fixture: basename(filePath),
      ok: result.summary.ok,
      errors: result.summary.hardErrorCount,
      warnings: result.summary.warningCount,
      codes: result.diagnostics.map((d) => d.code),
    });
  }
  console.log(JSON.stringify(results, null, 2));
  if (results.some((item) => !item.ok)) process.exitCode = 1;
}

async function main() {
  const [, , command, fileArg, ...rest] = process.argv;
  const flags = parseFlags(rest);
  if (!command) {
    usage();
    return;
  }

  if (command === "compile") {
    await runCompileCommand(fileArg, flags);
    return;
  }
  if (command === "run") {
    await runRunCommand(fileArg);
    return;
  }
  if (command === "return") {
    await runReturnCommand(fileArg, flags);
    return;
  }
  if (command === "status") {
    await runStatusCommand(fileArg);
    return;
  }
  if (command === "fixtures") {
    await runFixturesCommand();
    return;
  }

  usage();
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
