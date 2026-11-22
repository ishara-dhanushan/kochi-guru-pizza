// src/services/orderService.ts
import { httpClient } from "@lib/httpClient";
import type { CreateOrderPayload, CreateOrderResponse } from "@typings/order";

export const createOrder = (
  payload: CreateOrderPayload
): Promise<CreateOrderResponse> => {
  return httpClient<CreateOrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
    cache: "no-store"
  });
};

export const orderService = {
  createOrder
};
