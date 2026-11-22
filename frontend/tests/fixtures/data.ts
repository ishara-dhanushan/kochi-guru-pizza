import type { CartItem } from "@typings/cart";
import type { MenuItem } from "@typings/menu";
import type { OrderRecord } from "@typings/order";
import type { User } from "@typings/user";

// Realistic, deterministic records shared by the unit and component suites.
export const PIZZA_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";
export const PASTA_ID = "bbbbbbbbbbbbbbbbbbbbbbbb";
export const CUSTOMER_ID = "cccccccccccccccccccccccc";

export const pizza: MenuItem = {
  _id: PIZZA_ID,
  name: "Margherita Pizza",
  category: "pizza",
  variants: [
    { size: "small", price: 1000 },
    { size: "medium", price: 1450.25 },
    { size: "large", price: 1900 }
  ],
  isAvailable: true,
  images: [],
  sortOrder: 1,
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:00:00.000Z"
};

export const pasta: MenuItem = {
  _id: PASTA_ID,
  name: "Alfredo Pasta",
  category: "pasta",
  price: 800.5,
  isAvailable: true,
  images: [],
  sortOrder: 2,
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:00:00.000Z"
};

export const customer: User = {
  _id: CUSTOMER_ID,
  name: "Test Customer",
  email: "customer@example.test",
  phone: "0771234567",
  authProvider: "local",
  role: "customer",
  emailVerified: true,
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:00:00.000Z"
};

export function cartPizza(overrides: Partial<CartItem> = {}): CartItem {
  return {
    menuItemId: PIZZA_ID,
    name: pizza.name,
    selectedSize: "medium",
    quantity: 2,
    selected: true,
    ...overrides
  };
}

export function cartPasta(overrides: Partial<CartItem> = {}): CartItem {
  return {
    menuItemId: PASTA_ID,
    name: pasta.name,
    quantity: 1,
    selected: true,
    ...overrides
  };
}

export function makeOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    _id: "dddddddddddddddddddddddd",
    userId: CUSTOMER_ID,
    items: [
      {
        menuItemId: PIZZA_ID,
        nameSnapshot: pizza.name,
        selectedSize: "medium",
        qty: 2,
        unitPrice: 1450.25,
        lineSubtotal: 2900.5,
        discountAmount: 0,
        lineTotal: 2900.5
      }
    ],
    currency: "LKR",
    subtotal: 2900.5,
    discountAmount: 0,
    deliveryFee: 0,
    total: 2900.5,
    status: "pending",
    deliveryType: "pickup",
    phone: "0771234567",
    paymentMethod: "cash",
    paymentStatus: "unpaid",
    createdAt: "2026-11-21T10:00:00.000Z",
    updatedAt: "2026-11-21T10:00:00.000Z",
    ...overrides
  };
}
