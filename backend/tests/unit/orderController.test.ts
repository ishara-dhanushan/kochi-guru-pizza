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

function makeHttpContext(
  options: {
    body?: unknown;
    query?: Record<string, string>;
    params?: Record<string, string>;
  } = {}
) {
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

describe("OrderController HTTP response handling", () => {
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

  it("should return 201 when checkout creates an order", async () => {
    jest.mocked(orderService.createOrder).mockResolvedValue({
      created: true,
      order: {} as never
    });

    const { req, res } = makeHttpContext({ body: { items: [] } });
    await orderController.createOrder(req, res);

    expect(orderService.createOrder).toHaveBeenCalledWith(testUserId, req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ replayed: false })
    );
  });

  it("should return 200 when a previous order is replayed", async () => {
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

  it("should scope customer history to the current user", async () => {
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

  it("should list all orders on the staff-only endpoint", async () => {
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

  it("should preserve service error codes and statuses", async () => {
    jest
      .mocked(orderService.createOrder)
      .mockRejectedValue(
        new OrderError(409, "IDEMPOTENCY_CONFLICT", "Different request")
      );

    const { req, res } = makeHttpContext();
    await orderController.createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "IDEMPOTENCY_CONFLICT" })
    );
  });

  describe("Controller failure responses", () => {
    it("should reject invalid customer order pagination with HTTP 400", async () => {
      const { req, res } = makeHttpContext({ query: { page: "0" } });
      await orderController.listMyOrders(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Validation failed" })
      );
      expect(orderService.listOrders).not.toHaveBeenCalled();
    });

    it("should reject unsupported staff order filters with HTTP 400", async () => {
      const { req, res } = makeHttpContext({ query: { status: "invalid" } });
      await orderController.listAllOrders(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(orderService.listOrders).not.toHaveBeenCalled();
    });

    it("should omit unexpected error details from HTTP 500 responses and logs", async () => {
      const log = jest
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      jest
        .mocked(orderService.createOrder)
        .mockRejectedValue(new Error("PRIVATE_ORDER_CUSTOMER_DATA"));
      try {
        const { req, res } = makeHttpContext();
        await orderController.createOrder(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          error: "An unexpected order processing error occurred"
        });
        expect(log).toHaveBeenCalledWith("createOrder error:", "Error");
      } finally {
        log.mockRestore();
      }
    });

    it("should send validated status changes to the order service", async () => {
      jest
        .mocked(orderService.updateOrderStatus)
        .mockResolvedValue({} as never);
      const { req, res } = makeHttpContext({
        params: { id: "69a40f3d8bbc889da274ff37" },
        body: { status: "confirmed" }
      });
      await orderController.updateOrderStatus(req, res);
      expect(orderService.updateOrderStatus).toHaveBeenCalledWith(
        "69a40f3d8bbc889da274ff37",
        "confirmed"
      );
      expect(res.json).toHaveBeenCalledWith({
        order: expect.objectContaining({ status: "pending" })
      });
    });

    it("should return 404 when the service cannot find an order", async () => {
      jest
        .mocked(orderService.updateOrderStatus)
        .mockRejectedValue(
          new OrderError(404, "ORDER_NOT_FOUND", "Order not found")
        );
      const { req, res } = makeHttpContext({
        params: { id: "69a40f3d8bbc889da274ff37" },
        body: { status: "confirmed" }
      });
      await orderController.updateOrderStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: "ORDER_NOT_FOUND" })
      );
    });
  });
});
