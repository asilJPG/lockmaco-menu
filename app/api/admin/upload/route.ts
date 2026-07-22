import { NextRequest, NextResponse } from "next/server";
import { writeImage } from "@/lib/store";

export async function POST(req: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || req.headers.get("x-admin-password") !== password) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    const { base64, ext } = await req.json();
    const isVideo = ext === "mp4" || ext === "webm";
    const limit = isVideo ? 14_000_000 : 3_000_000; // base64 ~ файл × 1.37
    if (!base64 || base64.length > limit) {
      return NextResponse.json({ ok: false, error: "file too large" }, { status: 400 });
    }
    const safeExt = isVideo ? ext : "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
    const url = await writeImage(fileName, base64);
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
