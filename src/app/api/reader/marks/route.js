import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/server-session";
import { loadReaderPageData, saveReaderAnnotationsForUser } from "@/lib/reader-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await loadReaderPageData(session.user.id);
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
  const data = await saveReaderAnnotationsForUser(session.user.id, body);

  return NextResponse.json({
    ok: true,
    annotations: data?.annotations || { bookmarks: [], highlights: [], notes: [] },
  });
}
