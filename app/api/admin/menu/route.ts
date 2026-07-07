import { NextRequest, NextResponse } from "next/server";
import { readMenu, writeMenu } from "@/lib/store";

function authorized(req: NextRequest): boolean {
  const password = process.env.ADMIN_PASSWORD;
  return !!password && req.headers.get("x-admin-password") === password;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, menu: await readMenu() });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const { menu } = await req.json();
    if (!menu?.brand || !menu?.sections) {
      return NextResponse.json({ ok: false, error: "invalid menu" }, { status: 400 });
    }
    await writeMenu(menu);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
