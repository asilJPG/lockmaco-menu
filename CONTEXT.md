# The Lokmaco · QR Menu — контекст проекта

QR-меню для кофейни-кондитерской The Lokmaco (Ташкент, турецкие десерты: локма, вафли, кофе). Референс: https://qrmenu.abnmbgroup.com/bon/. Хостинг — Vercel, домен уже есть.

## Архитектура

- Next.js 16 (App Router, TS), без БД.
- Меню — `data/menu.json`, фото — `public/uploads/`.
- Публичное меню `/`: RU/UZ/EN, welcome-лоадер, секции Еда/Напитки, категории-чипсы, поиск, диалог блюда с КБЖУ. Всё в `components/MenuApp.tsx`.
- Админка `/admin` (`components/AdminApp.tsx`): пароль из `ADMIN_PASSWORD`, CRUD категорий/блюд, три языка полей, загрузка фото (ресайз до 900px JPEG на клиенте).
- Сохранение: локально — запись в файлы; на Vercel — коммит в GitHub через API (`lib/store.ts`, env: `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`) → автопересборка.
- Палитра: шоколад `#5C3317` + мёд/карамель `#D9A441` + крем `#F6EDDF` (переменные в `app/globals.css`). Шрифты: Cormorant Garamond + Onest.

## Сделано 2026-07-07

- Каркас проекта, публичное меню, админка, API (`/api/admin/menu`, `/api/admin/upload`), README с инструкцией деплоя.
- Проверено локально: рендер, языки, диалог, логин, правка цены → запись в menu.json, аплоад фото, 401 на неверный пароль.

## Git

Репозиторий: https://github.com/asilJPG/lockmaco-menu, код лежит в ветке `qr-menu` (локальная ветка `main` трекает `origin/qr-menu`). В `origin/main` — начальное содержимое репо, наша история с ним не связана.

## Осталось

- Смержить `qr-menu` в `main` (или деплоить прямо из `qr-menu`), подключить к Vercel, задать env-переменные (`GITHUB_REPO=asilJPG/lockmaco-menu`, `GITHUB_BRANCH` = продовая ветка), привязать домен (шаги в README).
- Заполнить реальное меню и фото через админку (сейчас — примерные позиции).
- Опционально: логотип-картинка вместо текстового, QR-коды на столы.
