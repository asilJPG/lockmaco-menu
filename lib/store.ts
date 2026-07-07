import { promises as fs } from "fs";
import path from "path";
import type { MenuData } from "./types";

const MENU_PATH = "data/menu.json";
const REPO = process.env.GITHUB_REPO; // "owner/repo"
const TOKEN = process.env.GITHUB_TOKEN;
const BRANCH = process.env.GITHUB_BRANCH || "main";

// On Vercel the filesystem is read-only — persist via GitHub commits,
// which also trigger a redeploy with the fresh menu.
const useGitHub = !!(process.env.VERCEL && REPO && TOKEN);

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
  if (useGitHub) {
    const file = await ghGetFile(MENU_PATH);
    if (!file) throw new Error("menu.json not found in repo");
    return JSON.parse(Buffer.from(file.content, "base64").toString("utf-8"));
  }
  const raw = await fs.readFile(path.join(process.cwd(), MENU_PATH), "utf-8");
  return JSON.parse(raw);
}

export async function writeMenu(menu: MenuData): Promise<void> {
  const json = JSON.stringify(menu, null, 2) + "\n";
  if (useGitHub) {
    await ghPutFile(MENU_PATH, Buffer.from(json).toString("base64"), "admin: update menu");
    return;
  }
  await fs.writeFile(path.join(process.cwd(), MENU_PATH), json, "utf-8");
}

export async function writeImage(fileName: string, base64: string): Promise<string> {
  const relPath = `public/uploads/${fileName}`;
  if (useGitHub) {
    await ghPutFile(relPath, base64, `admin: upload ${fileName}`);
    return `/uploads/${fileName}`;
  }
  const abs = path.join(process.cwd(), relPath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, Buffer.from(base64, "base64"));
  return `/uploads/${fileName}`;
}
