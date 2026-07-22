export type Lang = "ru" | "uz" | "en";

export type L10n = Record<Lang, string>;

export interface Nutrition {
  kcal?: number;
  proteins?: number;
  fats?: number;
  carbs?: number;
}

export type Badge = "hit" | "new" | "spicy";

export interface MenuItem {
  id: string;
  name: L10n;
  description: L10n;
  price: number;
  imageUrl: string;
  imagePosition?: string; // object-position, напр. "50% 30%" — центрирование кадра
  videoUrl?: string; // короткое видео блюда (Kling); проигрывается в диалоге и уходит в фото
  weight?: number;
  measureUnit?: "г" | "мл" | "шт";
  nutrition?: Nutrition;
  badges?: Badge[];
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
    info?: {
      wifi?: string;
      phone?: string;
      instagram?: string;
      address?: string;
      hours?: string;
      service?: string;
    };
  };
  sections: Record<SectionKey, Category[]>;
}
