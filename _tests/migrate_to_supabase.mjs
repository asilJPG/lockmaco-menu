#!/usr/bin/env node
// Разовая миграция: загружает все public/uploads/* в Supabase Storage
// и переписывает imageUrl/videoUrl в data/menu.json на публичные URL.

import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const envRaw = await fs.readFile(path.join(ROOT, ".env.local"), "utf-8");
const env = Object.fromEntries(
  envRaw.split("\n")
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#") && l.includes("="))
    .map(l => {
      const i = l.indexOf("=");
      let v = l.slice(i + 1).trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      return [l.slice(0, i).trim(), v];
    })
);

const URL = env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = env.SUPABASE_STORAGE_BUCKET || "lokmaco-uploads";
if (!URL || !KEY) throw new Error("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY отсутствуют в .env.local");

const sb = createClient(URL, KEY, { auth: { persistSession: false } });

const uploadsDir = path.join(ROOT, "public/uploads");
const files = (await fs.readdir(uploadsDir)).filter(f => !f.startsWith("."));

const ctype = (name) => {
  const ext = name.split(".").pop().toLowerCase();
  if (ext === "mp4") return "video/mp4";
  if (ext === "webm") return "video/webm";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
};

let ok = 0, fail = 0;
for (const name of files) {
  const body = await fs.readFile(path.join(uploadsDir, name));
  const { error } = await sb.storage.from(BUCKET).upload(name, body, {
    contentType: ctype(name),
    cacheControl: "31536000",
    upsert: true,
  });
  if (error) { console.error(`✗ ${name}: ${error.message}`); fail++; continue; }
  ok++;
  if (ok % 10 === 0) console.log(`  ${ok}/${files.length}...`);
}
console.log(`\nЗагружено: ${ok} | Ошибок: ${fail} | Всего: ${files.length}`);

// Переписываем menu.json
const publicBase = `${URL}/storage/v1/object/public/${BUCKET}`;
const menuPath = path.join(ROOT, "data/menu.json");
const menu = JSON.parse(await fs.readFile(menuPath, "utf-8"));

let rewrote = 0;
const rewriteUrl = (u) => {
  if (!u || typeof u !== "string") return u;
  if (u.startsWith("/uploads/")) {
    rewrote++;
    return `${publicBase}/${u.slice("/uploads/".length)}`;
  }
  return u;
};

for (const sec of Object.values(menu.sections)) {
  for (const cat of sec) {
    for (const item of cat.items || []) {
      item.imageUrl = rewriteUrl(item.imageUrl);
      if (item.videoUrl) item.videoUrl = rewriteUrl(item.videoUrl);
    }
  }
}

await fs.writeFile(menuPath, JSON.stringify(menu, null, 2) + "\n", "utf-8");
console.log(`menu.json: переписано ${rewrote} URL → ${publicBase}/`);
