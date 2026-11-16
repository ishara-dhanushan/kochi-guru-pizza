// src/app/menu/components/MenuContent.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  MenuItem,
  IPriceVariant,
  MenuCategory,
  CATEGORY_LABELS,
  CATEGORIES
} from "@typings/menu";
import { UtensilsCrossed, Search, ChevronRight } from "lucide-react";
import ScrollAnimatedList from "@components/ScrollAnimatedList";
import ScrollAnimatedItem from "@components/ScrollAnimatedItem";

interface MenuContentProps {
  grouped: Partial<Record<MenuCategory, MenuItem[]>>;
}

const CATEGORY_ICONS: Record<MenuCategory, string> = {
  pizza: "🍕",
  pasta: "🍝",
  bun: "🍔",
  sandwich: "🥪",
  snack: "🍟",
  fresh_juice: "🥤",
  milkshake: "🥛",
  mojito: "🍹",
  soft_drinks: "🧃",
  add_on: "✨"
};

function MenuItemCard({ item }: { item: MenuItem }) {
  const hasVariants = item.variants && item.variants.length > 0;

  // The first image in the array is the primary image selected in the dashboard.
  const primaryImage = item.images[0];

  const sortedVariants = hasVariants
    ? [...item.variants!].sort((a, b) => {
        const order: Record<string, number> = { large: 0, medium: 1, small: 2 };
        return order[a.size] - order[b.size];
      })
    : [];

  const [selectedVariant, setSelectedVariant] = useState<IPriceVariant | null>(
    sortedVariants[0] ?? null
  );

  const displayPrice = hasVariants
    ? selectedVariant
      ? `Rs. ${selectedVariant.price.toLocaleString()}`
      : null
    : item.price != null
      ? `Rs. ${item.price.toLocaleString()}`
      : null;

  return (
    <div className="group bg-surface-card hover:bg-surface-card-hover rounded-2xl overflow-hidden border border-divider-card shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col h-full">
      {/* Image */}
      <Link
        href={`/menu/${item._id}`}
        className="block relative h-52 bg-surface-placeholder overflow-hidden shrink-0"
      >
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={item.name}
            width={0}
            height={0}
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl opacity-20">
              {CATEGORY_ICONS[item.category]}
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Name + description */}
        <div className="flex-1">
          <Link href={`/menu/${item._id}`}>
            <h3 className="font-heading font-bold text-content-main text-base leading-snug hover:text-brand transition-colors">
              {item.name}
            </h3>
          </Link>
          {item.description && (
            <p className="text-sm text-content-muted mt-1.5 leading-relaxed line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        {/* Variant dropdown */}
        {hasVariants && sortedVariants.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-content-subtle uppercase tracking-wide mb-1">
              Size
            </label>
            <select
              value={selectedVariant?.size ?? ""}
              onChange={(e) => {
                const v = sortedVariants.find((v) => v.size === e.target.value);
                setSelectedVariant(v ?? null);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full border border-divider-control rounded-lg px-3 py-2 text-sm bg-surface-inset text-content-main focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-smooth cursor-pointer"
            >
              {sortedVariants.map((v) => (
                <option key={v.size} value={v.size}>
                  {v.size.charAt(0).toUpperCase() + v.size.slice(1)} — Rs.{" "}
                  {v.price.toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Price row */}
        <div className="flex items-center justify-between pt-1 border-t border-divider-subtle">
          {displayPrice ? (
            <span className="text-base font-extrabold text-brand">
              {displayPrice}
            </span>
          ) : (
            <span className="text-sm text-content-muted">—</span>
          )}
          <Link
            href={`/menu/${item._id}`}
            className="flex items-center gap-0.5 text-xs font-semibold text-content-muted hover:text-brand transition-colors"
          >
            View details <ChevronRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MenuContent({ grouped }: MenuContentProps) {
  const availableCategories = CATEGORIES.filter((cat) => grouped[cat]?.length);
  const [activeCategory, setActiveCategory] = useState<MenuCategory | "all">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const visibleCategories =
    activeCategory === "all"
      ? availableCategories
      : availableCategories.filter((c) => c === activeCategory);

  // Pre-compute filtered items per category to avoid O(N) operations inside render loops
  const filteredCategoryMap = React.useMemo(() => {
    const map = new Map<MenuCategory, MenuItem[]>();
    const q = searchQuery.trim().toLowerCase();

    for (const cat of visibleCategories) {
      const items = grouped[cat] ?? [];

      if (!q) {
        map.set(cat, items);
      } else {
        const filtered = items.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            i.description?.toLowerCase().includes(q)
        );
        map.set(cat, filtered);
      }
    }

    return map;
  }, [grouped, visibleCategories, searchQuery]);

  const filteredCategories = visibleCategories.filter(
    (cat) => (filteredCategoryMap.get(cat)?.length ?? 0) > 0
  );

  if (availableCategories.length === 0) {
    return (
      <section className="py-32 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-brand-wash dark:bg-brand-wash/25 flex items-center justify-center mx-auto mb-6">
            <UtensilsCrossed className="w-9 h-9 text-brand-muted" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-content-main mb-3">
            Menu coming soon
          </h2>
          <p className="text-content-muted">
            We&apos;re still setting things up. Check back shortly!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 md:py-14 bg-surface transition-colors min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search bar */}
        <div className="relative max-w-md mx-auto mb-8">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-divider-control bg-surface-inset text-sm text-content-main placeholder-content-muted hover:ring-2 hover:ring-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-smooth shadow-sm"
          />
        </div>

        {/* Sticky category filter tabs */}
        <div className="sticky top-0 z-20 bg-surface/75 backdrop-blur-sm py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-10">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveCategory("all")}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-smooth border ${
                activeCategory === "all"
                  ? "bg-brand text-brand-on border-brand shadow-md shadow-brand/20"
                  : "bg-surface-card text-content-muted border-divider-control hover:border-brand hover:text-brand"
              }`}
            >
              All Items
            </button>
            {availableCategories.map((cat) => {
              const count = grouped[cat]?.length ?? 0;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-smooth border ${
                    activeCategory === cat
                      ? "bg-brand text-brand-on border-brand shadow-md shadow-brand/20"
                      : "bg-surface-card text-content-muted border-divider-control hover:border-brand hover:text-brand"
                  }`}
                >
                  <span>{CATEGORY_ICONS[cat]}</span>
                  {CATEGORY_LABELS[cat]}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      activeCategory === cat
                        ? "bg-white/20 text-brand-on"
                        : "bg-surface-soft text-content-muted"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category sections */}
        <div className="space-y-14">
          <AnimatePresence mode="wait">
            {filteredCategories.length === 0 ? (
              <motion.div
                key="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20 text-content-muted"
              >
                <Search className="w-12 h-12 mx-auto mb-4 text-content-muted" />
                <p className="font-semibold text-lg">No items found</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </motion.div>
            ) : (
              filteredCategories.map((cat) => (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Category heading */}
                  <ScrollAnimatedItem className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{CATEGORY_ICONS[cat]}</span>
                      <h2 className="font-heading text-2xl md:text-3xl font-bold text-content-main">
                        {CATEGORY_LABELS[cat]}
                      </h2>
                    </div>
                    <div className="flex-1 h-px bg-divider-standard" />
                    <span className="text-sm text-content-muted font-medium shrink-0">
                      {filteredCategoryMap.get(cat)?.length ?? 0}{" "}
                      {(filteredCategoryMap.get(cat)?.length ?? 0) === 1
                        ? "item"
                        : "items"}
                    </span>
                  </ScrollAnimatedItem>

                  {/* Responsive grid: 1 col mobile, 2 col sm, 3 col lg, 4 col xl */}
                  <ScrollAnimatedList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {(filteredCategoryMap.get(cat) ?? []).map((item) => (
                      <ScrollAnimatedItem key={item._id} className="h-full">
                        <MenuItemCard item={item} />
                      </ScrollAnimatedItem>
                    ))}
                  </ScrollAnimatedList>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
