import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useSupabase = !!(SUPABASE_URL && SUPABASE_KEY);

const supabase = () =>
  createClient(SUPABASE_URL!, SUPABASE_KEY!, { auth: { persistSession: false } });

const LOCAL_STATS_PATH = path.join(process.cwd(), "data/stats.json");

export interface StatsOverview {
  today: { visits: number; uniques: number };
  week: { visits: number; uniques: number };
  month: { visits: number; uniques: number };
  allTime: { visits: number; uniques: number };
}

interface LocalVisit {
  visitor_id: string;
  path: string;
  created_at: string;
}

async function readLocalVisits(): Promise<LocalVisit[]> {
  try {
    const raw = await fs.readFile(LOCAL_STATS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeLocalVisits(visits: LocalVisit[]): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_STATS_PATH), { recursive: true });
  // Ограничиваем локальный файл последними 10 000 записями
  const trimmed = visits.slice(-10000);
  await fs.writeFile(LOCAL_STATS_PATH, JSON.stringify(trimmed), "utf-8");
}

export async function recordVisit(visitorId: string, pagePath: string): Promise<void> {
  const cleanVisitorId = (visitorId || "").slice(0, 64);
  const cleanPath = (pagePath || "/").slice(0, 128);

  if (useSupabase) {
    try {
      const { error } = await supabase()
        .from("site_visits")
        .insert({ visitor_id: cleanVisitorId, path: cleanPath });
      if (!error) return;
      console.warn("Supabase recordVisit insert error:", error.message);
    } catch (e) {
      console.warn("Supabase recordVisit exception:", e);
    }
  }

  // Fallback / локальный режим в data/stats.json
  try {
    const visits = await readLocalVisits();
    visits.push({
      visitor_id: cleanVisitorId,
      path: cleanPath,
      created_at: new Date().toISOString(),
    });
    await writeLocalVisits(visits);
  } catch (e) {
    console.error("Local recordVisit error:", e);
  }
}

export async function getStatsOverview(): Promise<StatsOverview> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  if (useSupabase) {
    try {
      // 1. Попробуем быстрый RPC, если настроена функция в БД
      const { data: rpcData, error: rpcError } = await supabase().rpc("get_site_stats");
      if (!rpcError && rpcData) {
        return rpcData as StatsOverview;
      }

      // 2. Fallback через прямой запрос последних записей (за 30 дней)
      const { data, error } = await supabase()
        .from("site_visits")
        .select("visitor_id, created_at")
        .gte("created_at", startOfMonth);

      if (!error && data) {
        const calculate = (since: string) => {
          const filtered = data.filter((row) => row.created_at >= since);
          const uniq = new Set(filtered.map((r) => r.visitor_id));
          return { visits: filtered.length, uniques: uniq.size };
        };

        // За всё время берём count
        const { count: allVisitsCount } = await supabase()
          .from("site_visits")
          .select("*", { count: "exact", head: true });

        const monthStats = calculate(startOfMonth);
        return {
          today: calculate(startOfDay),
          week: calculate(startOfWeek),
          month: monthStats,
          allTime: {
            visits: allVisitsCount ?? monthStats.visits,
            uniques: monthStats.uniques,
          },
        };
      }
    } catch (e) {
      console.warn("Supabase getStatsOverview fallback to local:", e);
    }
  }

  // Расчёт из локального файла
  const local = await readLocalVisits();
  const calculateLocal = (since?: string) => {
    const filtered = since ? local.filter((r) => r.created_at >= since) : local;
    const uniq = new Set(filtered.map((r) => r.visitor_id));
    return { visits: filtered.length, uniques: uniq.size };
  };

  return {
    today: calculateLocal(startOfDay),
    week: calculateLocal(startOfWeek),
    month: calculateLocal(startOfMonth),
    allTime: calculateLocal(),
  };
}
