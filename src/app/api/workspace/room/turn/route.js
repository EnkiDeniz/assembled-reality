import { NextResponse } from "next/server";
import {
  ROOM_TURN_RESPONSE_SCHEMA,
  handleRoomTurnPost,
} from "@/lib/room-turn-route-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export { ROOM_TURN_RESPONSE_SCHEMA };

export async function POST(request) {
  const result = await handleRoomTurnPost(request);
  return NextResponse.json(result.body, { status: result.status });
}
