// src/app/dashboard/menu/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  RefreshCw,
  UtensilsCrossed,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import { menuService } from "@services/menuService";
import {
  MenuItem,
  MenuCategory,
  CATEGORY_LABELS,
  CATEGORIES
} from "@typings/menu";
import MenuItemCard from "../components/MenuItemCard";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

export default function MenuManagementPage() {
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<MenuCategory | "all">(
    "all"
  );
  const [filterAvailability, setFilterAvailability] = useState<
    "all" | "available" | "unavailable"
  >("all");
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);

  // Fetch menu items and ignore responses from obsolete requests.
  const fetchItems = useCallback(
    (shouldIgnore: () => boolean = () => false) => {
      return menuService
        .getMenuItems()
        .then((data) => {
          if (!shouldIgnore()) {
            setItems(data);
          }
        })
        .catch(() => {
          if (!shouldIgnore()) {
            toast.error("Failed to load menu items");
          }
        })
        .finally(() => {
          if (!shouldIgnore()) {
            setLoading(false);
            setRefreshing(false);
          }
        });
    },
    []
  );

  // Load menu items when the page mounts.
  useEffect(() => {
    let ignore = false;

    void fetchItems(() => ignore);

    return () => {
      ignore = true;
    };
  }, [fetchItems]);

  // Refresh the list without replacing it with the initial loading screen.
  const handleRefresh = async () => {
    if (loading || refreshing) return;

    setRefreshing(true);
    await fetchItems();
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await menuService.deleteMenuItem(deletingItem._id);
      setItems((prev) => prev.filter((i) => i._id !== deletingItem._id));
      toast.success("Menu item deleted");
      setDeletingItem(null);
    } catch {
      toast.error("Failed to delete menu item");
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const updated = await menuService.updateMenuItem(item._id, {
        isAvailable: !item.isAvailable
      });
      setItems((prev) =>
        prev.map((i) => (i._id === updated._id ? updated : i))
      );
      toast.success(
        updated.isAvailable ? "Marked as available" : "Marked as unavailable"
      );
    } catch {
      toast.error("Failed to update availability");
    }
  };

  const filtered = items.filter((item) => {
    const matchSearch =
      search === "" ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      filterCategory === "all" || item.category === filterCategory;
    const matchAvailability =
      filterAvailability === "all" ||
      (filterAvailability === "available" && item.isAvailable) ||
      (filterAvailability === "unavailable" && !item.isAvailable);
    return matchSearch && matchCategory && matchAvailability;
  });

  const grouped = CATEGORIES.reduce(
    (acc, cat) => {
      const catItems = filtered.filter((i) => i.category === cat);
      if (catItems.length > 0) acc[cat] = catItems;
      return acc;
    },
    {} as Record<MenuCategory, MenuItem[]>
  );

  const totalItems = items.length;
  const availableCount = items.filter((i) => i.isAvailable).length;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-content-main">
            Menu Management
          </h1>
          <p className="text-sm text-content-muted mt-1">
            {totalItems} items · {availableCount} available
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="p-2.5 rounded-xl border border-divider-control text-content-muted enabled:hover:text-brand enabled:hover:border-brand/60 transition-all disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => router.push("/dashboard/menu/new")}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-btn text-brand-on rounded-xl font-semibold text-sm hover:bg-brand-btn-hover shadow-lg shadow-brand/20 hover:shadow-brand/50 transition-all"
          >
            <Plus size={16} />
            Add Item
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col sm:flex-row gap-3 mb-6"
      >
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-card border border-divider-control rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-smooth text-content-main placeholder-content-muted"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) =>
            setFilterCategory(e.target.value as MenuCategory | "all")
          }
          className="px-4 py-2.5 bg-surface-card border border-divider-control rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-smooth text-content-subtle"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
        <select
          value={filterAvailability}
          onChange={(e) =>
            setFilterAvailability(e.target.value as typeof filterAvailability)
          }
          className="px-4 py-2.5 bg-surface-card border border-divider-control rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-smooth text-content-subtle"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 size={32} className="animate-spin text-brand" />
          <p className="text-sm text-content-muted">Loading menu items...</p>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-brand-wash dark:bg-brand-wash/25 flex items-center justify-center">
            <UtensilsCrossed size={28} className="text-brand" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-content-subtle">
              {search ||
              filterCategory !== "all" ||
              filterAvailability !== "all"
                ? "No items match your filters"
                : "No menu items yet"}
            </p>
            <p className="text-sm text-content-muted mt-1">
              {search ||
              filterCategory !== "all" ||
              filterAvailability !== "all"
                ? "Try adjusting your search or filters"
                : 'Click "Add Item" to add your first menu item'}
            </p>
          </div>
          {!search &&
            filterCategory === "all" &&
            filterAvailability === "all" && (
              <button
                onClick={() => router.push("/dashboard/menu/new")}
                className="flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-hover text-brand-on rounded-xl font-semibold text-sm transition-all"
              >
                <Plus size={16} />
                Add First Item
              </button>
            )}
        </motion.div>
      ) : (
        <div className="space-y-8">
          {(Object.keys(grouped) as MenuCategory[]).map((cat, catIdx) => (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIdx * 0.05 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-bold text-content-main uppercase tracking-wider">
                  {CATEGORY_LABELS[cat]}
                </h2>
                <span className="text-xs bg-surface-inset text-content-muted px-2 py-0.5 rounded-full font-medium">
                  {grouped[cat].length}
                </span>
                <div className="flex-1 h-px bg-divider-subtle" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                <AnimatePresence>
                  {grouped[cat].map((item) => (
                    <MenuItemCard
                      key={item._id}
                      item={item}
                      onDelete={setDeletingItem}
                      onToggleAvailability={handleToggleAvailability}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Menu Item Confirmation Modal */}
      <AnimatePresence>
        {deletingItem && (
          <DeleteConfirmModal
            key={deletingItem._id}
            item={deletingItem}
            onConfirm={handleDelete}
            onClose={() => setDeletingItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
