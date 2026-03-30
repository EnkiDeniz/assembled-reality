import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/server-session";
import { buildGetReceiptsConnectUrl } from "@/lib/getreceipts";

export async function GET(request) {
  const session = await getRequiredSession();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    return NextResponse.redirect(buildGetReceiptsConnectUrl(session.user.id));
  } catch {
    return NextResponse.redirect(new URL("/account?error=getreceipts-config", request.url));
  }
}
