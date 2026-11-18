// src/components/HomeComponents/TrendingItems.tsx
"use client";

import { motion } from "framer-motion";
import { MenuItem } from "@typings/menu";
import MenuItemCard from "@components/MenuItemCard";
import ScrollAnimatedList from "@components/ScrollAnimatedList";
import ScrollAnimatedItem from "@components/ScrollAnimatedItem";

interface TrendingItemsProps {
  items: MenuItem[];
}

export default function TrendingItems({ items }: TrendingItemsProps) {
  // Hide the section when no selected menu items are available.
  if (items.length === 0) return null;

  return (
    <section className="py-20 md:py-24 bg-surface-alternate/30 dark:bg-surface-alternate transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 gpu-fix"
        >
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-content-main mb-4">
            Trending Now
          </h2>
          <p className="text-lg text-content-muted max-w-2xl mx-auto">
            Discover our most popular items that customers can&apos;t get enough
            of
          </p>
        </motion.div>

        {/* Grid */}
        <ScrollAnimatedList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((item) => (
            <ScrollAnimatedItem key={item._id} className="h-full">
              <MenuItemCard item={item} />
            </ScrollAnimatedItem>
          ))}
        </ScrollAnimatedList>
      </div>
    </section>
  );
}
