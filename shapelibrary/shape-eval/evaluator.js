import { normalizeToCanonicalIR } from "../shape-core/translator.js";
import { analyzeCanonicalIR } from "../shape-core/engine.js";
import {
  computeReproducibility,
  scoreEpisodeQuality,
  scoreUtility,
  scoreExpectedAlignment,
  scoreGranularityAlignment,
} from "./metrics.js";

export function evaluateEpisodes({
  episodes = [],
  iterations = 3,
  library = { primitives: [], assemblies: [] },
  features = {},
} = {}) {
  const isCorrectPreScreen = (run) =>
    run?.status === "not_sealable_yet" &&
    (run?.resultType === undefined || run?.resultType === null || run?.resultType === "");

  const episodeReports = [];
  for (const episode of episodes) {
    const runs = [];
    for (let i = 0; i < iterations; i += 1) {
      const ir = normalizeToCanonicalIR({
        ...episode.payload,
        runType: "evaluation",
        metadata: {
          ...(episode.payload?.metadata || {}),
          trace: {
            ...(episode.payload?.metadata?.trace || {}),
            evalIteration: i + 1,
          },
        },
      });
      const analyzed = analyzeCanonicalIR(ir, { library, features });
      if (!analyzed.ok) {
        runs.push({
          resultType: "rejection",
          shapeIds: [],
          gate: { passed: false, failures: [analyzed.error.code], warnings: [] },
          granularity: ir.granularity,
          reads: {},
          discriminatingTest: {
            observable: "n/a",
            expectedOutcomeA: "n/a",
            expectedOutcomeB: "n/a",
            timeWindow: "n/a",
          },
          requiredReceipts: [],
        });
      } else {
        runs.push(analyzed.value);
      }
    }

    const reproducibility = computeReproducibility(runs);
    const utilityScores = runs.map((run) => scoreUtility(run));
    const utilityV01 =
      utilityScores.reduce((sum, value) => sum + value, 0) / Math.max(1, utilityScores.length);

    const lastRun = runs[runs.length - 1];
    const conv = lastRun?.crossDomain?.convergenceScore;
    const utility =
      features.enableCrossDomain && typeof conv === "number" && !Number.isNaN(conv)
        ? Math.min(1, 0.85 * utilityV01 + 0.15 * conv)
        : utilityV01;

    const expectedAlignment = scoreExpectedAlignment(runs[0], episode.expected);
    const granularityAlignment = scoreGranularityAlignment(runs[0], episode.expected);
    const maturationPass = runs.every((run) =>
      isCorrectPreScreen(run) || (run?.maturation?.gate ? run.maturation.gate.passed === true : true),
    );
    const maturationScore = maturationPass ? 1 : 0;
    const episodeHardFailures = [];
    if (String(episode.label || "").toLowerCase().includes("adversarial") && !maturationPass) {
      episodeHardFailures.push("adversarial_maturation_failure");
    }

    episodeReports.push({
      episodeId: episode.episodeId,
      label: episode.label,
      assemblyClass: runs[0]?.assemblyClass || "combinable",
      iterations,
      reproducibility,
      utility,
      utilityV01,
      pass:
        reproducibility >= 0.8 &&
        utility >= 0.5 &&
        maturationPass &&
        episodeHardFailures.length === 0,
      expectedAlignment,
      granularityAlignment,
      maturationPass,
      maturationScore,
      hardFailures: episodeHardFailures,
      runs,
    });
  }

  const reproducibility =
    episodeReports.reduce((sum, report) => sum + report.reproducibility, 0) /
    Math.max(1, episodeReports.length);
  const utilityV01Agg =
    episodeReports.reduce((sum, report) => sum + report.utilityV01, 0) /
    Math.max(1, episodeReports.length);
  const utility =
    episodeReports.reduce((sum, report) => sum + report.utility, 0) /
    Math.max(1, episodeReports.length);
  const maturationScore =
    episodeReports.reduce((sum, report) => sum + report.maturationScore, 0) /
    Math.max(1, episodeReports.length);
  const maturationThreshold = 0.85;
  const maturationPass = maturationScore >= maturationThreshold;
  const quality = scoreEpisodeQuality(episodes);

  const alignments = episodeReports
    .map((r) => r.expectedAlignment)
    .filter((x) => x != null && typeof x === "number");
  const expectedAlignment =
    alignments.length > 0
      ? alignments.reduce((a, b) => a + b, 0) / alignments.length
      : null;
  const granularityAlignments = episodeReports
    .map((r) => r.granularityAlignment)
    .filter((x) => x != null && typeof x === "number");
  const granularityAlignment =
    granularityAlignments.length > 0
      ? granularityAlignments.reduce((a, b) => a + b, 0) / granularityAlignments.length
      : null;

  let convergenceScore = null;
  let domainCoverageCount = 0;
  if (features.enableCrossDomain) {
    const scores = [];
    for (const report of episodeReports) {
      const lr = report.runs[report.runs.length - 1];
      if (lr?.crossDomain && typeof lr.crossDomain.convergenceScore === "number") {
        scores.push(lr.crossDomain.convergenceScore);
      }
      const dc = lr?.crossDomain?.domainCoverageCount;
      if (typeof dc === "number" && dc > domainCoverageCount) domainCoverageCount = dc;
    }
    if (scores.length) convergenceScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  const crossDomainPass =
    !features.enableCrossDomain ||
    convergenceScore == null ||
    convergenceScore >= 0.45 ||
    domainCoverageCount >= 2;

  const hardFailures = Array.from(
    new Set(episodeReports.flatMap((report) => report.hardFailures || [])),
  );

  const releaseGatePass =
    reproducibility >= 0.8 &&
    utility >= 0.5 &&
    maturationPass &&
    hardFailures.length === 0 &&
    quality.diversityPass &&
    quality.adversarialPass &&
    quality.structuredPass &&
    crossDomainPass;

  return {
    reproducibility,
    utility,
    utilityV01: utilityV01Agg,
    thresholds: { reproducibility: 0.8, utility: 0.5 },
    quality,
    releaseGatePass,
    expectedAlignment,
    granularityAlignment,
    convergenceScore,
    domainCoverageCount: domainCoverageCount || 0,
    crossDomainPass,
    maturationScore,
    maturationPass,
    maturationThreshold,
    hardFailures,
    episodes: episodeReports,
  };
}
