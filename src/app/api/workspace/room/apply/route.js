import { NextResponse } from "next/server";
import { PRIMARY_WORKSPACE_DOCUMENT_KEY } from "@/lib/project-model";
import {
  createReadingReceiptDraftForUser,
  getReadingReceiptDraftByIdForUser,
} from "@/lib/reader-db";
import { getReaderProjectForUser } from "@/lib/reader-projects";
import { buildRoomWorkspaceViewForUser } from "@/lib/room-server";
import { getRequiredSession } from "@/lib/server-session";
import { loadConversationThreadForUser } from "@/lib/reader-workspace";
import {
  extractRoomPayloadFromCitations,
  normalizeReceiptKit,
} from "@/lib/room";
import { ensureCompilerFirstWorkspaceResetForUser } from "@/lib/room-sessions";
import { buildRoomSemanticContext, hasCanonicalProposalSegments } from "@/lib/room-turn-policy.mjs";
import {
  applyArtifactToRuntimeWindow,
  compileRoomSource,
  createOrHydrateRoomRuntimeWindow,
  runRoomProposalGate,
} from "@/lib/room-canonical";
import {
  ensureRoomAssemblyDocumentForProject,
  getRoomAssemblySource,
  saveRoomAssemblySourceForUser,
} from "@/lib/room-documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeLongText(value = "") {
  return String(value || "").trim();
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

