import { NextResponse } from "next/server";
import {
  normalizeWorkspaceBlocks,
} from "@/lib/document-blocks";
import {
  createRemoteReadingReceiptDraft,
  getGetReceiptsConnectionForUser,
} from "@/lib/getreceipts";
import { createReadingReceiptDraftForUser, getReaderProfileByUserId } from "@/lib/reader-db";
import { listReaderDocumentsForUser } from "@/lib/reader-documents";
import { getRequiredSession } from "@/lib/server-session";
import {
  buildWorkspaceReceiptDraftInput,
  buildWorkspaceReceiptPayload,
} from "@/lib/workspace-receipts";
import { createAssemblyDocumentForUser } from "@/lib/workspace-documents";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const title = String(body?.title || "").trim() || "Assembly";
  const subtitle = String(body?.subtitle || "").trim();
  const blocks = normalizeWorkspaceBlocks(body?.blocks, {
    documentKey: "",
    defaultSourceDocumentKey: "assembly",
    defaultIsEditable: true,
    defaultIsAssemblyBlock: true,
    defaultOperation: "assembled",
  });
  const createReceipt = body?.createReceipt !== false;

  if (blocks.length === 0) {
    return NextResponse.json(
      { error: "Select at least one block before assembling." },
      { status: 400 },
    );
  }

  try {
    const document = await createAssemblyDocumentForUser(session.user.id, {
      title,
      subtitle,
      blocks,
    });

    let draft = null;
    let remoteReceipt = null;
    let remoteError = null;

    if (createReceipt) {
      const [readerData, connection] = await Promise.all([
        getReaderProfileByUserId(session.user.id),
        getGetReceiptsConnectionForUser(session.user.id),
      ]);

      if (readerData?.profile) {
        const payload = buildWorkspaceReceiptPayload({
          profile: readerData.profile,
          document,
          blocks: document.blocks,
          logEntries: document.logEntries,
          mode: "assembly",
        });
        let status = "LOCAL_DRAFT";

        if (connection?.status === "CONNECTED" && connection?.accessTokenEncrypted) {
          try {
            remoteReceipt = await createRemoteReadingReceiptDraft(connection, payload);
            status = "REMOTE_DRAFT";
          } catch (error) {
            remoteError =
              error instanceof Error ? error.message : "getreceipts-create-failed";
          }
        }

        draft = await createReadingReceiptDraftForUser(session.user.id, {
          ...buildWorkspaceReceiptDraftInput({
            document,
            blocks: document.blocks,
            logEntries: document.logEntries,
            remoteReceiptId: remoteReceipt?.id || null,
            status,
            mode: "assembly",
          }),
          payload: {
            ...payload,
            remoteReceipt,
            remoteError,
          },
        });
      }
    }

    const documents = await listReaderDocumentsForUser(session.user.id);

    return NextResponse.json({
      ok: true,
      document,
      documents,
      draft,
      remoteReceipt,
      remoteError,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not assemble the document." },
      { status: 400 },
    );
  }
}
