import { NextResponse } from "next/server";

// Endpoint trivial untuk verifikasi wiring deploy (Vercel) & monitoring uptime (UptimeRobot/Betterstack).
export function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
