import type { Metadata, Viewport } from "next";
import { Playfair_Display, Manrope, Raleway } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

const raleway = Raleway({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500"],
  variable: "--font-raleway",
});

export const metadata: Metadata = {
  title: "The Lokmaco · QR Menu",
  description: "The Lokmaco — Your Personal Confectioner. Меню кофейни-кондитерской.",
};

export const viewport: Viewport = {
  themeColor: "#3B2416",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={`${playfair.variable} ${manrope.variable} ${raleway.variable}`}>{children}</body>
    </html>
  );
}
