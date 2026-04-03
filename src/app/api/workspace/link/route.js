import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/server-session";
import { ingestLinkSourceForUser } from "@/lib/source-intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const projectKey = String(body?.projectKey || "").trim();
    const url = String(body?.url || "").trim();

    const result = await ingestLinkSourceForUser(session.user.id, {
      projectKey,
      url,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        code: error?.code || null,
        error:
          error instanceof Error ? error.message : "Could not create a source from that link.",
      },
      { status: 400 },
    );
  }
}
