import type { Metadata } from "next";
import CardApp from "@/components/CardApp";

export const metadata: Metadata = {
  title: "The Lokmaco · Бонусная карта",
  description: "Бонусная карта The Lokmaco — копите бонусы с каждой покупкой.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>;
}) {
  const { theme } = (await searchParams) || {};
  return <CardApp theme={theme || "classic"} />;
}
