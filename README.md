# The Lokmaco · QR Menu

QR-меню кофейни-кондитерской **The Lokmaco** (Ташкент) + админка. Референс: qrmenu.abnmbgroup.com/bon.

- Публичное меню: `/` — RU/UZ/EN, секции «Еда»/«Напитки», категории, поиск, карточка блюда с КБЖУ.
- Админка: `/admin` — вход по паролю, редактирование бренда, категорий и блюд, загрузка фото.

## Как хранятся данные

Всё меню — один файл [data/menu.json](data/menu.json), фото — в `public/uploads/`. Без базы данных.

- **Локально**: админка пишет прямо в файлы.
- **На Vercel**: файловая система read-only, поэтому админка коммитит изменения в GitHub через API → Vercel автоматически пересобирает сайт (~1 мин).

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
4. Привязать домен в **Settings → Domains**.

После «Сохранить» в админке коммит попадает в репозиторий и Vercel сам передеплоит сайт с новым меню.
