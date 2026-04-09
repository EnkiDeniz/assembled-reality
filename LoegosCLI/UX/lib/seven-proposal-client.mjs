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
  };
}

export function mapSevenProposalResponse(payload = null) {
  const instrumentResult = payload?.instrumentResult || null;
  const segments = normalizeSegmentsFromCandidates(instrumentResult?.candidates || []);
  if (segments.length > 0) {
    return {
      summary: String(instrumentResult?.summary || payload?.answer || "").trim(),
      segments,
      source: "instrument_candidates",
    };
  }
  return buildFallbackProposal(payload?.answer || "");
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

  return mapSevenProposalResponse(payload);
}
