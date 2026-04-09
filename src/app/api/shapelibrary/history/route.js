import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ROOT = path.resolve(process.cwd(), "shapelibrary", "results");
const KINDS = ["analyze", "evaluate", "promote"];
const MAX_FILES_PER_KIND = 12;
const MAX_FILE_BYTES = 1_500_000;

function safeReadJson(filePath) {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size > MAX_FILE_BYTES) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function toTimestamp(fileName = "") {
  const raw = String(fileName).split("_")[0];
  const ms = Date.parse(raw);
  return Number.isNaN(ms) ? 0 : ms;
}

function summarize(kind, payload) {
  const value = payload?.value || {};
  if (kind === "analyze") {
    return {
      status: value.status || value.resultType || "unknown",
      assemblyClass: value.assemblyClass || "",
      resultType: value.resultType || value.status || "",
    };
  }
  if (kind === "evaluate") {
    return {
      status: value.releaseGatePass ? "release_gate_pass" : "release_gate_blocked",
      assemblyClass: "",
      resultType: `maturation:${value.maturationScore ?? "n/a"}`,
    };
  }
  return {
    status: value.approved ? "promoted" : "blocked",
    assemblyClass: value.assemblyClass || "",
    resultType: value.targetType || "",
  };
}

function listHistoryEntries() {
  const entries = [];
  for (const kind of KINDS) {
    const dir = path.resolve(ROOT, kind);
    if (!fs.existsSync(dir)) continue;
    const files = fs
      .readdirSync(dir)
      .filter((name) => name.endsWith(".json"))
      .sort((a, b) => toTimestamp(b) - toTimestamp(a))
      .slice(0, MAX_FILES_PER_KIND);
    for (const fileName of files) {
      const filePath = path.resolve(dir, fileName);
      const payload = safeReadJson(filePath);
      if (!payload) continue;
      entries.push({
        id: `${kind}:${fileName}`,
        kind,
        fileName,
        timestamp: toTimestamp(fileName),
        ...summarize(kind, payload),
        payload: { value: payload?.value || {} },
      });
    }
  }
  return entries.sort((a, b) => b.timestamp - a.timestamp);
}

export async function GET() {
  const entries = listHistoryEntries();
  return NextResponse.json({ ok: true, value: entries });
}
