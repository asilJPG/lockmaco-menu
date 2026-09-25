import { NextRequest, NextResponse } from "next/server";
import { getStatsOverview } from "@/lib/stats";

function authorized(req: NextRequest): boolean {
  const password = process.env.ADMIN_PASSWORD;
  return !!password && req.headers.get("x-admin-password") === password;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const stats = await getStatsOverview();
    return NextResponse.json({ ok: true, stats });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
