import { NextRequest, NextResponse } from "next/server";
import { recordVisit } from "@/lib/stats";

export async function POST(req: NextRequest) {
  try {
    const { visitorId, path: pagePath } = await req.json();
    if (!visitorId) {
      return NextResponse.json({ ok: false, error: "missing visitorId" }, { status: 400 });
    }
    await recordVisit(visitorId, pagePath || "/");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
