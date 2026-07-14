import MenuApp from "@/components/MenuApp";
import menu from "@/data/menu.json";
import type { MenuData } from "@/lib/types";

export default function MatchaMenuPage() {
  return <MenuApp menu={menu as MenuData} theme="matcha" />;
}
