import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/server-session";
import { saveReadingProgressForUser } from "@/lib/reader-db";

export const dynamic = "force-dynamic";

export async function PUT(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const progress = await saveReadingProgressForUser(session.user.id, body);

  return NextResponse.json({
    ok: true,
    progress: progress
      ? {
          sectionSlug: progress.sectionSlug,
          progressPercent: progress.progressPercent,
          updatedAt: progress.updatedAt.toISOString(),
        }
      : null,
  });
}
