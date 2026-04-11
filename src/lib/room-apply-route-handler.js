import {
  extractRoomPayloadFromCitations,
  normalizeReceiptKit,
} from "./room.js";
import { buildRoomSemanticContext, hasCanonicalProposalSegments } from "./room-turn-policy.mjs";
import {
  applyArtifactToRuntimeWindow,
  compileRoomSource,
  createOrHydrateRoomRuntimeWindow,
  runRoomProposalGate,
} from "./room-canonical.js";

const PRIMARY_WORKSPACE_DOCUMENT_KEY = "assembled-reality-v07-final";

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeLongText(value = "") {
  return String(value || "").trim();
}

function json(body, status = 200) {
  return { body, status };
}

function inferScalarKind(value = "") {
  const normalized = normalizeText(value);
  if (!normalized) return "text";
  if (/^(true|false)$/i.test(normalized)) return "bool";
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return "date";
  if (/^-?\d+(\.\d+)?$/.test(normalized)) return "score";
  return "text";
}

function makeIdentifier(value = "", fallback = "room_value") {
  return (
    normalizeText(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 80) || fallback
  );
}

function buildChecklistActual(completion = {}) {
  const checkedItems = Array.isArray(completion?.checkedItems)
    ? completion.checkedItems.map((item) => normalizeText(item)).filter(Boolean)
    : [];
  const note = normalizeLongText(completion?.actual);
  if (checkedItems.length && note) {
    return `${checkedItems.join(", ")}\n\n${note}`.trim();
  }
  if (checkedItems.length) return checkedItems.join(", ");
  return note;
}

function findAssistantMessage(thread = null, assistantMessageId = "") {
  const normalizedId = normalizeText(assistantMessageId);
  if (!normalizedId) return null;
  return (thread?.messages || []).find(
    (message) =>
      message?.id === normalizedId &&
      String(message?.role || "").toUpperCase() === "ASSISTANT",
  );
}

function buildApplyEvent({ kind, proposalId = "", assistantMessageId = "", detail = "" } = {}) {
  return {
    kind,
    proposalId: normalizeText(proposalId),
    assistantMessageId: normalizeText(assistantMessageId),
    detail: normalizeText(detail),
  };
}

function buildReturnEvent(actual = "", provenanceLabel = "") {
  return {
    kind: "return_received",
    actual: normalizeLongText(actual),
    provenanceLabel: normalizeText(provenanceLabel).toLowerCase(),
  };
}

function buildRoomReceiptDraftTitle(view = null) {
  return `${normalizeText(view?.project?.title) || "Box"} return receipt`;
}

async function createLocalReceiptDraft(deps, {
  userId,
  project = null,
  view = null,
  roomDocument = null,
  receiptKit = null,
  completion = {},
  uploadedDocument = null,
  actual = "",
}) {
  if (!deps.createReadingReceiptDraftForUser || !deps.getReadingReceiptDraftByIdForUser) {
    const readerDb = await import("./reader-db.js");
    deps.createReadingReceiptDraftForUser ||= readerDb.createReadingReceiptDraftForUser;
    deps.getReadingReceiptDraftByIdForUser ||= readerDb.getReadingReceiptDraftByIdForUser;
  }

  const documentKey =
    normalizeText(uploadedDocument?.documentKey) ||
    normalizeText(view?.recentSources?.[0]?.documentKey) ||
    normalizeText(project?.currentAssemblyDocumentKey) ||
    normalizeText(roomDocument?.documentKey) ||
    PRIMARY_WORKSPACE_DOCUMENT_KEY;

  const draft = await deps.createReadingReceiptDraftForUser(userId, {
    projectId: project?.id || null,
    projectKey: project?.projectKey || view?.project?.projectKey || "",
    documentKey,
    status: "LOCAL_DRAFT",
    title: buildRoomReceiptDraftTitle(view),
    interpretation: actual || "Room return captured.",
    implications: `Predicted: ${normalizeText(receiptKit?.prediction?.expected) || "Not specified"}\nResult: ${normalizeText(completion?.result) || "matched"}`,
    stance: normalizeText(completion?.result) === "contradicted" ? "WORKING" : "TENTATIVE",
    sourceSections: normalizeText(uploadedDocument?.documentKey)
      ? [normalizeText(uploadedDocument.documentKey)]
      : [],
    payload: {
      mode: "room",
      receiptKit,
      completion,
      actual,
      uploadedDocument,
    },
  });

  if (!draft?.id) return null;
  return deps.getReadingReceiptDraftByIdForUser(userId, draft.id);
}

