import { NextResponse } from "next/server";
import { PRIMARY_WORKSPACE_DOCUMENT_KEY } from "@/lib/project-model";
import {
  buildAssemblyIndexEvent,
  normalizeProjectArchitectureMeta,
  validateRootText,
} from "@/lib/assembly-architecture";
import {
  createReadingReceiptDraftForUser,
  getReadingReceiptDraftByIdForUser,
} from "@/lib/reader-db";
import { getReaderProjectForUser, updateReaderProjectForUser } from "@/lib/reader-projects";
import {
  applyMirrorDraftToRoomState,
  commitReceiptKitToRoomState,
  normalizeReceiptKit,
  normalizeRoomMirrorDraft,
} from "@/lib/room";
import { buildRoomWorkspaceViewForUser } from "@/lib/room-server";
import { getRequiredSession } from "@/lib/server-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeLongText(value = "") {
  return String(value || "").trim();
}

function countWords(text = "") {
  const normalized = normalizeText(text);
  return normalized ? normalized.split(/\s+/).length : 0;
}

function bindReceiptKitToDraft(mirrorDraft = null, receiptKit = null) {
  const normalizedDraft = normalizeRoomMirrorDraft(mirrorDraft);
  const normalizedKit = normalizeReceiptKit(receiptKit);
  if (!normalizedKit || normalizedDraft.moveItems.length !== 1) {
    return normalizedDraft;
  }

  return {
    ...normalizedDraft,
    moveItems: normalizedDraft.moveItems.map((item, index) =>
      index === 0 && !item.receiptKitId
        ? {
            ...item,
            receiptKitId: normalizedKit.id,
          }
        : item,
    ),
  };
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

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const projectKey = String(body?.projectKey || "").trim();
  const action = normalizeText(body?.action).toLowerCase();

  if (!projectKey) {
    return NextResponse.json({ ok: false, error: "Box key is required." }, { status: 400 });
  }

  const project = await getReaderProjectForUser(session.user.id, projectKey);
  if (!project) {
    return NextResponse.json({ ok: false, error: "Box not found." }, { status: 404 });
  }

  const projectMeta = normalizeProjectArchitectureMeta(project.metadataJson || project.architectureMeta || null);
  const currentRoomState = projectMeta.room;

  if (action === "apply_mirror_draft") {
    const receiptKit = normalizeReceiptKit(body?.receiptKit);
    const mirrorDraft = bindReceiptKitToDraft(body?.mirrorDraft, receiptKit);
    const assistantMessageId = normalizeText(body?.assistantMessageId);
    const nextRoomState = applyMirrorDraftToRoomState(currentRoomState, mirrorDraft, {
      assistantMessageId,
    });
    const appendEvents = [
      buildAssemblyIndexEvent("room_mirror_applied", {
        move: "Accepted a Room draft into the box mirror.",
        return: "Aim, witness, story, or move structure was persisted.",
        echo: "room-apply",
        context: {
          assistantMessageId,
          aimText: nextRoomState.aim.text,
          evidenceCount: nextRoomState.evidenceItems.length,
          storyCount: nextRoomState.storyItems.length,
          moveCount: nextRoomState.moveItems.length,
        },
      }),
    ];
    const nextProjectUpdate = {
      roomState: nextRoomState,
      touchSystemExample: true,
      appendEvents,
    };
    const nextAimText = normalizeText(mirrorDraft.aimText);
    const nextAimGloss = normalizeText(mirrorDraft.aimGloss);
    if (!projectMeta.root.text && nextAimText && countWords(nextAimText) <= 7) {
      const rootError = validateRootText(nextAimText);
      if (!rootError) {
        nextProjectUpdate.rootText = nextAimText;
        if (nextAimGloss) {
          nextProjectUpdate.rootGloss = nextAimGloss;
        }
      }
    }

    await updateReaderProjectForUser(session.user.id, projectKey, nextProjectUpdate);
    const view = await buildRoomWorkspaceViewForUser(session.user.id, { projectKey });
    return NextResponse.json({ ok: true, view });
  }

  if (action === "complete_receipt_kit") {
    const receiptKit = normalizeReceiptKit(body?.receiptKit);
    if (!receiptKit) {
      return NextResponse.json({ ok: false, error: "Receipt Kit is required." }, { status: 400 });
    }

    const completion = body?.completion && typeof body.completion === "object" ? body.completion : {};
    const mode = normalizeText(completion?.mode).toLowerCase() === "move" ? "move" : "return";
    const viewBefore = await buildRoomWorkspaceViewForUser(session.user.id, { projectKey });
    let uploadedDocument =
      completion?.uploadedDocument && typeof completion.uploadedDocument === "object"
        ? completion.uploadedDocument
        : null;
    const checkedItems = Array.isArray(completion?.checkedItems)
      ? completion.checkedItems.map((item) => normalizeText(item)).filter(Boolean)
      : [];
    const actual =
      normalizeLongText(completion?.actual) ||
      buildChecklistActual({ actual: completion?.actual, checkedItems }) ||
      normalizeText(uploadedDocument?.title) ||
      normalizeText(uploadedDocument?.documentKey);
    let draft = null;

    if (mode === "return") {
      const documentKey =
        normalizeText(uploadedDocument?.documentKey) ||
        normalizeText(viewBefore?.recentSources?.[0]?.documentKey) ||
        normalizeText(project?.currentAssemblyDocumentKey) ||
        PRIMARY_WORKSPACE_DOCUMENT_KEY;

      draft = await createReadingReceiptDraftForUser(session.user.id, {
        projectId: project.id || null,
        projectKey,
        documentKey,
        status: "LOCAL_DRAFT",
        title: `${normalizeText(viewBefore?.project?.title) || "Box"} return receipt`,
        interpretation: actual || "Room return captured.",
        implications: `Predicted: ${normalizeText(receiptKit?.prediction?.expected) || "Not specified"}\nResult: ${normalizeText(completion?.result) || "matched"}`,
        stance: normalizeText(completion?.result) === "contradicted" ? "WORKING" : "TENTATIVE",
        sourceSections: normalizeText(uploadedDocument?.documentKey)
          ? [normalizeText(uploadedDocument.documentKey)]
          : [],
        payload: {
          mode: "room",
          receiptKit,
          returnComparison: {
            predicted: normalizeText(receiptKit?.prediction?.expected),
            actual,
            result: normalizeText(completion?.result) || "matched",
          },
          uploadedDocument,
          checkedItems,
          messageDraft: normalizeLongText(completion?.messageDraft),
          linkUrl: normalizeText(completion?.linkUrl),
        },
      });

      if (draft?.id) {
        uploadedDocument =
          uploadedDocument ||
          (await getReadingReceiptDraftByIdForUser(session.user.id, draft.id))?.payload?.uploadedDocument ||
          null;
      }
    }

    const nextRoomState = commitReceiptKitToRoomState(currentRoomState, {
      receiptKit,
      mode,
      result: normalizeText(completion?.result) || "matched",
      actual,
      moveText: normalizeText(completion?.moveText) || normalizeText(completion?.messageDraft),
      uploadedDocument,
      draftId: draft?.id || "",
    });

    await updateReaderProjectForUser(session.user.id, projectKey, {
      roomState: nextRoomState,
      touchSystemExample: true,
      appendEvents: [
        buildAssemblyIndexEvent(mode === "move" ? "room_ping_sent" : "room_return_recorded", {
          move:
            mode === "move"
              ? `Sent Room ping: ${normalizeText(completion?.moveText) || normalizeText(receiptKit.fastestPath) || normalizeText(receiptKit.need)}`
              : `Recorded Room return for ${normalizeText(receiptKit.need) || "the active ping"}.`,
          return:
            mode === "move"
              ? "The room is now waiting for reality to answer."
              : `Return classified as ${normalizeText(completion?.result) || "matched"}.`,
          echo: mode === "move" ? "awaiting" : normalizeText(completion?.result) || "matched",
          context: {
            receiptKitId: receiptKit.id,
            actual,
            result: normalizeText(completion?.result) || "matched",
            draftId: draft?.id || null,
            uploadedDocumentKey: normalizeText(uploadedDocument?.documentKey) || null,
            checkedItems,
          },
        }),
      ],
    });

    const view = await buildRoomWorkspaceViewForUser(session.user.id, { projectKey });
    return NextResponse.json({
      ok: true,
      view,
      draft,
    });
  }

  return NextResponse.json({ ok: false, error: "Unknown Room apply action." }, { status: 400 });
}
