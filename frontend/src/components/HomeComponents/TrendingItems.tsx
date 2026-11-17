// src/components/HomeComponents/TrendingItems.tsx
"use client";

import React from "react";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import ScrollAnimatedList from "@components/ScrollAnimatedList";
import ScrollAnimatedItem from "@components/ScrollAnimatedItem";
import { motion } from "framer-motion";

type TrendingItem = {
  id: number;
  name: string;
  price: number;
  image: string;
};

const trendingItems: TrendingItem[] = [
  {
    id: 1,
    name: "Margherita Pizza",
    price: 15.99,
    //image: "/assets/images/trending/pizza.jpg"
    image: "/assets/image-fallback.jpg"
  },
  {
    id: 2,
    name: "Loaded Burger",
    price: 12.99,
    //image: "/assets/images/trending/burger.jpg"
    image: "/assets/image-fallback.jpg"
  },
  {
    id: 3,
    name: "Fresh Mango Juice",
    price: 4.99,
    //image: "/assets/images/trending/juice.jpg"
    image: "/assets/image-fallback.jpg"
  },
  {
    id: 4,
    name: "Creamy Pasta",
    price: 13.99,
    //image: "/assets/images/trending/pasta.jpg"
    image: "/assets/image-fallback.jpg"
  }
];

export default function TrendingItems() {
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
        <ScrollAnimatedList className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingItems.map((item) => (
            <ScrollAnimatedItem
              key={item.id}
              className="group bg-surface-card rounded-xl shadow-md hover:shadow-xl transition-smooth overflow-hidden border border-divider-card gpu-fix"
            >
              {/* Image */}
              <div className="relative h-48 bg-surface-placeholder overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/image-fallback.jpg";
                    e.currentTarget.srcset = "";
                  }}
                />
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-heading text-lg font-semibold text-content-main mb-2 line-clamp-1">
                  {item.name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-brand">
                    ${item.price.toFixed(2)}
                  </span>
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-brand-on rounded-lg transition-colors"
                    aria-label={`Add ${item.name} to cart`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">
                      Add
                    </span>
                  </button>
                </div>
              </div>
            </ScrollAnimatedItem>
          ))}
        </ScrollAnimatedList>
      </div>
    </section>
  );
}
