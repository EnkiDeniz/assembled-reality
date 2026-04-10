import { NextResponse } from "next/server";
import { getRequiredSession } from "@/lib/server-session";
import { buildGetReceiptsConnectUrl } from "@/lib/getreceipts";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const session = await getRequiredSession();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const projectKey = String(searchParams.get("project") || "").trim();
  const returnTo = String(searchParams.get("returnTo") || "").trim();

  try {
    return NextResponse.redirect(
      buildGetReceiptsConnectUrl(session.user.id, {
        projectKey,
        returnTo,
      }),
    );
  } catch {
    if (projectKey) {
      const url = new URL("/workspace/phase1", origin);
      url.searchParams.set("project", projectKey);
      url.searchParams.set("mode", "assemble");
      url.searchParams.set("phase", "receipts");
      url.searchParams.set("error", "getreceipts-config");
      return NextResponse.redirect(url);
    }
    return NextResponse.redirect(new URL("/account?error=getreceipts-config", request.url));
  }
}
