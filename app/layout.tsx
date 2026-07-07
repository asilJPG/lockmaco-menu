import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Onest } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const onest = Onest({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "The Lokmaco · QR Menu",
  description: "The Lokmaco — Your Personal Confectioner. Меню кофейни-кондитерской.",
};

export const viewport: Viewport = {
  themeColor: "#5C3317",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={`${cormorant.variable} ${onest.variable}`}>{children}</body>
    </html>
  );
}
