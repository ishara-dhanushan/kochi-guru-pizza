// src/app/menu/page.tsx
import { Metadata } from "next";
import Header from "@components/Header";
import Footer from "@components/Footer";
import MenuHeroBanner from "./components/MenuHeroBanner";
import MenuContent from "./components/MenuContent";
import { MenuItem, MenuCategory, CATEGORIES } from "@typings/menu";
import { httpServerClient } from "@lib/httpServerClient";

export const metadata: Metadata = {
  title: "Menu - Kochi Guru Pizza",
  description:
    "Explore our full menu — wood-fired pizzas, pasta, burgers, sandwiches, fresh juices, milkshakes, and more at Kochi Guru Pizza, Walasmulla.",
  openGraph: {
    title: "Menu - Kochi Guru Pizza",
    description:
      "From Italian-style pizzas in three sizes to fresh fruit juices — discover everything on our menu."
  }
};

async function fetchMenuItems(): Promise<MenuItem[]> {
  try {
    const data = await httpServerClient<{ items: MenuItem[] }>(
      "/menu?isAvailable=true",
      {
        next: { revalidate: 60 }
      }
    );

    const items: MenuItem[] = data.items ?? [];

    console.info(`✅ Successfully fetched ${items.length} menu items`);

    return items;
  } catch (error) {
    console.error("❌ Failed to fetch menu items despite retries:", error);
    return [];
  }
}

export default async function MenuPage() {
  const items = await fetchMenuItems();

  // Group by category, preserving CATEGORIES order
  const grouped = CATEGORIES.reduce(
    (acc, cat) => {
      const catItems = items.filter((i) => i.category === cat);
      if (catItems.length > 0) acc[cat] = catItems;
      return acc;
    },
    {} as Record<MenuCategory, MenuItem[]>
  );

  return (
    <>
      <Header />
      <MenuHeroBanner />
      <MenuContent grouped={grouped} />
      <Footer />
    </>
  );
}
