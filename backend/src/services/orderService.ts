// src/services/orderService.ts
import { createHash } from "node:crypto";
import { Types } from "mongoose";
import Order from "@models/Order";
import type { IOrder, OrderStatus } from "@models/Order";
import type { CreateOrderInput, ListOrdersQuery } from "@schemas/orderSchemas";
import { getOrderPricing } from "@services/orderPricingService";
import { OrderError } from "@utils/OrderError";
import {
  isRetryableMongoConflict,
  withMongoConflictRetry
} from "@utils/mongoConflictRetry";

// Initial order status transition policy.
// Confirm cancellation and fulfilment rules before production launch.
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready"],
  ready: ["delivered"],
  delivered: [],
  cancelled: []
};

// Ensure the unique idempotency index exists before creating orders.
let indexesPromise: Promise<unknown> | undefined;

async function ensureOrderIndexes(): Promise<void> {
  if (!indexesPromise) {
    indexesPromise = Order.createIndexes().catch((error) => {
      indexesPromise = undefined;

      throw error;
    });
  }

  await indexesPromise;
}

// Explicitly expose only the intended order response fields.
export function toOrderResponse(order: IOrder) {
  return {
    _id: order._id,
    userId: order.userId,

    items: order.items.map((item) => ({
      menuItemId: item.menuItemId,
      nameSnapshot: item.nameSnapshot,
      selectedSize: item.selectedSize,
      qty: item.qty,

      unitPrice: item.unitPrice,
      lineSubtotal: item.lineSubtotal,
      discountAmount: item.discountAmount,
      lineTotal: item.lineTotal,

      imageUrlSnapshot: item.imageUrlSnapshot
    })),

    currency: order.currency,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    deliveryFee: order.deliveryFee,
    total: order.total,

    status: order.status,

    deliveryType: order.deliveryType,
    phone: order.phone,
    address: order.address,

    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,

    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
}

// Hash the normalized request without relying on client-supplied prices.
// Sorting ensures that changing the order of cart entries does not
// incorrectly identify a retry as a different checkout.
export function getRequestHash(input: CreateOrderInput): string {
  const items = input.items
    .map((item) => ({
      menuItemId: item.menuItemId.toLowerCase(),
      selectedSize: item.selectedSize,
      qty: item.qty
    }))
    .sort(
      (a, b) =>
        a.menuItemId.localeCompare(b.menuItemId) ||
        (a.selectedSize ?? "").localeCompare(b.selectedSize ?? "")
    );

  return createHash("sha256")
    .update(
      JSON.stringify({
        items,
        deliveryType: input.deliveryType,
        phone: input.phone,
        address: input.address,
        paymentMethod: input.paymentMethod
      })
    )
    .digest("hex");
}

async function findExistingOrder(userId: string, idempotencyKey: string) {
  return Order.findOne({
    userId,
    idempotencyKey
  }).select("+requestHash");
}

function validateExistingOrder(order: IOrder, requestHash: string) {
  if (order.requestHash !== requestHash) {
    throw new OrderError(
      409,
      "IDEMPOTENCY_CONFLICT",
      "This checkout identifier has already been used for a different request"
    );
  }

  return {
    order,
    created: false
  };
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

// Create an order using authoritative database prices.
async function createOrderOnce(userId: string, input: CreateOrderInput) {
  await ensureOrderIndexes();

  const requestHash = getRequestHash(input);

  // Check for a completed request before recalculating current
  // prices. A retry must return the original order snapshot.
  const existingOrder = await findExistingOrder(userId, input.idempotencyKey);

  if (existingOrder) {
    return validateExistingOrder(existingOrder, requestHash);
  }

  // Online payments will be enabled only after the PayHere
  // integration and payment verification are implemented.
  if (input.paymentMethod === "online") {
    throw new OrderError(
      503,
      "ONLINE_PAYMENT_UNAVAILABLE",
      "Online payments are not available yet"
    );
  }

  // Retrieve current menu prices, availability and discounts.
  const pricing = await getOrderPricing(input.items, input.deliveryType);

  try {
    const order = await Order.create({
      userId: new Types.ObjectId(userId),

      items: pricing.items.map((item) => ({
        ...item,
        menuItemId: new Types.ObjectId(item.menuItemId)
      })),

      currency: pricing.currency,
      subtotal: pricing.subtotal,
      discountAmount: pricing.discountAmount,
      deliveryFee: pricing.deliveryFee,
      total: pricing.total,

      status: "pending",

      deliveryType: input.deliveryType,
      phone: input.phone,
      address: input.deliveryType === "delivery" ? input.address : undefined,

      paymentMethod: input.paymentMethod,
      paymentStatus: "unpaid",

      idempotencyKey: input.idempotencyKey,
      requestHash
    });

    return {
      order,
      created: true
    };
  } catch (error) {
    // Concurrent requests may pass the initial existence check.
    // The unique index ensures only one of them creates an order.
    if (isDuplicateKeyError(error)) {
      const existing = await findExistingOrder(userId, input.idempotencyKey);

      if (existing) {
        return validateExistingOrder(existing, requestHash);
      }
    }

    throw error;
  }
}

// Retry transient write conflicts without weakening the existing
// checkout idempotency and authoritative pricing checks.
export async function createOrder(userId: string, input: CreateOrderInput) {
  try {
    return await withMongoConflictRetry(() => createOrderOnce(userId, input));
  } catch (error) {
    if (isRetryableMongoConflict(error)) {
      throw new OrderError(
        409,
        "ORDER_CONCURRENCY_CONFLICT",
        "Order creation encountered repeated database conflicts. Please retry."
      );
    }

    throw error;
  }
}

// Retrieve paginated orders, optionally restricted to one user.
export async function listOrders(query: ListOrdersQuery, userId?: string) {
  const filter = {
    ...(userId !== undefined ? { userId } : {}),
    ...(query.status ? { status: query.status } : {})
  };

  const skip = (query.page - 1) * query.limit;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({
        createdAt: -1,
        _id: -1
      })
      .skip(skip)
      .limit(query.limit),

    Order.countDocuments(filter)
  ]);

  return {
    orders: orders.map(toOrderResponse),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit)
    }
  };
}

