import { NextResponse } from "next/server";
import { createReaderProjectForUser } from "@/lib/reader-projects";
import { getRequiredSession } from "@/lib/server-session";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const title = String(body?.title || "").trim();
  const subtitle = String(body?.subtitle || "").trim();

  if (!title) {
    return NextResponse.json({ error: "Box title is required." }, { status: 400 });
  }

  try {
    const project = await createReaderProjectForUser(session.user.id, {
      title,
      subtitle,
    });

    return NextResponse.json({
      ok: true,
      project: {
        id: project.id,
        projectKey: project.projectKey,
        title: project.title,
        subtitle: project.subtitle,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create the box." },
      { status: 400 },
    );
  }
}
