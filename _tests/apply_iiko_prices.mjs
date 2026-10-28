import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Load env
const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
  if (match) env[match[1]] = match[2];
}

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = env.SUPABASE_STORAGE_BUCKET || "lokmaco-uploads";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

// 1. Read current menu (prefer Supabase if exists, else local)
let menu;
try {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/menu.json`, { cache: "no-store" });
  if (res.ok) {
    menu = await res.json();
    console.log("Loaded menu from Supabase Storage");
  } else {
    throw new Error(`Supabase returned ${res.status}`);
  }
} catch (e) {
  console.log("Fallback to local data/menu.json:", e.message);
  menu = JSON.parse(fs.readFileSync("data/menu.json", "utf8"));
}

// Exact price updates map (item_id -> { newPrice, reason })
const PRICE_UPDATES = {
  // Завтраки
  "bliny-myaso": 35000,
  "bliny-tvorog": 30000,
  "bliny-apple": 30000,
  "dop-sgushenka": 10000,
  "dop-smetana": 10000,
  "kasha-mannaya": 35000,
  "kasha-ovsyanaya": 35000,
  "kasha-risovaya": 35000,
  "croissant-skrembl": 45000,
  "croissant-losos": 49000,
  "croissant-vetchina": 45000,
  "omlet-yaichnica": 30000,
  "omlet-turkey": 35000,
  "breakfast-english": 78000,
  "breakfast-cottage": 32000,
  "breakfast-syrniki": 48000,
  "breakfast-shakshuka": 55000,

  // Десерты
  "fondue-classic": 80000,
  "pancake-fruit": 68000,
  "crepes-fruit": 70000,
  "strawberry-cup": 68000,

  // Мороженое
  "ice-cream-choco": 40000,
  "ice-mix": 35000,
  "ice-chocomoko": 37000,
  "ice-chocomix": 60000,
  "ice-fruttimix": 55000,
  "ice-cukatimix": 55000,
  "box-vanilla": 50000,
  "box-choco": 65000,
  "box-chocomoko": 60000,
  "box-mix": 50000,

  // Салаты
  "salad-caesar": 50000,
  "salad-greek": 52000,
  "salad-tuna": 49000,

  // Горячие мясные блюда
  "meat-lamb-rack": 155000,
  "meat-salmon-rice": 113000,

  // Паста
  "pasta-alfredo": 68000,
  "pasta-pomodoro": 72000,
  "pasta-bolognese": 68000,

  // Пицца
  "pizza-four-cheeses": 65000,
  "pizza-pear": 80000,
  "pizza-pepperoni": 82000,

  // Коктейли
  "cocktail-gangster": 40000,
  "cocktail-maldives": 38000,
  "cocktail-sunset": 38000,
  "cocktail-mclaren": 45000,
};

const updatedItems = [];

// Apply price updates
for (const secKey of ["food", "drinks"]) {
  const categories = menu.sections?.[secKey] || [];
  for (const cat of categories) {
    for (const it of cat.items || []) {
      if (PRICE_UPDATES[it.id] !== undefined) {
        const oldPrice = it.price;
        const newPrice = PRICE_UPDATES[it.id];
        if (oldPrice !== newPrice) {
          it.price = newPrice;
          updatedItems.push({
            id: it.id,
            name: it.name?.ru,
            oldPrice,
            newPrice,
            cat: cat.name?.ru,
          });
        }
      }
    }
  }
}

// Check and add the 4 requested items if missing
const foodCategories = menu.sections?.food || [];
let meatCat = foodCategories.find((c) => c.id === "meat-dishes");
if (!meatCat) {
  meatCat = {
    id: "meat-dishes",
    name: { ru: "Горячие блюда", uz: "Issiq taomlar", en: "Hot Dishes" },
    items: [],
  };
  foodCategories.push(meatCat);
}

const NEW_DISHES = [
  {
    id: "burger-beef",
    name: { ru: "Бургер с говядиной", uz: "Mol go'shtli burger", en: "Beef Burger" },
    description: {
      ru: "Говяжья котлета, чеддер, соленые огурцы и помидоры на черной булочке",
      uz: "Mol go'shti kotleti, cheddar, tuzlangan bodring va pomidor, qora bulochkada",
      en: "Beef patty, cheddar, pickles and tomatoes on a black bun",
    },
    price: 61000,
    imageUrl: "",
    available: true,
  },
  {
    id: "fish-dorado",
    name: { ru: "Дорадо на гриле", uz: "Grilda dorado", en: "Grilled Dorado" },
    description: {
      ru: "Целая дорадо с лимоном и оливковым маслом",
      uz: "Butun dorado, limon va zaytun moyi bilan",
      en: "Whole dorado with lemon and olive oil",
    },
    price: 160000,
    imageUrl: "",
    available: true,
  },
  {
    id: "steak-machete",
    name: { ru: "Стейк мачете", uz: "Machete steyki", en: "Machete Steak" },
    description: {
      ru: "С насыщенным мясным вкусом, приготовленный на гриле",
      uz: "To'yingan go'sht ta'mi bilan, grilda",
      en: "Rich meaty flavor, grilled to perfection",
    },
    price: 150000,
    imageUrl: "",
    available: true,
  },
  {
    id: "steak-ribeye",
    name: { ru: "Рибай", uz: "Ribay", en: "Ribeye Steak" },
    description: {
      ru: "Говядина на гриле с соусом из тимьяна",
      uz: "Grilda pishirilgan mol go'shti, timyan sousi bilan",
      en: "Grilled beef with thyme sauce",
    },
    price: 173000,
    imageUrl: "",
    available: true,
  },
];

const addedItems = [];
for (const dish of NEW_DISHES) {
  const existing = meatCat.items.find((it) => it.id === dish.id || it.name?.ru === dish.name.ru);
  if (!existing) {
    meatCat.items.push(dish);
    addedItems.push(dish);
  } else {
    // update price if existing
    if (existing.price !== dish.price) {
      updatedItems.push({
        id: existing.id,
        name: existing.name?.ru,
        oldPrice: existing.price,
        newPrice: dish.price,
        cat: meatCat.name?.ru,
      });
      existing.price = dish.price;
    }
  }
}

console.log(`Updated ${updatedItems.length} prices:`);
for (const u of updatedItems) {
  console.log(`  [${u.cat}] ${u.name}: ${u.oldPrice?.toLocaleString()} -> ${u.newPrice?.toLocaleString()} UZS`);
}

if (addedItems.length > 0) {
  console.log(`\nAdded ${addedItems.length} new dishes to Горячие блюда:`);
  for (const a of addedItems) {
    console.log(`  + ${a.name.ru}: ${a.price.toLocaleString()} UZS`);
  }
}

// Save local
const jsonStr = JSON.stringify(menu, null, 2) + "\n";
fs.writeFileSync("data/menu.json", jsonStr, "utf8");
console.log("\nSaved data/menu.json locally");

// Save to Supabase Storage
const { error } = await supabase.storage.from(BUCKET).upload("menu.json", Buffer.from(jsonStr, "utf-8"), {
  contentType: "application/json",
  cacheControl: "0",
  upsert: true,
});

if (error) {
  console.error("Failed to upload to Supabase:", error);
} else {
  console.log("Successfully uploaded menu.json to Supabase Storage!");
}
