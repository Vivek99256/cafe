import { NextResponse } from "next/server";
import { clearSessionCookie, COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  try {
    await clearSessionCookie();
  } catch {
    // safe fallback
  }
  const response = NextResponse.json({ success: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
