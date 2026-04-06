export const LOEGOS_SHAPES = Object.freeze({
  aim: {
    key: "aim",
    label: "Aim",
    glyph: "triangle",
    summary: "Direction, declaration, next move.",
    verbs: ["declare", "name", "sharpen"],
  },
  reality: {
    key: "reality",
    label: "Reality",
    glyph: "square",
    summary: "Capture, listen, inspect what is here.",
    verbs: ["capture", "listen", "inspect"],
  },
  weld: {
    key: "weld",
    label: "Weld",
    glyph: "weld",
    summary: "Stage, rewrite, operate the object.",
    verbs: ["stage", "rewrite", "operate"],
  },
  seal: {
    key: "seal",
    label: "Seal",
    glyph: "seal",
    summary: "Review, seal, share the proof.",
    verbs: ["review", "seal", "share"],
  },
});

export const LOEGOS_SHAPE_ORDER = Object.freeze(["aim", "reality", "weld", "seal"]);

export const BOX_PHASE_TO_SHAPE = Object.freeze({
  lane: "aim",
  think: "reality",
  create: "weld",
  operate: "weld",
  receipts: "seal",
});

export const SHAPE_TO_PRIMARY_BOX_PHASE = Object.freeze({
  aim: "lane",
  reality: "think",
  weld: "create",
  seal: "receipts",
});

export function getLoegosShape(shapeKey = "aim") {
  return LOEGOS_SHAPES[shapeKey] || LOEGOS_SHAPES.aim;
}

export function getShapeForBoxPhase(boxPhase = "lane") {
  return BOX_PHASE_TO_SHAPE[boxPhase] || "aim";
}

export function getPrimaryBoxPhaseForShape(shapeKey = "aim") {
  return SHAPE_TO_PRIMARY_BOX_PHASE[shapeKey] || "lane";
}

export function getVerbsForShape(shapeKey = "aim") {
  return getLoegosShape(shapeKey).verbs;
}

export function getWorkspaceVerb({
  shapeKey = "aim",
  boxPhase = "lane",
  workspaceMode = "assemble",
} = {}) {
  if (workspaceMode === "listen") return "listen";

  if (shapeKey === "aim") return "declare";
  if (shapeKey === "reality") return "inspect";
  if (shapeKey === "weld") {
    if (boxPhase === "operate") return "operate";
    return "rewrite";
  }
  if (shapeKey === "seal") return "review";

  return getVerbsForShape(shapeKey)[0] || "";
}

export function getWorkspaceShapeAndVerb({
  boxPhase = "lane",
  workspaceMode = "assemble",
} = {}) {
  const shapeKey = getShapeForBoxPhase(boxPhase);
  return {
    shapeKey,
    verb: getWorkspaceVerb({ shapeKey, boxPhase, workspaceMode }),
  };
}

export function getSignalTone(value = "") {
  const normalized = String(value || "").trim().toLowerCase();

  if (
    normalized === "verified" ||
    normalized === "released" ||
    normalized === "connected" ||
    normalized === "clear" ||
    normalized === "success" ||
    normalized === "sealed"
  ) {
    return "clear";
  }

  if (
    normalized === "partial" ||
    normalized === "active" ||
    normalized === "committing" ||
    normalized === "draft" ||
    normalized === "pending" ||
    normalized === "waiting"
  ) {
    return "active";
  }

  if (
    normalized === "unverified" ||
    normalized === "alert" ||
    normalized === "rate-limited" ||
    normalized === "error" ||
    normalized === "failed" ||
    normalized === "disconnected"
  ) {
    return "alert";
  }

  return "neutral";
}

export function buildShapeNavItems({
  activeShape = "aim",
  activeVerb = "",
  badges = {},
} = {}) {
  return LOEGOS_SHAPE_ORDER.map((shapeKey) => {
    const shape = getLoegosShape(shapeKey);
    const badge = badges?.[shapeKey] || null;

    return {
      shapeKey,
      label: shape.label,
      description: shape.summary,
      verb: shapeKey === activeShape ? activeVerb || shape.verbs[0] : shape.verbs[0],
      badge: badge?.label || "",
      badgeTone: badge?.tone || "neutral",
      active: shapeKey === activeShape,
    };
  });
}
