// tests/unit/Order.test.ts
import { describe, expect, it } from "@jest/globals";
import { Types } from "mongoose";
import Order from "@models/Order";

/**
 * Mongoose schema validation can run without opening a database connection.
 */
function makeOrder(overrides: Record<string, unknown> = {}) {
  return new Order({
    userId: new Types.ObjectId(),
    items: [
      {
        menuItemId: new Types.ObjectId(),
        nameSnapshot: "Chicken Pizza",
        selectedSize: "large",
        qty: 2,
        unitPrice: 3000,
        lineSubtotal: 6000,
        discountAmount: 0,
        lineTotal: 6000
      }
    ],
    subtotal: 6000,
    total: 6000,
    deliveryType: "pickup",
    phone: "0771234567",
    paymentMethod: "cash",
    idempotencyKey: "123e4567-e89b-42d3-a456-426614174000",
    requestHash: "test-request-hash",
    ...overrides
  });
}

describe("Order model schema and indexes", () => {
  it("should validate a complete order without MongoDB", async () => {
    await expect(makeOrder().validate()).resolves.toBeUndefined();
  });

  it("should default new orders to pending and unpaid", () => {
    const order = makeOrder();
    expect(order.status).toBe("pending");
    expect(order.paymentStatus).toBe("unpaid");
    expect(order.currency).toBe("LKR");
    expect(order.deliveryFee).toBe(0);
  });

  it("should reject orders without menu items", async () => {
    await expect(makeOrder({ items: [] }).validate()).rejects.toThrow(
      "An order must contain at least one item"
    );
  });

  it("should require an address for delivery orders", async () => {
    await expect(
      makeOrder({ deliveryType: "delivery" }).validate()
    ).rejects.toThrow();
  });

  it("should reject unsupported order statuses", async () => {
    await expect(makeOrder({ status: "unknown" }).validate()).rejects.toThrow();
  });

  it("should define a unique customer idempotency index", () => {
    expect(Order.schema.indexes()).toEqual(
      expect.arrayContaining([
        [
          { userId: 1, idempotencyKey: 1 },
          expect.objectContaining({ unique: true })
        ]
      ])
    );
  });
});
