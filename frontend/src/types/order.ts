// src/types/order.ts
import type { PizzaSize } from "@typings/menu";

export type DeliveryType = "pickup" | "delivery";
export type PaymentMethod = "cash" | "online";

export type OrderStatus =
  "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";

export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refund_pending"
  | "refunded"
  | "chargeback";

export interface CreateOrderItem {
  menuItemId: string;
  selectedSize?: PizzaSize;
  qty: number;
}

export interface CreateOrderPayload {
  items: CreateOrderItem[];
  deliveryType: DeliveryType;
  phone: string;
  address?: string;
  paymentMethod: PaymentMethod;
  idempotencyKey: string;
}

export interface OrderItemSnapshot {
  menuItemId: string;
  nameSnapshot: string;
  selectedSize?: PizzaSize;
  qty: number;
  unitPrice: number;
  lineSubtotal: number;
  discountAmount: number;
  lineTotal: number;
  imageUrlSnapshot?: string;
}

export interface OrderRecord {
  _id: string;
  userId: string;
  items: OrderItemSnapshot[];
  currency: "LKR";
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  deliveryType: DeliveryType;
  phone: string;
  address?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderResponse {
  order: OrderRecord;
  replayed: boolean;
}
