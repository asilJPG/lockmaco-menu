import type { Metadata } from "next";
import CardApp from "@/components/CardApp";

export const metadata: Metadata = {
  title: "The Lokmaco · Бонусная карта",
  description: "Бонусная карта The Lokmaco — копите бонусы с каждой покупкой.",
};

export default function Page({ searchParams }: { searchParams: { theme?: string } }) {
  return <CardApp theme={searchParams.theme || "classic"} />;
}
