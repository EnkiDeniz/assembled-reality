import { NextResponse } from "next/server";
import { PRIMARY_DOCUMENT_KEY } from "@/lib/document";
import { getRequiredSession } from "@/lib/server-session";
import { loadReaderPageData, saveReaderAnnotationsForUser } from "@/lib/reader-db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const documentKey = searchParams.get("documentKey") || PRIMARY_DOCUMENT_KEY;
  const data = await loadReaderPageData(session.user.id, documentKey);
  return NextResponse.json({
    annotations: data?.annotations || { bookmarks: [], highlights: [], notes: [] },
  });
}

export async function PUT(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const documentKey = String(body?.documentKey || PRIMARY_DOCUMENT_KEY).trim() || PRIMARY_DOCUMENT_KEY;
  const data = await saveReaderAnnotationsForUser(session.user.id, documentKey, body);

  return NextResponse.json({
    ok: true,
    annotations: data?.annotations || { bookmarks: [], highlights: [], notes: [] },
  });
}
