import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SHAPELIBRARY_API_BASE =
  process.env.SHAPELIBRARY_API_BASE || process.env.NEXT_PUBLIC_SHAPELIBRARY_API_BASE || "http://localhost:4310";

export async function GET() {
  try {
    const response = await fetch(`${SHAPELIBRARY_API_BASE}/v1/candidates`, {
      method: "GET",
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({
      ok: false,
      error: { message: `Shape Library candidates returned ${response.status}` },
    }));
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: { message: "Shape Library service is unreachable. Start shapelibrary on port 4310." },
      },
      { status: 503 },
    );
  }
}
