import { NextResponse } from "next/server";

export function GET(request) {
  return NextResponse.redirect(new URL("/favicon.svg", request.url), {
    status: 308,
  });
}
