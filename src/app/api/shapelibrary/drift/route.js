import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const EVALUATE_DIR = path.resolve(process.cwd(), "shapelibrary", "results", "evaluate");

function toTimestamp(fileName = "") {
  const raw = String(fileName).split("_")[0];
  const ms = Date.parse(raw);
  return Number.isNaN(ms) ? 0 : ms;
}

function latestEvaluateResult() {
  if (!fs.existsSync(EVALUATE_DIR)) return null;
  const files = fs
    .readdirSync(EVALUATE_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort((a, b) => toTimestamp(b) - toTimestamp(a));
  const latest = files[0];
  if (!latest) return null;
  const filePath = path.resolve(EVALUATE_DIR, latest);
  try {
    const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return { payload, fileName: latest };
  } catch {
    return null;
  }
}

function inferDriftFlags(value = {}) {
  const flags = [];
  if (!value.releaseGatePass) flags.push("release_gate_blocked");
  if (Number(value.maturationScore || 0) < 0.85) flags.push("maturation_below_target");
  const nearMissByShape = value.nearMissHistogram?.byShape || {};
  const totalNearMisses = Object.values(nearMissByShape).reduce(
    (sum, count) => sum + Number(count || 0),
    0,
  );
  if (totalNearMisses >= 3) flags.push("elevated_near_miss_rate");
  const matchBasisDistribution = value.matchBasisDistribution || {};
  if (
    Object.keys(matchBasisDistribution).length &&
    !Object.prototype.hasOwnProperty.call(matchBasisDistribution, "hybrid_structural_overlap")
  ) {
    flags.push("unexpected_match_basis_mix");
  }
  return flags;
}

export async function GET() {
  const latest = latestEvaluateResult();
  if (!latest) {
    return NextResponse.json({
      ok: true,
      value: {
        reportDate: "",
        releaseGatePass: false,
        maturationScore: 0,
        nearMissHistogram: { byShape: {}, bins: {} },
        matchBasisDistribution: {},
        driftFlags: ["no_evaluate_runs_found"],
      },
    });
  }

  const value = latest.payload?.value || {};
  const report = {
    reportDate: new Date(toTimestamp(latest.fileName)).toISOString(),
    releaseGatePass: Boolean(value.releaseGatePass),
    maturationScore: Number(value.maturationScore || 0),
    nearMissHistogram: value.nearMissHistogram || { byShape: {}, bins: {} },
    matchBasisDistribution: value.matchBasisDistribution || {},
    driftFlags: inferDriftFlags(value),
  };

  return NextResponse.json({ ok: true, value: report });
}
