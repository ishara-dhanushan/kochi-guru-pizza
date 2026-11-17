// src/app/dashboard/menu/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import toast from "react-hot-toast";
import { menuService } from "@services/menuService";
import { MenuItem, CreateMenuItemPayload } from "@typings/menu";
import MenuItemFormPage from "../../components/MenuItemFormPage";

export default function EditMenuItemPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const data = await menuService.getMenuItem(id);
        setItem(data);
      } catch {
        setNotFound(true);
        toast.error("Menu item not found");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchItem();
  }, [id]);

  const handleSave = async (payload: CreateMenuItemPayload) => {
    try {
      await menuService.updateMenuItem(id, payload);
      toast.success("Menu item updated!");
      router.push("/dashboard/menu");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update menu item";
      toast.error(message);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 size={32} className="animate-spin text-orange-500" />
        <p className="text-sm text-gray-400">Loading item...</p>
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-danger-wash dark:bg-danger-wash/25 flex items-center justify-center">
          <Search className="size-8 text-danger" aria-hidden="true" />
        </div>
        <div className="text-center">
          <h2 className="font-bold text-gray-900 dark:text-white">
            Item not found
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            This menu item doesn&apos;t exist or has been deleted.
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/menu")}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  return <MenuItemFormPage item={item} onSave={handleSave} />;
}
