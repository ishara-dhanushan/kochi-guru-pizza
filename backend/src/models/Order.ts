// src/models/Order.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import type { PizzaSize } from "@models/MenuItem";

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
  "cancelled"
] as const;

export const DELIVERY_TYPES = ["pickup", "delivery"] as const;

export const PAYMENT_METHODS = ["cash", "online"] as const;

export const PAYMENT_STATUSES = [
  "unpaid",
  "pending",
  "paid",
  "failed",
  "cancelled",
  "refund_pending",
  "refunded",
  "chargeback"
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type DeliveryType = (typeof DELIVERY_TYPES)[number];

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface IOrderItem {
  menuItemId: Types.ObjectId;
  nameSnapshot: string;
  selectedSize?: PizzaSize;
  qty: number;

  // Original unit price before discounts.
  unitPrice: number;

  // Quantity multiplied by the original unit price.
  lineSubtotal: number;

  // Total discount applied to this order line.
  discountAmount: number;

  // Final line amount after discounts.
  lineTotal: number;

  imageUrlSnapshot?: string;
}

export interface IOrder extends Document {
  userId: Types.ObjectId;
  items: IOrderItem[];

  currency: "LKR";
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  total: number;

  status: OrderStatus;

  deliveryType: DeliveryType;
  phone: string;
  address?: string;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  // Identify retries of the same checkout operation.
  idempotencyKey: string;
  requestHash: string;

  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true
    },
    nameSnapshot: {
      type: String,
      required: true
    },
    selectedSize: {
      type: String,
      enum: ["small", "medium", "large"]
    },
    qty: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: "Quantity must be a positive integer"
      }
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    lineSubtotal: {
      type: Number,
      required: true,
      min: 0
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0
    },
    imageUrlSnapshot: {
      type: String
    }
  },
  {
    _id: false
  }
);

const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (items: IOrderItem[]) => items.length > 0,
        message: "An order must contain at least one item"
      }
    },
    currency: {
      type: String,
      enum: ["LKR"],
      default: "LKR",
      required: true
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
      required: true
    },
    deliveryType: {
      type: String,
      enum: DELIVERY_TYPES,
      required: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      trim: true,
      required: function (this: IOrder) {
        return this.deliveryType === "delivery";
      }
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      required: true
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "unpaid",
      required: true
    },
    idempotencyKey: {
      type: String,
      required: true,
      select: false
    },
    requestHash: {
      type: String,
      required: true,
      select: false
    }
  },
  {
    timestamps: true
  }
);

// Customer order history.
OrderSchema.index({
  userId: 1,
  createdAt: -1
});

// Administrative order filtering.
OrderSchema.index({
  status: 1,
  createdAt: -1
});

// Administrative order listing.
OrderSchema.index({
  createdAt: -1
});

// Prevent repeated checkout requests from creating duplicate orders.
OrderSchema.index(
  {
    userId: 1,
    idempotencyKey: 1
  },
  {
    unique: true
  }
);

const Order = mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
