# The Lokmaco · QR Menu

QR-меню кофейни-кондитерской **The Lokmaco** (филиал в Фергане) + админка. Референс: qrmenu.abnmbgroup.com/bon.

- Публичное меню: `/` — RU/UZ/EN, секции «Еда»/«Напитки», категории, поиск, карточка блюда с КБЖУ.
- Админка: `/admin` — вход по паролю, редактирование бренда, категорий и блюд, загрузка фото.

## Как хранятся данные

Всё меню — один файл [data/menu.json](data/menu.json), фото — в `public/uploads/`. Без базы данных.

- **Локально**: админка пишет прямо в файлы.
- **На Vercel**: файловая система read-only, поэтому админка коммитит изменения в GitHub через API → Vercel автоматически пересобирает сайт (~1 мин).

Аккаунты бонусной карты хранятся отдельно:

- **Прод**: Supabase, таблицы из [supabase.sql](supabase.sql).
- **Локально без Supabase env**: мок [data/customers.json](data/customers.json).
- **Google Wallet**: данные не хранит, а получает подписанную ссылку на pass через `/api/card/wallet`.

## Запуск локально

```bash
npm install
npm run dev
```

Пароль админки — в `.env.local` (`ADMIN_PASSWORD`).

## Деплой на Vercel

1. Запушить репозиторий на GitHub.
2. В Vercel: **Add New Project** → импортировать репозиторий (настройки по умолчанию).
3. В **Settings → Environment Variables** добавить:
   - `ADMIN_PASSWORD` — пароль админки;
   - `GITHUB_TOKEN` — fine-grained PAT (github.com → Settings → Developer settings → Fine-grained tokens) с доступом только к этому репозиторию и правом **Contents: Read and write**;
   - `GITHUB_REPO` — `owner/repo` (например `asilchik/lokmaco-qr`);
   - `GITHUB_BRANCH` — `main`.
   - `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` — хранение клиентов бонусной карты;
   - `CARD_SECRET` — длинная случайная строка для cookie сессии карты;
   - `NEXT_PUBLIC_SITE_URL`, `GOOGLE_WALLET_ISSUER_ID`, `GOOGLE_WALLET_CLIENT_EMAIL`, `GOOGLE_WALLET_PRIVATE_KEY` — выдача карты в Google Wallet.
4. Привязать домен в **Settings → Domains**.

После «Сохранить» в админке коммит попадает в репозиторий и Vercel сам передеплоит сайт с новым меню.
