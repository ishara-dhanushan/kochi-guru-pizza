// tests/unit/orderService.test.ts
import { beforeEach, describe, expect, it } from "@jest/globals";
import { Types } from "mongoose";

import Order, { type IOrder } from "@models/Order";
import type { CreateOrderInput } from "@schemas/orderSchemas";
import { getOrderPricing } from "@services/orderPricingService";
import {
  createOrder,
  getRequestHash,
  listOrders,
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

  describe("Additional order business rules", () => {
    it("should distinguish changes to checkout contact or delivery details", () => {
      expect(getRequestHash({ ...orderInput, phone: "0779999999" })).not.toBe(
        getRequestHash(orderInput)
      );
      expect(
        getRequestHash({
          ...orderInput,
          deliveryType: "delivery",
          address: "123 Main Street"
        })
      ).not.toBe(getRequestHash(orderInput));
    });

    it("should distinguish the selected sizes of the same pizza", () => {
      const medium: CreateOrderInput = {
        ...orderInput,
        items: [{ menuItemId, selectedSize: "medium", qty: 1 }]
      };
      const large: CreateOrderInput = {
        ...orderInput,
        items: [{ menuItemId, selectedSize: "large", qty: 1 }]
      };
      expect(getRequestHash(medium)).not.toBe(getRequestHash(large));
    });

    it("should expose delivery details without leaking private checkout identifiers", () => {
      const result = toOrderResponse(
        storedOrder({ address: "123 Main Street", paymentStatus: "paid" })
      );
      expect(result.address).toBe("123 Main Street");
      expect(result.paymentStatus).toBe("paid");
      expect(result.items[0].qty).toBe(2);
      expect(result).not.toHaveProperty("idempotencyKey");
      expect(result).not.toHaveProperty("requestHash");
    });

    it("should filter paginated customer orders by user and status", async () => {
      const cursor = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest
          .fn()
          .mockResolvedValue([storedOrder({ status: "confirmed" })] as never)
      };
      jest.spyOn(Order, "find").mockReturnValue(cursor as never);
      jest.spyOn(Order, "countDocuments").mockResolvedValue(7 as never);

      const result = await listOrders(
        { page: 2, limit: 5, status: "confirmed" },
        userId
      );
      expect(Order.find).toHaveBeenCalledWith({ userId, status: "confirmed" });
      expect(cursor.sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
      expect(cursor.skip).toHaveBeenCalledWith(5);
      expect(cursor.limit).toHaveBeenCalledWith(5);
      expect(Order.countDocuments).toHaveBeenCalledWith({
        userId,
        status: "confirmed"
      });
      expect(result.orders).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 7,
        totalPages: 2
      });
    });

    it("should list all orders without restricting them to a customer", async () => {
      const cursor = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([] as never)
      };
      jest.spyOn(Order, "find").mockReturnValue(cursor as never);
      jest.spyOn(Order, "countDocuments").mockResolvedValue(0 as never);
      const result = await listOrders({ page: 1, limit: 20 });
      expect(Order.find).toHaveBeenCalledWith({});
      expect(Order.countDocuments).toHaveBeenCalledWith({});
      expect(result.pagination.totalPages).toBe(0);
    });

    it("should reject status changes for a nonexistent order", async () => {
      jest.spyOn(Order, "findById").mockResolvedValue(null as never);
      await expect(
        updateOrderStatus(userId, "confirmed")
      ).rejects.toMatchObject({
        statusCode: 404,
        code: "ORDER_NOT_FOUND"
      });
      expect(Order.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("should return an unchanged order for a repeated status update", async () => {
      const current = storedOrder({ status: "confirmed" });
      jest.spyOn(Order, "findById").mockResolvedValue(current as never);
      const result = await updateOrderStatus(userId, "confirmed");
      expect(result).toBe(current);
      expect(Order.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it.each([
      ["pending", "confirmed"],
      ["pending", "cancelled"],
      ["confirmed", "preparing"],
      ["confirmed", "cancelled"],
      ["preparing", "ready"],
      ["ready", "delivered"]
    ] as Array<[IOrder["status"], IOrder["status"]]>)(
      "should allow transition from %s to %s",
      async (from, to) => {
        jest
          .spyOn(Order, "findById")
          .mockResolvedValue(storedOrder({ status: from }) as never);
        jest
          .spyOn(Order, "findOneAndUpdate")
          .mockResolvedValue(storedOrder({ status: to }) as never);
        const result = await updateOrderStatus(userId, to);
        expect(result.status).toBe(to);
        expect(Order.findOneAndUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ status: from, paymentStatus: "unpaid" }),
          { $set: { status: to } },
          expect.objectContaining({ runValidators: true })
        );
      }
    );

    it.each([
      ["delivered", "confirmed"],
      ["cancelled", "pending"],
      ["preparing", "cancelled"]
    ] as Array<[IOrder["status"], IOrder["status"]]>)(
      "should reject transition from %s to %s",
      async (from, to) => {
        jest
          .spyOn(Order, "findById")
          .mockResolvedValue(storedOrder({ status: from }) as never);
        await expect(updateOrderStatus(userId, to)).rejects.toMatchObject({
          statusCode: 409,
          code: "INVALID_STATUS_TRANSITION"
        });
        expect(Order.findOneAndUpdate).not.toHaveBeenCalled();
      }
    );

    it.each(["paid", "refund_pending", "chargeback"] as const)(
      "should reject cancelling orders with %s payment status",
      async (paymentStatus) => {
        jest
          .spyOn(Order, "findById")
          .mockResolvedValue(storedOrder({ paymentStatus }) as never);
        await expect(
          updateOrderStatus(userId, "cancelled")
        ).rejects.toMatchObject({
          statusCode: 409,
          code: "REFUND_REQUIRED"
        });
        expect(Order.findOneAndUpdate).not.toHaveBeenCalled();
      }
    );

    it("should allow an unpaid online order to be cancelled", async () => {
      jest.spyOn(Order, "findById").mockResolvedValue(
        storedOrder({
          paymentMethod: "online",
          paymentStatus: "unpaid"
        }) as never
      );
      jest
        .spyOn(Order, "findOneAndUpdate")
        .mockResolvedValue(storedOrder({ status: "cancelled" }) as never);
      const order = await updateOrderStatus(userId, "cancelled");
      expect(order.status).toBe("cancelled");
    });

    it("should allow a verified online order to enter fulfilment", async () => {
      jest.spyOn(Order, "findById").mockResolvedValue(
        storedOrder({
          paymentMethod: "online",
          paymentStatus: "paid"
        }) as never
      );
      await updateOrderStatus(userId, "confirmed");
      expect(Order.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ paymentStatus: "paid" }),
        { $set: { status: "confirmed" } },
        expect.any(Object)
      );
    });
  });
});
