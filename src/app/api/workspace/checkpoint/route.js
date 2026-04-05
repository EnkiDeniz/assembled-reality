import { NextResponse } from "next/server";
import { recordReaderProjectSessionCheckpointForUser } from "@/lib/reader-projects";
import { getRequiredSession } from "@/lib/server-session";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bodyText = await request.text().catch(() => "");
  const body = bodyText
    ? (() => {
        try {
          return JSON.parse(bodyText);
        } catch {
          return null;
        }
      })()
    : null;
  const projectKey = String(body?.projectKey || "").trim();
  const seedDocumentKey = String(body?.seedDocumentKey || "").trim();
  const reason = String(body?.reason || "activity").trim().toLowerCase();

  if (!projectKey) {
    return NextResponse.json({ error: "Box key is required." }, { status: 400 });
  }

  try {
    const result = await recordReaderProjectSessionCheckpointForUser(session.user.id, projectKey, {
      seedDocumentKey,
      reason,
    });

    return NextResponse.json({
      ok: true,
      created: Boolean(result?.created),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not record the checkpoint." },
      { status: 400 },
    );
  }
}
