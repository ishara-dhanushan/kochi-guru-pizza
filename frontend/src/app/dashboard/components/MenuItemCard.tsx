// src/app/dashboard/components/MenuItemCard.tsx
"use client";

import { motion } from "framer-motion";
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { MenuItem } from "@typings/menu";
import { useAuth } from "@contexts/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MenuCategoryIcon from "@components/MenuCategoryIcon";

interface MenuItemCardProps {
  item: MenuItem;
  onDelete: (item: MenuItem) => void;
  onToggleAvailability: (item: MenuItem) => void;
}

export default function MenuItemCard({
  item,
  onDelete,
  onToggleAvailability
}: MenuItemCardProps) {
  const { user } = useAuth();
  const router = useRouter();

  // The first image in the array is the primary menu item image.
  const primaryImage = item.images[0];

  const renderPrice = () => {
    if (item.variants && item.variants.length > 0) {
      const sorted = [...item.variants].sort((a, b) => {
        const order = { large: 0, medium: 1, small: 2 };
        return order[a.size] - order[b.size];
      });
      return (
        <div className="flex gap-2 flex-wrap">
          {sorted.map((v) => (
            <span
              key={v.size}
              className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-lg font-semibold capitalize border border-orange-100 dark:border-orange-800/30"
            >
              {v.size[0].toUpperCase()}: Rs. {v.price.toLocaleString()}
            </span>
          ))}
        </div>
      );
    }
    return (
      <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
        Rs. {item.price?.toLocaleString()}
      </span>
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white dark:bg-gray-800/50 rounded-xl border transition-all duration-200 hover:shadow-md group ${
        item.isAvailable
          ? "border-gray-100 dark:border-gray-700"
          : "border-dashed border-gray-200 dark:border-gray-700 opacity-60"
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="w-14 h-14 rounded-xl bg-orange-50 dark:bg-orange-900/10 flex items-center justify-center shrink-0 overflow-hidden border border-orange-100 dark:border-orange-900/20">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={item.name}
              width={56}
              height={56}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <MenuCategoryIcon
              category={item.category}
              className="size-6 text-brand"
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                {item.name}
              </h3>
              {item.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                  {item.description}
                </p>
              )}
            </div>
            <span
              className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                item.isAvailable
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                  : "bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              }`}
            >
              {item.isAvailable ? "Available" : "Unavailable"}
            </span>
          </div>
          <div className="mt-2">{renderPrice()}</div>
        </div>
      </div>

      <div className="flex border-t border-gray-50 dark:border-gray-700/50">
        <button
          onClick={() => onToggleAvailability(item)}
          title={item.isAvailable ? "Mark unavailable" : "Mark available"}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-gray-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all duration-150 rounded-bl-xl"
        >
          {item.isAvailable ? <EyeOff size={13} /> : <Eye size={13} />}
          {item.isAvailable ? "Hide" : "Show"}
        </button>
        <div className="w-px bg-gray-50 dark:bg-gray-700/50" />
        <button
          onClick={() => router.push(`/dashboard/menu/${item._id}`)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all duration-150"
        >
          <Pencil size={13} />
          Edit
        </button>
        {user?.role === "admin" && (
          <>
            <div className="w-px bg-gray-50 dark:bg-gray-700/50" />
            <button
              onClick={() => onDelete(item)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all duration-150 rounded-br-xl"
            >
              <Trash2 size={13} />
              Delete
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
