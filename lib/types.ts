export type Lang = "ru" | "uz" | "en";

export type L10n = Record<Lang, string>;

export interface Nutrition {
  kcal?: number;
  proteins?: number;
  fats?: number;
  carbs?: number;
}

export interface MenuItem {
  id: string;
  name: L10n;
  description: L10n;
  price: number;
  imageUrl: string;
  weight?: number;
  measureUnit?: "г" | "мл" | "шт";
  nutrition?: Nutrition;
  available: boolean;
}

export interface Category {
  id: string;
  name: L10n;
  items: MenuItem[];
}

export type SectionKey = "food" | "drinks";

export interface MenuData {
  brand: {
    name: string;
    tagline?: string;
    currency: L10n;
    welcomeTitle: string;
    welcomeLine: string;
  };
  sections: Record<SectionKey, Category[]>;
}
