// tests/unit/orderService.test.ts
import { beforeEach, describe, expect, it } from "@jest/globals";
import { Types } from "mongoose";

import Order, { type IOrder } from "@models/Order";
import type { CreateOrderInput } from "@schemas/orderSchemas";
import { getOrderPricing } from "@services/orderPricingService";
import {
  createOrder,
  getRequestHash,
  toOrderResponse,
  updateOrderStatus
} from "@services/orderService";

// Mock only the database-dependent pricing lookup. The pure pricing function
// is covered separately by orderPricingService.test.ts.
jest.mock("@services/orderPricingService", () => ({
  __esModule: true,
  getOrderPricing: jest.fn()
}));

const userId = "699bee908b3c7b09a0bcb84f";
const menuItemId = "69a40f3d8bbc889da274ff37";
const idempotencyKey = "123e4567-e89b-42d3-a456-426614174000";

const orderInput: CreateOrderInput = {
  items: [{ menuItemId, qty: 2 }],
  deliveryType: "pickup",
  phone: "0771234567",
  paymentMethod: "cash",
  idempotencyKey
};

function storedOrder(overrides: Record<string, unknown> = {}): IOrder {
  return {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(userId),
    items: [
      {
        menuItemId: new Types.ObjectId(menuItemId),
        nameSnapshot: "Chicken Bun",
        qty: 2,
        unitPrice: 700,
        lineSubtotal: 1400,
        discountAmount: 0,
        lineTotal: 1400
      }
    ],
    currency: "LKR",
    subtotal: 1400,
    discountAmount: 0,
    deliveryFee: 0,
    total: 1400,
    status: "pending",
    deliveryType: "pickup",
    phone: "0771234567",
    paymentMethod: "cash",
    paymentStatus: "unpaid",
    idempotencyKey,
    requestHash: getRequestHash(orderInput),
    createdAt: new Date("2026-11-20T10:00:00.000Z"),
    updatedAt: new Date("2026-11-20T10:00:00.000Z"),
    ...overrides
  } as unknown as IOrder;
}

describe("OrderService business rules", () => {
  beforeEach(() => {
    // Avoid live MongoDB calls in unit tests. These spies are restored by Jest.
    jest.spyOn(Order, "createIndexes").mockResolvedValue([] as never);
    jest
      .spyOn(Order, "findOne")
      .mockImplementation(
        () => ({ select: () => Promise.resolve(null) }) as never
      );
    jest.spyOn(Order, "create").mockResolvedValue(storedOrder() as never);
    jest.spyOn(Order, "findById").mockResolvedValue(storedOrder() as never);
    jest
      .spyOn(Order, "findOneAndUpdate")
      .mockResolvedValue(storedOrder({ status: "confirmed" }) as never);

    jest.mocked(getOrderPricing).mockReset();
    jest.mocked(getOrderPricing).mockResolvedValue({
      items: [
        {
          menuItemId,
          nameSnapshot: "Chicken Bun",
          selectedSize: undefined,
          qty: 2,
          unitPrice: 700,
          lineSubtotal: 1400,
          discountAmount: 0,
          lineTotal: 1400,
          imageUrlSnapshot: "https://example.invalid/chicken-bun.jpg"
        }
      ],
      currency: "LKR",
      subtotal: 1400,
      discountAmount: 0,
      deliveryFee: 0,
      total: 1400
    });
  });

  describe("getRequestHash", () => {
    it("should hash reordered cart items identically", () => {
      const input: CreateOrderInput = {
        ...orderInput,
        items: [{ menuItemId: userId, qty: 1 }, ...orderInput.items]
      };

      expect(getRequestHash(input)).toBe(
        getRequestHash({ ...input, items: [...input.items].reverse() })
      );
    });

    it("should change the hash when quantities change", () => {
      expect(getRequestHash(orderInput)).not.toBe(
        getRequestHash({
          ...orderInput,
          items: [{ menuItemId, qty: 1 }]
        })
      );
    });
  });

  describe("toOrderResponse", () => {
    it("should omit internal idempotency fields", () => {
      const result = toOrderResponse(storedOrder());

      expect(result.total).toBe(1400);
      expect(result.items[0].nameSnapshot).toBe("Chicken Bun");
      expect(result).not.toHaveProperty("idempotencyKey");
      expect(result).not.toHaveProperty("requestHash");
    });
  });

  describe("createOrder", () => {
    it("should persist an authoritative price snapshot", async () => {
      const result = await createOrder(userId, orderInput);

      expect(result.created).toBe(true);
      expect(jest.mocked(getOrderPricing)).toHaveBeenCalledWith(
        orderInput.items,
        "pickup"
      );
      expect(Order.create).toHaveBeenCalledWith(
        expect.objectContaining({ total: 1400, status: "pending" })
      );
    });

    it("should replay the same order for identical retries", async () => {
      const existing = storedOrder();
      jest
        .spyOn(Order, "findOne")
        .mockImplementation(
          () => ({ select: () => Promise.resolve(existing) }) as never
        );

      const result = await createOrder(userId, orderInput);

      expect(result.created).toBe(false);
      expect(result.order).toBe(existing);
      expect(getOrderPricing).not.toHaveBeenCalled();
    });

    it("should reject reused keys with changed content", async () => {
      const existing = storedOrder({ requestHash: "different-hash" });
      jest
        .spyOn(Order, "findOne")
        .mockImplementation(
          () => ({ select: () => Promise.resolve(existing) }) as never
        );

      await expect(createOrder(userId, orderInput)).rejects.toMatchObject({
        statusCode: 409,
        code: "IDEMPOTENCY_CONFLICT"
      });
      expect(Order.create).not.toHaveBeenCalled();
    });

    it("should reject unavailable online payments", async () => {
      await expect(
        createOrder(userId, { ...orderInput, paymentMethod: "online" })
      ).rejects.toMatchObject({
        statusCode: 503,
        code: "ONLINE_PAYMENT_UNAVAILABLE"
      });
      expect(Order.create).not.toHaveBeenCalled();
    });
  });

  describe("updateOrderStatus", () => {
    it("should confirm a pending order", async () => {
      const result = await updateOrderStatus(userId, "confirmed");

      expect(result.status).toBe("confirmed");
      expect(Order.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: "pending" }),
        { $set: { status: "confirmed" } },
        expect.objectContaining({ runValidators: true })
      );
    });

    it("should reject invalid transitions without writing", async () => {
      await expect(
        updateOrderStatus(userId, "delivered")
      ).rejects.toMatchObject({
        statusCode: 409,
        code: "INVALID_STATUS_TRANSITION"
      });
      expect(Order.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("should reject concurrent order state changes", async () => {
      jest.spyOn(Order, "findOneAndUpdate").mockResolvedValue(null as never);

      await expect(
        updateOrderStatus(userId, "confirmed")
      ).rejects.toMatchObject({
        statusCode: 409,
        code: "ORDER_STATE_CHANGED"
      });
    });

    it("should block unverified online orders", async () => {
      jest.spyOn(Order, "findById").mockResolvedValue(
        storedOrder({
          paymentMethod: "online",
          paymentStatus: "unpaid"
        }) as never
      );

      await expect(
        updateOrderStatus(userId, "confirmed")
      ).rejects.toMatchObject({
        statusCode: 409,
        code: "PAYMENT_NOT_VERIFIED"
      });
      expect(Order.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });
});
