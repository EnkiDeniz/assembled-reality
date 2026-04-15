function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function buildClaimHaystack(claim = null) {
  return [
    normalizeText(claim?.text),
    normalizeText(claim?.sourceExcerpt),
    normalizeText(claim?.reason),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function includesPattern(text = "", pattern) {
  return pattern.test(text);
}

const BACKGROUND_FRAMING_PATTERN =
  /\b(a lot of|many (?:online )?businesses|many companies|many [a-z]+ brands|some businesses|pain points identified|lack of|struggle|due to|market-level|broad characterization|generalized observation|common pain point|problem statement|lose conversions)\b/i;
const PRICING_PATTERN =
  /\$\s?\d|\bpricing\b|\bprice\b|\bper month\b|\/m\b|\bretainer\b|\bfee\b|\bbudget\b|\bmonths?\b/i;
const TIMELINE_PATTERN =
  /\bweek\s+\d+\b|\bkick-?off\b|\btimeline\b|\bbi-?weekly\b|\bweekly\b|\bmonthly\b|\bcall\b|\broadmap\b|\bmeeting\b|\blaunch\b|\breview\b/i;
const SERVICE_SCOPE_PATTERN =
  /\b(a\/b tests?|audit|copywriting|reporting|data analysis|ui\/ux|designs?|landing pages?|developers?|cro specialists?|analysts?|marketing experts?|full-stack team|account management|ad management|creatives?|meta audit|heatmap|deliver|provide|provides|conduct|implementation|pipeline|growth plan|team)\b/i;
const OBLIGATION_PATTERN =
  /\bwe expect\b|\bboth parties agree\b|\bwithin\s+\d+\s+hours\b|\bdecision making\b|\bapprove\b|\bcooperate\b|\bkeep each other informed\b|\banswer within\b/i;
const EFFICACY_PATTERN =
  /\b(enhance|increase|improve|grow|drive|ensure|boost|lift|reduce|outperform|optimi[sz]e|better targeting|data-backed growth)\b/i;
const METRIC_PATTERN =
  /\b(roas|cpa|cvr|aov|revenue|mom growth|ltv|conversion(?: rate)?|performance ads?)\b/i;

function isBackgroundFramingClaim(claim = null) {
  const haystack = buildClaimHaystack(claim);
  return (
    includesPattern(haystack, BACKGROUND_FRAMING_PATTERN) ||
    (normalizeText(claim?.claimKind) === "interpretation" &&
      normalizeText(claim?.supportStatus) === "unsupported" &&
      !includesPattern(haystack, SERVICE_SCOPE_PATTERN) &&
      !includesPattern(haystack, PRICING_PATTERN) &&
      !includesPattern(haystack, TIMELINE_PATTERN) &&
      !includesPattern(haystack, OBLIGATION_PATTERN) &&
      !includesPattern(haystack, EFFICACY_PATTERN) &&
      !includesPattern(haystack, METRIC_PATTERN))
  );
}

function isSupportedOfferTerm(claim = null) {
  const haystack = buildClaimHaystack(claim);
  if (!haystack) return false;
  if (isBackgroundFramingClaim(claim)) return false;

  if (
    includesPattern(haystack, PRICING_PATTERN) ||
    includesPattern(haystack, TIMELINE_PATTERN) ||
    includesPattern(haystack, SERVICE_SCOPE_PATTERN) ||
    includesPattern(haystack, OBLIGATION_PATTERN)
  ) {
    return true;
  }

  return (
    normalizeText(claim?.claimKind) === "ground" &&
    normalizeText(claim?.supportStatus) !== "unsupported"
  );
}

function isUnsupportedEfficacyClaim(claim = null) {
  const haystack = buildClaimHaystack(claim);
  if (!haystack || isBackgroundFramingClaim(claim)) return false;
  if (isSupportedOfferTerm(claim)) {
    const outcomeVerb = includesPattern(haystack, EFFICACY_PATTERN);
    const metricSignal = includesPattern(haystack, METRIC_PATTERN);
    const offerVerb = includesPattern(haystack, SERVICE_SCOPE_PATTERN);
    return outcomeVerb && metricSignal && !offerVerb;
  }

  return (
    includesPattern(haystack, EFFICACY_PATTERN) ||
    includesPattern(haystack, METRIC_PATTERN) ||
    ["protocol", "testable_hypothesis"].includes(normalizeText(claim?.claimKind))
  );
}

function uniqueClaims(claims = []) {
  const seen = new Set();
  return (Array.isArray(claims) ? claims : []).filter((claim) => {
    const id = normalizeText(claim?.id);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function buildMissingDecisionWitness({
  supportedOfferTerms = [],
  unsupportedEfficacyClaims = [],
} = {}) {
  const items = [];
  const supportedHaystack = supportedOfferTerms.map((claim) => buildClaimHaystack(claim)).join(" ");
  const efficacyHaystack = unsupportedEfficacyClaims.map((claim) => buildClaimHaystack(claim)).join(" ");
  const combinedHaystack = `${supportedHaystack} ${efficacyHaystack}`.trim();

  if (unsupportedEfficacyClaims.length) {
    items.push("Add one quoted case study, testimonial, or external citation for the proposal’s central promised outcome.");
  }

  if (includesPattern(combinedHaystack, METRIC_PATTERN)) {
    items.push("Add baseline metrics, target math, and success thresholds for the performance metrics this proposal promises to move.");
  }

  const hasCadenceOrApproval =
    includesPattern(supportedHaystack, TIMELINE_PATTERN) || includesPattern(supportedHaystack, OBLIGATION_PATTERN);
  if (!hasCadenceOrApproval || unsupportedEfficacyClaims.length) {
    items.push("Name the decision owner, approval path, and what happens if early tests underperform.");
  }

  return items.slice(0, 3);
}

export function buildCompilerReadReview(compilerRead = null) {
  const documentType = normalizeText(compilerRead?.documentSummary?.documentType).toLowerCase();
  const claimSet = Array.isArray(compilerRead?.claimSet) ? compilerRead.claimSet : [];

  if (documentType !== "proposal") {
    return {
      isProposal: false,
      supportedOfferTerms: [],
      unsupportedEfficacyClaims: [],
      backgroundFraming: [],
      missingDecisionWitness: [],
    };
  }

  const supportedOfferTerms = [];
  const unsupportedEfficacyClaims = [];
  const backgroundFraming = [];

  claimSet.forEach((claim) => {
    if (isBackgroundFramingClaim(claim)) {
      backgroundFraming.push(claim);
      return;
    }

    if (isSupportedOfferTerm(claim)) {
      supportedOfferTerms.push(claim);
      return;
    }

    if (isUnsupportedEfficacyClaim(claim)) {
      unsupportedEfficacyClaims.push(claim);
      return;
    }

    backgroundFraming.push(claim);
  });

  return {
    isProposal: true,
    supportedOfferTerms: uniqueClaims(supportedOfferTerms),
    unsupportedEfficacyClaims: uniqueClaims(unsupportedEfficacyClaims),
    backgroundFraming: uniqueClaims(backgroundFraming),
    missingDecisionWitness: buildMissingDecisionWitness({
      supportedOfferTerms,
      unsupportedEfficacyClaims,
    }),
  };
}

export function isProposalCompilerRead(compilerRead = null) {
  return Boolean(buildCompilerReadReview(compilerRead).isProposal);
}
