import { NextResponse } from "next/server";
import { buildRoomWorkspaceViewForUser } from "@/lib/room-server";
import { getRequiredSession } from "@/lib/server-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getRequiredSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectKey =
    String(searchParams.get("projectKey") || searchParams.get("project") || "").trim();
  const sessionId =
    String(searchParams.get("sessionId") || searchParams.get("session") || "").trim();
  const documentKey =
    String(searchParams.get("documentKey") || searchParams.get("document") || "").trim();
  const adjacent = String(searchParams.get("adjacent") || "").trim();
  const view = await buildRoomWorkspaceViewForUser(session.user.id, {
    projectKey,
    sessionId,
    documentKey,
    adjacent,
  });
  return NextResponse.json({ ok: true, view });
}
