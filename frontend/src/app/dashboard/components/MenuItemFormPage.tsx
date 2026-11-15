// src/app/dashboard/components/MenuItemFormPage.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  MenuItem,
  MenuCategory,
  CreateMenuItemPayload,
  CATEGORY_LABELS,
  CATEGORIES,
  VARIANT_CATEGORIES,
  IPriceVariant,
  PizzaSize
} from "@typings/menu";
import ImageGalleryManager from "@/components/admin/ImageGalleryManager";

interface MenuItemFormPageProps {
  item?: MenuItem | null; // null/undefined = create mode
  onSave: (payload: CreateMenuItemPayload) => Promise<void>;
}

const SIZE_OPTIONS: { value: PizzaSize; label: string }[] = [
  { value: "large", label: "Large" },
  { value: "medium", label: "Medium" },
  { value: "small", label: "Small" }
];

const DEFAULT_VARIANTS: IPriceVariant[] = [
  { size: "large", price: 0 },
  { size: "medium", price: 0 },
  { size: "small", price: 0 }
];

export default function MenuItemFormPage({
  item,
  onSave
}: MenuItemFormPageProps) {
  const isEdit = !!item;

  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [longDescription, setLongDescription] = useState(
    item?.longDescription ?? ""
  );
  const [category, setCategory] = useState<MenuCategory>(
    item?.category ?? "pizza"
  );
  const [price, setPrice] = useState<string>(
    item?.price !== undefined ? String(item.price) : ""
  );
  const [variants, setVariants] = useState<IPriceVariant[]>(
    item?.variants && item.variants.length > 0
      ? item.variants
      : DEFAULT_VARIANTS
  );
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable ?? true);
  const [images, setImages] = useState<string[]>(item?.images ?? []);
  const [sortOrder, setSortOrder] = useState<string>(
    item?.sortOrder !== undefined ? String(item.sortOrder) : "0"
  );
  const [saving, setSaving] = useState(false);

  const isVariantCategory = VARIANT_CATEGORIES.includes(category);

  // Reset pricing when category changes (only in create mode)
  const handleCategoryChange = (newCategory: MenuCategory) => {
    if (newCategory === category) return;

    setCategory(newCategory);

    if (!isEdit) {
      setVariants(DEFAULT_VARIANTS);
      setPrice("");
    }
  };

  const updateVariantPrice = (size: PizzaSize, value: string) => {
    setVariants((prev) =>
      prev.map((v) =>
        v.size === size ? { ...v, price: Number(value) || 0 } : v
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (isVariantCategory) {
      const hasInvalidVariant = variants.some((v) => v.price <= 0);
      if (hasInvalidVariant) {
        toast.error("All variant prices must be greater than 0");
        return;
      }
    } else {
      if (!price || Number(price) <= 0) {
        toast.error("Price must be greater than 0");
        return;
      }
    }

    const payload: CreateMenuItemPayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      longDescription: longDescription.trim() || undefined,
      category,
      isAvailable,
      sortOrder: Number(sortOrder) || 0,
      images: images
    };

    if (isVariantCategory) {
      payload.variants = variants;
    } else {
      payload.price = Number(price);
    }

    setSaving(true);
    try {
      await onSave(payload);
    } catch {
      // onSave handles toast errors
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-8"
      >
        <Link
          href="/dashboard/menu"
          className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-orange-500 hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-200"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? "Edit Menu Item" : "Add Menu Item"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {isEdit
              ? `Editing "${item.name}"`
              : "Fill in the details to add a new item to the menu"}
          </p>
        </div>
      </motion.div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm max-w-3xl mx-auto"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Item Name <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chicken Pizza"
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Category <span className="text-orange-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) =>
                handleCategoryChange(e.target.value as MenuCategory)
              }
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200 text-gray-900 dark:text-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Short Description
              <span className="ml-1.5 text-xs font-normal text-gray-400">
                (shown on menu card — 2 lines max)
              </span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Chicken, Onion, Green Chilli, Cheese"
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>

          {/* Long Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Long Description
              <span className="ml-1.5 text-xs font-normal text-gray-400">
                (shown on item detail page only)
              </span>
            </label>
            <textarea
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
              rows={4}
              placeholder="Describe the item in detail — ingredients, preparation, allergens, etc."
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-400 resize-none"
            />
          </div>

          {/* Pricing */}
          {isVariantCategory ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Pricing by Size <span className="text-orange-500">*</span>
              </label>
              <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-4 space-y-3">
                {SIZE_OPTIONS.map((sizeOpt) => {
                  const variant = variants.find(
                    (v) => v.size === sizeOpt.value
                  );
                  return (
                    <div
                      key={sizeOpt.value}
                      className="flex items-center gap-4"
                    >
                      <span className="w-16 text-sm text-gray-600 dark:text-gray-400 font-semibold">
                        {sizeOpt.label}
                      </span>
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                          Rs.
                        </span>
                        <input
                          type="number"
                          min={0}
                          value={variant?.price ?? 0}
                          onChange={(e) =>
                            updateVariantPrice(sizeOpt.value, e.target.value)
                          }
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Price <span className="text-orange-500">*</span>
              </label>
              <div className="relative max-w-xs">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                  Rs.
                </span>
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  className="w-full pl-12 pr-4 py-2.5 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Image Gallery Manager */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Product Images
            </label>
            <ImageGalleryManager initialImages={images} onChange={setImages} />
          </div>

          {/* Sort Order + Availability row */}
          <div className="flex flex-col sm:flex-row gap-5 pt-1">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Sort Order
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex flex-col justify-end pb-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Availability
              </label>
              <button
                type="button"
                onClick={() => setIsAvailable((p) => !p)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                  isAvailable
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40 text-green-700 dark:text-green-400"
                    : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400"
                }`}
              >
                <div
                  className={`w-9 h-5 rounded-full transition-colors duration-200 flex items-center px-0.5 shrink-0 ${
                    isAvailable
                      ? "bg-green-500 dark:bg-green-600"
                      : "bg-red-500 dark:bg-red-600"
                  }`}
                >
                  <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`w-4 h-4 bg-white rounded-full shadow ${isAvailable ? "ml-auto" : ""}`}
                  />
                </div>
                {isAvailable ? "Available" : "Unavailable"}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-2" />

          {/* Actions */}
          <div className="flex gap-3">
            <Link
              href="/dashboard/menu"
              className="flex-1 sm:flex-none px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 sm:flex-none px-8 py-3 bg-linear-to-r from-orange-600 to-orange-500 text-white rounded-xl font-semibold text-sm hover:from-orange-700 hover:to-orange-600 shadow-lg shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {isEdit ? "Save Changes" : "Add Item"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
