import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/server-session";
import { loadConversationThreadForUser } from "@/lib/reader-workspace";
import { PRIMARY_DOCUMENT_KEY } from "@/lib/document";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const documentKey = searchParams.get("documentKey") || PRIMARY_DOCUMENT_KEY;
  const thread = await loadConversationThreadForUser(session.user.id, documentKey);

  return NextResponse.json({
    thread,
  });
}
