function valueEquals(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function jaccardSimilarity(left = "", right = "") {
  const a = new Set(String(left || "").toLowerCase().split(/[^a-z0-9_]+/).filter(Boolean));
  const b = new Set(String(right || "").toLowerCase().split(/[^a-z0-9_]+/).filter(Boolean));
  if (!a.size && !b.size) return 1;
  if (!a.size || !b.size) return 0;
  let overlap = 0;
  for (const token of a) {
    if (b.has(token)) overlap += 1;
  }
  return overlap / (a.size + b.size - overlap);
}

export function computeReproducibility(results = [], invariantSimilarityThreshold = 0.6) {
  if (!Array.isArray(results) || results.length < 2) return 1;
  const anchor = results[0];
  let agreements = 0;
  for (const current of results.slice(1)) {
    const agreesResultType = current.resultType === anchor.resultType;
    const agreesTopShape =
      String(current.shapeIds?.[0] || "") === String(anchor.shapeIds?.[0] || "");
    const agreesGate = valueEquals(current.gate, anchor.gate);
    const agreesGranularity = current.granularity === anchor.granularity;
    const similarity = jaccardSimilarity(
      current.reads?.matchInvariants?.rationale || "",
      anchor.reads?.matchInvariants?.rationale || "",
    );
    const meetsSimilarity = similarity >= invariantSimilarityThreshold;
    if (agreesResultType && agreesTopShape && agreesGate && agreesGranularity && meetsSimilarity) {
      agreements += 1;
    }
  }
  return agreements / Math.max(1, results.length - 1);
}

export function scoreUtility(result = {}) {
  const prediction_clarity = String(result?.discriminatingTest?.observable || "").trim() ? 1 : 0.25;
  const falsifier_quality = String(result?.requiredReceipts?.[0] || "").trim() ? 0.75 : 0.2;
  const repair_actionability = result?.gate?.passed ? 0.7 : 0.55;
  const rejection_specificity =
    result?.resultType === "rejection"
      ? result?.gate?.failures?.length
        ? 1
        : 0.2
      : 0.7;
  return (
    0.25 * prediction_clarity +
    0.25 * falsifier_quality +
    0.25 * repair_actionability +
    0.25 * rejection_specificity
  );
}

/**
 * Compare first analyze outcome to episode.expected (granularity, resultType, shapeIds).
 * Returns null if expected has no comparable fields.
 */
export function scoreExpectedAlignment(run, expected) {
  if (!expected || typeof expected !== "object") return null;
  let hits = 0;
  let total = 0;
  if (expected.granularity != null && String(expected.granularity).length > 0) {
    total += 1;
    if (run.granularity === expected.granularity) hits += 1;
  }
  if (expected.resultType != null && String(expected.resultType).length > 0) {
    total += 1;
    if (run.resultType === expected.resultType) hits += 1;
  }
  if (Array.isArray(expected.shapeIds) && expected.shapeIds.length > 0) {
    total += 1;
    const top = run.shapeIds?.[0];
    if (top && expected.shapeIds.includes(top)) hits += 1;
  }
  return total ? hits / total : null;
}

export function scoreEpisodeQuality(episodes = []) {
  const types = new Set();
  let adversarial = 0;
  let structured = 0;
  for (const episode of episodes) {
    types.add(String(episode?.payload?.granularity || "unknown"));
    if (String(episode?.label || "").toLowerCase().includes("adversarial")) adversarial += 1;
    if (episode?.expected && typeof episode.expected === "object") structured += 1;
  }
  return {
    diversityPass: types.size >= 3,
    adversarialPass: adversarial >= Math.max(2, Math.floor(episodes.length * 0.15)),
    structuredPass: structured === episodes.length,
  };
}