// Update order status using controlled state transitions.
async function updateOrderStatusOnce(orderId: string, nextStatus: OrderStatus) {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new OrderError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  // Repeating an already completed status update is harmless.
  if (order.status === nextStatus) {
    return order;
  }

  const allowedStatuses = STATUS_TRANSITIONS[order.status];

  if (!allowedStatuses.includes(nextStatus)) {
    throw new OrderError(
      409,
      "INVALID_STATUS_TRANSITION",
      `Cannot change order status from ${order.status} to ${nextStatus}`
    );
  }

  // Unpaid online orders must not enter fulfilment.
  if (
    order.paymentMethod === "online" &&
    order.paymentStatus !== "paid" &&
    nextStatus !== "cancelled"
  ) {
    throw new OrderError(
      409,
      "PAYMENT_NOT_VERIFIED",
      "Online payment must be verified before processing the order"
    );
  }

  // Paid order cancellation requires the future refund workflow.
  if (
    nextStatus === "cancelled" &&
    ["paid", "refund_pending", "chargeback"].includes(order.paymentStatus)
  ) {
    throw new OrderError(
      409,
      "REFUND_REQUIRED",
      "This order requires payment resolution before cancellation"
    );
  }

  // Match the observed order and payment states to prevent
  // concurrent updates from silently overwriting each other.
  const updatedOrder = await Order.findOneAndUpdate(
    {
      _id: orderId,
      status: order.status,
      paymentStatus: order.paymentStatus
    },
    {
      $set: {
        status: nextStatus
      }
    },
    {
      returnDocument: "after",
      runValidators: true
    }
  );

  if (!updatedOrder) {
    throw new OrderError(
      409,
      "ORDER_STATE_CHANGED",
      "The order has changed. Refresh and try again."
    );
  }

  return updatedOrder;
}

// Re-read and revalidate order state after a transient write conflict.
// Business errors such as ORDER_STATE_CHANGED are not retried.
export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus
) {
  try {
    return await withMongoConflictRetry(() =>
      updateOrderStatusOnce(orderId, nextStatus)
    );
  } catch (error) {
    if (isRetryableMongoConflict(error)) {
      throw new OrderError(
        409,
        "ORDER_CONCURRENCY_CONFLICT",
        "The order encountered repeated database conflicts. Please retry."
      );
    }

    throw error;
  }
}
