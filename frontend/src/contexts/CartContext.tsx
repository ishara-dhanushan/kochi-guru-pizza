// src/contexts/CartContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode
} from "react";

import type {
  CartItem,
  CartContextType,
  PurchasedCartItem
} from "@typings/cart";
import type { MenuItem, PizzaSize } from "@typings/menu";
import {
  getCartItemKey,
  getCartLineSubtotal,
  getCartUnitPrice
} from "@lib/cartPricing";

// Preserve the existing storage key for previously stored carts.
const CART_STORAGE_KEY = "kochi-guru-pizza-cart-v1";
const CART_CHANGE_EVENT = "kochi-guru-pizza-cart-change";

const CartContext = createContext<CartContextType | undefined>(undefined);

// Keep the existing imports in MenuItemCard and ItemPricing compatible.
export { getCartUnitPrice };

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

// A product and its selected size identify a unique cart entry.
function matchesItem(
  item: CartItem,
  menuItemId: string,
  selectedSize?: PizzaSize
): boolean {
  return (
    item.menuItemId === menuItemId.toLowerCase() &&
    item.selectedSize === selectedSize
  );
}

// Validate and normalize cart data before using it.
// Legacy price and image properties are intentionally discarded.
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
    !isValidQuantity(item.quantity)
  ) {
    return null;
  }

  if (item.selectedSize !== undefined && !isPizzaSize(item.selectedSize)) {
    return null;
  }

  return {
    menuItemId: item.menuItemId.toLowerCase(),
    name: item.name,
    selectedSize: item.selectedSize,
    quantity: item.quantity,

    // Previously stored items are selected by default.
    selected: typeof item.selected === "boolean" ? item.selected : true
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
    const seen = new Set<string>();

    let itemCount = 0;

    for (const value of stored) {
      const item = normalizeCartItem(value);

      if (!item) {
        continue;
      }

      // Ignore duplicate entries in malformed stored data.
      const itemKey = getCartItemKey(item);

      if (seen.has(itemKey)) {
        continue;
      }

      const nextCount = itemCount + item.quantity;

      if (!Number.isSafeInteger(nextCount)) {
        continue;
      }

      items.push(item);
      seen.add(itemKey);

      itemCount = nextCount;
    }

    return items;
  } catch {
    return [];
  }
}

// Calculate the total number of cart units without storing a derived value.
function getItemCount(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

// Persist the latest cart and notify subscribed components.
function saveCart(items: CartItem[]): boolean {
  // Normalize all items before writing to prevent transient product
  // prices, images or other properties from entering localStorage.
  const normalizedItems = items.map(normalizeCartItem);

  if (normalizedItems.some((item) => item === null)) {
    return false;
  }

  const validItems = normalizedItems.filter(
    (item): item is CartItem => item !== null
  );

  if (!Number.isSafeInteger(getItemCount(validItems))) {
    return false;
  }

  memorySnapshot = JSON.stringify(validItems);

  if (!storageUnavailable) {
    try {
      if (validItems.length === 0) {
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

// Migrate existing cart records to the new selection-only format.
function migrateStoredCart(): void {
  const currentSnapshot = getSnapshot();
  const items = parseCart(currentSnapshot);
  const normalizedSnapshot = JSON.stringify(items);

  if (currentSnapshot !== normalizedSnapshot) {
    saveCart(items);
  }
}

function addItem(
  item: MenuItem,
  selectedSize?: PizzaSize,
  quantity = 1
): boolean {
  if (!item.isAvailable || !isValidQuantity(quantity)) {
    return false;
  }

  // Validate the menu's current pricing configuration without
  // persisting its monetary values.
  const unitPrice = getCartUnitPrice(item, selectedSize);

  if (unitPrice === undefined) {
    return false;
  }

  const newItem = normalizeCartItem({
    menuItemId: item._id,
    name: item.name,
    selectedSize,
    quantity,
    selected: true
  });

  if (!newItem || getCartLineSubtotal(unitPrice, quantity) === undefined) {
    return false;
  }

  // Read the latest cart before applying each change.
  const items = parseCart(getSnapshot());

  const existingItem = items.find((entry) =>
    matchesItem(entry, item._id, selectedSize)
  );

  if (existingItem) {
    const updatedQuantity = existingItem.quantity + quantity;

    if (
      !isValidQuantity(updatedQuantity) ||
      getCartLineSubtotal(unitPrice, updatedQuantity) === undefined
    ) {
      return false;
    }

    const updatedItems = items.map((entry) =>
      matchesItem(entry, item._id, selectedSize)
        ? {
            ...newItem,
            quantity: updatedQuantity,

            // Preserve the customer's existing checkbox selection.
            selected: entry.selected
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

  if (!existingItem) {
    return false;
  }

  const updatedItems = items.map((item) =>
    matchesItem(item, menuItemId, selectedSize) ? { ...item, quantity } : item
  );

  return saveCart(updatedItems);
}

// Update an individual cart entry's checkbox selection.
function setItemSelected(
  menuItemId: string,
  selectedSize: PizzaSize | undefined,
  selected: boolean
): void {
  const items = parseCart(getSnapshot());

  const updatedItems = items.map((item) =>
    matchesItem(item, menuItemId, selectedSize) ? { ...item, selected } : item
  );

  saveCart(updatedItems);
}

// Update several checkbox selections in a single storage operation.
// The caller determines which items are currently eligible.
function setItemsSelected(selectedItems: CartItem[], selected: boolean): void {
  const items = parseCart(getSnapshot());

  const keys = new Set(selectedItems.map(getCartItemKey));

  const updatedItems = items.map((item) =>
    keys.has(getCartItemKey(item)) ? { ...item, selected } : item
  );

  saveCart(updatedItems);
}

// Remove only quantities included in a successfully completed checkout.
// Unselected items and additional quantities must remain in the cart.
function removePurchasedItems(purchasedItems: PurchasedCartItem[]): void {
  const purchasedQuantities = new Map<string, number>();

  for (const item of purchasedItems) {
    if (!isValidQuantity(item.quantity)) {
      return;
    }

    const key = getCartItemKey({
      menuItemId: item.menuItemId.toLowerCase(),
      selectedSize: item.selectedSize
    });

    const quantity = (purchasedQuantities.get(key) ?? 0) + item.quantity;

    if (!isValidQuantity(quantity)) {
      return;
    }

    purchasedQuantities.set(key, quantity);
  }

  // Use the latest cart rather than the original checkout state.
  const items = parseCart(getSnapshot());

  const updatedItems = items
    .map((item) => {
      const purchasedQuantity =
        purchasedQuantities.get(getCartItemKey(item)) ?? 0;

      return {
        ...item,
        quantity: Math.max(0, item.quantity - purchasedQuantity)
      };
    })
    .filter((item) => item.quantity > 0);

  saveCart(updatedItems);
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

  // Normalize legacy localStorage records after hydration.
  // Read the latest storage snapshot to preserve recent cart changes.
  useEffect(() => {
    if (snapshot !== null) {
      migrateStoredCart();
    }
  }, [snapshot]);

  const value = useMemo<CartContextType>(() => {
    const items = parseCart(snapshot);
    const itemCount = getItemCount(items);

    return {
      items,
      itemCount,
      isHydrated: snapshot !== null,
      addItem,
      removeItem,
      updateQuantity,
      setItemSelected,
      setItemsSelected,
      removePurchasedItems,
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
