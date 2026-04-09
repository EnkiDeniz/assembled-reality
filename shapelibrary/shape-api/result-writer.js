import fs from "node:fs";
import path from "node:path";

function exportEnabled() {
  const flag = String(process.env.SHAPELIBRARY_EXPORT_RESULTS ?? "1").toLowerCase();
  return flag !== "0" && flag !== "false" && flag !== "off";
}

export function getResultsRoot() {
  const dir = process.env.SHAPELIBRARY_RESULTS_DIR || "results";
  return path.resolve(process.cwd(), dir);
}

function safeTimestamp() {
  return new Date().toISOString().replace(/:/g, "-");
}

function writeJson(subdir, baseName, document) {
  if (!exportEnabled()) return null;
  const root = getResultsRoot();
  const dir = path.join(root, subdir);
  fs.mkdirSync(dir, { recursive: true });
  const fileName = `${safeTimestamp()}_${baseName}.json`;
  const filePath = path.join(dir, fileName);
  const payload = {
    exportedAt: new Date().toISOString(),
    resultsRoot: root,
    relativePath: path.join(subdir, fileName),
    ...document,
  };
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return filePath;
}

export function exportAnalyzeSuccess({ ir, value }) {
  const runId = String(value?.runId || ir?.runId || "unknown").replace(/[^\w-]/g, "_");
  return writeJson("analyze", `analyze_ok_${runId}`, {
    kind: "analyze",
    ok: true,
    ir,
    value,
  });
}

export function exportAnalyzeError({ ir, code, message, details }) {
  const runId = String(ir?.runId || "unknown").replace(/[^\w-]/g, "_");
  const slug =
    code === "invalid_input"
      ? "invalid_input"
      : code === "invalid_layer_execution"
        ? "invalid_layer"
        : code === "gate_failed"
          ? "gate_failed"
          : "error";
  return writeJson("analyze", `analyze_${slug}_${runId}`, {
    kind: "analyze",
    ok: false,
    error: { code, message, details },
    ir,
  });
}

export function exportEvaluateSuccess({ requestBody, value }) {
  return writeJson("evaluate", "evaluate_run", {
    kind: "evaluate",
    ok: true,
    request: {
      iterations: requestBody?.iterations,
      episodeCount: Array.isArray(requestBody?.episodes) ? requestBody.episodes.length : null,
    },
    value,
  });
}

export function exportPromoteSuccess({ requestBody, value }) {
  const id = String(value?.decisionId || "unknown").replace(/[^\w-]/g, "_");
  return writeJson("promote", `promote_${id}`, {
    kind: "promote",
    ok: true,
    request: {
      candidateId: requestBody?.candidateId,
      targetType: requestBody?.targetType,
      reproducibility: requestBody?.reproducibility,
      utility: requestBody?.utility,
      nonAdditive: requestBody?.nonAdditive,
      newFailureSignature: requestBody?.newFailureSignature,
      newTransferPrediction: requestBody?.newTransferPrediction,
    },
    value,
  });
}

export function exportPromoteBlocked({ requestBody, code, message }) {
  const cid = String(requestBody?.candidateId || "unknown").replace(/[^\w-]/g, "_");
  return writeJson("promote", `promote_blocked_${cid}`, {
    kind: "promote",
    ok: false,
    error: { code, message },
    request: requestBody,
  });
}
