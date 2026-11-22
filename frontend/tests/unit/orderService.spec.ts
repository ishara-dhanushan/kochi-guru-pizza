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

describe("order service", () => {
  it("sends only the order request fields and preserves its idempotency key", async () => {
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

  it("uses default pagination when requesting a customer's order history", async () => {
    mocks.request.mockResolvedValue({ orders: [], pagination: {} });
    await orderService.getMyOrders();
    expect(mocks.request).toHaveBeenCalledWith("/orders/me?page=1&limit=10", {
      cache: "no-store"
    });
  });

  it("adds status and pagination filters without dropping no-store caching", async () => {
    mocks.request.mockResolvedValue({ orders: [], pagination: {} });
    await orderService.getMyOrders({ page: 3, limit: 5, status: "confirmed" });
    expect(mocks.request).toHaveBeenCalledWith(
      "/orders/me?page=3&limit=5&status=confirmed",
      { cache: "no-store" }
    );
  });

  it("propagates backend failures to the caller", async () => {
    mocks.request.mockRejectedValue(new Error("Request failed"));
    await expect(orderService.getMyOrders()).rejects.toThrow("Request failed");
  });
});
