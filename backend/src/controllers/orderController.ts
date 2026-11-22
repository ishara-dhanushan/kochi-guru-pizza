// src/controllers/orderController.ts
import { Request, Response } from "express";
import { ZodError } from "zod";
import type { IUser } from "@models/User";
import type { OrderStatus } from "@models/Order";
import {
  listOrdersQuerySchema,
  type CreateOrderInput
} from "@schemas/orderSchemas";
import * as orderService from "@services/orderService";
import { OrderError } from "@utils/OrderError";

// Convert service errors into appropriate HTTP responses.
function handleOrderError(
  res: Response,
  error: unknown,
  operation: string
): void {
  if (error instanceof OrderError) {
    res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      details: error.details
    });

    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message
      }))
    });

    return;
  }

  // Avoid logging customer contact details or complete
  // checkout payloads when unexpected errors occur.
  console.error(
    `${operation} error:`,
    error instanceof Error ? error.name : "Unknown error"
  );

  res.status(500).json({
    error: "An unexpected order processing error occurred"
  });
}

/**
 * POST /v1/orders
 * Protected — create an order for the authenticated user.
 */
export const createOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user as IUser;
    const input = req.body as CreateOrderInput;

    const result = await orderService.createOrder(String(user._id), input);

    res.status(result.created ? 201 : 200).json({
      order: orderService.toOrderResponse(result.order),
      replayed: !result.created
    });
  } catch (error) {
    handleOrderError(res, error, "createOrder");
  }
};

/**
 * GET /v1/orders/me
 * Protected — list only the authenticated user's orders.
 */
export const listMyOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user as IUser;

    const query = listOrdersQuerySchema.parse(req.query);

    const result = await orderService.listOrders(query, String(user._id));

    res.json(result);
  } catch (error) {
    handleOrderError(res, error, "listMyOrders");
  }
};

/**
 * GET /v1/orders
 * Protected — administrators and staff only.
 */
export const listAllOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const query = listOrdersQuerySchema.parse(req.query);

    const result = await orderService.listOrders(query);

    res.json(result);
  } catch (error) {
    handleOrderError(res, error, "listAllOrders");
  }
};

/**
 * PATCH /v1/orders/:id/status
 * Protected — administrators and staff only.
 */
export const updateOrderStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const orderId = String(req.params.id);

    const { status } = req.body as {
      status: OrderStatus;
    };

    const order = await orderService.updateOrderStatus(orderId, status);

    res.json({
      order: orderService.toOrderResponse(order)
    });
  } catch (error) {
    handleOrderError(res, error, "updateOrderStatus");
  }
};
