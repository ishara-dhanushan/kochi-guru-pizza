// tests/unit/orderController.test.ts
import { beforeEach, describe, expect, it } from "@jest/globals";
import type { Request, Response } from "express";

import * as orderController from "@controllers/orderController";
import * as orderService from "@services/orderService";
import { OrderError } from "@utils/OrderError";

// Match ConstructPro's controller tests: mock the service dependency,
// then test HTTP status codes and response shapes without MongoDB.
jest.mock("@services/orderService", () => ({
  __esModule: true,
  createOrder: jest.fn(),
  listOrders: jest.fn(),
  updateOrderStatus: jest.fn(),
  toOrderResponse: jest.fn()
}));

const testUserId = "699bee908b3c7b09a0bcb84f";

function makeHttpContext(options: {
  body?: unknown;
  query?: Record<string, string>;
  params?: Record<string, string>;
} = {}) {
  const req = {
    user: { _id: testUserId },
    body: options.body ?? {},
    query: options.query ?? {},
    params: options.params ?? {}
  } as unknown as Request;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  } as unknown as Response;

  return { req, res };
}

describe("OrderController", () => {
  beforeEach(() => {
    jest.mocked(orderService.createOrder).mockReset();
    jest.mocked(orderService.listOrders).mockReset();
    jest.mocked(orderService.updateOrderStatus).mockReset();
    jest.mocked(orderService.toOrderResponse).mockReset();

    jest.mocked(orderService.toOrderResponse).mockReturnValue({
      _id: "test-order",
      status: "pending",
      items: [],
      total: 1000
    } as never);
  });

  it("responds 201 when a customer creates a new order", async () => {
    jest.mocked(orderService.createOrder).mockResolvedValue({
      created: true,
      order: {} as never
    });

    const { req, res } = makeHttpContext({ body: { items: [] } });
    await orderController.createOrder(req, res);

    expect(orderService.createOrder).toHaveBeenCalledWith(
      testUserId,
      req.body
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ replayed: false })
    );
  });

  it("responds 200 for a replayed order", async () => {
    jest.mocked(orderService.createOrder).mockResolvedValue({
      created: false,
      order: {} as never
    });

    const { req, res } = makeHttpContext();
    await orderController.createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ replayed: true })
    );
  });

  it("lists only the authenticated customer's orders", async () => {
    const result = {
      orders: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
    };
    jest.mocked(orderService.listOrders).mockResolvedValue(result);

    const { req, res } = makeHttpContext();
    await orderController.listMyOrders(req, res);

    expect(orderService.listOrders).toHaveBeenCalledWith(
      { page: 1, limit: 20 },
      testUserId
    );
    expect(res.json).toHaveBeenCalledWith(result);
  });

  it("lists all orders for the administrator route", async () => {
    const result = {
      orders: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
    };
    jest.mocked(orderService.listOrders).mockResolvedValue(result);

    const { req, res } = makeHttpContext();
    await orderController.listAllOrders(req, res);

    expect(orderService.listOrders).toHaveBeenCalledWith({
      page: 1,
      limit: 20
    });
    expect(res.json).toHaveBeenCalledWith(result);
  });

  it("returns structured errors from order service", async () => {
    jest.mocked(orderService.createOrder).mockRejectedValue(
      new OrderError(409, "IDEMPOTENCY_CONFLICT", "Different request")
    );

    const { req, res } = makeHttpContext();
    await orderController.createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "IDEMPOTENCY_CONFLICT" })
    );
  });
});
