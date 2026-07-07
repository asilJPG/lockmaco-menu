import { NextRequest, NextResponse } from "next/server";
import { writeImage } from "@/lib/store";

export async function POST(req: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || req.headers.get("x-admin-password") !== password) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    const { base64 } = await req.json();
    if (!base64 || base64.length > 3_000_000) {
      return NextResponse.json({ ok: false, error: "invalid image" }, { status: 400 });
    }
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const url = await writeImage(fileName, base64);
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
