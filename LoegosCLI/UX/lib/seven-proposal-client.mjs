function toIdentifier(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

function normalizeSegmentsFromCandidates(candidates = []) {
  return (Array.isArray(candidates) ? candidates : [])
    .map((candidate) => {
      const rootText = String(candidate?.rootText || "").trim();
      const rationale = String(candidate?.rationale || "").trim();
      const identifier = toIdentifier(rootText);
      if (!identifier) return null;
      return {
        text: rootText,
        domain: "aim",
        suggestedClause: `DIR aim ${identifier}`,
        rationale,
      };
    })
    .filter(Boolean);
}

const RECEIPT_TYPES = new Set([
  "upload",
  "paste",
  "draft_message",
  "link",
  "checklist",
  "compare",
]);

function normalizeReceiptKit(rawKit = null, fallback = {}) {
  const type = String(rawKit?.artifact?.type || fallback?.artifact?.type || "paste").trim();
  const normalizedType = RECEIPT_TYPES.has(type) ? type : "paste";
  const config =
    rawKit?.artifact?.config && typeof rawKit.artifact.config === "object"
      ? rawKit.artifact.config
      : fallback?.artifact?.config && typeof fallback.artifact.config === "object"
        ? fallback.artifact.config
        : {};
  const base = {
    need: String(rawKit?.need || fallback?.need || "Missing witness").trim(),
    why: String(rawKit?.why || fallback?.why || "Needed to reduce uncertainty in this box").trim(),
    fastestPath: String(rawKit?.fastestPath || fallback?.fastestPath || "Use the suggested artifact below").trim(),
    artifact: {
      type: normalizedType,
      config,
    },
    enough: String(rawKit?.enough || fallback?.enough || "One concrete, verifiable return").trim(),
    prediction: {
      expected: String(rawKit?.prediction?.expected || fallback?.prediction?.expected || "One return with provenance").trim(),
      direction: String(rawKit?.prediction?.direction || fallback?.prediction?.direction || "narrows").trim(),
      timebound: String(rawKit?.prediction?.timebound || fallback?.prediction?.timebound || "within this loop").trim(),
      surprise: String(rawKit?.prediction?.surprise || fallback?.prediction?.surprise || "Return differs from expectation").trim(),
    },
  };
  return base;
}

function buildFallbackReceiptKit({ question = "", segments = [] } = {}) {
  const firstSegment = segments[0] || null;
  const firstText = String(firstSegment?.text || question || "").trim();
  const needLabel = firstText || "Missing grounding witness";
  return normalizeReceiptKit(null, {
    need: needLabel.slice(0, 120),
    why: "This box needs one concrete return before closure.",
    fastestPath: "Paste the smallest verifiable value you can get now.",
    artifact: {
      type: "paste",
      config: {
        label: "Paste one concrete return",
        placeholder: "e.g. lender pre-approval, offer number, measured value",
      },
    },
    enough: "One value with source context.",
    prediction: {
      expected: "Reality likely narrows this decision range.",
      direction: "narrows",
      timebound: "this turn",
      surprise: "Return contradicts the active story.",
    },
  });
}

function buildFallbackProposal(answer = "") {
  const normalized = toIdentifier(answer || "clarify_next_step");
  return {
    summary: "Fallback proposal generated from Seven answer text.",
    segments: [
      {
        text: String(answer || "Seven suggested a refinement.").trim(),
        domain: "aim",
        suggestedClause: `DIR aim ${normalized || "clarify_next_step"}`,
        rationale: "fallback",
      },
    ],
    source: "fallback",
    receiptKit: buildFallbackReceiptKit({
      question: answer,
      segments: [
        {
          text: String(answer || "Seven suggested a refinement.").trim(),
        },
      ],
    }),
  };
}

export function mapSevenProposalResponse(payload = null, context = {}) {
  const instrumentResult = payload?.instrumentResult || null;
  const segments = normalizeSegmentsFromCandidates(instrumentResult?.candidates || []);
  const providedKit = payload?.receiptKit || instrumentResult?.receiptKit || null;
  if (segments.length > 0) {
    const fallbackKit = buildFallbackReceiptKit({
      question: context?.question || payload?.answer || "",
      segments,
    });
    return {
      summary: String(instrumentResult?.summary || payload?.answer || "").trim(),
      segments,
      source: "instrument_candidates",
      receiptKit: normalizeReceiptKit(providedKit, fallbackKit),
    };
  }
  const fallback = buildFallbackProposal(payload?.answer || "");
  const fallbackKit = buildFallbackReceiptKit({
    question: context?.question || payload?.answer || "",
    segments: fallback.segments || [],
  });
  return {
    ...fallback,
    receiptKit: normalizeReceiptKit(providedKit, fallbackKit),
  };
}

export async function fetchSevenProposal({
  userInput = "",
  documentKey = "",
  boxTitle = "",
  rootText = "",
  sourceDocuments = [],
  endpoint = "/api/seven",
} = {}) {
  const question = String(userInput || "").trim();
  if (!question) {
    return { summary: "", segments: [], source: "empty" };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "question",
      question,
      documentKey,
      instrumentIntent: "root-suggest",
      instrumentContext: {
        rootText: rootText || question,
        rootGloss: "phase2 proposal gate",
        boxTitle,
        sourceCount: Array.isArray(sourceDocuments) ? sourceDocuments.length : 0,
        sourceDocuments,
      },
    }),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    throw new Error(
      String(payload?.error || "Seven is unavailable right now for proposal suggestions.").trim(),
    );
  }

  return mapSevenProposalResponse(payload, { question });
}
