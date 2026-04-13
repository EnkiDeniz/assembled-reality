function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export const ROOM_SHAPE_ROLES = Object.freeze({
  aim: {
    key: "aim",
    glyph: "△",
    label: "Aim",
    regionLabel: "Aim",
    tone: "brand",
  },
  evidence: {
    key: "evidence",
    glyph: "◻",
    label: "Evidence / Reality",
    regionLabel: "Evidence / Reality",
    tone: "grounded",
  },
  story: {
    key: "story",
    glyph: "○",
    label: "Story / Listen",
    regionLabel: "Story / Listen",
    tone: "story",
  },
  moves: {
    key: "moves",
    glyph: "△",
    label: "Ping / Move",
    regionLabel: "Ping / Move",
    tone: "brand",
  },
  returns: {
    key: "returns",
    glyph: "𒐛",
    label: "Echoes / Seal",
    regionLabel: "Echoes / Seal",
    tone: "grounded",
  },
  other: {
    key: "other",
    glyph: "",
    label: "Meta",
    regionLabel: "Meta",
    tone: "neutral",
  },
});

export const ROOM_TERRAIN_PRESENTATIONS = Object.freeze({
  open: {
    key: "open",
    label: "Open",
    description: "A read is still forming.",
    tone: "neutral",
  },
  contested: {
    key: "contested",
    label: "Contested",
    description: "Competing reads or instability remain live.",
    tone: "flagged",
  },
  awaiting_return: {
    key: "awaiting_return",
    label: "Awaiting return",
    description: "Reality still needs to answer back.",
    tone: "brand",
  },
  fog: {
    key: "fog",
    label: "Fog",
    description: "No echo. Unmapped.",
    tone: "neutral",
  },
  awaiting: {
    key: "awaiting",
    label: "Awaiting",
    description: "Ping sent. Listening.",
    tone: "brand",
  },
  mapped: {
    key: "mapped",
    label: "Mapped",
    description: "Echo returned. Surface confirmed.",
    tone: "grounded",
  },
  fractured: {
    key: "fractured",
    label: "Fractured",
    description: "Contradiction returned.",
    tone: "flagged",
  },
  suspected: {
    key: "suspected",
    label: "Suspected",
    description: "Advisory only. Not yet grounded.",
    tone: "neutral",
  },
  stale: {
    key: "stale",
    label: "Stale",
    description: "Echo may have shifted.",
    tone: "story",
  },
});

export function getRoomShapeRole(role = "other") {
  const normalizedRole = normalizeText(role).toLowerCase();
  return ROOM_SHAPE_ROLES[normalizedRole] || ROOM_SHAPE_ROLES.other;
}

export function getSegmentShapeRole(domain = "other") {
  const normalizedDomain = normalizeText(domain).toLowerCase();
  if (normalizedDomain === "aim") return ROOM_SHAPE_ROLES.aim;
  if (normalizedDomain === "witness" || normalizedDomain === "evidence") return ROOM_SHAPE_ROLES.evidence;
  if (normalizedDomain === "story") return ROOM_SHAPE_ROLES.story;
  if (normalizedDomain === "move" || normalizedDomain === "test") return ROOM_SHAPE_ROLES.moves;
  if (normalizedDomain === "return" || normalizedDomain === "receipt") return ROOM_SHAPE_ROLES.returns;
  return ROOM_SHAPE_ROLES.other;
}

export function getMirrorRegionRole(region = "other") {
  const normalizedRegion = normalizeText(region).toLowerCase();
  if (normalizedRegion === "aim") return ROOM_SHAPE_ROLES.aim;
  if (normalizedRegion === "evidence") return ROOM_SHAPE_ROLES.evidence;
  if (normalizedRegion === "story") return ROOM_SHAPE_ROLES.story;
  if (normalizedRegion === "moves") return ROOM_SHAPE_ROLES.moves;
  if (normalizedRegion === "returns") return ROOM_SHAPE_ROLES.returns;
  return ROOM_SHAPE_ROLES.other;
}

export function deriveRoomTerrainPresentation({ fieldState = null, loopState = "" } = {}) {
  const normalizedLoopState = normalizeText(loopState).toLowerCase();
  if (normalizedLoopState === "awaiting_return") {
    return {
      ...ROOM_TERRAIN_PRESENTATIONS.awaiting_return,
      canonicalKey: "awaiting",
      canonicalLabel: ROOM_TERRAIN_PRESENTATIONS.awaiting_return.label,
    };
  }
  if (normalizedLoopState === "contested") {
    return {
      ...ROOM_TERRAIN_PRESENTATIONS.contested,
      canonicalKey: "contested",
      canonicalLabel: ROOM_TERRAIN_PRESENTATIONS.contested.label,
    };
  }
  if (normalizedLoopState === "open") {
    return {
      ...ROOM_TERRAIN_PRESENTATIONS.open,
      canonicalKey: normalizeText(fieldState?.key).toLowerCase() || "open",
      canonicalLabel: ROOM_TERRAIN_PRESENTATIONS.open.label,
    };
  }

  const canonicalKey = normalizeText(fieldState?.key).toLowerCase();
  let terrain = ROOM_TERRAIN_PRESENTATIONS.fog;

  if (canonicalKey === "awaiting") {
    terrain = ROOM_TERRAIN_PRESENTATIONS.awaiting;
  } else if (canonicalKey === "flagged" || canonicalKey === "stopped") {
    terrain = ROOM_TERRAIN_PRESENTATIONS.fractured;
  } else if (canonicalKey === "rerouted") {
    terrain = ROOM_TERRAIN_PRESENTATIONS.stale;
  } else if (canonicalKey === "grounded" || canonicalKey === "actionable" || canonicalKey === "sealed") {
    terrain = ROOM_TERRAIN_PRESENTATIONS.mapped;
  } else if (canonicalKey === "suspected") {
    terrain = ROOM_TERRAIN_PRESENTATIONS.suspected;
  }

  return {
    ...terrain,
    canonicalKey: canonicalKey || "open",
    canonicalLabel: normalizeText(fieldState?.label) || terrain.label,
  };
}
