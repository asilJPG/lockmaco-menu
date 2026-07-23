import { NextResponse } from "next/server";

// Временный эндпоинт для диагностики env Wallet на Vercel.
// НЕ раскрывает сами значения — только «задан/не задан» и длину.
export async function GET() {
  return NextResponse.json({
    GOOGLE_WALLET_ISSUER_ID: !!process.env.GOOGLE_WALLET_ISSUER_ID,
    GOOGLE_WALLET_CLIENT_EMAIL: !!process.env.GOOGLE_WALLET_CLIENT_EMAIL,
    GOOGLE_WALLET_PRIVATE_KEY: !!process.env.GOOGLE_WALLET_PRIVATE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    PRIVATE_KEY_LEN: process.env.GOOGLE_WALLET_PRIVATE_KEY?.length ?? 0,
    PRIVATE_KEY_HAS_NEWLINES: process.env.GOOGLE_WALLET_PRIVATE_KEY?.includes("\n") ?? false,
    PRIVATE_KEY_HAS_ESCAPED_NEWLINES: process.env.GOOGLE_WALLET_PRIVATE_KEY?.includes("\\n") ?? false,
    PRIVATE_KEY_STARTS_WITH: process.env.GOOGLE_WALLET_PRIVATE_KEY?.slice(0, 30) ?? null,
  });
}
