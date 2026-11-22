// src/services/orderService.ts
import { httpClient } from "@lib/httpClient";
import type {
  CreateOrderPayload,
  CreateOrderResponse,
  ListMyOrdersResponse,
  MyOrdersQuery
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

export const orderService = {
  createOrder,
  getMyOrders
};