function buildReceiptCompletionProposal({
  receiptKit = null,
  completion = {},
  uploadedDocument = null,
  actual = "",
}) {
  const mode = normalizeText(completion?.mode).toLowerCase() === "move" ? "move" : "return";
  const segments = [];
  const moveText =
    normalizeText(completion?.moveText) ||
    normalizeText(completion?.messageDraft) ||
    normalizeText(receiptKit?.fastestPath) ||
    normalizeText(receiptKit?.need);
  const testText =
    normalizeText(receiptKit?.prediction?.expected) ||
    normalizeText(receiptKit?.enough) ||
    "Reality answers the active move clearly.";

  if (mode === "move") {
    segments.push(
      {
        text: moveText,
        domain: "move",
        suggestedClause: `MOV move "${moveText.replace(/"/g, '\\"')}" via manual`,
        intent: "move",
      },
      {
        text: testText,
        domain: "test",
        suggestedClause: `TST test "${testText.replace(/"/g, '\\"')}"`,
        intent: "test",
      },
    );

    return {
      proposal: { segments },
      receiptEntry: null,
      mode,
      provenanceLabel: "",
      actual: "",
    };
  }

  let provenanceLabel = "user_entered";
  let via = "user";

  if (normalizeText(uploadedDocument?.documentKey)) {
    const fileRef = makeIdentifier(
      uploadedDocument?.documentKey || uploadedDocument?.title || uploadedDocument?.originalFilename,
      "uploaded_document",
    );
    const filename = normalizeText(
      uploadedDocument?.title || uploadedDocument?.originalFilename || uploadedDocument?.documentKey,
    );
    segments.push({
      text: filename || "Uploaded document",
      domain: "witness",
      suggestedClause: `GND witness @${fileRef} from "${filename.replace(/"/g, '\\"')}" with hash_${fileRef}`,
      intent: "ground",
    });
    segments.push({
      text: actual || filename,
      domain: "return",
      suggestedClause: `RTN receipt @${fileRef} via service as ${inferScalarKind(actual || filename)}`,
      intent: "capture",
    });
    provenanceLabel = "uploaded_document";
    via = "service";
  } else if (normalizeText(completion?.linkUrl)) {
    segments.push({
      text: actual || normalizeText(completion.linkUrl),
      domain: "return",
      suggestedClause: `RTN observe "${(actual || normalizeText(completion.linkUrl)).replace(/"/g, '\\"')}" via third_party as text`,
      intent: "observe",
    });
    provenanceLabel = "linked_source";
    via = "third_party";
  } else {
    segments.push({
      text: actual,
      domain: "return",
      suggestedClause: `RTN observe "${actual.replace(/"/g, '\\"')}" via user as ${inferScalarKind(actual)}`,
      intent: "observe",
    });
  }

  const receiptEntry = {
    label: normalizeText(receiptKit?.need) || "Return",
    predicted: normalizeText(receiptKit?.prediction?.expected),
    actual,
    result: normalizeText(completion?.result).toLowerCase() || "matched",
    via,
    provenanceLabel,
    receiptKitId: normalizeText(receiptKit?.id),
    draftId: "",
  };

  return {
    proposal: { segments },
    receiptEntry,
    mode,
    provenanceLabel,
    actual,
  };
}

export async function createRoomApplyRouteDependencies(overrides = {}) {
  const deps = {
    extractRoomPayloadFromCitations,
    normalizeReceiptKit,
    buildRoomSemanticContext,
    hasCanonicalProposalSegments,
    applyArtifactToRuntimeWindow,
    compileRoomSource,
    createOrHydrateRoomRuntimeWindow,
    runRoomProposalGate,
    ...overrides,
  };

  if (!deps.getReaderProjectForUser) {
    const readerProjects = await import("./reader-projects.js");
    deps.getReaderProjectForUser = readerProjects.getReaderProjectForUser;
  }

  if (!deps.buildRoomWorkspaceViewForUser) {
    const roomServer = await import("./room-server.js");
    deps.buildRoomWorkspaceViewForUser = roomServer.buildRoomWorkspaceViewForUser;
  }

  if (!deps.getRequiredSession) {
    const serverSession = await import("./server-session.js");
    deps.getRequiredSession = serverSession.getRequiredSession;
  }

  if (!deps.loadConversationThreadForUser) {
    const readerWorkspace = await import("./reader-workspace.js");
    deps.loadConversationThreadForUser = readerWorkspace.loadConversationThreadForUser;
  }

  if (!deps.ensureCompilerFirstWorkspaceResetForUser) {
    const roomSessions = await import("./room-sessions.js");
    deps.ensureCompilerFirstWorkspaceResetForUser =
      roomSessions.ensureCompilerFirstWorkspaceResetForUser;
  }

  if (
    !deps.ensureRoomAssemblyDocumentForProject ||
    !deps.getRoomAssemblySource ||
    !deps.saveRoomAssemblySourceForUser
  ) {
    const roomDocuments = await import("./room-documents.js");
    deps.ensureRoomAssemblyDocumentForProject ||= roomDocuments.ensureRoomAssemblyDocumentForProject;
    deps.getRoomAssemblySource ||= roomDocuments.getRoomAssemblySource;
    deps.saveRoomAssemblySourceForUser ||= roomDocuments.saveRoomAssemblySourceForUser;
  }

  return deps;
}

