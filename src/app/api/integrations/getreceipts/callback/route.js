import { NextResponse } from "next/server";
import {
  exchangeGetReceiptsCode,
  readSignedIntegrationState,
  storeGetReceiptsConnection,
} from "@/lib/getreceipts";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/account?error=${encodeURIComponent(error)}`, origin));
  }

  const payload = readSignedIntegrationState(state);
  if (!code || !payload?.userId) {
    return NextResponse.redirect(new URL("/account?error=getreceipts-state", origin));
  }

  try {
    const tokenPayload = await exchangeGetReceiptsCode(code);
    await storeGetReceiptsConnection(payload.userId, tokenPayload);
    return NextResponse.redirect(new URL("/account?connected=getreceipts", origin));
  } catch (thrownError) {
    const message =
      thrownError instanceof Error ? thrownError.message : "getreceipts-connection-failed";
    return NextResponse.redirect(
      new URL(`/account?error=${encodeURIComponent(message)}`, origin),
    );
  }
}