async function createLocalReceiptDraft({
  userId,
  project = null,
  view = null,
  roomDocument = null,
  receiptKit = null,
  completion = {},
  uploadedDocument = null,
  actual = "",
}) {
  const documentKey =
    normalizeText(uploadedDocument?.documentKey) ||
    normalizeText(view?.recentSources?.[0]?.documentKey) ||
    normalizeText(project?.currentAssemblyDocumentKey) ||
    normalizeText(roomDocument?.documentKey) ||
    PRIMARY_WORKSPACE_DOCUMENT_KEY;

  const draft = await createReadingReceiptDraftForUser(userId, {
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
  return getReadingReceiptDraftByIdForUser(userId, draft.id);
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

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  await ensureCompilerFirstWorkspaceResetForUser(session.user.id);

  const body = await request.json().catch(() => null);
  const projectKey = String(body?.projectKey || "").trim();
  const sessionId = String(body?.sessionId || "").trim();
  const documentKey = String(body?.documentKey || body?.document || "").trim();
  const action = normalizeText(body?.action).toLowerCase();

  if (!projectKey) {
    return NextResponse.json({ ok: false, error: "Box key is required." }, { status: 400 });
  }

  const project = await getReaderProjectForUser(session.user.id, projectKey);
  if (!project) {
    return NextResponse.json({ ok: false, error: "Box not found." }, { status: 404 });
  }

  const sessionView = await buildRoomWorkspaceViewForUser(session.user.id, {
    projectKey: project.projectKey,
    sessionId,
    documentKey,
  });
  if (!normalizeText(sessionView?.session?.threadDocumentKey)) {
    return NextResponse.json({ ok: false, error: "Conversation not found." }, { status: 404 });
  }

  const roomDocument = await ensureRoomAssemblyDocumentForProject(session.user.id, project.projectKey);
  const currentSource = getRoomAssemblySource(roomDocument);
  const currentArtifact = compileRoomSource({
    source: currentSource,
    filename: `${roomDocument?.documentKey || "room"}.loe`,
  });
  const currentWindow = createOrHydrateRoomRuntimeWindow(roomDocument, currentArtifact);

  if (action === "apply_proposal_preview") {
    const assistantMessageId = normalizeText(body?.assistantMessageId);
    if (!assistantMessageId) {
      return NextResponse.json({ ok: false, error: "Assistant message is required." }, { status: 400 });
    }

    const thread = await loadConversationThreadForUser(
      session.user.id,
      sessionView.session.threadDocumentKey,
    );
    const assistantMessage = findAssistantMessage(thread, assistantMessageId);
    if (!assistantMessage) {
      return NextResponse.json({ ok: false, error: "Proposal preview not found." }, { status: 404 });
    }

    const roomPayload = extractRoomPayloadFromCitations(assistantMessage.citations);
    if (!roomPayload || normalizeText(roomPayload?.turnMode).toLowerCase() !== "proposal") {
      return NextResponse.json({ ok: false, error: "That message has no Room proposal." }, { status: 400 });
    }
    if (!hasCanonicalProposalSegments(roomPayload)) {
      return NextResponse.json({ ok: false, error: "That message has no Room proposal." }, { status: 400 });
    }

    const viewBefore = sessionView;

    const gate = runRoomProposalGate({
      currentSource,
      proposal: roomPayload,
      filename: `${roomDocument?.documentKey || "room"}.loe`,
      runtimeWindow: currentWindow,
      semanticContext: buildRoomSemanticContext({
        currentSource,
        recentSources: viewBefore?.recentSources,
        latestUserMessage: thread?.messages?.findLast?.(
          (message) => String(message?.role || "").toUpperCase() === "USER",
        )?.content,
      }),
    });

    if (!gate.accepted) {
      return NextResponse.json(
        { ok: false, error: "That proposal is no longer lawful to apply.", gatePreview: gate.gatePreview },
        { status: 400 },
      );
    }

    let nextWindow = applyArtifactToRuntimeWindow(currentWindow, gate.artifact, {
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

    await saveRoomAssemblySourceForUser(session.user.id, roomDocument.documentKey, {
      source: gate.nextSource,
      runtimeWindow: nextWindow,
    });

    const view = await buildRoomWorkspaceViewForUser(session.user.id, {
      projectKey: project.projectKey,
      sessionId: sessionView.session.id,
      documentKey,
    });
    return NextResponse.json({ ok: true, view });
  }

  if (action === "complete_receipt_kit") {
    const receiptKit = normalizeReceiptKit(body?.receiptKit);
    if (!receiptKit) {
      return NextResponse.json({ ok: false, error: "Receipt Kit is required." }, { status: 400 });
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
    const gate = runRoomProposalGate({
      currentSource,
      proposal: proposalBundle.proposal,
      filename: `${roomDocument?.documentKey || "room"}.loe`,
      runtimeWindow: currentWindow,
      semanticContext: buildRoomSemanticContext({
        currentSource,
        recentSources: viewBefore?.recentSources,
        latestUserMessage:
          mode === "return"
            ? actual
            : normalizeText(completion?.moveText) || normalizeText(completion?.messageDraft),
      }),
    });

    if (!gate.accepted) {
      return NextResponse.json(
        { ok: false, error: "The receipt completion is not lawful yet.", gatePreview: gate.gatePreview },
        { status: 400 },
      );
    }

    let draft = null;

    if (mode === "return") {
      draft = await createLocalReceiptDraft({
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

    const nextWindow = applyArtifactToRuntimeWindow(currentWindow, gate.artifact, {
      previousArtifact: currentArtifact,
      event: buildApplyEvent({
        kind: mode === "move" ? "ping_sent" : "receipt_kit_completed",
        detail: mode === "move" ? "Committed lawful ping clauses." : "Recorded Room return.",
      }),
      receipt: receiptEntry,
    });

    await saveRoomAssemblySourceForUser(session.user.id, roomDocument.documentKey, {
      source: gate.nextSource,
      runtimeWindow: nextWindow,
    });

    const view = await buildRoomWorkspaceViewForUser(session.user.id, {
      projectKey: project.projectKey,
      sessionId: sessionView.session.id,
      documentKey,
    });
    return NextResponse.json({
      ok: true,
      view,
      draft,
    });
  }

  return NextResponse.json({ ok: false, error: "Unknown Room apply action." }, { status: 400 });
}
