// tests/unit/orderService.spec.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@lib/ApiError";
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

  it("should list operational orders using pagination and status filters", async () => {
    mocks.request.mockResolvedValue({ orders: [], pagination: {} });
    await orderService.getAllOrders({ page: 2, limit: 5, status: "pending" });

    expect(mocks.request).toHaveBeenCalledWith(
      "/orders?page=2&limit=5&status=pending",
      { cache: "no-store" }
    );
  });

  it("should use default pagination for the operational order list", async () => {
    mocks.request.mockResolvedValue({ orders: [], pagination: {} });
    await orderService.getAllOrders();

    expect(mocks.request).toHaveBeenCalledWith("/orders?page=1&limit=10", {
      cache: "no-store"
    });
  });

  it("should send only the requested next status to the update endpoint", async () => {
    mocks.request.mockResolvedValue({ order: { status: "confirmed" } });
    const id = "dddddddddddddddddddddddd";

    await orderService.updateOrderStatus(id, "confirmed");

    expect(mocks.request).toHaveBeenCalledWith(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "confirmed" }),
      cache: "no-store"
    });
  });

  it.each([
    ["INVALID_STATUS_TRANSITION", "Cannot change order status"],
    ["ORDER_STATE_CHANGED", "The order has changed"]
  ] as const)(
    "should preserve %s errors when the backend rejects a status change",
    async (code, message) => {
      mocks.request.mockRejectedValue(
        new ApiError(message, 409, undefined, code)
      );

      await expect(
        orderService.updateOrderStatus("dddddddddddddddddddddddd", "ready")
      ).rejects.toMatchObject({ status: 409, code, message });
    }
  );

  it("should propagate backend request failures", async () => {
    mocks.request.mockRejectedValue(new Error("Request failed"));
    await expect(orderService.getMyOrders()).rejects.toThrow("Request failed");
  });
});
