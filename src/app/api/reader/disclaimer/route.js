import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/server-session";
import { acceptReaderDisclaimerForUser, getReaderProfileByUserId } from "@/lib/reader-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolved = await getReaderProfileByUserId(session.user.id);
  return NextResponse.json({
    acceptedAt: resolved?.profile?.disclaimerAcceptedAt || null,
  });
}

export async function POST() {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await acceptReaderDisclaimerForUser(session.user.id);
  return NextResponse.json({
    ok: true,
    acceptedAt: profile?.disclaimerAcceptedAt || null,
  });
}