export async function handleRoomApplyPost(request, overrides = {}) {
  const deps = await createRoomApplyRouteDependencies(overrides);
  const session = await deps.getRequiredSession();
  if (!session?.user?.id) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  await deps.ensureCompilerFirstWorkspaceResetForUser(session.user.id);

  const body = await request.json().catch(() => null);
  const projectKey = String(body?.projectKey || "").trim();
  const sessionId = String(body?.sessionId || "").trim();
  const documentKey = String(body?.documentKey || body?.document || "").trim();
  const action = normalizeText(body?.action).toLowerCase();

  if (!projectKey) {
    return json({ ok: false, error: "Box key is required." }, 400);
  }

  const project = await deps.getReaderProjectForUser(session.user.id, projectKey);
  if (!project) {
    return json({ ok: false, error: "Box not found." }, 404);
  }

  const sessionView = await deps.buildRoomWorkspaceViewForUser(session.user.id, {
    projectKey: project.projectKey,
    sessionId,
    documentKey,
  });
  if (!normalizeText(sessionView?.session?.threadDocumentKey)) {
    return json({ ok: false, error: "Conversation not found." }, 404);
  }

  const roomDocument = await deps.ensureRoomAssemblyDocumentForProject(session.user.id, project.projectKey);
  const currentSource = deps.getRoomAssemblySource(roomDocument);
  const currentArtifact = deps.compileRoomSource({
    source: currentSource,
    filename: `${roomDocument?.documentKey || "room"}.loe`,
  });
  const currentWindow = deps.createOrHydrateRoomRuntimeWindow(roomDocument, currentArtifact);

  if (action === "apply_proposal_preview") {
    const assistantMessageId = normalizeText(body?.assistantMessageId);
    if (!assistantMessageId) {
      return json({ ok: false, error: "Assistant message is required." }, 400);
    }

    const thread = await deps.loadConversationThreadForUser(
      session.user.id,
      sessionView.session.threadDocumentKey,
    );
    const assistantMessage = findAssistantMessage(thread, assistantMessageId);
    if (!assistantMessage) {
      return json({ ok: false, error: "Proposal preview not found." }, 404);
    }

    const roomPayload = deps.extractRoomPayloadFromCitations(assistantMessage.citations);
    if (!roomPayload || normalizeText(roomPayload?.turnMode).toLowerCase() !== "proposal") {
      return json({ ok: false, error: "That message has no Room proposal." }, 400);
    }
    if (!deps.hasCanonicalProposalSegments(roomPayload)) {
      return json({ ok: false, error: "That message has no Room proposal." }, 400);
    }

    const viewBefore = sessionView;
    const gate = deps.runRoomProposalGate({
      currentSource,
      proposal: roomPayload,
      filename: `${roomDocument?.documentKey || "room"}.loe`,
      runtimeWindow: currentWindow,
      semanticContext: deps.buildRoomSemanticContext({
        currentSource,
        recentSources: viewBefore?.recentSources,
        latestUserMessage: thread?.messages?.findLast?.(
          (message) => String(message?.role || "").toUpperCase() === "USER",
        )?.content,
      }),
    });

    if (!gate.accepted) {
      return json(
        {
          ok: false,
          error: "That proposal is no longer lawful to apply.",
          gatePreview: gate.gatePreview,
        },
        400,
      );
    }

    let nextWindow = deps.applyArtifactToRuntimeWindow(currentWindow, gate.artifact, {
      previousArtifact: currentArtifact,
      event: buildApplyEvent({
        kind: "proposal_applied",
        proposalId: roomPayload.proposalId,
        assistantMessageId,
        detail: "Applied accepted Room proposal.",
      }),
    });

    const priorReturnCount = (currentArtifact?.ast || []).filter((clause) => clause.head === "RTN").length;
    const nextReturnCount = (gate.artifact?.ast || []).filter((clause) => clause.head === "RTN").length;
    if (nextReturnCount > priorReturnCount) {
      const latestReturn = gate.artifact.ast.filter((clause) => clause.head === "RTN").at(-1);
      nextWindow = {
        ...nextWindow,
        events: [
          ...(Array.isArray(nextWindow.events) ? nextWindow.events : []),
          {
            ...buildReturnEvent(
              normalizeText(latestReturn?.positional?.[0]?.value || latestReturn?.positional?.[0]?.raw),
              normalizeText(latestReturn?.keywords?.via?.value || "user"),
            ),
            id: `evt_${(Array.isArray(nextWindow.events) ? nextWindow.events.length : 0) + 1}`,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    }

    await deps.saveRoomAssemblySourceForUser(session.user.id, roomDocument.documentKey, {
      source: gate.nextSource,
      runtimeWindow: nextWindow,
    });

    const view = await deps.buildRoomWorkspaceViewForUser(session.user.id, {
      projectKey: project.projectKey,
      sessionId: sessionView.session.id,
      documentKey,
    });
    return json({ ok: true, view });
  }

  if (action === "complete_receipt_kit") {
    const receiptKit = deps.normalizeReceiptKit(body?.receiptKit);
    if (!receiptKit) {
      return json({ ok: false, error: "Receipt Kit is required." }, 400);
    }

    const completion = body?.completion && typeof body.completion === "object" ? body.completion : {};
    const mode = normalizeText(completion?.mode).toLowerCase() === "move" ? "move" : "return";
    let uploadedDocument =
      completion?.uploadedDocument && typeof completion.uploadedDocument === "object"
        ? completion.uploadedDocument
        : null;
    const actual =
      normalizeLongText(completion?.actual) ||
      buildChecklistActual({ actual: completion?.actual, checkedItems: completion?.checkedItems }) ||
      normalizeText(uploadedDocument?.title) ||
      normalizeText(uploadedDocument?.documentKey);

    const proposalBundle = buildReceiptCompletionProposal({
      receiptKit,
      completion,
      uploadedDocument,
      actual,
    });

    const viewBefore = sessionView;
    const gate = deps.runRoomProposalGate({
      currentSource,
      proposal: proposalBundle.proposal,
      filename: `${roomDocument?.documentKey || "room"}.loe`,
      runtimeWindow: currentWindow,
      semanticContext: deps.buildRoomSemanticContext({
        currentSource,
        recentSources: viewBefore?.recentSources,
        latestUserMessage:
          mode === "return"
            ? actual
            : normalizeText(completion?.moveText) || normalizeText(completion?.messageDraft),
      }),
    });

    if (!gate.accepted) {
      return json(
        {
          ok: false,
          error: "The receipt completion is not lawful yet.",
          gatePreview: gate.gatePreview,
        },
        400,
      );
    }

    let draft = null;
    if (mode === "return") {
      draft = await createLocalReceiptDraft(deps, {
        userId: session.user.id,
        project,
        view: viewBefore,
        roomDocument,
        receiptKit,
        completion,
        uploadedDocument,
        actual,
      });
      if (draft?.payload?.uploadedDocument && !uploadedDocument) {
        uploadedDocument = draft.payload.uploadedDocument;
      }
    }

    const receiptEntry = proposalBundle.receiptEntry
      ? {
          ...proposalBundle.receiptEntry,
          draftId: draft?.id || "",
        }
      : null;

    const nextWindow = deps.applyArtifactToRuntimeWindow(currentWindow, gate.artifact, {
      previousArtifact: currentArtifact,
      event: buildApplyEvent({
        kind: mode === "move" ? "ping_sent" : "receipt_kit_completed",
        detail: mode === "move" ? "Committed lawful ping clauses." : "Recorded Room return.",
      }),
      receipt: receiptEntry,
    });

    await deps.saveRoomAssemblySourceForUser(session.user.id, roomDocument.documentKey, {
      source: gate.nextSource,
      runtimeWindow: nextWindow,
    });

    const view = await deps.buildRoomWorkspaceViewForUser(session.user.id, {
      projectKey: project.projectKey,
      sessionId: sessionView.session.id,
      documentKey,
    });
    return json({
      ok: true,
      view,
      draft,
    });
  }

  return json({ ok: false, error: "Unknown Room apply action." }, 400);
}
