import { NextResponse } from "next/server";
import { appEnv } from "@/lib/env";

export async function POST(request) {
  const payload = await request.json().catch(() => null);
  const submittedCode = String(payload?.code || "").trim().toLowerCase();
  const expectedCode = String(appEnv.bootstrapCode || "").trim().toLowerCase();

  if (!submittedCode || !expectedCode) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (submittedCode !== expectedCode) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
