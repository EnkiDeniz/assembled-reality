import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/server-session";
import {
  addEvidenceItemForUser,
  loadEvidenceSetForUser,
  removeEvidenceItemForUser,
} from "@/lib/reader-workspace";
import { PRIMARY_DOCUMENT_KEY } from "@/lib/document";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const documentKey = searchParams.get("documentKey") || PRIMARY_DOCUMENT_KEY;
  const evidenceSet = await loadEvidenceSetForUser(session.user.id, documentKey);

  return NextResponse.json({
    evidenceSet,
  });
}

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const item = await addEvidenceItemForUser(session.user.id, {
      documentKey: body?.documentKey || PRIMARY_DOCUMENT_KEY,
      origin: body?.origin,
      sourceType: body?.sourceType,
      sectionSlug: body?.sectionSlug,
      sectionTitle: body?.sectionTitle,
      blockId: body?.blockId || null,
      startOffset: body?.startOffset,
      endOffset: body?.endOffset,
      quote: body?.quote,
      excerpt: body?.excerpt,
      noteText: body?.noteText || "",
      sourceMarkId: body?.sourceMarkId || null,
      sourceMessageId: body?.sourceMessageId || null,
      sourceCitationId: body?.sourceCitationId || null,
    });

    return NextResponse.json({
      ok: true,
      item,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not add evidence item.",
      },
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
  const itemId = String(body?.itemId || "").trim();
  if (!itemId) {
    return NextResponse.json({ error: "Evidence item id is required." }, { status: 400 });
  }

  const removed = await removeEvidenceItemForUser(session.user.id, itemId);
  if (!removed) {
    return NextResponse.json({ error: "Evidence item not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
