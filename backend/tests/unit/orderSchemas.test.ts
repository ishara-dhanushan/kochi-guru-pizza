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

describe("Order request validation schemas", () => {
  describe("createOrderSchema", () => {
    it("should accept valid checkout details", () => {
      expect(createOrderSchema.safeParse({ body: validBody }).success).toBe(
        true
      );
    });

    it("should reject client-supplied totals", () => {
      expect(
        createOrderSchema.safeParse({
          body: { ...validBody, total: 1 }
        }).success
      ).toBe(false);
    });

    it("should reject client-supplied item prices", () => {
      expect(
        createOrderSchema.safeParse({
          body: {
            ...validBody,
            items: [{ menuItemId, qty: 1, unitPrice: 1 }]
          }
        }).success
      ).toBe(false);
    });

    it("should require an address for delivery", () => {
      expect(
        createOrderSchema.safeParse({
          body: { ...validBody, deliveryType: "delivery" }
        }).success
      ).toBe(false);
    });

    it("should reject duplicate item and size pairs", () => {
      expect(
        createOrderSchema.safeParse({
          body: {
            ...validBody,
            items: [validBody.items[0], validBody.items[0]]
          }
        }).success
      ).toBe(false);
    });

    it("should reject zero item quantities", () => {
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
    it("should apply default pagination", () => {
      expect(listOrdersQuerySchema.parse({})).toEqual({ page: 1, limit: 20 });
    });

    it("should reject page zero", () => {
      expect(listOrdersQuerySchema.safeParse({ page: "0" }).success).toBe(
        false
      );
    });
  });

  describe("updateOrderStatusSchema", () => {
    it("should reject unsupported status values", () => {
      expect(
        updateOrderStatusSchema.safeParse({
          params: { id: menuItemId },
          body: { status: "unknown" }
        }).success
      ).toBe(false);
    });
  });
});
