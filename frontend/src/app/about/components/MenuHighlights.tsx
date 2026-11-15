// src/app/about/components/MenuHighlights.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Flame, Leaf, Zap, ChefHat } from "lucide-react";
import { motion } from "framer-motion";
import ScrollAnimatedList from "@components/ScrollAnimatedList";
import ScrollAnimatedItem from "@components/ScrollAnimatedItem";

const menuHighlights = [
  {
    icon: <Flame className="w-8 h-8" />,
    category: "Pizza",
    description:
      "Italian, Chicken, BBQ Chicken, Kochchi, Seafood, Supreme — available in 3 sizes."
  },
  {
    icon: <ChefHat className="w-8 h-8" />,
    category: "Buns & Snacks",
    description:
      "Burgers, Hotdogs, Cheese Sandwiches, Cheese Roll, and crispy French Fries."
  },
  {
    icon: <Zap className="w-8 h-8" />,
    category: "Pasta",
    description:
      "Spaghetti with Chicken & Sausage or Seafood — rich, hearty, and satisfying."
  },
  {
    icon: <Leaf className="w-8 h-8" />,
    category: "Drinks",
    description:
      "Fresh Juices, Milkshakes, Mojitos, Soft Drinks — the perfect companion to your meal."
  }
];

export default function MenuHighlights() {
  return (
    <section className="py-20 md:py-24 bg-surface-alternate/30 dark:bg-surface-alternate transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 gpu-fix"
        >
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-content-main mb-4">
            A Menu for Every Craving
          </h2>
          <p className="text-lg text-content-muted max-w-2xl mx-auto">
            From wood-fired pizzas to refreshing drinks, we have something for
            everyone
          </p>
        </motion.div>

        <ScrollAnimatedList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuHighlights.map((item) => (
            <ScrollAnimatedItem key={item.category} className="h-full">
              <motion.div
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group bg-surface-card rounded-xl shadow-md hover:shadow-xl transition-smooth border border-divider-card p-6 gpu-fix h-full"
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blob-gradient text-brand-on mb-4 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="font-heading text-xl font-semibold text-content-main mb-3">
                  {item.category}
                </h3>
                <p className="text-content-muted leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            </ScrollAnimatedItem>
          ))}
        </ScrollAnimatedList>

        <div className="text-center mt-10">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-btn text-brand-on font-bold rounded-xl hover:bg-brand-btn-hover shadow-lg shadow-brand/20 hover:shadow-brand/30 transition-all"
          >
            View Full Menu
          </Link>
        </div>
      </div>
    </section>
  );
}
