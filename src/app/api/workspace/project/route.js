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
        isPinned: Boolean(project.isPinned),
        isArchived: Boolean(project.isArchived),
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
  const hasTitle = Boolean(body) && Object.prototype.hasOwnProperty.call(body, "title");
  const hasSubtitle = Boolean(body) && Object.prototype.hasOwnProperty.call(body, "subtitle");
  const hasPinned = Boolean(body) && Object.prototype.hasOwnProperty.call(body, "isPinned");
  const hasArchived = Boolean(body) && Object.prototype.hasOwnProperty.call(body, "isArchived");
  const title = String(body?.title || "").trim();
  const subtitle = hasSubtitle ? body?.subtitle : undefined;
  const isPinned = hasPinned ? Boolean(body?.isPinned) : undefined;
  const isArchived = hasArchived ? Boolean(body?.isArchived) : undefined;

  if (!projectKey) {
    return NextResponse.json({ error: "Box key is required." }, { status: 400 });
  }

  if (hasTitle && !title) {
    return NextResponse.json({ error: "Box title is required." }, { status: 400 });
  }

  if (!hasTitle && !hasSubtitle && !hasPinned && !hasArchived) {
    return NextResponse.json({ error: "No box changes were provided." }, { status: 400 });
  }

  try {
    const project = await updateReaderProjectForUser(session.user.id, projectKey, {
      ...(hasTitle ? { title } : {}),
      ...(hasSubtitle ? { subtitle } : {}),
      ...(hasPinned ? { isPinned } : {}),
      ...(hasArchived ? { isArchived } : {}),
    });

    return NextResponse.json({
      ok: true,
      project: {
        id: project.id,
        projectKey: project.projectKey,
        title: project.title,
        subtitle: project.subtitle,
        currentAssemblyDocumentKey: project.currentAssemblyDocumentKey || null,
        isPinned: Boolean(project.isPinned),
        isArchived: Boolean(project.isArchived),
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
