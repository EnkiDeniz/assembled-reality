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
  const view = await buildRoomWorkspaceViewForUser(session.user.id, { projectKey });
  return NextResponse.json({ ok: true, view });
}
