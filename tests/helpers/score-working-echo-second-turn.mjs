function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeLower(value = "") {
  return normalizeText(value).toLowerCase();
}

function unique(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => normalizeText(value)).filter(Boolean))];
}

function includesAny(text = "", patterns = []) {
  const haystack = normalizeLower(text);
  return (Array.isArray(patterns) ? patterns : []).some((pattern) => haystack.includes(normalizeLower(pattern)));
}

function inferEvidenceIdsFromText(text = "", evidenceReferenceHints = {}) {
  const normalized = normalizeLower(text);
  const ids = [];

  for (const [evidenceId, hints] of Object.entries(evidenceReferenceHints || {})) {
    if ((Array.isArray(hints) ? hints : []).some((hint) => normalized.includes(normalizeLower(hint)))) {
      ids.push(normalizeText(evidenceId));
    }
  }

  return unique(ids);
}

function countOverlap(left = [], right = []) {
  const leftSet = new Set(unique(left).map((value) => value.toLowerCase()));
  return unique(right).filter((value) => leftSet.has(value.toLowerCase())).length;
}

function parseMoveFamilyHints(text = "") {
  const normalized = normalizeLower(text);
  if (!normalized) return [];

  const hints = [];
  if (/(timestamp|clock|expiry|issued|verifier log|service log)/i.test(text)) {
    hints.push("check_timestamps", "inspect_verifier_logs");
  }
  if (/(safari|segment|cohort)/i.test(text)) {
    hints.push("segment_safari_cohort");
  }
  if (/(avs|postal|post-sms|foreign card|traveler)/i.test(text)) {
    hints.push("inspect_avs_logs", "segment_foreign_card_cohort", "compare_post_sms_handoff");
  }
  if (/(exact drop-off|where is the drop-off|which step)/i.test(text)) {
    hints.push("ask_for_exact_dropoff", "ask_for_checkout_segment");
  }
  if (/(logs|trace|traces)/i.test(text)) {
    hints.push("ask_for_logs", "ask_for_avs_logs", "ask_for_post_sms_trace");
  }
  if (/(traveler|foreign card|segment)/i.test(text)) {
    hints.push("ask_for_safari_segment", "ask_for_traveler_segment");
  }
  if (/(missing witness|full replay|recording|exact step|step breakdown)/i.test(text)) {
    hints.push("ask_for_missing_witness", "ask_for_exact_dropoff");
  }
  if (/(domain verification|quarantined domain|domain logs|company domain)/i.test(text)) {
    hints.push("inspect_domain_logs", "segment_domain_cohort", "ask_for_domain_logs", "ask_for_company_domain_segment");
  }
  if (/(invite failure|invite step|verification trace)/i.test(text)) {
    hints.push("compare_invite_failures", "ask_for_verification_trace");
  }
  if (/(legal review|sso)/i.test(text)) {
    hints.push("ask_for_missing_witness", "ask_for_exact_dropoff");
  }

  return unique(hints);
}

function rejectedCounterfeit(text = "", rejectedClaims = [], shouldResist = []) {
  const haystack = normalizeLower(text);
  const explicit = unique(rejectedClaims)
    .map((claim) => claim.toLowerCase())
    .some((claim) => shouldResist.some((token) => claim.includes(normalizeLower(token))));

  if (explicit) return true;

  return shouldResist.some((token) => {
    const normalizedToken = normalizeLower(token);
    return (
      (haystack.includes(`not ${normalizedToken}`) ||
        haystack.includes(`don't trust ${normalizedToken}`) ||
        haystack.includes(`doesn't prove ${normalizedToken}`) ||
        haystack.includes(`unsupported ${normalizedToken}`) ||
        haystack.includes(`not enough to blame ${normalizedToken}`)) &&
      haystack.includes(normalizedToken)
    );
  });
}

