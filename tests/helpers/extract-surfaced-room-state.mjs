function clone(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function getLastAssistantMessage(messages = []) {
  return [...(Array.isArray(messages) ? messages : [])]
    .reverse()
    .find((message) => normalizeText(message?.role).toLowerCase() === "assistant") || null;
}

function buildVisibleSegments(message = null) {
  const segments = Array.isArray(message?.roomPayload?.segments) ? message.roomPayload.segments : [];
  return segments
    .map((segment) => ({
      text: normalizeText(segment?.text),
      mirrorRegion: normalizeText(segment?.mirrorRegion).toLowerCase() || "other",
      suggestedClauseVisible: false,
    }))
    .filter((segment) => segment.text);
}

function buildPreviewBanner(activePreview = null) {
  if (!activePreview) return null;

  const bannerSummary =
    normalizeText(activePreview?.assistantText) ||
    normalizeText(activePreview?.segments?.[0]?.text) ||
    "A preview is live in this conversation.";

  return {
    visible: true,
    bannerSummary,
    previewStatusLabel: "Preview",
  };
}

function buildMirrorSurface(view = null) {
  if (!view?.hasStructure) return null;

  const mirror = view?.mirror || {};
  return {
    visible: true,
    aim: normalizeText(mirror?.aim?.text),
    evidence: (Array.isArray(mirror?.evidence) ? mirror.evidence : []).map((item) => ({
      title: normalizeText(item?.title),
      detail: normalizeText(item?.detail),
    })),
    story: (Array.isArray(mirror?.story) ? mirror.story : []).map((item) => ({
      text: normalizeText(item?.text),
      detail: normalizeText(item?.detail),
    })),
    moves: (Array.isArray(mirror?.moves) ? mirror.moves : []).map((item) => ({
      text: normalizeText(item?.text),
      detail: normalizeText(item?.detail),
      status: normalizeText(item?.status),
    })),
    returns: (Array.isArray(mirror?.returns) ? mirror.returns : []).map((item) => ({
      label: normalizeText(item?.label),
      actual: normalizeText(item?.actual),
      result: normalizeText(item?.result),
    })),
  };
}

function buildWorkingEchoSurface(view = null) {
  if (!view?.workingEcho) return null;

  const evidenceCarried = Array.isArray(view.workingEcho?.evidenceCarried)
    ? view.workingEcho.evidenceCarried
    : [];
  const evidenceBuckets = view?.workingEcho?.evidenceBuckets || {};
  const openTension = Array.isArray(view.workingEcho?.openTension)
    ? view.workingEcho.openTension
    : [];
  const normalizeEvidenceItem = (item = null) => ({
    id: normalizeText(item?.id),
    title: normalizeText(item?.title),
    detail: normalizeText(item?.detail),
    sourceRefs: (Array.isArray(item?.sourceRefs) ? item.sourceRefs : [])
      .map((entry) => normalizeText(entry))
      .filter(Boolean),
  });

  return {
    visible: true,
    id: normalizeText(view.workingEcho?.id),
    turnId: normalizeText(view.workingEcho?.turnId),
    status: normalizeText(view.workingEcho?.status),
    aim: normalizeText(view.workingEcho?.aim?.text),
    aimRefs: (Array.isArray(view.workingEcho?.aim?.sourceRefs) ? view.workingEcho.aim.sourceRefs : [])
      .map((item) => normalizeText(item))
      .filter(Boolean),
    evidenceCarried: evidenceCarried
      .map((item) => normalizeEvidenceItem(item))
      .filter((item) => item.title || item.detail),
    evidenceBuckets: {
      supports: (Array.isArray(evidenceBuckets?.supports) ? evidenceBuckets.supports : [])
        .map((item) => normalizeEvidenceItem(item))
        .filter((item) => item.title || item.detail),
      weakens: (Array.isArray(evidenceBuckets?.weakens) ? evidenceBuckets.weakens : [])
        .map((item) => normalizeEvidenceItem(item))
        .filter((item) => item.title || item.detail),
      missing: (Array.isArray(evidenceBuckets?.missing) ? evidenceBuckets.missing : [])
        .map((item) => normalizeEvidenceItem(item))
        .filter((item) => item.title || item.detail),
    },
    openTension: openTension
      .map((item) => ({
        text: normalizeText(item?.text),
        kind: normalizeText(item?.kind),
        sourceRefs: (Array.isArray(item?.sourceRefs) ? item.sourceRefs : [])
          .map((entry) => normalizeText(entry))
          .filter(Boolean),
      }))
      .filter((item) => item.text),
    whatWouldDecideIt: {
      text: normalizeText(view.workingEcho?.whatWouldDecideIt?.text),
      kind: normalizeText(view.workingEcho?.whatWouldDecideIt?.kind),
      sourceRefs: (Array.isArray(view.workingEcho?.whatWouldDecideIt?.sourceRefs)
        ? view.workingEcho.whatWouldDecideIt.sourceRefs
        : [])
        .map((entry) => normalizeText(entry))
        .filter(Boolean),
    },
    candidateMove: view.workingEcho?.candidateMove
      ? {
          text: normalizeText(view.workingEcho?.candidateMove?.text),
          kind: normalizeText(view.workingEcho?.candidateMove?.kind),
          sourceRefs: (Array.isArray(view.workingEcho?.candidateMove?.sourceRefs)
            ? view.workingEcho.candidateMove.sourceRefs
            : [])
            .map((entry) => normalizeText(entry))
            .filter(Boolean),
        }
      : null,
    uncertainty: {
      label: normalizeText(view.workingEcho?.uncertainty?.label),
      detail: normalizeText(view.workingEcho?.uncertainty?.detail),
    },
    returnDelta: view.workingEcho?.returnDelta
      ? {
          summary: normalizeText(view.workingEcho.returnDelta?.summary),
          changedRead: (Array.isArray(view.workingEcho.returnDelta?.changedRead)
            ? view.workingEcho.returnDelta.changedRead
            : []
          )
            .map((item) => ({
              text: normalizeText(item?.text),
              sourceRefs: (Array.isArray(item?.sourceRefs) ? item.sourceRefs : [])
                .map((entry) => normalizeText(entry))
                .filter(Boolean),
            }))
            .filter((item) => item.text),
          weakenedRead: (Array.isArray(view.workingEcho.returnDelta?.weakenedRead)
            ? view.workingEcho.returnDelta.weakenedRead
            : []
          )
            .map((item) => ({
              text: normalizeText(item?.text),
              sourceRefs: (Array.isArray(item?.sourceRefs) ? item.sourceRefs : [])
                .map((entry) => normalizeText(entry))
                .filter(Boolean),
            }))
            .filter((item) => item.text),
          nextMoveShift: view.workingEcho.returnDelta?.nextMoveShift
            ? {
                text: normalizeText(view.workingEcho.returnDelta.nextMoveShift?.text),
                sourceRefs: (Array.isArray(view.workingEcho.returnDelta.nextMoveShift?.sourceRefs)
                  ? view.workingEcho.returnDelta.nextMoveShift.sourceRefs
                  : []
                )
                  .map((entry) => normalizeText(entry))
                  .filter(Boolean),
              }
            : null,
        }
      : null,
  };
}

function buildWitnessSurface(view = null) {
  if (!view?.focusedWitness) return null;
  const blocks = Array.isArray(view.focusedWitness?.excerptBlocks)
    ? view.focusedWitness.excerptBlocks
    : [];

  return {
    visible: true,
    title: normalizeText(view.focusedWitness?.title),
    excerptBlocks: blocks
      .map((block) => ({
        kind: normalizeText(block?.kind) || "paragraph",
        text: normalizeText(block?.text),
      }))
      .filter((block) => block.text),
  };
}

export function extractCurrentSurfacedRoomState({ view = null, assistantText = "" } = {}) {
  const lastAssistant = getLastAssistantMessage(view?.messages);
  const normalizedAssistantText =
    normalizeText(assistantText) ||
    normalizeText(lastAssistant?.content) ||
    normalizeText(view?.activePreview?.assistantText);
  const previewStatus =
    normalizeText(lastAssistant?.previewStatus) ||
    (view?.activePreview ? "active" : "none");
  const visibleSegments = buildVisibleSegments(lastAssistant);
  const previewBanner = buildPreviewBanner(view?.activePreview);

  return {
    mode: "current_surface",
    surfaceKind: "current_surface",
    assistantAnswer: {
      text: normalizedAssistantText,
      previewStatus: previewStatus || "none",
    },
    workingEchoSurface: buildWorkingEchoSurface(view),
    previewSurface:
      previewBanner || visibleSegments.length
        ? {
            visible: true,
            bannerSummary: previewBanner?.bannerSummary || "",
            previewStatusLabel: previewBanner?.previewStatusLabel || "",
            visibleSegments,
          }
        : null,
    witnessSurface: buildWitnessSurface(view),
    mirrorSurface: buildMirrorSurface(view),
    fieldStateLabel: normalizeText(view?.fieldState?.label || view?.fieldState?.key),
  };
}

export function buildBlindfoldedSurfacedState(surface = null) {
  return {
    mode: normalizeText(surface?.mode) || "current_surface",
    surfaceKind: "answer_only",
    assistantAnswer: {
      text: normalizeText(surface?.assistantAnswer?.text),
      previewStatus: "none",
    },
    workingEchoSurface: null,
    previewSurface: null,
    witnessSurface: null,
    mirrorSurface: null,
    fieldStateLabel: "",
  };
}

export function makeAnswerOnlySurfacedState(assistantText = "", { mode = "current_surface" } = {}) {
  return {
    mode,
    surfaceKind: "answer_only",
    assistantAnswer: {
      text: normalizeText(assistantText),
      previewStatus: "none",
    },
    workingEchoSurface: null,
    previewSurface: null,
    witnessSurface: null,
    mirrorSurface: null,
    fieldStateLabel: "",
  };
}

export function renderSurfacedStateForEvaluator(surface = null) {
  const sections = [];
  const assistantText = normalizeText(surface?.assistantAnswer?.text);

  sections.push("Visible assistant answer:");
  sections.push(assistantText || "(none)");

  if (surface?.degraded) {
    sections.push("");
    sections.push("Visible surface note: degraded output");
  }

  if (surface?.workingEchoSurface?.visible) {
    sections.push("");
    sections.push("Visible working echo:");
    if (normalizeText(surface.workingEchoSurface?.status)) {
      sections.push(`Status: ${normalizeText(surface.workingEchoSurface.status)}`);
    }
    if (normalizeText(surface.workingEchoSurface?.aim)) {
      sections.push(`What seems real: ${normalizeText(surface.workingEchoSurface.aim)}`);
    }
    const supports = Array.isArray(surface.workingEchoSurface?.evidenceBuckets?.supports)
      ? surface.workingEchoSurface.evidenceBuckets.supports
      : [];
    const weakens = Array.isArray(surface.workingEchoSurface?.evidenceBuckets?.weakens)
      ? surface.workingEchoSurface.evidenceBuckets.weakens
      : [];
    const missing = Array.isArray(surface.workingEchoSurface?.evidenceBuckets?.missing)
      ? surface.workingEchoSurface.evidenceBuckets.missing
      : [];
    const evidence = Array.isArray(surface.workingEchoSurface?.evidenceCarried)
      ? surface.workingEchoSurface.evidenceCarried
      : [];
    if (supports.length || evidence.length) {
      sections.push("Supporting evidence:");
      (supports.length ? supports : evidence).forEach((item) => {
        sections.push(`- ${normalizeText(item.title)}${normalizeText(item.detail) ? ` — ${normalizeText(item.detail)}` : ""}`);
      });
    }
    const tension = Array.isArray(surface.workingEchoSurface?.openTension)
      ? surface.workingEchoSurface.openTension
      : [];
    if (tension.length) {
      sections.push("What conflicts:");
      tension.forEach((item) => {
        sections.push(`- ${normalizeText(item.text)}${normalizeText(item.kind) ? ` [${normalizeText(item.kind)}]` : ""}`);
      });
    }
    if (weakens.length) {
      sections.push("Weakening evidence:");
      weakens.forEach((item) => {
        sections.push(`- ${normalizeText(item.title)}${normalizeText(item.detail) ? ` — ${normalizeText(item.detail)}` : ""}`);
      });
    }
    if (normalizeText(surface.workingEchoSurface?.whatWouldDecideIt?.text)) {
      sections.push(`What would decide it: ${normalizeText(surface.workingEchoSurface.whatWouldDecideIt.text)}`);
    }
    if (missing.length) {
      sections.push("Still missing:");
      missing.forEach((item) => {
        sections.push(`- ${normalizeText(item.title)}${normalizeText(item.detail) ? ` — ${normalizeText(item.detail)}` : ""}`);
      });
    }
    if (normalizeText(surface.workingEchoSurface?.candidateMove?.text)) {
      sections.push(`Candidate move: ${normalizeText(surface.workingEchoSurface.candidateMove.text)}`);
    }
    if (normalizeText(surface.workingEchoSurface?.returnDelta?.summary)) {
      sections.push(`What changed after return: ${normalizeText(surface.workingEchoSurface.returnDelta.summary)}`);
    }
    const changedRead = Array.isArray(surface.workingEchoSurface?.returnDelta?.changedRead)
      ? surface.workingEchoSurface.returnDelta.changedRead
      : [];
    if (changedRead.length) {
      sections.push("Changed read:");
      changedRead.forEach((item) => {
        sections.push(`- ${normalizeText(item.text)}`);
      });
    }
    const weakenedRead = Array.isArray(surface.workingEchoSurface?.returnDelta?.weakenedRead)
      ? surface.workingEchoSurface.returnDelta.weakenedRead
      : [];
    if (weakenedRead.length) {
      sections.push("Earlier read weakened:");
      weakenedRead.forEach((item) => {
        sections.push(`- ${normalizeText(item.text)}`);
      });
    }
  }

  if (surface?.previewSurface?.visible) {
    sections.push("");
    sections.push("Visible preview surface:");
    if (normalizeText(surface.previewSurface?.bannerSummary)) {
      sections.push(`Banner: ${normalizeText(surface.previewSurface.bannerSummary)}`);
    }
    if (normalizeText(surface.previewSurface?.previewStatusLabel)) {
      sections.push(`Status: ${normalizeText(surface.previewSurface.previewStatusLabel)}`);
    }
    const visibleSegments = Array.isArray(surface.previewSurface?.visibleSegments)
      ? surface.previewSurface.visibleSegments
      : [];
    if (visibleSegments.length) {
      sections.push("Inline chips:");
      visibleSegments.forEach((segment) => {
        sections.push(`- [${normalizeText(segment.mirrorRegion) || "other"}] ${normalizeText(segment.text)}`);
      });
    }
  }

  if (surface?.mirrorSurface?.visible) {
    sections.push("");
    sections.push("Visible mirror:");
    if (normalizeText(surface.mirrorSurface?.aim)) {
      sections.push(`Aim: ${normalizeText(surface.mirrorSurface.aim)}`);
    }
    const evidence = Array.isArray(surface.mirrorSurface?.evidence) ? surface.mirrorSurface.evidence : [];
    if (evidence.length) {
      sections.push("Evidence:");
      evidence.forEach((item) => {
        sections.push(`- ${normalizeText(item.title)}${normalizeText(item.detail) ? ` — ${normalizeText(item.detail)}` : ""}`);
      });
    }
    const story = Array.isArray(surface.mirrorSurface?.story) ? surface.mirrorSurface.story : [];
    if (story.length) {
      sections.push("Story:");
      story.forEach((item) => {
        sections.push(`- ${normalizeText(item.text)}${normalizeText(item.detail) ? ` — ${normalizeText(item.detail)}` : ""}`);
      });
    }
    const moves = Array.isArray(surface.mirrorSurface?.moves) ? surface.mirrorSurface.moves : [];
    if (moves.length) {
      sections.push("Moves:");
      moves.forEach((item) => {
        sections.push(
          `- ${normalizeText(item.text)}${normalizeText(item.detail) ? ` — ${normalizeText(item.detail)}` : ""}${normalizeText(item.status) ? ` [${normalizeText(item.status)}]` : ""}`,
        );
      });
    }
    const returns = Array.isArray(surface.mirrorSurface?.returns) ? surface.mirrorSurface.returns : [];
    if (returns.length) {
      sections.push("Returns:");
      returns.forEach((item) => {
        sections.push(
          `- ${normalizeText(item.label || "Return")}${normalizeText(item.actual) ? ` — ${normalizeText(item.actual)}` : ""}${normalizeText(item.result) ? ` [${normalizeText(item.result)}]` : ""}`,
        );
      });
    }
  }

  if (surface?.witnessSurface?.visible) {
    sections.push("");
    sections.push("Visible witness panel:");
    sections.push(`Title: ${normalizeText(surface.witnessSurface?.title) || "(untitled)"}`);
    (Array.isArray(surface.witnessSurface?.excerptBlocks) ? surface.witnessSurface.excerptBlocks : []).forEach(
      (block) => {
        sections.push(`- ${normalizeText(block.kind) || "paragraph"}: ${normalizeText(block.text)}`);
      },
    );
  }

  if (normalizeText(surface?.fieldStateLabel)) {
    sections.push("");
    sections.push(`Visible field state: ${normalizeText(surface.fieldStateLabel)}`);
  }

  return sections.join("\n");
}

export function cloneSurfacedState(surface = null) {
  return clone(surface);
}
