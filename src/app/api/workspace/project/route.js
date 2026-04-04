import { NextResponse } from "next/server";
import {
  createReaderProjectForUser,
  deleteReaderProjectForUser,
  updateReaderProjectForUser,
} from "@/lib/reader-projects";
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

export async function PUT(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const projectKey = String(body?.projectKey || "").trim();
  const title = String(body?.title || "").trim();
  const subtitle = body?.subtitle;

  if (!projectKey) {
    return NextResponse.json({ error: "Box key is required." }, { status: 400 });
  }

  if (!title) {
    return NextResponse.json({ error: "Box title is required." }, { status: 400 });
  }

  try {
    const project = await updateReaderProjectForUser(session.user.id, projectKey, {
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
        currentAssemblyDocumentKey: project.currentAssemblyDocumentKey || null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not rename the box." },
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
  const projectKey = String(body?.projectKey || "").trim();

  if (!projectKey) {
    return NextResponse.json({ error: "Box key is required." }, { status: 400 });
  }

  try {
    const result = await deleteReaderProjectForUser(session.user.id, projectKey);

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete the box." },
      { status: 400 },
    );
  }
}
