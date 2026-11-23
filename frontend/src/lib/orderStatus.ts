// src/lib/orderStatus.ts
import type { OrderRecord, OrderStatus } from "@typings/order";

// Mirror the existing backend order lifecycle for action visibility only.
// The server remains authoritative and rejects invalid or concurrent changes.
export const ORDER_STATUS_TRANSITIONS: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready"],
  ready: ["delivered"],
  delivered: [],
  cancelled: []
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

// The backend also prevents processing unpaid online orders and cancelling
// payments that require a refund. Match those restrictions in the UI.
export function getAllowedNextStatuses(
  order: Pick<OrderRecord, "status" | "paymentMethod" | "paymentStatus">
): OrderStatus[] {
  return ORDER_STATUS_TRANSITIONS[order.status].filter((status) => {
    if (
      status === "cancelled" &&
      ["paid", "refund_pending", "chargeback"].includes(order.paymentStatus)
    ) {
      return false;
    }

    if (
      status !== "cancelled" &&
      order.paymentMethod === "online" &&
      order.paymentStatus !== "paid"
    ) {
      return false;
    }

    return true;
  });
}
