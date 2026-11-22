// tests/unit/orderSchemas.test.ts
import { describe, expect, it } from "@jest/globals";
import {
  createOrderSchema,
  listOrdersQuerySchema,
  updateOrderStatusSchema
} from "@schemas/orderSchemas";

const menuItemId = "699bee908b3c7b09a0bcb84f";
const validBody = {
  items: [{ menuItemId, selectedSize: "large", qty: 2 }],
  deliveryType: "pickup",
  phone: "0771234567",
  paymentMethod: "cash",
  idempotencyKey: "123e4567-e89b-42d3-a456-426614174000"
};

describe("Order request validation", () => {
  describe("createOrderSchema", () => {
    it("accepts valid checkout input", () => {
      expect(
        createOrderSchema.safeParse({ body: validBody }).success
      ).toBe(true);
    });

    it("rejects client-supplied totals", () => {
      expect(
        createOrderSchema.safeParse({
          body: { ...validBody, total: 1 }
        }).success
      ).toBe(false);
    });

    it("rejects client-supplied unit prices", () => {
      expect(
        createOrderSchema.safeParse({
          body: {
            ...validBody,
            items: [{ menuItemId, qty: 1, unitPrice: 1 }]
          }
        }).success
      ).toBe(false);
    });

    it("requires an address for delivery", () => {
      expect(
        createOrderSchema.safeParse({
          body: { ...validBody, deliveryType: "delivery" }
        }).success
      ).toBe(false);
    });

    it("rejects duplicate menu item and size combinations", () => {
      expect(
        createOrderSchema.safeParse({
          body: {
            ...validBody,
            items: [validBody.items[0], validBody.items[0]]
          }
        }).success
      ).toBe(false);
    });

    it("rejects invalid quantities", () => {
      expect(
        createOrderSchema.safeParse({
          body: {
            ...validBody,
            items: [{ menuItemId, qty: 0 }]
          }
        }).success
      ).toBe(false);
    });
  });

  describe("listOrdersQuerySchema", () => {
    it("applies pagination defaults", () => {
      expect(listOrdersQuerySchema.parse({})).toEqual({ page: 1, limit: 20 });
    });

    it("rejects invalid pages", () => {
      expect(
        listOrdersQuerySchema.safeParse({ page: "0" }).success
      ).toBe(false);
    });
  });

  describe("updateOrderStatusSchema", () => {
    it("rejects unsupported statuses", () => {
      expect(
        updateOrderStatusSchema.safeParse({
          params: { id: menuItemId },
          body: { status: "unknown" }
        }).success
      ).toBe(false);
    });
  });
});
