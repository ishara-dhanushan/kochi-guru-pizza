// src/schemas/orderSchemas.ts
import { z } from "zod";
import {
  DELIVERY_TYPES,
  ORDER_STATUSES,
  PAYMENT_METHODS
} from "../models/Order";

const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid ObjectId")
  .transform((value) => value.toLowerCase());

const pizzaSizeSchema = z.enum(["small", "medium", "large"]);

// Defensive request limits, not finalized restaurant order limits.
const MAX_CART_LINES = 100;
const MAX_LINE_QUANTITY = 1000;

const orderItemSchema = z.strictObject({
  menuItemId: objectIdSchema,
  selectedSize: pizzaSizeSchema.optional(),
  qty: z.number().int().positive().max(MAX_LINE_QUANTITY)
});

const orderItemsSchema = z
  .array(orderItemSchema)
  .min(1, "At least one menu item is required")
  .max(MAX_CART_LINES)
  .superRefine((items, ctx) => {
    const seen = new Set<string>();

    items.forEach((item, index) => {
      const key = `${item.menuItemId}:${item.selectedSize ?? "single"}`;

      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: [index],
          message: "Duplicate menu item and size combination"
        });
      }

      seen.add(key);
    });
  });

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Phone number is required")
  .max(25)
  .regex(/^\+?[0-9 ()-]+$/, "Invalid phone number")
  .refine((value) => {
    const digits = value.replace(/\D/g, "");

    return digits.length >= 7 && digits.length <= 15;
  }, "Invalid phone number");

// Create an order using only product selections and checkout details.
export const createOrderSchema = z.object({
  body: z
    .strictObject({
      items: orderItemsSchema,
      deliveryType: z.enum(DELIVERY_TYPES),
      phone: phoneSchema,
      address: z.string().trim().min(1).max(500).optional(),
      paymentMethod: z.enum(PAYMENT_METHODS),

      // Reuse this key for retries of the same checkout.
      idempotencyKey: z.uuid().transform((value) => value.toLowerCase())
    })
    .superRefine((data, ctx) => {
      if (data.deliveryType === "delivery" && !data.address) {
        ctx.addIssue({
          code: "custom",
          path: ["address"],
          message: "Delivery address is required"
        });
      }

      if (data.deliveryType === "pickup" && data.address) {
        ctx.addIssue({
          code: "custom",
          path: ["address"],
          message: "Address must be omitted for pickup orders"
        });
      }
    })
});

// Validate pagination and optional order status filtering.
export const listOrdersQuerySchema = z.strictObject({
  status: z.enum(ORDER_STATUSES).optional(),

  page: z
    .string()
    .regex(/^[1-9]\d*$/)
    .optional()
    .transform((value) => (value ? Number(value) : 1))
    .pipe(z.number().int().min(1).max(10000)),

  limit: z
    .string()
    .regex(/^[1-9]\d*$/)
    .optional()
    .transform((value) => (value ? Number(value) : 20))
    .pipe(z.number().int().min(1).max(100))
});

// Only allow changing the order status through this endpoint.
export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.strictObject({
    status: z.enum(ORDER_STATUSES)
  })
});

export type OrderItemInput = z.infer<typeof orderItemSchema>;

export type CreateOrderInput = z.infer<typeof createOrderSchema>["body"];

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
