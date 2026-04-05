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
import { getReaderProjectForUser, updateReaderProjectForUser } from "@/lib/reader-projects";
import { getRequiredSession } from "@/lib/server-session";
import { buildAssemblyIndexEvent } from "@/lib/assembly-architecture";
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
  const projectKey = String(body?.projectKey || "").trim();
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
      projectKey,
      blocks,
    });

    let draft = null;
    let remoteReceipt = null;
    let remoteError = null;

    if (createReceipt) {
      const [readerData, connection, project] = await Promise.all([
        getReaderProfileByUserId(session.user.id),
        getGetReceiptsConnectionForUser(session.user.id),
        projectKey ? getReaderProjectForUser(session.user.id, projectKey) : null,
      ]);

      if (readerData?.profile) {
        const payload = buildWorkspaceReceiptPayload({
          profile: readerData.profile,
          project,
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
          projectId: project?.id || null,
          projectKey,
          payload: {
            ...payload,
            remoteReceipt,
            remoteError,
          },
        });

        if (projectKey) {
          await updateReaderProjectForUser(session.user.id, projectKey, {
            appendEvents: [
              buildAssemblyIndexEvent("receipt_drafted", {
                move: `Drafted receipt ${draft.title || draft.id} for ${document.title || document.documentKey}.`,
                return:
                  status === "REMOTE_DRAFT"
                    ? "Receipt draft is also pushed outward as a courthouse draft."
                    : "Receipt draft is held locally until you seal it.",
                echo: status.toLowerCase(),
                context: {
                  draftId: draft.id,
                  documentKey: document.documentKey,
                  primaryDocumentKey: document.documentKey,
                  relatedSourceDocumentKeys: [
                    ...new Set(
                      (Array.isArray(document.blocks) ? document.blocks : [])
                        .map((block) => String(block?.sourceDocumentKey || "").trim())
                        .filter(Boolean),
                    ),
                  ],
                  remoteDraft: status === "REMOTE_DRAFT",
                },
              }),
            ],
          });
        }
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
