// src/types/cart.ts
import type { MenuItem, PizzaSize } from "@typings/menu";

// Only these fields are persisted in localStorage.
export interface CartItem {
  menuItemId: string;
  name: string;
  selectedSize?: PizzaSize;
  quantity: number;
  selected: boolean;
}

export type CartItemStatus =
  | "available"
  | "unavailable"
  | "deleted"
  | "size_unavailable"
  | "price_unavailable";

// Current product information resolved from the menu API.
// These fields must never be persisted in localStorage.
export interface ResolvedCartItem extends CartItem {
  imageUrl?: string;
  unitPrice?: number;
  lineSubtotal?: number;
  status: CartItemStatus;
}

// The original quantities included in a completed order.
export type PurchasedCartItem = Pick<
  CartItem,
  "menuItemId" | "selectedSize" | "quantity"
>;

export interface CartContextType {
  items: CartItem[];
  itemCount: number;
  isHydrated: boolean;

  addItem: (
    item: MenuItem,
    selectedSize?: PizzaSize,
    quantity?: number
  ) => boolean;

  removeItem: (menuItemId: string, selectedSize?: PizzaSize) => void;

  updateQuantity: (
    menuItemId: string,
    selectedSize: PizzaSize | undefined,
    quantity: number
  ) => boolean;

  setItemSelected: (
    menuItemId: string,
    selectedSize: PizzaSize | undefined,
    selected: boolean
  ) => void;

  setItemsSelected: (items: CartItem[], selected: boolean) => void;

  removePurchasedItems: (items: PurchasedCartItem[]) => void;

  clearCart: () => void;
}