export const SECOND_TURN_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    replyText: { type: "string" },
    referencedEvidenceIds: {
      type: "array",
      items: { type: "string" },
    },
    supportingEvidenceIds: {
      type: "array",
      items: { type: "string" },
    },
    weakeningEvidenceIds: {
      type: "array",
      items: { type: "string" },
    },
    missingEvidenceIds: {
      type: "array",
      items: { type: "string" },
    },
    noticedContradictions: {
      type: "array",
      items: { type: "string" },
    },
    rejectedClaims: {
      type: "array",
      items: { type: "string" },
    },
    chosenMoveFamily: { type: "string" },
    clarifyingMove: { type: "string" },
    returnChangedRead: { type: "string" },
    returnWeakenedRead: { type: "string" },
  },
  required: [
    "replyText",
    "referencedEvidenceIds",
    "supportingEvidenceIds",
    "weakeningEvidenceIds",
    "missingEvidenceIds",
    "noticedContradictions",
    "rejectedClaims",
    "chosenMoveFamily",
    "clarifyingMove",
    "returnChangedRead",
    "returnWeakenedRead",
  ],
};

export function normalizeSecondTurnResponse(payload = null) {
  return {
    replyText: normalizeText(payload?.replyText),
    referencedEvidenceIds: unique(payload?.referencedEvidenceIds),
    supportingEvidenceIds: unique(payload?.supportingEvidenceIds),
    weakeningEvidenceIds: unique(payload?.weakeningEvidenceIds),
    missingEvidenceIds: unique(payload?.missingEvidenceIds),
    noticedContradictions: unique(payload?.noticedContradictions),
    rejectedClaims: unique(payload?.rejectedClaims),
    chosenMoveFamily: normalizeText(payload?.chosenMoveFamily),
    clarifyingMove: normalizeText(payload?.clarifyingMove),
    returnChangedRead: normalizeText(payload?.returnChangedRead),
    returnWeakenedRead: normalizeText(payload?.returnWeakenedRead),
  };
}

