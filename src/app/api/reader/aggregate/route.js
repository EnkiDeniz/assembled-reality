import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/server-session";
import { loadSevenAggregate } from "@/lib/reader-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getRequiredSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const aggregate = await loadSevenAggregate();
  return NextResponse.json({ annotations: aggregate });
}
