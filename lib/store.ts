import { promises as fs } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import type { MenuData } from "./types";

const MENU_PATH = "data/menu.json";
const REPO = process.env.GITHUB_REPO; // "owner/repo"
const TOKEN = process.env.GITHUB_TOKEN;
const BRANCH = process.env.GITHUB_BRANCH || "main";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "lokmaco-uploads";

// menu.json — GitHub на Vercel (пересборка нужна для новых блюд), файл на диске локально.
// Картинки/видео — Supabase Storage (без пересборки, мгновенно на проде).
const menuInGitHub = !!(process.env.VERCEL && REPO && TOKEN);
const mediaInSupabase = !!(SUPABASE_URL && SUPABASE_KEY);

const GH_HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

async function ghGetFile(filePath: string): Promise<{ content: string; sha: string } | null> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${filePath}?ref=${BRANCH}`,
    { headers: GH_HEADERS, cache: "no-store" }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET ${filePath}: ${res.status}`);
  const json = await res.json();
  return { content: json.content, sha: json.sha };
}

async function ghPutFile(filePath: string, base64Content: string, message: string) {
  const existing = await ghGetFile(filePath);
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
    method: "PUT",
    headers: { ...GH_HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: base64Content,
      branch: BRANCH,
      ...(existing ? { sha: existing.sha } : {}),
    }),
  });
  if (!res.ok) throw new Error(`GitHub PUT ${filePath}: ${res.status} ${await res.text()}`);
}

export async function readMenu(): Promise<MenuData> {
  if (menuInGitHub) {
    const file = await ghGetFile(MENU_PATH);
    if (!file) throw new Error("menu.json not found in repo");
    return JSON.parse(Buffer.from(file.content, "base64").toString("utf-8"));
  }
  const raw = await fs.readFile(path.join(process.cwd(), MENU_PATH), "utf-8");
  return JSON.parse(raw);
}

export async function writeMenu(menu: MenuData): Promise<void> {
  const json = JSON.stringify(menu, null, 2) + "\n";
  if (menuInGitHub) {
    await ghPutFile(MENU_PATH, Buffer.from(json).toString("base64"), "admin: update menu");
    return;
  }
  await fs.writeFile(path.join(process.cwd(), MENU_PATH), json, "utf-8");
}

const contentTypeFor = (fileName: string): string => {
  const ext = fileName.split(".").pop()!.toLowerCase();
  if (ext === "mp4") return "video/mp4";
  if (ext === "webm") return "video/webm";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
};

export async function writeImage(fileName: string, base64: string): Promise<string> {
  if (mediaInSupabase) {
    const sb = createClient(SUPABASE_URL!, SUPABASE_KEY!, { auth: { persistSession: false } });
    const { error } = await sb.storage
      .from(BUCKET)
      .upload(fileName, Buffer.from(base64, "base64"), {
        contentType: contentTypeFor(fileName),
        cacheControl: "31536000",
        upsert: true,
      });
    if (error) throw new Error(`Supabase upload ${fileName}: ${error.message}`);
    const { data } = sb.storage.from(BUCKET).getPublicUrl(fileName);
    return data.publicUrl;
  }
  const abs = path.join(process.cwd(), "public/uploads", fileName);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, Buffer.from(base64, "base64"));
  return `/uploads/${fileName}`;
}
