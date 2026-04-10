const ROOM_TURN_MODES = new Set(["conversation", "proposal"]);

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeLongText(value = "") {
  return String(value || "").trim();
}

function normalizeLowerText(value = "") {
  return normalizeText(value).toLowerCase();
}

function countWords(value = "") {
  const normalized = normalizeText(value);
  return normalized ? normalized.split(/\s+/).length : 0;
}

function buildDiagnostic(code, severity, message) {
  return {
    code,
    severity,
    message,
    span: { line: 1, startCol: 1, endCol: 1 },
  };
}

export function normalizeRoomTurnMode(value = "", fallback = "conversation") {
  const normalized = normalizeLowerText(value);
  return ROOM_TURN_MODES.has(normalized) ? normalized : fallback;
}

export function hasCanonicalProposalSegments(turn = null) {
  const segments = Array.isArray(turn?.segments) ? turn.segments : [];
  return segments.some((segment) => normalizeLongText(segment?.suggestedClause || segment?.loe));
}

export function buildSafeFallbackTurn(
  assistantText = "I lost the thread. Say that again?",
) {
  return {
    assistantText: normalizeLongText(assistantText) || "I lost the thread. Say that again?",
    turnMode: "conversation",
    segments: [],
    receiptKit: null,
    gatePreview: null,
  };
}

export function coerceConversationTurn(turn = null) {
  return {
    assistantText:
      normalizeLongText(turn?.assistantText || turn?.reply) || "Tell me a little more.",
    proposalId: normalizeText(turn?.proposalId),
    turnMode: "conversation",
    segments: [],
    receiptKit: null,
    gatePreview: null,
  };
}

export function looksLikeAspiration(message = "") {
  const text = normalizeLowerText(message);
  if (!text) return false;
  return (
    /\b(i|we)\s+(want|hope|wish|dream|plan|intend)\b/.test(text) ||
    /\b(i('| a)?m|we('?re)?)\s+trying\s+to\b/.test(text) ||
    /\b(thinking about|would like to|want to build|trying to build)\b/.test(text)
  );
}

export function looksLikeUncertainty(message = "") {
  const text = normalizeLowerText(message);
  if (!text) return false;
  return /\b(not sure|unsure|idk|i don't know|maybe|something is off|kind of|sort of|roughly|possibly)\b/.test(
    text,
  );
}

export function looksLikeLowSignal(message = "") {
  const text = normalizeLowerText(message);
  if (!text) return true;
  if (countWords(text) <= 2) return true;
  if (/^(hi|hello|hey|hmm|uh|ok|okay|yo|sup|test|testing)$/i.test(text)) return true;
  if (/(asdf|blorp|qwerty|lol|lmao|haha)/i.test(text)) return true;
  return false;
}

export function looksLikeExplicitStructureRequest(message = "") {
  const text = normalizeLowerText(message);
  if (!text) return false;
  return /\b(next step|next move|what should i check|what should i do|test this|compare|receipt kit|turn this into|box move|make a box|structure this|lawful proposal|proposal)\b/.test(
    text,
  );
}

export function looksLikeConcreteObservation(message = "") {
  const text = normalizeLowerText(message);
  if (!text) return false;
  return (
    /\b(said|told me|sent|received|got|measured|observed|noticed|saw|found|confirmed|contradicted|returned|came back|output changed|changed|stopped|started|failed|passed|offered|quoted)\b/.test(
      text,
    ) ||
    /\$\s?\d/.test(text) ||
    /\b\d{1,4}(k|m|%)\b/.test(text) ||
    /\b\d{4}-\d{2}-\d{2}\b/.test(text) ||
    /\b(true|false|yes|no)\b/.test(text)
  );
}

export function looksLikeClarificationOnly(message = "") {
  const text = normalizeLowerText(message);
  if (!text) return false;
  return /\b(what do you mean|say more|tell me more|can you clarify|clarify this|help me understand|what's the difference|explain that)\b/.test(
    text,
  );
}

export function looksLikeConversationalMove(message = "") {
  const text = normalizeLowerText(message);
  if (!text) return false;
  return /\b(answer my question|clarify|tell me more|say more|what do you mean|describe your next|pick the layer|what stack|keep talking|respond here|reply here)\b/.test(
    text,
  );
}

