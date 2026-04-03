import { NextResponse } from "next/server";
import { PRIMARY_DOCUMENT_KEY } from "@/lib/document";
import { getRequiredSession } from "@/lib/server-session";
import {
  loadListeningSessionForUser,
  saveListeningSessionForUser,
} from "@/lib/reader-workspace";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const documentKey = String(searchParams.get("documentKey") || PRIMARY_DOCUMENT_KEY).trim() || PRIMARY_DOCUMENT_KEY;
  const data = await loadListeningSessionForUser(session.user.id, documentKey);

  return NextResponse.json({
    listeningSession: data?.listeningSession || null,
    voicePreferences: data?.voicePreferences || null,
  });
}

export async function PUT(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const documentKey = String(body?.documentKey || PRIMARY_DOCUMENT_KEY).trim() || PRIMARY_DOCUMENT_KEY;
  const data = await saveListeningSessionForUser(session.user.id, {
    ...body,
    documentKey,
  });

  return NextResponse.json({
    ok: true,
    listeningSession: data?.listeningSession || null,
    voicePreferences: data?.voicePreferences || null,
  });
}
