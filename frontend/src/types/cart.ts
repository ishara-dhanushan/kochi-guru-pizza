// src/types/cart.ts
import type { MenuItem, PizzaSize } from "@typings/menu";

export interface CartItem {
  menuItemId: string;
  name: string;
  selectedSize?: PizzaSize;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
}

export interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
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

  clearCart: () => void;
}
