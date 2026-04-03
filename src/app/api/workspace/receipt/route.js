import { NextResponse } from "next/server";
import {
  normalizeWorkspaceBlocks,
  normalizeWorkspaceLogEntries,
} from "@/lib/document-blocks";
import {
  createRemoteReadingReceiptDraft,
  getGetReceiptsConnectionForUser,
} from "@/lib/getreceipts";
import { createReadingReceiptDraftForUser, getReaderProfileByUserId } from "@/lib/reader-db";
import { getRequiredSession } from "@/lib/server-session";
import {
  buildWorkspaceReceiptDraftInput,
  buildWorkspaceReceiptPayload,
} from "@/lib/workspace-receipts";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const document = body?.document || null;
  const blocks = normalizeWorkspaceBlocks(body?.blocks, {
    documentKey: document?.documentKey || "",
    defaultSourceDocumentKey: document?.documentKey || "",
    defaultIsEditable: true,
    defaultIsAssemblyBlock: Boolean(document?.isAssembly),
  });
  const logEntries = normalizeWorkspaceLogEntries(
    body?.logEntries,
    document?.documentKey || "",
  );

  if (!document?.documentKey) {
    return NextResponse.json({ error: "Document is required." }, { status: 400 });
  }

  const [readerData, connection] = await Promise.all([
    getReaderProfileByUserId(session.user.id),
    getGetReceiptsConnectionForUser(session.user.id),
  ]);

  if (!readerData?.profile) {
    return NextResponse.json({ error: "Reader profile not found." }, { status: 404 });
  }

  const mode = document?.isAssembly ? "assembly" : "workspace";
  const payload = buildWorkspaceReceiptPayload({
    profile: readerData.profile,
    document,
    blocks,
    logEntries,
    mode,
  });

  let remoteReceipt = null;
  let remoteError = null;
  let status = "LOCAL_DRAFT";

  if (connection?.status === "CONNECTED" && connection?.accessTokenEncrypted) {
    try {
      remoteReceipt = await createRemoteReadingReceiptDraft(connection, payload);
      status = "REMOTE_DRAFT";
    } catch (error) {
      remoteError = error instanceof Error ? error.message : "getreceipts-create-failed";
    }
  }

  const draft = await createReadingReceiptDraftForUser(session.user.id, {
    ...buildWorkspaceReceiptDraftInput({
      document,
      blocks,
      logEntries,
      remoteReceiptId: remoteReceipt?.id || null,
      status,
      mode,
    }),
    payload: {
      ...payload,
      remoteReceipt,
      remoteError,
    },
  });

  return NextResponse.json({
    ok: true,
    draft,
    remoteReceipt,
    remoteError,
  });
}
