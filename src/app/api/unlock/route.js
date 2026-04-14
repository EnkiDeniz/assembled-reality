import { NextResponse } from "next/server";
import {
  attachBetaAccessCookie,
  clearBetaAccessCookie,
  isBetaPasswordValid,
} from "@/lib/beta-access";
import { appEnv } from "@/lib/env";

export async function POST(request) {
  const payload = await request.json().catch(() => null);
  const submittedCode = String(payload?.code || "");

  if (!appEnv.beta.passwordRequired) {
    return NextResponse.json(
      { ok: false, error: "Beta password protection is not configured." },
      { status: 503 },
    );
  }

  if (!isBetaPasswordValid(submittedCode)) {
    const response = NextResponse.json(
      { ok: false, error: "Incorrect beta password." },
      { status: 401 },
    );
    return clearBetaAccessCookie(response);
  }

  const response = NextResponse.json({ ok: true });
  return attachBetaAccessCookie(response);
}
