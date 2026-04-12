function normalizeText(value = "") {
  return String(value || "")
    .replace(/\\n/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clipText(value = "", max = 220) {
  const normalized = normalizeText(value);
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function lowerFirst(value = "") {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  return normalized.charAt(0).toLowerCase() + normalized.slice(1);
}

function slugify(value = "") {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "item";
}

function uniqueBy(values = [], keyFn = (value) => value) {
  const seen = new Set();
  const result = [];

  for (const value of Array.isArray(values) ? values : []) {
    const key = normalizeText(keyFn(value)).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }

  return result;
}

function buildSourceRef(kind = "", value = "") {
  const normalizedKind = normalizeText(kind).toLowerCase() || "ref";
  const normalizedValue = clipText(value, 80);
  return normalizedValue ? `${normalizedKind}:${normalizedValue}` : "";
}

function isInternalSystemText(value = "") {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) return false;
  return (
    /fix shape violations/.test(normalized) ||
    /retry the loop/.test(normalized) ||
    /program has no declared aim/.test(normalized) ||
    /shape violation/.test(normalized) ||
    /compiler/.test(normalized) ||
    /compile state/.test(normalized)
  );
}

function getLastAssistantMessage(messages = []) {
  return [...(Array.isArray(messages) ? messages : [])]
    .reverse()
    .find((message) => normalizeText(message?.role).toLowerCase() === "assistant") || null;
}

function normalizeSegment(segment = {}, index = 0) {
  return {
    id: normalizeText(segment?.id) || `segment_${index + 1}`,
    text: clipText(segment?.text, 220),
    mirrorRegion: normalizeText(segment?.mirrorRegion).toLowerCase() || "other",
    domain: normalizeText(segment?.domain).toLowerCase() || "other",
    suggestedClause: clipText(segment?.suggestedClause, 220),
  };
}

function collectSegments({ canonicalView = null, messages = [] } = {}) {
  const lastAssistant = getLastAssistantMessage(messages);
  const lastAssistantSegments = Array.isArray(lastAssistant?.roomPayload?.segments)
    ? lastAssistant.roomPayload.segments.map(normalizeSegment)
    : [];
  const activePreviewSegments = Array.isArray(canonicalView?.activePreview?.segments)
    ? canonicalView.activePreview.segments.map(normalizeSegment)
    : [];

  return uniqueBy(
    [...lastAssistantSegments, ...activePreviewSegments].filter(
      (segment) => normalizeText(segment?.text) || normalizeText(segment?.suggestedClause),
    ),
    (segment) => `${segment.id}:${segment.text}:${segment.mirrorRegion}`,
  );
}

function extractEvidenceHandle(...values) {
  for (const value of values) {
    const match = normalizeText(value).match(/\b(E\d+)\b/i);
    if (match) return match[1].toUpperCase();
  }
  return "";
}

function buildAim({ canonicalView = null, segments = [] } = {}) {
  const aimSegment = segments.find((segment) => segment.mirrorRegion === "aim");
  const candidates = [
    {
      text: normalizeText(canonicalView?.interaction?.aim?.text || canonicalView?.interaction?.aim),
      source: "lawful_artifact",
      sourceRefs: [buildSourceRef("interaction", "aim")],
    },
    {
      text: normalizeText(canonicalView?.mirror?.aim?.text),
      source: "lawful_artifact",
      sourceRefs: [buildSourceRef("mirror", "aim")],
    },
    {
      text: normalizeText(canonicalView?.activePreview?.sections?.aim?.text),
      source: "bounded_provisional_state",
      sourceRefs: [buildSourceRef("preview", canonicalView?.activePreview?.assistantMessageId || "aim")],
    },
    {
      text: normalizeText(aimSegment?.text),
      source: "bounded_provisional_state",
      sourceRefs: [buildSourceRef("segment", aimSegment?.id)],
    },
  ].filter((candidate) => candidate.text);

  if (!candidates.length) return null;

  return {
    text: candidates[0].text,
    source: candidates[0].source,
    sourceRefs: uniqueBy(candidates.flatMap((candidate) => candidate.sourceRefs).filter(Boolean)),
  };
}

function buildEvidenceItem({
  id = "",
  title = "",
  detail = "",
  sourceKind = "",
  weight = "primary",
  sourceRefs = [],
} = {}) {
  const normalizedTitle = clipText(title, 72);
  const normalizedDetail = clipText(detail, 140);
  if (!normalizedTitle && !normalizedDetail) return null;

  return {
    id: normalizeText(id) || extractEvidenceHandle(normalizedTitle, normalizedDetail) || slugify(normalizedTitle || normalizedDetail),
    title: normalizedTitle || clipText(normalizedDetail, 72),
    detail: normalizedDetail,
    sourceKind: normalizeText(sourceKind) || "recent_source",
    weight: normalizeText(weight) || "primary",
    sourceRefs: uniqueBy((Array.isArray(sourceRefs) ? sourceRefs : []).filter(Boolean)),
  };
}

function buildEvidenceFromSegments(segments = []) {
  return segments
    .filter((segment) => segment.mirrorRegion === "evidence" && normalizeText(segment?.text))
    .map((segment, index) =>
      buildEvidenceItem({
        id: extractEvidenceHandle(segment.text, segment.id) || segment.id || `evidence_${index + 1}`,
        title: segment.text,
        detail: "",
        sourceKind: "conversation_observation",
        weight: "primary",
        sourceRefs: [buildSourceRef("segment", segment.id)].filter(Boolean),
      }),
    )
    .filter(Boolean);
}

function buildEvidenceFromFocusedWitness(focusedWitness = null) {
  if (!focusedWitness) return [];
  const blocks = Array.isArray(focusedWitness?.excerptBlocks) ? focusedWitness.excerptBlocks : [];
  return blocks
    .filter((block) => normalizeText(block?.text))
    .slice(0, 2)
    .map((block, index) =>
      buildEvidenceItem({
        id:
          extractEvidenceHandle(focusedWitness?.title, block?.text, block?.id) ||
          normalizeText(block?.id) ||
          `focused_witness_${index + 1}`,
        title: focusedWitness?.title || `Witness ${index + 1}`,
        detail: block.text,
        sourceKind: "focused_witness",
        weight: index === 0 ? "primary" : "secondary",
        sourceRefs: [
          buildSourceRef("witness", focusedWitness?.documentKey || focusedWitness?.title),
          buildSourceRef("block", block?.id || `${index + 1}`),
        ].filter(Boolean),
      }),
    )
    .filter(Boolean);
}

function buildEvidenceFromRecentSources(recentSources = []) {
  return (Array.isArray(recentSources) ? recentSources : [])
    .filter((source) => normalizeText(source?.title) || normalizeText(source?.operateSummary))
    .slice(0, 4)
    .map((source, index) =>
      buildEvidenceItem({
        id:
          extractEvidenceHandle(source?.title, source?.operateSummary, source?.documentKey, source?.id) ||
          normalizeText(source?.documentKey || source?.id) ||
          `recent_source_${index + 1}`,
        title: source?.title || source?.metaLine || "Recent source",
        detail: source?.operateSummary || source?.metaLine || "",
        sourceKind: "recent_source",
        weight: index === 0 ? "primary" : "secondary",
        sourceRefs: [buildSourceRef("source", source?.documentKey || source?.id || source?.title)].filter(Boolean),
      }),
    )
    .filter(Boolean);
}

function buildEvidenceCarried({ segments = [], focusedWitness = null, recentSources = [] } = {}) {
  const evidence = [
    ...buildEvidenceFromSegments(segments),
    ...buildEvidenceFromFocusedWitness(focusedWitness),
    ...buildEvidenceFromRecentSources(recentSources),
  ];

  return uniqueBy(evidence, (item) => `${item.id}:${item.title}:${item.detail}`).slice(0, 6);
}

function buildOpenTension({ segments = [], assistantText = "", canonicalView = null } = {}) {
  const segmentTension = segments
    .filter((segment) => ["story", "returns"].includes(segment.mirrorRegion) && normalizeText(segment?.text))
    .map((segment, index) => ({
      id: segment.id || `tension_${index + 1}`,
      text: segment.text,
      kind:
        /conflict|contradict|counterfeit|unsupported|not enough/i.test(segment.text)
          ? "contradiction"
          : /missing|need more|unclear|unknown/i.test(segment.text)
            ? "missing_witness"
            : "uncertainty",
      sourceRefs: uniqueBy([buildSourceRef("segment", segment.id)].filter(Boolean)),
    }));

  const gateReason = normalizeText(canonicalView?.activePreview?.gatePreview?.reason);
  const gateTension = gateReason
    ? !isInternalSystemText(gateReason)
      ? [
          {
            id: "gate_tension",
            text: gateReason,
            kind: /reject|block|unsupported|requires/i.test(gateReason) ? "counterfeit_risk" : "uncertainty",
            sourceRefs: uniqueBy(
              [buildSourceRef("preview", canonicalView?.activePreview?.assistantMessageId)].filter(Boolean),
            ),
          },
        ]
      : []
    : [];

  const assistantQuestion =
    normalizeText(assistantText).includes("?") && !segmentTension.length
      ? [
          {
            id: "assistant_question_tension",
            text: clipText(assistantText, 140),
            kind: "uncertainty",
            sourceRefs: uniqueBy([buildSourceRef("assistant", "latest_turn")]),
          },
        ]
      : [];

  return uniqueBy([...segmentTension, ...gateTension, ...assistantQuestion], (item) => item.id || item.text).slice(0, 4);
}

function inferDecidingKind(text = "") {
  const normalized = normalizeText(text).toLowerCase();
  if (/first|before|after|timeline|when|date|expiry|timestamp/.test(normalized)) return "timeline";
  if (/diverg|split|where.*split|which changed first/.test(normalized)) return "first_divergence";
  if (/rollout|cohort|segment|traveler|safari|foreign card|domain/.test(normalized)) return "cohort_split";
  if (/compare|vs|against|baseline/.test(normalized)) return "compare";
  if (/log|trace|replay|inspect|check|verification/.test(normalized)) return "log_check";
  if (/capture|missing witness|step|full replay/.test(normalized)) return "capture_missing_witness";
  return "compare";
}

function extractQuestionSentence(text = "") {
  const normalized = normalizeText(text);
  if (!normalized) return "";
  const questionSentence = normalized
    .split(/(?<=[?.!])\s+/)
    .find((sentence) => sentence.includes("?"));
  return clipText(questionSentence || "", 140);
}

function isGenericDecisionText(text = "") {
  const normalized = normalizeText(text).toLowerCase();
  if (!normalized) return true;
  return (
    /^ask:\s*what else changed/.test(normalized) ||
    /^ask:\s*what changed before/.test(normalized) ||
    /^ask:\s*which path failed most/.test(normalized) ||
    /^ask for more info/.test(normalized) ||
    /^ask for logs/.test(normalized) ||
    /^need more signal/.test(normalized) ||
    /^wait for/.test(normalized) ||
    /^check the logs/.test(normalized) ||
    /^compare the evidence/.test(normalized) ||
    /^what else changed/.test(normalized) ||
    /^what changed before/.test(normalized) ||
    /^which path failed most/.test(normalized) ||
    /^what breaks after sms/.test(normalized) ||
    /^ask:\s*what breaks after sms/.test(normalized) ||
    normalized === "what matters next?"
  );
}

function inferDecisionSplitFromEvidence({ evidenceCarried = [], openTension = [], assistantText = "", fieldState = "" } = {}) {
  const corpus = normalizeText(
    [
      assistantText,
      ...evidenceCarried.flatMap((item) => [item?.title, item?.detail]),
      ...openTension.map((item) => item?.text),
    ].join(" "),
  ).toLowerCase();

  if (normalizeText(fieldState).toLowerCase() === "awaiting") {
    return {
      text: "Which return would actually settle the leading read?",
      kind: "compare",
    };
  }

  if (/clock|expired|expiry|verifier|safari/.test(corpus)) {
    return {
      text: "Which split decides it: clock-skew expiry on affected Safari sessions, or a later blocker that only looks related?",
      kind: "timeline",
    };
  }

  if (/avs|postal|foreign card|traveler|sms|cta copy|cta/.test(corpus)) {
    return {
      text: "Which post-SMS split decides it: AVS mismatch in foreign-card travelers, or CTA exposure that only looks correlated?",
      kind: "cohort_split",
    };
  }

  if (/pricing|annual-plan|legal review|security addendum|sso/.test(corpus)) {
    return {
      text: "Which missing witness decides it: one step-level replay for a failed trial, or a breakdown showing whether legal review, SSO setup, or pricing exposure diverged first?",
      kind: "first_divergence",
    };
  }

  if (/domain verification|dmarc|quarantined|company domains|invite teammate/.test(corpus)) {
    return {
      text: "Does the failure track copy exposure, or domain-verification errors in quarantined company domains?",
      kind: "cohort_split",
    };
  }

  return {
    text: "Which named witness or log would separate the leading read from the popular blame story?",
    kind: "compare",
  };
}

function buildWhatWouldDecideIt({ segments = [], assistantText = "", canonicalView = null, evidenceCarried = [], openTension = [] } = {}) {
  const moveSegment =
    segments.find(
      (segment) =>
        segment.mirrorRegion === "moves" &&
        normalizeText(segment?.text) &&
        !isInternalSystemText(segment?.text),
    ) || null;
  const pendingMoveText = [canonicalView?.pendingMove?.text, canonicalView?.interaction?.nextBestAction]
    .map((value) => normalizeText(value))
    .find((value) => value && !isInternalSystemText(value)) || "";
  const fieldState = normalizeText(canonicalView?.fieldState?.key || canonicalView?.fieldState?.label).toLowerCase();
  const questionSentence = extractQuestionSentence(assistantText);
  const fallback = inferDecisionSplitFromEvidence({
    evidenceCarried,
    openTension,
    assistantText,
    fieldState,
  });
  const rawText =
    normalizeText(moveSegment?.text) ||
    pendingMoveText ||
    questionSentence ||
    fallback.text;
  const text = isGenericDecisionText(rawText) ? fallback.text : rawText;

  return {
    text: clipText(text, 180),
    kind: inferDecidingKind(text) || fallback.kind,
    sourceRefs: uniqueBy(
      [
        buildSourceRef("segment", moveSegment?.id),
        buildSourceRef("pending_move", canonicalView?.pendingMove?.id || canonicalView?.pendingMove?.text),
        buildSourceRef("assistant", questionSentence ? "latest_turn" : ""),
      ].filter(Boolean),
    ),
  };
}

function evidenceText(item = null) {
  return normalizeText([item?.title, item?.detail].filter(Boolean).join(" "));
}

function supportSignalScore(text = "") {
  const normalized = normalizeText(text).toLowerCase();
  let score = 0;
  if (
    /dashboard|shows|cluster|concentrated|cohort|device clock|expired|mismatch|quarantine|retries|server-side|client-side|foreign cards|travelers|fails later|after sms|verification/.test(
      normalized,
    )
  ) {
    score += 2;
  }
  if (/replay|trace|support ticket|ops logs|report|manual replay|funnel snapshot/.test(normalized)) {
    score += 1;
  }
  if (/time zone|47 minutes|postal|dmarc|domain could not be verified|stuck during sso/.test(normalized)) {
    score += 1;
  }
  return score;
}

function weakeningSignalScore(text = "") {
  const normalized = normalizeText(text).toLowerCase();
  let score = 0;
  if (
    /unsupported|no linked evidence|no evidence|does not request|still fails|older copy still failing|same cta copy|stays flat|different later blocker|did not solve|never opened pricing|no replay|does not break.*down/.test(
      normalized,
    )
  ) {
    score += 3;
  }
  if (/support note|internal note|internal slack|ops claim|definitely/.test(normalized)) {
    score += 2;
  }
  if (/old copy|same checkpoint|after .* fix|later stage blocker|flat/.test(normalized)) {
    score += 1;
  }
  return score;
}

function buildEvidenceBuckets({ evidenceCarried = [], whatWouldDecideIt = null } = {}) {
  const supports = [];
  const weakens = [];

  for (const item of Array.isArray(evidenceCarried) ? evidenceCarried : []) {
    const text = evidenceText(item);
    const supportScore = supportSignalScore(text);
    const weakenScore = weakeningSignalScore(text);
    const normalized = text.toLowerCase();
    const namesConcreteWitness =
      /legal review|security addendum|procurement|sso setup|domain could not be verified|invite teammate|avs|postal|clock|expired|billing country mismatch|foreign card|traveler|after sms|later on/.test(
        normalized,
      );
    const isThinOrUnsupported =
      /unsupported|no linked evidence|no evidence|internal note|slack note|support note says|definitely|does not break.*down|no replay|no step-by-step trace/.test(
        normalized,
      );

    if (isThinOrUnsupported && !namesConcreteWitness) {
      weakens.push(item);
    } else if (namesConcreteWitness) {
      supports.push(item);
    } else if (weakenScore > supportScore) {
      weakens.push(item);
    } else {
      supports.push(item);
    }
  }

  const missing = [];
  const decidingText = normalizeText(whatWouldDecideIt?.text).toLowerCase();
  if (/clock|timestamp|expiry|verifier/.test(decidingText)) {
    missing.push(
      buildEvidenceItem({
        id: "missing_verifier_timestamps",
        title: "Missing witness",
        detail: "Verifier timestamps for the affected sessions.",
        sourceKind: "missing_witness",
        weight: "needed",
        sourceRefs: Array.isArray(whatWouldDecideIt?.sourceRefs) ? whatWouldDecideIt.sourceRefs : [],
      }),
    );
  }
  if (/avs|postal|post-sms/.test(decidingText)) {
    missing.push(
      buildEvidenceItem({
        id: "missing_post_sms_handoff",
        title: "Missing witness",
        detail: "Post-SMS handoff or AVS logs for the failing cohort.",
        sourceKind: "missing_witness",
        weight: "needed",
        sourceRefs: Array.isArray(whatWouldDecideIt?.sourceRefs) ? whatWouldDecideIt.sourceRefs : [],
      }),
    );
  }
  if (/legal review|sso|which step/.test(decidingText)) {
    missing.push(
      buildEvidenceItem({
        id: "missing_step_breakdown",
        title: "Missing witness",
        detail: "One step-level replay or breakdown for the failed path.",
        sourceKind: "missing_witness",
        weight: "needed",
        sourceRefs: Array.isArray(whatWouldDecideIt?.sourceRefs) ? whatWouldDecideIt.sourceRefs : [],
      }),
    );
  }
  if (/domain-verification|company domains|quarantined/.test(decidingText)) {
    missing.push(
      buildEvidenceItem({
        id: "missing_domain_logs",
        title: "Missing witness",
        detail: "Domain-verification logs segmented by quarantined company domains.",
        sourceKind: "missing_witness",
        weight: "needed",
        sourceRefs: Array.isArray(whatWouldDecideIt?.sourceRefs) ? whatWouldDecideIt.sourceRefs : [],
      }),
    );
  }

  return {
    supports: uniqueBy(supports, (item) => item.id || item.title).slice(0, 4),
    weakens: uniqueBy(weakens, (item) => item.id || item.title).slice(0, 4),
    missing: uniqueBy(missing.filter(Boolean), (item) => item.id || item.detail).slice(0, 3),
  };
}

function hasReturnShiftLanguage(text = "") {
  const normalized = normalizeText(text).toLowerCase();
  return /after .* fix|still|later|stays flat|did not solve|same .* still fails|after correcting|after successful|older and newer|same checkpoint/.test(
    normalized,
  );
}

function toReturnClaim(item = null, text = "") {
  const claimText = clipText(text || item?.detail || evidenceText(item), 180);
  if (!claimText) return null;
  return {
    text: claimText,
    sourceRefs: uniqueBy((Array.isArray(item?.sourceRefs) ? item.sourceRefs : []).filter(Boolean)),
  };
}

function buildReturnDelta({ evidenceBuckets = null, whatWouldDecideIt = null } = {}) {
  const supports = Array.isArray(evidenceBuckets?.supports) ? evidenceBuckets.supports : [];
  const weakens = Array.isArray(evidenceBuckets?.weakens) ? evidenceBuckets.weakens : [];
  const changedRead = supports
    .filter((item) => hasReturnShiftLanguage(evidenceText(item)))
    .slice(0, 2)
    .map((item) => toReturnClaim(item))
    .filter(Boolean);
  const weakenedRead = weakens
    .filter((item) => hasReturnShiftLanguage(evidenceText(item)))
    .slice(0, 2)
    .map((item) => toReturnClaim(item))
    .filter(Boolean);
  const fallbackWeakenedRead =
    !weakenedRead.length && changedRead.length
      ? weakens
          .slice(0, 2)
          .map((item) => toReturnClaim(item))
          .filter(Boolean)
      : [];
  const visibleWeakenedRead = weakenedRead.length ? weakenedRead : fallbackWeakenedRead;

  if (!changedRead.length && !visibleWeakenedRead.length) return null;

  const changedLead = changedRead[0]?.text || "";
  const weakenedLead = visibleWeakenedRead[0]?.text || "";
  const summary = clipText(
    changedLead && weakenedLead
      ? `Return bent the read: ${changedLead} This weakens the earlier read that ${lowerFirst(weakenedLead)}.`
      : `Return bent the read: ${changedLead || weakenedLead}`,
    200,
  );

  return {
    summary,
    changedRead,
    weakenedRead: visibleWeakenedRead,
    nextMoveShift: normalizeText(whatWouldDecideIt?.text)
      ? {
          text: clipText(whatWouldDecideIt.text, 160),
          sourceRefs: uniqueBy((Array.isArray(whatWouldDecideIt?.sourceRefs) ? whatWouldDecideIt.sourceRefs : []).filter(Boolean)),
        }
      : null,
  };
}

function buildCandidateMove({ whatWouldDecideIt = null, canonicalView = null, returnDelta = null } = {}) {
  const fieldState = normalizeText(canonicalView?.fieldState?.key || canonicalView?.fieldState?.label).toLowerCase();
  if (fieldState === "awaiting") return null;
  const pendingMove = canonicalView?.pendingMove || null;
  const text = normalizeText(pendingMove?.text) || normalizeText(whatWouldDecideIt?.text);

  if (!text || isInternalSystemText(text)) return null;

  const ready = !/\?$/.test(text) && !/need more|ask|which|what|where|when/i.test(text);
  if (!ready) return null;

  return {
    text: clipText(text, 160),
    kind: /inspect|check|log|trace/.test(text.toLowerCase())
      ? "inspect"
      : /compare|segment|cohort/.test(text.toLowerCase())
        ? "compare"
        : /test/.test(text.toLowerCase())
          ? "test"
          : /capture/.test(text.toLowerCase())
            ? "capture"
            : "clarify",
    justified: Boolean(ready),
    readiness: ready ? "ready" : "forming",
    sourceRefs: uniqueBy(
      [
        ...((Array.isArray(whatWouldDecideIt?.sourceRefs) ? whatWouldDecideIt.sourceRefs : [])),
        buildSourceRef("pending_move", pendingMove?.id || pendingMove?.text),
      ].filter(Boolean),
    ),
  };
}

function buildUncertainty({
  evidenceCarried = [],
  openTension = [],
  fieldState = "",
  candidateMove = null,
  returnDelta = null,
  whatWouldDecideIt = null,
  evidenceBuckets = null,
} = {}) {
  const normalizedFieldState = normalizeText(fieldState).toLowerCase();
  const decidingText = normalizeText(whatWouldDecideIt?.text);
  const missingItems = Array.isArray(evidenceBuckets?.missing) ? evidenceBuckets.missing : [];
  const firstMissing = normalizeText(missingItems[0]?.detail || missingItems[0]?.title);
  const firstTension = normalizeText(openTension[0]?.text);
  if (normalizedFieldState === "awaiting") {
    return {
      label: "awaiting_return",
      detail: firstMissing
        ? `Waiting on reality to answer back. ${firstMissing}`
        : "Waiting on reality to answer back.",
    };
  }
  if (returnDelta) {
    return {
      label: "return_shift",
      detail: decidingText
        ? `A return changed the read. Reroute around this split: ${decidingText}`
        : "A return changed the read, so the next move should tighten around the new split.",
    };
  }
  if (openTension.length > 0) {
    return {
      label: evidenceCarried.length > 0 ? "mixed_signal" : "low_signal",
      detail: clipText(
        [
          firstTension ? `Still open because ${lowerFirst(firstTension)}` : "Competing reads are still live.",
          firstMissing || (decidingText ? `This split decides it: ${decidingText}` : ""),
        ]
          .filter(Boolean)
          .join(" "),
        180,
      ),
    };
  }
  if (candidateMove?.justified) {
    return {
      label: "grounded_but_open",
      detail: "A next move looks justified, but the field is not settled.",
    };
  }
  return {
    label: evidenceCarried.length > 0 ? "grounded_but_open" : "low_signal",
    detail: evidenceCarried.length > 0
      ? clipText(
          firstMissing
            ? `A read is forming but remains provisional. ${firstMissing}`
            : decidingText
              ? `A read is forming but remains provisional. ${decidingText}`
              : "A read is forming but remains provisional.",
          180,
        )
      : "Not enough grounded signal yet.",
  };
}

function computeStatus({
  fieldState = "",
  evidenceCarried = [],
  openTension = [],
  candidateMove = null,
  aim = null,
  returnDelta = null,
} = {}) {
  const normalizedFieldState = normalizeText(fieldState).toLowerCase();
  if (normalizedFieldState === "awaiting") return "awaiting_return";
  if (candidateMove?.justified && candidateMove?.readiness === "ready") return "move_ready";
  if (returnDelta || openTension.length > 0) return "contested";
  if (aim && evidenceCarried.length > 0) return "grounded";
  return "forming";
}

function shouldShowWorkingEcho({ fieldState = "", evidenceCarried = [], aim = null, openTension = [], whatWouldDecideIt = null } = {}) {
  const normalizedFieldState = normalizeText(fieldState).toLowerCase();
  if (!whatWouldDecideIt?.text) return false;
  if (normalizedFieldState === "awaiting" && evidenceCarried.length > 0) return true;
  if (evidenceCarried.length > 0 && (aim || openTension.length > 0 || whatWouldDecideIt)) return true;
  if (openTension.length > 0 && whatWouldDecideIt) return true;
  return false;
}

function buildPreviewLink(activePreview = null) {
  if (!activePreview) return null;
  return {
    assistantMessageId: normalizeText(activePreview?.assistantMessageId),
    previewStatus: normalizeText(activePreview?.status).toLowerCase() || "active",
  };
}

export function buildWorkingEcho({
  canonicalView = null,
  messages = [],
  recentSources = [],
  focusedWitness = null,
  activeSession = null,
} = {}) {
  const fieldState = normalizeText(canonicalView?.fieldState?.key || canonicalView?.fieldState?.label);
  const lastAssistant = getLastAssistantMessage(messages);
  const assistantText = normalizeText(lastAssistant?.content || canonicalView?.activePreview?.assistantText);
  const segments = collectSegments({ canonicalView, messages });
  const aim = buildAim({ canonicalView, segments });
  const evidenceCarried = buildEvidenceCarried({ segments, focusedWitness, recentSources });
  const openTension = buildOpenTension({ segments, assistantText, canonicalView });
  const whatWouldDecideIt = buildWhatWouldDecideIt({
    segments,
    assistantText,
    canonicalView,
    evidenceCarried,
    openTension,
  });

  if (
    !shouldShowWorkingEcho({
      fieldState,
      evidenceCarried,
      aim,
      openTension,
      whatWouldDecideIt,
    })
  ) {
    return null;
  }

  const evidenceBuckets = buildEvidenceBuckets({
    evidenceCarried,
    whatWouldDecideIt,
  });
  const returnDelta = buildReturnDelta({
    evidenceBuckets,
    whatWouldDecideIt,
  });
  const candidateMove = buildCandidateMove({
    whatWouldDecideIt,
    canonicalView,
    returnDelta,
  });
  const uncertainty = buildUncertainty({
    evidenceCarried,
    openTension,
    fieldState,
    candidateMove,
    returnDelta,
    whatWouldDecideIt,
    evidenceBuckets,
  });
  const status = computeStatus({
    fieldState,
    evidenceCarried,
    openTension,
    candidateMove,
    aim,
    returnDelta,
  });
  const turnId = normalizeText(lastAssistant?.id || canonicalView?.activePreview?.assistantMessageId || "turn");
  const sessionId = normalizeText(activeSession?.id || canonicalView?.session?.id || "session");

  return {
    visible: true,
    id: `working_echo:${slugify(sessionId)}:${slugify(turnId)}`,
    sessionId,
    turnId,
    updatedAt: new Date().toISOString(),
    status,
    aim,
    evidenceCarried,
    evidenceBuckets,
    openTension,
    whatWouldDecideIt,
    candidateMove,
    returnDelta,
    uncertainty,
    previewLink: buildPreviewLink(canonicalView?.activePreview),
  };
}
