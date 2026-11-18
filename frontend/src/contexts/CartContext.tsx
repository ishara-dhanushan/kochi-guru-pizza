// src/contexts/CartContext.tsx
"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode
} from "react";

import type { CartItem, CartContextType } from "@typings/cart";
import { VARIANT_CATEGORIES } from "@typings/menu";
import type { MenuItem, PizzaSize } from "@typings/menu";

const CART_STORAGE_KEY = "kochi-guru-pizza-cart-v1";
const CART_CHANGE_EVENT = "kochi-guru-pizza-cart-change";

const CartContext = createContext<CartContextType | undefined>(undefined);

// Keep the cart usable in memory if localStorage is unavailable.
let memorySnapshot = "[]";
let storageUnavailable = false;

// Subscribe to cart changes in this tab and other tabs.
function subscribe(callback: () => void) {
  window.addEventListener(CART_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(CART_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// Return a stable string snapshot for React's external store.
function getSnapshot(): string {
  if (!storageUnavailable) {
    try {
      memorySnapshot = window.localStorage.getItem(CART_STORAGE_KEY) ?? "[]";
    } catch {
      storageUnavailable = true;
    }
  }

  return memorySnapshot;
}

// Browser storage is not available during server rendering.
function getServerSnapshot(): null {
  return null;
}

// Validate quantities without introducing an unapproved business limit.
function isValidQuantity(quantity: number): boolean {
  return Number.isSafeInteger(quantity) && quantity > 0;
}

function isPizzaSize(value: unknown): value is PizzaSize {
  return value === "small" || value === "medium" || value === "large";
}

// Only retain image URLs supported by the existing Next.js configuration.
function getValidImageUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !value) {
    return undefined;
  }

  try {
    const url = new URL(value);

    if (url.protocol === "https:" || url.protocol === "http:") {
      return value;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

// A product and its selected size identify a unique cart entry.
function matchesItem(
  item: CartItem,
  menuItemId: string,
  selectedSize?: PizzaSize
): boolean {
  return item.menuItemId === menuItemId && item.selectedSize === selectedSize;
}

// Validate and normalize cart data before using it.
function normalizeCartItem(value: unknown): CartItem | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const item = value as Partial<CartItem>;

  if (
    typeof item.menuItemId !== "string" ||
    !/^[a-fA-F0-9]{24}$/.test(item.menuItemId) ||
    typeof item.name !== "string" ||
    !item.name.trim() ||
    typeof item.quantity !== "number" ||
    !isValidQuantity(item.quantity) ||
    typeof item.unitPrice !== "number" ||
    !Number.isFinite(item.unitPrice) ||
    item.unitPrice < 0 ||
    !Number.isFinite(item.unitPrice * item.quantity)
  ) {
    return null;
  }

  if (item.selectedSize !== undefined && !isPizzaSize(item.selectedSize)) {
    return null;
  }

  return {
    menuItemId: item.menuItemId,
    name: item.name,
    selectedSize: item.selectedSize,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    imageUrl: getValidImageUrl(item.imageUrl)
  };
}

// Safely restore valid cart entries from the stored JSON.
function parseCart(snapshot: string | null): CartItem[] {
  if (!snapshot) {
    return [];
  }

  try {
    const stored: unknown = JSON.parse(snapshot);

    if (!Array.isArray(stored)) {
      return [];
    }

    const items: CartItem[] = [];
    let itemCount = 0;
    let subtotal = 0;

    for (const value of stored) {
      const item = normalizeCartItem(value);

      if (!item) {
        continue;
      }

      // Ignore duplicate entries in malformed stored data.
      const duplicate = items.some((existing) =>
        matchesItem(existing, item.menuItemId, item.selectedSize)
      );

      if (duplicate) {
        continue;
      }

      const nextCount = itemCount + item.quantity;
      const nextSubtotal = subtotal + item.unitPrice * item.quantity;

      if (!Number.isSafeInteger(nextCount) || !Number.isFinite(nextSubtotal)) {
        continue;
      }

      items.push(item);
      itemCount = nextCount;
      subtotal = nextSubtotal;
    }

    return items;
  } catch {
    return [];
  }
}

// Calculate derived values from cart entries instead of storing them.
function getTotals(items: CartItem[]) {
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  const subtotal = items.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0
  );

  return { itemCount, subtotal };
}

// Persist the latest cart and notify subscribed components.
function saveCart(items: CartItem[]): boolean {
  const { itemCount, subtotal } = getTotals(items);

  if (!Number.isSafeInteger(itemCount) || !Number.isFinite(subtotal)) {
    return false;
  }

  memorySnapshot = JSON.stringify(items);

  if (!storageUnavailable) {
    try {
      if (items.length === 0) {
        window.localStorage.removeItem(CART_STORAGE_KEY);
      } else {
        window.localStorage.setItem(CART_STORAGE_KEY, memorySnapshot);
      }
    } catch {
      storageUnavailable = true;
    }
  }

  // The native storage event does not fire in the tab making the change.
  window.dispatchEvent(new Event(CART_CHANGE_EVENT));

  return true;
}

// Resolve the current display price using the existing pricing model.
export function getCartUnitPrice(
  item: MenuItem,
  selectedSize?: PizzaSize
): number | undefined {
  const usesVariants = VARIANT_CATEGORIES.includes(item.category);

  let price: number | undefined;

  if (usesVariants) {
    if (!selectedSize || item.price != null) {
      return undefined;
    }

    const variant = item.variants?.find(
      (variant) => variant.size === selectedSize
    );

    price = variant?.price;
  } else {
    if (selectedSize !== undefined || item.variants?.length) {
      return undefined;
    }

    price = item.price;
  }

  return typeof price === "number" && Number.isFinite(price) && price >= 0
    ? price
    : undefined;
}

function addItem(
  item: MenuItem,
  selectedSize?: PizzaSize,
  quantity = 1
): boolean {
  if (!item.isAvailable || !isValidQuantity(quantity)) {
    return false;
  }

  const unitPrice = getCartUnitPrice(item, selectedSize);

  if (unitPrice === undefined) {
    return false;
  }

  const newItem = normalizeCartItem({
    menuItemId: item._id,
    name: item.name,
    selectedSize,
    quantity,
    unitPrice,
    imageUrl: item.images[0]
  });

  if (!newItem) {
    return false;
  }

  // Read the latest cart before applying each change.
  const items = parseCart(getSnapshot());

  const existingItem = items.find((entry) =>
    matchesItem(entry, item._id, selectedSize)
  );

  if (existingItem) {
    const updatedQuantity = existingItem.quantity + quantity;

    if (!isValidQuantity(updatedQuantity)) {
      return false;
    }

    if (!Number.isFinite(unitPrice * updatedQuantity)) {
      return false;
    }

    const updatedItems = items.map((entry) =>
      matchesItem(entry, item._id, selectedSize)
        ? {
            ...newItem,
            quantity: updatedQuantity
          }
        : entry
    );

    return saveCart(updatedItems);
  }

  return saveCart([...items, newItem]);
}

function removeItem(menuItemId: string, selectedSize?: PizzaSize): void {
  const items = parseCart(getSnapshot());

  const updatedItems = items.filter(
    (item) => !matchesItem(item, menuItemId, selectedSize)
  );

  saveCart(updatedItems);
}

function updateQuantity(
  menuItemId: string,
  selectedSize: PizzaSize | undefined,
  quantity: number
): boolean {
  if (!isValidQuantity(quantity)) {
    return false;
  }

  const items = parseCart(getSnapshot());

  const existingItem = items.find((item) =>
    matchesItem(item, menuItemId, selectedSize)
  );

  if (!existingItem || !Number.isFinite(existingItem.unitPrice * quantity)) {
    return false;
  }

  const updatedItems = items.map((item) =>
    matchesItem(item, menuItemId, selectedSize) ? { ...item, quantity } : item
  );

  return saveCart(updatedItems);
}

function clearCart(): void {
  saveCart([]);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const value = useMemo<CartContextType>(() => {
    const items = parseCart(snapshot);
    const { itemCount, subtotal } = getTotals(items);

    return {
      items,
      itemCount,
      subtotal,
      isHydrated: snapshot !== null,
      addItem,
      removeItem,
      updateQuantity,
      clearCart
    };
  }, [snapshot]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
