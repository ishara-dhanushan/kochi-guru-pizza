// src/components/MenuItemCard.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MenuItem, IPriceVariant } from "@typings/menu";
import MenuCategoryIcon from "@components/MenuCategoryIcon";

export default function MenuItemCard({ item }: { item: MenuItem }) {
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
        aria-label={item.name}
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
            <MenuCategoryIcon
              category={item.category}
              className="size-16 text-content-main opacity-20"
            />
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
