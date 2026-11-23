// tests/unit/orderService.spec.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { orderService } from "@services/orderService";
import { PIZZA_ID } from "../fixtures/data";

const mocks = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@lib/httpClient", () => ({
  httpClient: mocks.request
}));

beforeEach(() => {
  mocks.request.mockReset();
});

describe("OrderService HTTP request contract", () => {
  it("should submit only permitted checkout fields", async () => {
    const payload = {
      items: [
        { menuItemId: PIZZA_ID, selectedSize: "medium" as const, qty: 2 }
      ],
      deliveryType: "pickup" as const,
      phone: "0771234567",
      paymentMethod: "cash" as const,
      idempotencyKey: "order-request-1"
    };

    mocks.request.mockResolvedValue({
      order: { _id: "order-1" },
      replayed: false
    });
    await orderService.createOrder(payload);

    expect(mocks.request).toHaveBeenCalledTimes(1);
    expect(mocks.request).toHaveBeenCalledWith("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
      cache: "no-store"
    });
    expect(JSON.parse(mocks.request.mock.calls[0][1].body)).not.toHaveProperty(
      "total"
    );
    expect(JSON.parse(mocks.request.mock.calls[0][1].body)).not.toHaveProperty(
      "unitPrice"
    );
  });

  it("should apply default order history pagination", async () => {
    mocks.request.mockResolvedValue({ orders: [], pagination: {} });
    await orderService.getMyOrders();
    expect(mocks.request).toHaveBeenCalledWith("/orders/me?page=1&limit=10", {
      cache: "no-store"
    });
  });

  it("should retain no-store caching with filters", async () => {
    mocks.request.mockResolvedValue({ orders: [], pagination: {} });
    await orderService.getMyOrders({ page: 3, limit: 5, status: "confirmed" });
    expect(mocks.request).toHaveBeenCalledWith(
      "/orders/me?page=3&limit=5&status=confirmed",
      { cache: "no-store" }
    );
  });

  it("should propagate backend request failures", async () => {
    mocks.request.mockRejectedValue(new Error("Request failed"));
    await expect(orderService.getMyOrders()).rejects.toThrow("Request failed");
  });
});
