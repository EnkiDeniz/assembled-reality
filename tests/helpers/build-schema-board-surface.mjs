function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function unique(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => normalizeText(value)).filter(Boolean))];
}

export const SCHEMA_BOARD_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    tentativeAim: { type: "string" },
    evidenceNotes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string" },
          note: { type: "string" },
        },
        required: ["label", "note"],
      },
    },
    openTensions: {
      type: "array",
      items: { type: "string" },
    },
    candidateMoves: {
      type: "array",
      items: { type: "string" },
    },
    uncertaintyState: { type: "string" },
  },
  required: [
    "tentativeAim",
    "evidenceNotes",
    "openTensions",
    "candidateMoves",
    "uncertaintyState",
  ],
};

export function normalizeSchemaBoardPayload(payload = null) {
  return {
    tentativeAim: normalizeText(payload?.tentativeAim),
    evidenceNotes: (Array.isArray(payload?.evidenceNotes) ? payload.evidenceNotes : [])
      .map((item) => ({
        label: normalizeText(item?.label),
        note: normalizeText(item?.note),
      }))
      .filter((item) => item.label || item.note),
    openTensions: unique(payload?.openTensions),
    candidateMoves: unique(payload?.candidateMoves),
    uncertaintyState: normalizeText(payload?.uncertaintyState),
  };
}

export function buildSchemaBoardSurface({
  assistantText = "",
  board = null,
  degraded = false,
} = {}) {
  const normalizedBoard = normalizeSchemaBoardPayload(board);

  return {
    mode: "current_surface",
    surfaceKind: "schema_board",
    degraded: Boolean(degraded),
    assistantAnswer: {
      text: normalizeText(assistantText),
      previewStatus: "none",
    },
    workingEchoSurface: {
      visible: true,
      id: "schema_board",
      turnId: "schema_board",
      status: normalizedBoard.candidateMoves.length ? "move_ready" : "forming",
      aim: normalizedBoard.tentativeAim,
      aimRefs: [],
      evidenceCarried: normalizedBoard.evidenceNotes.map((item) => ({
        id: normalizeText(item.label),
        title: item.label,
        detail: item.note,
        sourceRefs: [],
      })),
      evidenceBuckets: {
        supports: normalizedBoard.evidenceNotes.map((item) => ({
          id: normalizeText(item.label),
          title: item.label,
          detail: item.note,
          sourceRefs: [],
        })),
        weakens: [],
        missing: [],
      },
      openTension: normalizedBoard.openTensions.map((item) => ({
        text: item,
        kind: "uncertainty",
        sourceRefs: [],
      })),
      whatWouldDecideIt: {
        text: normalizedBoard.candidateMoves[0] || normalizedBoard.openTensions[0] || "",
        kind: "compare",
        sourceRefs: [],
      },
      candidateMove: normalizedBoard.candidateMoves[0]
        ? {
            text: normalizedBoard.candidateMoves[0],
            kind: "compare",
            sourceRefs: [],
          }
        : null,
      uncertainty: {
        label: normalizeText(normalizedBoard.uncertaintyState),
        detail: degraded ? "Control-arm output was degraded or incomplete." : "",
      },
      returnDelta: null,
    },
    previewSurface: {
      visible: true,
      bannerSummary:
        normalizedBoard.tentativeAim ||
        normalizedBoard.uncertaintyState ||
        "Generic working board",
      previewStatusLabel: degraded ? "Board (degraded)" : "Board",
      visibleSegments: [
        ...(normalizedBoard.tentativeAim
          ? [{ text: normalizedBoard.tentativeAim, mirrorRegion: "aim", suggestedClauseVisible: false }]
          : []),
        ...normalizedBoard.openTensions.map((item) => ({
          text: item,
          mirrorRegion: "story",
          suggestedClauseVisible: false,
        })),
        ...normalizedBoard.candidateMoves.map((item) => ({
          text: item,
          mirrorRegion: "moves",
          suggestedClauseVisible: false,
        })),
      ],
    },
    witnessSurface: null,
    mirrorSurface: {
      visible: true,
      aim: normalizedBoard.tentativeAim,
      evidence: normalizedBoard.evidenceNotes.map((item) => ({
        title: item.label,
        detail: item.note,
      })),
      story: normalizedBoard.openTensions.map((item) => ({
        text: item,
        detail: "",
      })),
      moves: normalizedBoard.candidateMoves.map((item) => ({
        text: item,
        detail: "",
        status: "candidate",
      })),
      returns: [],
    },
    fieldStateLabel: normalizedBoard.uncertaintyState,
  };
}