function collectContextText(context = {}) {
  const recentSources = Array.isArray(context?.recentSources) ? context.recentSources : [];
  return [
    normalizeLongText(context?.currentSource),
    normalizeLongText(context?.latestUserMessage),
    ...recentSources.flatMap((source) => [
      normalizeLongText(source?.title),
      normalizeLongText(source?.excerpt),
      normalizeLongText(source?.summary),
      normalizeLongText(source?.modality),
      normalizeLongText(source?.kind),
      normalizeLongText(source?.sourceType),
    ]),
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
}

export function buildRoomSemanticContext({
  currentSource = "",
  recentSources = [],
  latestUserMessage = "",
} = {}) {
  const text = collectContextText({ currentSource, recentSources, latestUserMessage });
  return {
    currentSource: normalizeLongText(currentSource),
    recentSources: Array.isArray(recentSources) ? recentSources : [],
    latestUserMessage: normalizeLongText(latestUserMessage),
    hasScreenshotContext: /\b(screenshot|static screenshot|uploaded image|image upload|mockup|figma|image|png|jpg|jpeg)\b/.test(
      text,
    ),
  };
}

export function classifyRoomTurnMode({ message = "", view = null } = {}) {
  const normalized = normalizeLongText(message);
  if (!normalized) return "conversation";

  const hasStructure = Boolean(view?.hasStructure);
  const explicitStructure = looksLikeExplicitStructureRequest(normalized);
  const observation = looksLikeConcreteObservation(normalized);
  const lowSignal = looksLikeLowSignal(normalized);
  const clarificationOnly = looksLikeClarificationOnly(normalized);
  const aspiration = looksLikeAspiration(normalized);
  const uncertainty = looksLikeUncertainty(normalized);

  if (lowSignal) return "conversation";
  if (explicitStructure) return "proposal";
  if (observation) return "proposal";
  if (hasStructure && !clarificationOnly) return "proposal";
  if (clarificationOnly || aspiration || uncertainty) return "conversation";
  return "conversation";
}

export function auditRoomProposalSemantics({ proposal = null, context = null } = {}) {
  const diagnostics = [];
  const segments = Array.isArray(proposal?.segments) ? proposal.segments : [];
  const semanticContext = context && typeof context === "object" ? context : {};

  for (const segment of segments) {
    const text = normalizeLongText(segment?.text);
    const clause = normalizeLongText(segment?.suggestedClause || segment?.loe);
    const combined = `${text}\n${clause}`;
    const lowerClause = clause.toLowerCase();
    const lowerText = text.toLowerCase();

    if (
      /\bgnd\s+witness\b/.test(lowerClause) &&
      /\bfrom\s+"user_stated"/.test(lowerClause)
    ) {
      if (
        looksLikeAspiration(lowerText) ||
        looksLikeUncertainty(lowerText) ||
        looksLikeLowSignal(lowerText)
      ) {
        diagnostics.push(
          buildDiagnostic(
            "RM201",
            "error",
            "Desire, uncertainty, or playful noise is not lawful witness ground.",
          ),
        );
      } else {
        diagnostics.push(
          buildDiagnostic(
            "RM202",
            "warning",
            "User-stated witness is reported signal, not externally verified evidence yet.",
          ),
        );
      }
    }

    if (
      (/\bmov\s+move\b/.test(lowerClause) || /\btst\s+test\b/.test(lowerClause)) &&
      looksLikeConversationalMove(combined)
    ) {
      diagnostics.push(
        buildDiagnostic(
          "RM203",
          "error",
          "Conversation-only clarification is not a lawful move or test.",
        ),
      );
    }

    if (
      /\b(screenshot|static screenshot|label(?:ed| it)? static|live ui|interactive code)\b/.test(
        combined.toLowerCase(),
      ) &&
      !semanticContext.hasScreenshotContext
    ) {
      diagnostics.push(
        buildDiagnostic(
          "RM204",
          "error",
          "This proposal references screenshot context that is not present in the current room.",
        ),
      );
    }
  }

  const blockingDiagnostics = diagnostics.filter((diagnostic) => diagnostic.severity === "error");
  return {
    accepted: blockingDiagnostics.length === 0,
    reason: blockingDiagnostics.length ? "semantic_reject" : "",
    diagnostics,
  };
}
