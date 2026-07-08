import type { Lang } from "./types";

export const LANGS: Lang[] = ["ru", "uz", "en"];

export const UI: Record<Lang, Record<string, string>> = {
  ru: {
    menu_title: "Меню",
    food: "Еда",
    drinks: "Напитки",
    search: "Поиск в меню...",
    all: "Все",
    no_results: "Ничего не найдено",
    nutrition: "Пищевая ценность",
    kcal: "ккал",
    proteins: "белки",
    fats: "жиры",
    carbs: "углеводы",
    items: "поз.",
    qr_menu: "МЕНЮ",
  },
  uz: {
    menu_title: "Menyu",
    food: "Taomlar",
    drinks: "Ichimliklar",
    search: "Menyudan qidirish...",
    all: "Barchasi",
    no_results: "Hech narsa topilmadi",
    nutrition: "Oziqaviy qiymati",
    kcal: "kkal",
    proteins: "oqsil",
    fats: "yog‘",
    carbs: "uglevod",
    items: "ta",
    qr_menu: "MENYU",
  },
  en: {
    menu_title: "Menu",
    food: "Food",
    drinks: "Drinks",
    search: "Search the menu...",
    all: "All",
    no_results: "Nothing found",
    nutrition: "Nutrition facts",
    kcal: "kcal",
    proteins: "protein",
    fats: "fat",
    carbs: "carbs",
    items: "items",
    qr_menu: "MENU",
  },
};

export const BADGES: Record<string, Record<Lang, string>> = {
  hit: { ru: "Хит", uz: "Xit", en: "Hit" },
  new: { ru: "Новинка", uz: "Yangi", en: "New" },
  spicy: { ru: "Острое", uz: "Achchiq", en: "Spicy" },
};

export const UNITS: Record<string, Record<Lang, string>> = {
  "г": { ru: "г", uz: "g", en: "g" },
  "мл": { ru: "мл", uz: "ml", en: "ml" },
  "шт": { ru: "шт", uz: "dona", en: "pcs" },
};

export function unitLabel(unit: string | undefined, lang: Lang): string {
  return unit ? UNITS[unit]?.[lang] ?? unit : "";
}

export function formatPrice(price: number): string {
  return price.toLocaleString("ru-RU").replace(/,/g, " ");
}