export function scoreWorkingEchoSecondTurn(response = null, scenario = null) {
  const normalized = normalizeSecondTurnResponse(response);
  const gold = scenario?.secondTurnGold || {};
  const requiredEvidenceIds = unique(gold?.shouldCarryForwardEvidenceIds);
  const supportingEvidenceIds = unique(gold?.supportingEvidenceIds);
  const weakeningEvidenceIds = unique(gold?.weakeningEvidenceIds);
  const referencedEvidenceIds = unique([
    ...normalized.referencedEvidenceIds,
    ...normalized.supportingEvidenceIds,
    ...normalized.weakeningEvidenceIds,
    ...inferEvidenceIdsFromText(normalized.replyText, gold?.evidenceReferenceHints),
  ]);
  const contradictionHints = unique([
    ...normalized.noticedContradictions,
    ...unique(gold?.shouldNotice).filter((hint) => includesAny(normalized.replyText, [hint])),
  ]);
  const inferredMoveFamilies = parseMoveFamilyHints(normalized.replyText);
  const chosenMoveCandidates = unique([normalized.chosenMoveFamily, normalized.clarifyingMove, ...inferredMoveFamilies]);
  const decidingSplitHints = unique(gold?.decidingSplitHints);
  const missingEvidenceHints = unique(gold?.missingEvidenceHints);
  const returnChangedReadHints = unique(gold?.returnChangedReadHints);
  const returnWeakenedReadHints = unique(gold?.returnWeakenedReadHints);

  const requiredEvidenceOverlap = countOverlap(referencedEvidenceIds, requiredEvidenceIds);
  const supportOverlap = countOverlap(normalized.supportingEvidenceIds, supportingEvidenceIds);
  const weakenOverlap = countOverlap(normalized.weakeningEvidenceIds, weakeningEvidenceIds);
  const contradictionSeen =
    contradictionHints.length > 0 ||
    unique(gold?.shouldNotice).some((hint) => includesAny(normalized.replyText, [hint]));
  const counterfeitRejected = rejectedCounterfeit(
    normalized.replyText,
    normalized.rejectedClaims,
    gold?.shouldResist,
  );
  const repeatedCounterfeit =
    !counterfeitRejected &&
    includesAny(normalized.replyText, gold?.shouldResist) &&
    !/\bnot\b|\bunsupported\b|\bunclear\b|\bdoesn't prove\b/i.test(normalized.replyText);
  const disallowedMove = unique(gold?.disallowedMoveFamilies).some((moveFamily) =>
    chosenMoveCandidates.some((candidate) => normalizeLower(candidate) === normalizeLower(moveFamily)),
  );
  const allowedMove = unique(gold?.allowedMoveFamilies).some((moveFamily) =>
    chosenMoveCandidates.some((candidate) => normalizeLower(candidate) === normalizeLower(moveFamily)),
  );
  const lawfulClarification = unique(gold?.lawfulClarifications).some((clarification) =>
    chosenMoveCandidates.some((candidate) => normalizeLower(candidate) === normalizeLower(clarification)),
  );
  const decidingSplitQuality =
    decidingSplitHints.length === 0
      ? allowedMove || lawfulClarification
        ? 10
        : 0
      : decidingSplitHints.some((hint) => includesAny(normalized.replyText, [hint]))
        ? 10
        : allowedMove || lawfulClarification
          ? 5
          : 0;
  const overclaim =
    /\bdefinitely\b|\bproven\b|\bsettled\b|\broot cause\b|\bfor sure\b/i.test(normalized.replyText) &&
    !/\bnot\b|\bnot yet\b/i.test(normalized.replyText);

  const specificityGain =
    normalized.replyText.length >= 100
      ? 10
      : normalized.replyText.length >= 45
        ? 7
        : normalized.replyText.length >= 20
          ? 4
          : 0;
  const evidenceAlignment =
    requiredEvidenceIds.length === 0
      ? 10
      : requiredEvidenceOverlap >= requiredEvidenceIds.length
        ? 10
        : requiredEvidenceOverlap >= 1
          ? 5
          : 0;
  const contradictionAwareness = contradictionSeen ? 10 : 0;
  const counterfeitResistance = repeatedCounterfeit ? 0 : counterfeitRejected ? 10 : 5;
  const falseForwardAvoidance = !disallowedMove && !overclaim ? 10 : 0;
  const moveReadiness = allowedMove ? 10 : lawfulClarification ? 5 : 0;
  const evidenceDiscriminationQuality =
    !supportingEvidenceIds.length && !weakeningEvidenceIds.length
      ? 10
      : supportOverlap > 0 && weakenOverlap > 0
        ? 10
        : supportOverlap > 0 || weakenOverlap > 0
          ? 5
          : unique(gold?.missingEvidenceHints).some((hint) => includesAny(normalized.replyText, [hint])) &&
              normalized.missingEvidenceIds.length > 0
            ? 5
            : 0;
  const returnUpdateQuality =
    !returnChangedReadHints.length && !returnWeakenedReadHints.length
      ? 10
      : (returnChangedReadHints.some((hint) =>
            includesAny([normalized.replyText, normalized.returnChangedRead].join(" "), [hint]),
          )
        ? 5
        : 0) +
          (returnWeakenedReadHints.some((hint) =>
            includesAny([normalized.replyText, normalized.returnWeakenedRead].join(" "), [hint]),
          )
            ? 5
            : 0);

  return {
    specificityGain,
    evidenceAlignment,
    contradictionAwareness,
    counterfeitResistance,
    falseForwardAvoidance,
    moveReadiness,
    decidingSplitQuality,
    evidenceDiscriminationQuality,
    returnUpdateQuality,
    total:
      specificityGain +
      evidenceAlignment +
      contradictionAwareness +
      counterfeitResistance +
      falseForwardAvoidance +
      moveReadiness +
      decidingSplitQuality +
      evidenceDiscriminationQuality +
      returnUpdateQuality,
    flags: {
      noticedContradiction: contradictionSeen,
      repeatedCounterfeit,
      attemptedPrematureMove: disallowedMove || overclaim,
      referencedRequiredEvidenceIds: referencedEvidenceIds.filter((evidenceId) =>
        requiredEvidenceIds.map((value) => value.toLowerCase()).includes(evidenceId.toLowerCase()),
      ),
      alignedSupportingEvidenceIds: normalized.supportingEvidenceIds.filter((evidenceId) =>
        supportingEvidenceIds.map((value) => value.toLowerCase()).includes(evidenceId.toLowerCase()),
      ),
      alignedWeakeningEvidenceIds: normalized.weakeningEvidenceIds.filter((evidenceId) =>
        weakeningEvidenceIds.map((value) => value.toLowerCase()).includes(evidenceId.toLowerCase()),
      ),
      referencedMissingEvidence: normalized.missingEvidenceIds,
      allowedMove,
      lawfulClarification,
      surfacedDecidingSplit: decidingSplitQuality > 0,
      returnAware: returnUpdateQuality > 0,
    },
  };
}
