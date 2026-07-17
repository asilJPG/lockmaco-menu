import { NextRequest, NextResponse } from "next/server";
import { topupCustomerWallet, getCustomerById } from "@/lib/loyalty";
import { CARD_COOKIE, unsealCustomerId } from "@/lib/session";

// Глобальный кэш отсканированных чеков в оперативной памяти (для Vercel/Node)
// чтобы предотвратить повторное сканирование без подключения БД
if (!((global as any).claimedReceipts)) {
  ((global as any).claimedReceipts) = new Set<string>();
}
const claimedSet = ((global as any).claimedReceipts) as Set<string>;

interface SoliqReceiptData {
  timestamp: string;
  sum: number;
  fp: string;
}

function parseSoliqUrl(urlStr: string): SoliqReceiptData | null {
  try {
    const url = new URL(urlStr);
    if (!url.hostname.includes("soliq.uz")) {
      return null;
    }
    const t = url.searchParams.get("t");
    const s = url.searchParams.get("s");
    const fp = url.searchParams.get("fp");

    if (!t || !s || !fp) return null;

    const sum = parseFloat(s);
    if (isNaN(sum) || sum <= 0) return null;

    return { timestamp: t, sum, fp };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  // 1. Проверяем сессию гостя
  const customerId = unsealCustomerId(req.cookies.get(CARD_COOKIE)?.value);
  if (!customerId) {
    return NextResponse.json({ error: "Пожалуйста, войдите в личный кабинет карты" }, { status: 401 });
  }

  const customer = await getCustomerById(customerId);
  if (!customer) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { qrUrl } = body;

    if (!qrUrl) {
      return NextResponse.json({ error: "Ссылка QR-кода обязательна" }, { status: 400 });
    }

    // 2. Парсим ссылку Soliq.uz
    const receipt = parseSoliqUrl(qrUrl);
    if (!receipt) {
      return NextResponse.json({
        error: "Неверный формат чека. Пожалуйста, отсканируйте фискальный чек ГНК (Soliq.uz)"
      }, { status: 400 });
    }

    const { timestamp, sum, fp } = receipt;

    // 3. Защита от повторного сканирования
    if (claimedSet.has(fp)) {
      return NextResponse.json({ error: "Этот чек уже был использован для начисления бонусов" }, { status: 400 });
    }

    // 4. Проверка даты чека (не старше 3 дней)
    // Формат t: YYYYMMDDTHHmmss
    try {
      const year = parseInt(timestamp.substring(0, 4), 10);
      const month = parseInt(timestamp.substring(4, 6), 10) - 1;
      const day = parseInt(timestamp.substring(6, 8), 10);
      const hour = parseInt(timestamp.substring(9, 11), 10);
      const minute = parseInt(timestamp.substring(11, 13), 10);
      const second = parseInt(timestamp.substring(13, 15), 10);

      const receiptDate = new Date(year, month, day, hour, minute, second);
      const now = new Date();
      const diffMs = now.getTime() - receiptDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays > 3) {
        return NextResponse.json({
          error: "Чек слишком старый. Начислять бонусы можно только по чекам не старше 3 дней"
        }, { status: 400 });
      }

      if (diffDays < -1) {
        // Защита от будущих дат с учетом часовых поясов
        return NextResponse.json({ error: "Неверная дата чека" }, { status: 400 });
      }
    } catch (e) {
      return NextResponse.json({ error: "Не удалось распознать дату чека" }, { status: 400 });
    }

    // 5. Расчет кэшбэка
    // До 400к — 3%, от 400к — 5%
    const rate = sum < 400000 ? 0.03 : 0.05;
    const points = Math.round(sum * rate);

    if (points <= 0) {
      return NextResponse.json({ error: "Сумма чека слишком мала для начисления бонусов" }, { status: 400 });
    }

    // 6. Пополнение в iiko
    const comment = `Начисление по чеку Soliq FP: ${fp}`;
    await topupCustomerWallet(customerId, points, comment);

    // 7. Сохраняем в кэш отсканированных чеков
    claimedSet.add(fp);

    // Получаем обновленного клиента с новым балансом
    const updatedCustomer = await getCustomerById(customerId);

    return NextResponse.json({
      success: true,
      earnedPoints: points,
      ratePercent: rate * 100,
      newBalance: updatedCustomer?.balance ?? (customer.balance + points)
    });
  } catch (err: any) {
    console.error("Receipt claim error:", err);
    return NextResponse.json({ error: err.message || "Ошибка при начислении бонусов" }, { status: 500 });
  }
}
