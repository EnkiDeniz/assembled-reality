import { NextResponse } from "next/server";
import { getReaderProjectForUser } from "@/lib/reader-projects";
import { buildRoomWorkspaceViewForUser } from "@/lib/room-server";
import {
  activateRoomSessionForProject,
  archiveRoomSessionForProject,
  createRoomSessionForProject,
  ensureCompilerFirstWorkspaceResetForUser,
} from "@/lib/room-sessions";
import { getRequiredSession } from "@/lib/server-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

async function getProjectOrError(userId, projectKey = "") {
  const normalizedProjectKey = normalizeText(projectKey);
  if (!normalizedProjectKey) {
    return {
      project: null,
      error: NextResponse.json({ ok: false, error: "Box key is required." }, { status: 400 }),
    };
  }

  const project = await getReaderProjectForUser(userId, normalizedProjectKey);
  if (!project) {
    return {
      project: null,
      error: NextResponse.json({ ok: false, error: "Box not found." }, { status: 404 }),
    };
  }

  return { project, error: null };
}

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  await ensureCompilerFirstWorkspaceResetForUser(session.user.id);

  const body = await request.json().catch(() => null);
  const { project, error } = await getProjectOrError(session.user.id, body?.projectKey);
  if (error) return error;

  try {
    const roomSession = await createRoomSessionForProject(session.user.id, project, {
      title: normalizeText(body?.title),
      handoffSummary: normalizeText(body?.handoffSummary),
      activate: true,
      archiveExisting: false,
    });
    const view = await buildRoomWorkspaceViewForUser(session.user.id, {
      projectKey: project.projectKey,
      sessionId: roomSession?.id || "",
      documentKey: normalizeText(body?.documentKey),
    });
    return NextResponse.json({ ok: true, view, session: roomSession });
  } catch (routeError) {
    return NextResponse.json(
      {
        ok: false,
        error: routeError instanceof Error ? routeError.message : "Could not start a new conversation.",
      },
      { status: 400 },
    );
  }
}

export async function PUT(request) {
  const session = await getRequiredSession();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  await ensureCompilerFirstWorkspaceResetForUser(session.user.id);

  const body = await request.json().catch(() => null);
  const action = normalizeText(body?.action).toLowerCase();
  const { project, error } = await getProjectOrError(session.user.id, body?.projectKey);
  if (error) return error;

  try {
    if (action === "activate") {
      const roomSession = await activateRoomSessionForProject(
        session.user.id,
        project,
        body?.sessionId,
      );
      const view = await buildRoomWorkspaceViewForUser(session.user.id, {
        projectKey: project.projectKey,
        sessionId: roomSession?.id || "",
        documentKey: normalizeText(body?.documentKey),
      });
      return NextResponse.json({ ok: true, view, session: roomSession });
    }

    if (action === "archive") {
      await archiveRoomSessionForProject(session.user.id, project, body?.sessionId);
      const view = await buildRoomWorkspaceViewForUser(session.user.id, {
        projectKey: project.projectKey,
        documentKey: normalizeText(body?.documentKey),
      });
      return NextResponse.json({ ok: true, view });
    }

    return NextResponse.json({ ok: false, error: "Unknown session action." }, { status: 400 });
  } catch (routeError) {
    return NextResponse.json(
      {
        ok: false,
        error: routeError instanceof Error ? routeError.message : "Could not update that conversation.",
      },
      { status: 400 },
    );
  }
}
