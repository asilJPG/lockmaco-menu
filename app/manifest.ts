import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Lokmaco · Бонусная карта",
    short_name: "Lokmaco",
    description: "Бонусная карта The Lokmaco",
    start_url: "/card",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAF3E7",
    theme_color: "#3B2416",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
