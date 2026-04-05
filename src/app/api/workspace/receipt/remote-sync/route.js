import { NextResponse } from "next/server";
import {
  createRemoteReadingReceiptDraft,
  getGetReceiptsConnectionForUser,
} from "@/lib/getreceipts";
import {
  buildRemoteSealState,
  sanitizeRemoteReceiptPayload,
  syncReceiptDraftToCourthouse,
} from "@/lib/receipt-remote-sync";
import {
  getReadingReceiptDraftByIdForUser,
  updateReadingReceiptDraftForUser,
} from "@/lib/reader-db";
import { getRequiredSession } from "@/lib/server-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isDraftRetryable(draft = null) {
  const status = String(draft?.status || "").trim().toUpperCase();
  const remoteSealStatus = String(draft?.payload?.remoteSeal?.status || "").trim().toLowerCase();

  if (status === "SEALED") return true;
  return (
    remoteSealStatus === "pending_create" ||
    remoteSealStatus === "pending_seal" ||
    remoteSealStatus === "failed"
  );
}

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const draftId = String(body?.draftId || "").trim();

  if (!draftId) {
    return NextResponse.json({ error: "Receipt draft is required." }, { status: 400 });
  }

  const draft = await getReadingReceiptDraftByIdForUser(session.user.id, draftId);
  if (!draft) {
    return NextResponse.json({ error: "Receipt draft not found." }, { status: 404 });
  }

  if (!isDraftRetryable(draft)) {
    return NextResponse.json(
      { error: "Only sealed or retryable receipt drafts can sync to GetReceipts." },
      { status: 400 },
    );
  }

  const connection = await getGetReceiptsConnectionForUser(session.user.id);
  if (connection?.status !== "CONNECTED" || !connection?.accessTokenEncrypted) {
    return NextResponse.json(
      { error: "Connect GetReceipts before retrying courthouse sync." },
      { status: 409 },
    );
  }

  const payload = draft?.payload && typeof draft.payload === "object" ? draft.payload : {};
  const evidenceSnapshot =
    payload?.evidenceSnapshot && typeof payload.evidenceSnapshot === "object"
      ? payload.evidenceSnapshot
      : null;

  if (String(draft.status || "").trim().toUpperCase() === "SEALED") {
    const remoteSync = await syncReceiptDraftToCourthouse({
      userId: session.user.id,
      connection,
      draft,
      remotePayload: payload,
      evidenceSnapshot,
    });

    const nextPayload = {
      ...payload,
      remoteReceipt: remoteSync?.remoteReceipt || payload.remoteReceipt || null,
      remoteError: remoteSync?.ok
        ? null
        : remoteSync?.error instanceof Error
          ? remoteSync.error.message
          : payload.remoteError || null,
      remoteSeal: remoteSync?.remoteSeal || payload.remoteSeal || null,
      sealedAt: remoteSync?.remoteSeal?.sealedAt || payload.sealedAt || null,
    };

    const updatedDraft = await updateReadingReceiptDraftForUser(session.user.id, draftId, {
      status: "SEALED",
      getReceiptsReceiptId:
        remoteSync?.remoteReceiptId ||
        draft.getReceiptsReceiptId ||
        null,
      payload: nextPayload,
    });

    return NextResponse.json({
      ok: true,
      draft: updatedDraft,
      remoteSync,
    });
  }

  try {
    const remoteReceipt = await createRemoteReadingReceiptDraft(
      connection,
      sanitizeRemoteReceiptPayload(payload),
    );
    const updatedDraft = await updateReadingReceiptDraftForUser(session.user.id, draftId, {
      status: "REMOTE_DRAFT",
      getReceiptsReceiptId: remoteReceipt?.id || draft.getReceiptsReceiptId || null,
      payload: {
        ...payload,
        remoteReceipt,
        remoteError: null,
        remoteSeal: buildRemoteSealState({
          previous: payload.remoteSeal,
          status: "pending_seal",
          receiptId: remoteReceipt?.id || null,
        }),
      },
    });

    return NextResponse.json({
      ok: true,
      draft: updatedDraft,
      remoteSync: {
        ok: true,
        remoteReceiptId: remoteReceipt?.id || null,
        remoteReceipt,
      },
    });
  } catch (error) {
    const remoteSeal = buildRemoteSealState({
      previous: payload.remoteSeal,
      status: error?.retryable ? "pending_create" : "failed",
      error,
    });
    const updatedDraft = await updateReadingReceiptDraftForUser(session.user.id, draftId, {
      payload: {
        ...payload,
        remoteError: error instanceof Error ? error.message : "getreceipts-create-failed",
        remoteSeal,
      },
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not sync the receipt draft to GetReceipts.",
        draft: updatedDraft,
        remoteSync: {
          ok: false,
          remoteSeal,
        },
      },
      { status: 502 },
    );
  }
}
