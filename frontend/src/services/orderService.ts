// src/services/orderService.ts
import { httpClient } from "@lib/httpClient";
import type {
  CreateOrderPayload,
  CreateOrderResponse,
  ListAllOrdersResponse,
  ListMyOrdersResponse,
  MyOrdersQuery,
  OrderStatus,
  UpdateOrderStatusResponse
} from "@typings/order";

export const createOrder = (
  payload: CreateOrderPayload
): Promise<CreateOrderResponse> => {
  return httpClient<CreateOrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
    cache: "no-store"
  });
};

export const getMyOrders = ({
  page = 1,
  limit = 10,
  status
}: MyOrdersQuery = {}): Promise<ListMyOrdersResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit)
  });

  if (status) {
    params.set("status", status);
  }

  return httpClient<ListMyOrdersResponse>(`/orders/me?${params.toString()}`, {
    cache: "no-store"
  });
};

// Staff/admin listing uses the same pagination contract as personal history.
export const getAllOrders = ({
  page = 1,
  limit = 10,
  status
}: MyOrdersQuery = {}): Promise<ListAllOrdersResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit)
  });

  if (status) {
    params.set("status", status);
  }

  return httpClient<ListAllOrdersResponse>(`/orders?${params.toString()}`, {
    cache: "no-store"
  });
};

// The backend validates transitions and performs a conditional atomic update.
export const updateOrderStatus = (
  orderId: string,
  status: OrderStatus
): Promise<UpdateOrderStatusResponse> => {
  return httpClient<UpdateOrderStatusResponse>(
    `/orders/${encodeURIComponent(orderId)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
      cache: "no-store"
    }
  );
};

export const orderService = {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus
};
