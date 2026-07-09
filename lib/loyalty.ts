import { promises as fs } from "fs";
import path from "path";

// Гость программы лояльности. Источник данных — iiko (когда есть
// IIKO_API_LOGIN + IIKO_ORG_ID), иначе локальный мок в data/customers.json.
export interface LoyaltyCustomer {
  id: string;
  name: string;
  phone: string;
  cardNumber: string;
  balance: number;
  createdAt: string;
}

const IIKO_LOGIN = process.env.IIKO_API_LOGIN;
const IIKO_ORG = process.env.IIKO_ORG_ID;
const IIKO_BASE = process.env.IIKO_BASE_URL || "https://api-ru.iiko.services";

export const usingIiko = !!(IIKO_LOGIN && IIKO_ORG);

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  // Узбекский номер: 9 цифр после кода страны 998
  if (digits.length === 9) return `+998${digits}`;
  if (digits.length === 12 && digits.startsWith("998")) return `+${digits}`;
  return null;
}

function makeCardNumber(): string {
  // 10 цифр, префикс 77 — чтобы кассир отличал карты Lokmaco
  let n = "77";
  for (let i = 0; i < 8; i++) n += Math.floor(Math.random() * 10);
  return n;
}

/* ---------- iiko client ---------- */

let iikoToken: { value: string; expires: number } | null = null;

async function iikoFetch<T>(endpoint: string, body: object): Promise<T> {
  if (!iikoToken || iikoToken.expires < Date.now()) {
    const res = await fetch(`${IIKO_BASE}/api/1/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiLogin: IIKO_LOGIN }),
    });
    if (!res.ok) throw new Error(`iiko access_token: ${res.status}`);
    const { token } = await res.json();
    iikoToken = { value: token, expires: Date.now() + 50 * 60 * 1000 };
  }
  const res = await fetch(`${IIKO_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${iikoToken.value}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`iiko ${endpoint}: ${res.status} ${await res.text()}`);
  return res.json();
}

interface IikoCustomer {
  id: string;
  name: string | null;
  phone: string | null;
  cards: { number: string }[];
  walletBalances: { balance: number }[];
  whenRegistered?: string;
}

function fromIiko(c: IikoCustomer): LoyaltyCustomer {
  return {
    id: c.id,
    name: c.name ?? "",
    phone: c.phone ?? "",
    cardNumber: c.cards[0]?.number ?? "",
    balance: c.walletBalances.reduce((sum, w) => sum + w.balance, 0),
    createdAt: c.whenRegistered ?? new Date().toISOString(),
  };
}

async function iikoFindByPhone(phone: string): Promise<LoyaltyCustomer | null> {
  try {
    const c = await iikoFetch<IikoCustomer>("/api/1/loyalty/iiko/customer/info", {
      organizationId: IIKO_ORG,
      type: "phone",
      phone,
    });
    return fromIiko(c);
  } catch {
    return null; // iiko отвечает 400, если гость не найден
  }
}

async function iikoGetOrCreate(phone: string, name: string): Promise<LoyaltyCustomer> {
  const existing = await iikoFindByPhone(phone);
  if (existing) return existing;
  const { id } = await iikoFetch<{ id: string }>(
    "/api/1/loyalty/iiko/customer/create_or_update",
    { organizationId: IIKO_ORG, phone, name }
  );
  const cardNumber = makeCardNumber();
  await iikoFetch("/api/1/loyalty/iiko/customer/card/add", {
    organizationId: IIKO_ORG,
    customerId: id,
    cardNumber,
    cardTrack: cardNumber,
  });
  return (await iikoFindByPhone(phone)) ?? {
    id,
    name,
    phone,
    cardNumber,
    balance: 0,
    createdAt: new Date().toISOString(),
  };
}

async function iikoGetById(id: string): Promise<LoyaltyCustomer | null> {
  try {
    const c = await iikoFetch<IikoCustomer>("/api/1/loyalty/iiko/customer/info", {
      organizationId: IIKO_ORG,
      type: "id",
      id,
    });
    return fromIiko(c);
  } catch {
    return null;
  }
}

/* ---------- mock (локально, пока нет apiLogin) ---------- */

const MOCK_PATH = path.join(process.cwd(), "data/customers.json");
// На Vercel файловая система read-only — держим мок в памяти инстанса
const memory: Record<string, LoyaltyCustomer> = {};

async function mockRead(): Promise<Record<string, LoyaltyCustomer>> {
  try {
    return JSON.parse(await fs.readFile(MOCK_PATH, "utf-8"));
  } catch {
    return { ...memory };
  }
}

async function mockWrite(all: Record<string, LoyaltyCustomer>) {
  Object.assign(memory, all);
  try {
    await fs.writeFile(MOCK_PATH, JSON.stringify(all, null, 2) + "\n", "utf-8");
  } catch {
    // read-only FS — остаёмся на памяти
  }
}

async function mockGetOrCreate(phone: string, name: string): Promise<LoyaltyCustomer> {
  const all = await mockRead();
  const existing = Object.values(all).find((c) => c.phone === phone);
  if (existing) return existing;
  const customer: LoyaltyCustomer = {
    id: crypto.randomUUID(),
    name,
    phone,
    cardNumber: makeCardNumber(),
    balance: 25000, // приветственный бонус в моке, чтобы карта не пустовала
    createdAt: new Date().toISOString(),
  };
  all[customer.id] = customer;
  await mockWrite(all);
  return customer;
}

async function mockGetById(id: string): Promise<LoyaltyCustomer | null> {
  return (await mockRead())[id] ?? null;
}

/* ---------- public API ---------- */

export async function getOrCreateCustomer(phone: string, name: string): Promise<LoyaltyCustomer> {
  return usingIiko ? iikoGetOrCreate(phone, name) : mockGetOrCreate(phone, name);
}

export async function getCustomerById(id: string): Promise<LoyaltyCustomer | null> {
  return usingIiko ? iikoGetById(id) : mockGetById(id);
}
