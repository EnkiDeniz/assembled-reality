import { NextResponse } from "next/server";
import {
  exchangeGetReceiptsCode,
  readSignedIntegrationState,
  storeGetReceiptsConnection,
} from "@/lib/getreceipts";

function buildWorkspaceReturnUrl(origin, payload = null) {
  const url = new URL("/workspace", origin);
  if (payload?.projectKey) {
    url.searchParams.set("project", payload.projectKey);
  }
  if (payload?.returnTo === "workspace-receipts") {
    url.searchParams.set("mode", "assemble");
    url.searchParams.set("phase", "receipts");
  }
  return url;
}

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const payload = readSignedIntegrationState(state);

  if (error) {
    if (payload?.returnTo) {
      const url = buildWorkspaceReturnUrl(origin, payload);
      url.searchParams.set("error", error);
      return NextResponse.redirect(url);
    }
    return NextResponse.redirect(new URL(`/account?error=${encodeURIComponent(error)}`, origin));
  }

  if (!code || !payload?.userId) {
    return NextResponse.redirect(new URL("/account?error=getreceipts-state", origin));
  }

  try {
    const tokenPayload = await exchangeGetReceiptsCode(code);
    await storeGetReceiptsConnection(payload.userId, tokenPayload);
    if (payload?.returnTo) {
      const url = buildWorkspaceReturnUrl(origin, payload);
      url.searchParams.set("connected", "getreceipts");
      return NextResponse.redirect(url);
    }
    return NextResponse.redirect(new URL("/account?connected=getreceipts", origin));
  } catch (thrownError) {
    const message =
      thrownError instanceof Error ? thrownError.message : "getreceipts-connection-failed";
    if (payload?.returnTo) {
      const url = buildWorkspaceReturnUrl(origin, payload);
      url.searchParams.set("error", message);
      return NextResponse.redirect(url);
    }
    return NextResponse.redirect(
      new URL(`/account?error=${encodeURIComponent(message)}`, origin),
    );
  }
}
