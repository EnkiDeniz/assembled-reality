function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function buildEvidenceContour(mirror = null) {
  const items = Array.isArray(mirror?.evidence) ? mirror.evidence.filter(Boolean) : [];
  if (!items.length) {
    return {
      summary: "No accepted evidence contour yet.",
      items: [],
    };
  }

  const labels = items
    .map((item) => normalizeText(item?.text || item?.title || item?.ref))
    .filter(Boolean)
    .slice(0, 3);

  return {
    summary: `${items.length} accepted evidence item${items.length === 1 ? "" : "s"}`,
    items: labels,
  };
}

function buildReturnCondition(view = null) {
  const latestReturn = view?.recentReturns?.[0] || null;
  const pendingMove = normalizeText(view?.pendingMove?.text);
  const nextBestAction = normalizeText(view?.interaction?.nextBestAction);

  if (normalizeText(latestReturn?.actual)) {
    return latestReturn.actual;
  }

  if (pendingMove) {
    return `Awaiting return on: ${pendingMove}`;
  }

  return nextBestAction || "No return condition is explicit yet.";
}

function mapBox(project = null, { active = false } = {}) {
  if (!project) return null;
  return {
    id: normalizeText(project.projectKey),
    key: normalizeText(project.projectKey),
    projectKey: normalizeText(project.projectKey),
    title: normalizeText(project.title) || "Untitled Box",
    subtitle: normalizeText(project.subtitle),
    sourceCount: Number(project.sourceCount) || 0,
    receiptDraftCount: Number(project.receiptDraftCount) || 0,
    active,
  };
}

function mapSession(session = null, { active = false } = {}) {
  if (!session) return null;
  return {
    id: normalizeText(session.id || session.sessionKey),
    sessionKey: normalizeText(session.sessionKey || session.id),
    title: normalizeText(session.title) || "Conversation",
    messageCount: Number(session.messageCount) || 0,
    updatedAt: session.updatedAt || "",
    handoffSummary: normalizeText(session.handoffSummary),
    active,
    archived: Boolean(session.isArchived),
    isArchived: Boolean(session.isArchived),
  };
}

function mapWitnessArtifact(source = null) {
  if (!source) return null;
  const id = normalizeText(source.documentKey || source.title);
  if (!id) return null;
  return {
    id,
    type: "witness",
    title: normalizeText(source.title) || "Witness",
    subtitle: normalizeText(source.metaLine || source.badge || source.operateSummary),
    basis: normalizeText(source.originLabel || source.badge || "Box witness"),
    documentKey: normalizeText(source.documentKey),
  };
}

function mapReceiptArtifact(draft = null) {
  if (!draft?.id) return null;
  return {
    id: normalizeText(draft.id),
    type: "receipt",
    title: normalizeText(draft.title) || "Receipt draft",
    subtitle: normalizeText(draft.status || draft.stance || "draft"),
    basis: normalizeText(draft.documentKey || "Box receipt"),
  };
}

function mapRouteFocusedArtifact(view = null) {
  const routeArtifactType = normalizeText(view?.routeState?.artifactType).toLowerCase();
  const routeArtifactId = normalizeText(view?.routeState?.artifactId);

  if (routeArtifactType === "library") {
    return {
      id: routeArtifactId || "library",
      type: "library",
      title: "Library artifact",
      subtitle: routeArtifactId
        ? "Requested Library artifact"
        : "Select a Library artifact to inspect",
    };
  }

  return null;
}

export function buildWorkspaceShellContract(view = null) {
  const activeBox = mapBox(view?.project, { active: true });
  const boxes = (Array.isArray(view?.projects) ? view.projects : [])
    .map((project) =>
      mapBox(project, {
        active: normalizeText(project?.projectKey) === normalizeText(activeBox?.key),
      }),
    )
    .filter(Boolean);
  const activeSession = mapSession(view?.session, { active: true });
  const sessions = (Array.isArray(view?.sessions) ? view.sessions : [])
    .map((session) =>
      mapSession(session, {
        active: normalizeText(session?.id || session?.sessionKey) === normalizeText(activeSession?.id),
      }),
    )
    .filter(Boolean);
  const witnessArtifacts = (Array.isArray(view?.recentSources) ? view.recentSources : [])
    .map(mapWitnessArtifact)
    .filter(Boolean);
  const receiptArtifacts = (Array.isArray(view?.receiptSummary?.recentDrafts)
    ? view.receiptSummary.recentDrafts
    : [])
    .map(mapReceiptArtifact)
    .filter(Boolean);
  const routeFocusedArtifact = mapRouteFocusedArtifact(view);
  const evidenceContour = buildEvidenceContour(view?.mirror);

  return {
    activeBox,
    boxes,
    activeSession,
    sessions,
    focusedArtifact:
      routeFocusedArtifact ||
      (view?.focusedWitness
        ? {
            id: normalizeText(view.focusedWitness.documentKey),
            type: "witness",
            title: normalizeText(view.focusedWitness.title) || "Focused witness",
            subtitle: normalizeText(
              view.focusedWitness.sourceSummary || view.focusedWitness.provenanceLabel,
            ),
          }
        : null),
    artifacts: {
      witnesses: witnessArtifacts,
      library: routeFocusedArtifact ? [routeFocusedArtifact] : [],
      receipts: receiptArtifacts,
    },
    canonicalStrip: {
      aim: normalizeText(view?.mirror?.aim?.text),
      evidenceContour,
      returnCondition: buildReturnCondition(view),
      nextMove: normalizeText(view?.pendingMove?.text),
      fieldState: normalizeText(view?.fieldState?.label || view?.fieldState?.key),
    },
    thread: Array.isArray(view?.messages) ? view.messages : [],
    previewState: {
      activePreview: view?.activePreview || null,
      commitment: view?.activePreview ? "provisional" : "accepted",
    },
    returnState: {
      latestReturn: view?.recentReturns?.[0] || null,
    },
    composerScope: {
      label: normalizeText(activeBox?.title) || "Active box",
    },
  };
}
