import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/server-session";
import { getReaderProfileByUserId, updateReaderProfileForUser } from "@/lib/reader-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolved = await getReaderProfileByUserId(session.user.id);
  return NextResponse.json({
    profile: resolved?.profile || null,
  });
}

export async function PUT(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const profile = await updateReaderProfileForUser(session.user.id, body);
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update profile.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
