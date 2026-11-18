// src/app/page.tsx
import Header from "@components/Header";
import HeroSection from "@/components/HomeComponents/HeroSection";
import PromotionsSection from "@/components/HomeComponents/PromotionsSection";
import TrendingItems from "@/components/HomeComponents/TrendingItems";
import WhyChooseUs from "@/components/HomeComponents/WhyChooseUs";
import CustomerTestimonials from "@/components/HomeComponents/CustomerTestimonials";
import Footer from "@components/Footer";
import { fetchMenuItems } from "@services/menuServerService";
import { MenuItem } from "@typings/menu";

// Featured menu item IDs until trending analytics is implemented.
const TRENDING_ITEM_IDS = [
  "699bee908b3c7b09a0bcb84f", // Chicken Pizza
  "69a41be061fe718101710bf3", // BBQ Chicken Pizza
  "69a41f431e7de0751ce039ad", // Seafood Pizza
  "69a40f3d8bbc889da274ff37" // Burger
];

export default async function Home() {
  const items = await fetchMenuItems();

  // Select available trending items in the configured display order.
  const trendingItems: MenuItem[] = [];

  for (const id of TRENDING_ITEM_IDS) {
    const item = items.find((item) => item._id === id);

    if (item?.isAvailable) {
      trendingItems.push(item);
    }
  }

  return (
    <>
      <Header />
      <HeroSection />
      <PromotionsSection />
      <TrendingItems items={trendingItems} />
      <WhyChooseUs />
      <CustomerTestimonials />
      <Footer />
    </>
  );
}
