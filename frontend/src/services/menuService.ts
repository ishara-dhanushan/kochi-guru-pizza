// src/services/menuService.ts
import { httpClient } from "@lib/httpClient";
import {
  CATEGORIES,
  type MenuItem,
  type MenuListResponse,
  type MenuCategory,
  type CreateMenuItemPayload,
  type UpdateMenuItemPayload
} from "@typings/menu";

// Validate the fields required for reliable menu and cart rendering.
function isValidMenuItem(value: unknown): value is MenuItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Partial<MenuItem>;

  return (
    typeof item._id === "string" &&
    /^[a-fA-F0-9]{24}$/.test(item._id) &&
    typeof item.name === "string" &&
    item.name.trim().length > 0 &&
    item.category !== undefined &&
    CATEGORIES.includes(item.category) &&
    typeof item.isAvailable === "boolean" &&
    Array.isArray(item.images) &&
    item.images.every((image) => typeof image === "string") &&
    (item.price == null || typeof item.price === "number") &&
    (item.variants == null ||
      (Array.isArray(item.variants) &&
        item.variants.every(
          (variant) =>
            variant !== null &&
            typeof variant === "object" &&
            ["small", "medium", "large"].includes(variant.size) &&
            typeof variant.price === "number"
        )))
  );
}

/**
 * Fetch all menu items — public
 */
export const getMenuItems = async (params?: {
  category?: MenuCategory;
  isAvailable?: boolean;
}): Promise<MenuItem[]> => {
  const query = new URLSearchParams();

  if (params?.category) {
    query.set("category", params.category);
  }

  if (params?.isAvailable !== undefined) {
    query.set("isAvailable", String(params.isAvailable));
  }

  const qs = query.toString() ? `?${query.toString()}` : "";

  const response = await httpClient<MenuListResponse>(`/menu${qs}`, {
    cache: "no-store"
  });

  // Reject malformed responses instead of treating them as an empty menu.
  if (
    !Array.isArray(response?.items) ||
    !response.items.every(isValidMenuItem)
  ) {
    throw new Error("Invalid menu response");
  }

  // Duplicate identifiers indicate an invalid menu response.
  const uniqueIds = new Set(
    response.items.map((item) => item._id.toLowerCase())
  );

  if (uniqueIds.size !== response.items.length) {
    throw new Error("Duplicate menu item identifiers");
  }

  return response.items;
};

/**
 * Get a single menu item — public
 */
export const getMenuItem = async (id: string): Promise<MenuItem> => {
  return httpClient<MenuItem>(`/menu/${id}`);
};

/**
 * Create a menu item — admin/staff only
 */
export const createMenuItem = async (
  payload: CreateMenuItemPayload
): Promise<MenuItem> => {
  return httpClient<MenuItem>("/menu", {
    method: "POST",
    body: JSON.stringify(payload)
  });
};

/**
 * Update a menu item — admin/staff only
 */
export const updateMenuItem = async (
  id: string,
  payload: UpdateMenuItemPayload
): Promise<MenuItem> => {
  return httpClient<MenuItem>(`/menu/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
};

/**
 * Delete a menu item — admin only
 */
export const deleteMenuItem = async (id: string): Promise<void> => {
  await httpClient<{ message: string }>(`/menu/${id}`, {
    method: "DELETE"
  });
};

export const menuService = {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};
