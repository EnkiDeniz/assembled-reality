import { NextResponse } from "next/server";
import {
  normalizeWorkspaceBlocks,
  normalizeWorkspaceLogEntries,
} from "@/lib/document-blocks";
import { getRequiredSession } from "@/lib/server-session";
import {
  deleteWorkspaceDocumentForUser,
  getWorkspaceDocumentForUser,
  saveWorkspaceDocumentForUser,
} from "@/lib/workspace-documents";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documentKey = String(
    new URL(request.url).searchParams.get("documentKey") || "",
  ).trim();
  const document = await getWorkspaceDocumentForUser(session.user.id, documentKey);

  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, document });
}

export async function PUT(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const documentKey = String(body?.documentKey || "").trim();

  if (!documentKey) {
    return NextResponse.json({ error: "Document key is required." }, { status: 400 });
  }

  try {
    const document = await saveWorkspaceDocumentForUser(session.user.id, {
      documentKey,
      title: String(body?.title || "").trim(),
      subtitle: String(body?.subtitle || "").trim(),
      baseUpdatedAt: body?.baseUpdatedAt || null,
      blocks: normalizeWorkspaceBlocks(body?.blocks, {
        documentKey,
        defaultSourceDocumentKey: documentKey,
        defaultIsEditable: true,
      }),
      logEntries: normalizeWorkspaceLogEntries(body?.logEntries, documentKey),
    });

    return NextResponse.json({ ok: true, document });
  } catch (error) {
    if (error?.code === "stale_document") {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          documentKey,
          serverUpdatedAt: error.currentDocument?.updatedAt || null,
          currentDocument: error.currentDocument || null,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save the document." },
      { status: 400 },
    );
  }
}

export async function DELETE(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const documentKey = String(body?.documentKey || "").trim();

  if (!documentKey) {
    return NextResponse.json({ error: "Document key is required." }, { status: 400 });
  }

  try {
    const deleted = await deleteWorkspaceDocumentForUser(session.user.id, documentKey);
    return NextResponse.json({ ok: true, deleted });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete the document." },
      { status: 400 },
    );
  }
}
