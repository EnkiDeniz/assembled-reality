import { NextResponse } from "next/server";
import { handleRoomApplyPost } from "@/lib/room-apply-route-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const result = await handleRoomApplyPost(request);
  return NextResponse.json(result.body, { status: result.status });
}
