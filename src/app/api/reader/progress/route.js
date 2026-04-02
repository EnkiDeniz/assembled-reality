import { NextResponse } from "next/server";
import { PRIMARY_DOCUMENT_KEY } from "@/lib/document";
import { getRequiredSession } from "@/lib/server-session";
import { saveReadingProgressForUser } from "@/lib/reader-db";

export const dynamic = "force-dynamic";

export async function PUT(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const documentKey = String(body?.documentKey || PRIMARY_DOCUMENT_KEY).trim() || PRIMARY_DOCUMENT_KEY;
  const progress = await saveReadingProgressForUser(session.user.id, documentKey, body);

  return NextResponse.json({
    ok: true,
    progress: progress
      ? {
          documentKey: progress.documentKey,
          sectionSlug: progress.sectionSlug,
          progressPercent: progress.progressPercent,
          updatedAt: progress.updatedAt.toISOString(),
        }
      : null,
  });
}
