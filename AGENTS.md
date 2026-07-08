<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# The Lokmaco · QR Menu

QR-меню The Lokmaco (филиал в Фергане) + админка. Актуальное состояние и историю смотри в CONTEXT.md — обновляй его и коммить при каждом пуше (кросс-девайс континуити).

## Правила

- Коммиты: короткое сообщение на русском, БЕЗ трейлера Co-Authored-By.
- Только бесплатные инструменты (картинки — pollinations.ai, никаких платных кредитов).
- Заказы/корзина в меню НЕ нужны — решение владельца, не предлагать.
- Ответы пользователю — на русском, кратко, без воды.

## Архитектура (кратко)

- Без БД: меню в `data/menu.json`, фото в `public/uploads/` (≤900px JPEG).
- Публичное меню `/` — components/MenuApp.tsx; админка `/admin` — components/AdminApp.tsx (пароль: env `ADMIN_PASSWORD`, локально в `.env.local`).
- Сохранение из админки: локально пишет в файлы; на Vercel коммитит в GitHub через API (`lib/store.ts`; env `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`) → Vercel пересобирает.
- Палитра: эспрессо `#3B2416`, мёд `#E0A83E`, крем `#FAF3E7` (`app/globals.css`); шрифты Playfair Display + Manrope.
- Git: origin = github.com/asilJPG/lockmaco-menu, рабочая ветка `qr-menu`.
