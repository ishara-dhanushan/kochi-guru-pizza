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

  describe("Order request and query boundaries", () => {
    it("should lowercase uppercase identifiers after request validation", () => {
      const parsed = createOrderSchema.parse({
        body: {
          ...validBody,
          idempotencyKey: validBody.idempotencyKey.toUpperCase(),
          items: [{ menuItemId: menuItemId.toUpperCase(), qty: 1 }]
        }
      });
      expect(parsed.body.idempotencyKey).toBe(validBody.idempotencyKey);
      expect(parsed.body.items[0].menuItemId).toBe(menuItemId);
    });

    it("should trim valid delivery phone and address details", () => {
      const parsed = createOrderSchema.parse({
        body: {
          ...validBody,
          deliveryType: "delivery",
          address: " 123 Main Street ",
          phone: "  +94 (77) 123-4567  "
        }
      });
      expect(parsed.body.phone).toBe("+94 (77) 123-4567");
      expect(parsed.body.address).toBe("123 Main Street");
    });

    it("should reject an address supplied for pickup orders", () => {
      expect(
        createOrderSchema.safeParse({
          body: { ...validBody, address: "123 Main Street" }
        }).success
      ).toBe(false);
    });

    it("should reject a blank address for deliveries", () => {
      expect(
        createOrderSchema.safeParse({
          body: { ...validBody, deliveryType: "delivery", address: "  " }
        }).success
      ).toBe(false);
    });

    it.each(["invalid-id", "00000000000000000000000Z", ""])(
      "should reject malformed product IDs: %s",
      (id) => {
        expect(
          createOrderSchema.safeParse({
            body: { ...validBody, items: [{ menuItemId: id, qty: 1 }] }
          }).success
        ).toBe(false);
      }
    );

    it.each(["123456", "abcdefg", "077/123/4567", "+94-abc-123"])(
      "should reject invalid phone values: %s",
      (phone) => {
        expect(
          createOrderSchema.safeParse({ body: { ...validBody, phone } }).success
        ).toBe(false);
      }
    );

    it("should require a valid checkout idempotency UUID", () => {
      expect(
        createOrderSchema.safeParse({
          body: { ...validBody, idempotencyKey: "not-a-uuid" }
        }).success
      ).toBe(false);
    });

    it("should accept quantity 1000 but reject quantity 1001", () => {
      const withQuantity = (qty: number) =>
        createOrderSchema.safeParse({
          body: { ...validBody, items: [{ menuItemId, qty }] }
        }).success;
      expect(withQuantity(1000)).toBe(true);
      expect(withQuantity(1001)).toBe(false);
    });

    it("should reject empty cart requests", () => {
      expect(
        createOrderSchema.safeParse({ body: { ...validBody, items: [] } })
          .success
      ).toBe(false);
    });

    it("should permit 100 different lines but reject 101 lines", () => {
      const selections = Array.from({ length: 101 }, (_, index) => ({
        menuItemId: (index + 1).toString(16).padStart(24, "0"),
        qty: 1
      }));
      const isValid = (items: typeof selections) =>
        createOrderSchema.safeParse({ body: { ...validBody, items } }).success;
      expect(isValid(selections.slice(0, 100))).toBe(true);
      expect(isValid(selections)).toBe(false);
    });

    it("should reject extra checkout and cart-item properties", () => {
      expect(
        createOrderSchema.safeParse({
          body: { ...validBody, paymentStatus: "paid" }
        }).success
      ).toBe(false);
      expect(
        createOrderSchema.safeParse({
          body: {
            ...validBody,
            items: [{ menuItemId, qty: 1, discountAmount: 500 }]
          }
        }).success
      ).toBe(false);
    });

    it("should accept valid status and page filters", () => {
      expect(
        listOrdersQuerySchema.parse({
          status: "confirmed",
          page: "3",
          limit: "5"
        })
      ).toEqual({ status: "confirmed", page: 3, limit: 5 });
    });

    it("should enforce the page and page-size upper boundaries", () => {
      expect(
        listOrdersQuerySchema.safeParse({ page: "10000", limit: "100" }).success
      ).toBe(true);
      expect(listOrdersQuerySchema.safeParse({ page: "10001" }).success).toBe(
        false
      );
      expect(listOrdersQuerySchema.safeParse({ limit: "101" }).success).toBe(
        false
      );
    });

    it.each([
      { limit: "0" },
      { page: "01" },
      { page: "-1" },
      { page: "2.5" },
      { status: "unknown" },
      { userId: menuItemId }
    ])("should reject unsupported listing queries: %j", (query) => {
      expect(listOrdersQuerySchema.safeParse(query).success).toBe(false);
    });

    it("should normalize valid order IDs and allow supported status updates", () => {
      const parsed = updateOrderStatusSchema.parse({
        params: { id: menuItemId.toUpperCase() },
        body: { status: "confirmed" }
      });
      expect(parsed.params.id).toBe(menuItemId);
      expect(parsed.body.status).toBe("confirmed");
    });

    it("should reject extra status-update and malformed path fields", () => {
      expect(
        updateOrderStatusSchema.safeParse({
          params: { id: menuItemId },
          body: { status: "confirmed", paymentStatus: "paid" }
        }).success
      ).toBe(false);
      expect(
        updateOrderStatusSchema.safeParse({
          params: { id: "not-an-id" },
          body: { status: "confirmed" }
        }).success
      ).toBe(false);
    });
  });
});
