// tests/integration/orderRoutes.integration.test.ts
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import request from "supertest";

import app from "@/server";
import MenuItem from "@models/MenuItem";
import Order from "@models/Order";
import { useOrderFixtures } from "./helpers/orderFixtures";

// This Express app imports auth, menu and image routes even though the
// suite only tests orders. Replace external dependencies within the suite,
// following ConstructPro's provider-mocking approach.
//
// Do not import the production config module: it eagerly validates Google/R2
// credentials that are irrelevant to the order workflow. Only MongoDB is real.
jest.mock("@config/index", () => ({
  __esModule: true,
  default: {
    PORT: 5000,
    NODE_ENV: "test",
    MONGO_DB_URI: process.env.MONGO_DB_URI_TEST,
    FRONTEND_URL: "http://localhost:3000",
    // This token signing key is local to the Jest module mock.
    // It is not a CI environment variable or a production credential.
    JWT_SECRET: "kochi-order-integration-local-jwt-signing-key"
  }
}));

// Prevent Cloudflare R2 SDK initialization or network requests.
// These are the exact exports used by imageController.ts.
jest.mock("@services/r2Service", () => ({
  __esModule: true,
  uploadToR2: jest.fn(),
  deleteFromR2: jest.fn(),
  reconcileStorage: jest.fn()
}));

/**
 * Real HTTP requests, JWT verification and MongoDB persistence.
 * No Google OAuth or Cloudflare R2 provider requests are permitted.
 */
describe("Order routes — MongoDB integration", () => {
  const getFixtures = useOrderFixtures();

  function makePayload(overrides: Record<string, unknown> = {}) {
    return {
      items: [
        {
          menuItemId: getFixtures().pizzaId.toString(),
          selectedSize: "large",
          qty: 2
        }
      ],
      deliveryType: "pickup",
      phone: "0771234567",
      paymentMethod: "cash",
      idempotencyKey: randomUUID(),
      ...overrides
    };
  }

  function sendCreateOrder(token: string, payload = makePayload()) {
    return request(app)
      .post("/v1/orders")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);
  }

  async function createCustomerOrder(): Promise<string> {
    const response = await sendCreateOrder(getFixtures().customerToken);
    expect(response.status).toBe(201);
    return response.body.order._id as string;
  }

  describe("POST /v1/orders", () => {
    it("creates an order using server-side prices", async () => {
      const response = await sendCreateOrder(getFixtures().customerToken);

      expect(response.status).toBe(201);
      expect(response.body.order.total).toBe(6000);
      expect(response.body.order.paymentStatus).toBe("unpaid");
      expect(response.body.order).not.toHaveProperty("requestHash");
      expect(response.body.order).not.toHaveProperty("idempotencyKey");

      const savedOrder = await Order.findById(response.body.order._id);
      expect(savedOrder?.total).toBe(6000);
      expect(savedOrder?.items[0].nameSnapshot).toBe("Chicken Pizza");
    });

    it("rejects requests without authentication", async () => {
      const response = await request(app)
        .post("/v1/orders")
        .send(makePayload());

      expect(response.status).toBe(401);
    });

    it("rejects manipulated totals", async () => {
      const response = await sendCreateOrder(
        getFixtures().customerToken,
        makePayload({ total: 1 })
      );

      expect(response.status).toBe(400);
    });

    it("replays the original order for the same idempotency key", async () => {
      const payload = makePayload();
      const first = await sendCreateOrder(getFixtures().customerToken, payload);
      const second = await sendCreateOrder(
        getFixtures().customerToken,
        payload
      );

      expect(first.status).toBe(201);
      expect(second.status).toBe(200);
      expect(second.body.replayed).toBe(true);
      expect(second.body.order._id).toBe(first.body.order._id);
    });

    it("rejects changed order data with the same idempotency key", async () => {
      const payload = makePayload();
      const first = await sendCreateOrder(getFixtures().customerToken, payload);
      const changed = await sendCreateOrder(getFixtures().customerToken, {
        ...payload,
        items: [
          {
            menuItemId: getFixtures().pizzaId.toString(),
            selectedSize: "large",
            qty: 1
          }
        ]
      });

      expect(first.status).toBe(201);
      expect(changed.status).toBe(409);
      expect(changed.body.code).toBe("IDEMPOTENCY_CONFLICT");
      expect(
        await Order.countDocuments({ userId: getFixtures().customerId })
      ).toBe(1);
    });

    it("prevents duplicate orders from concurrent requests", async () => {
      const payload = makePayload();
      const [first, second] = await Promise.all([
        sendCreateOrder(getFixtures().customerToken, payload),
        sendCreateOrder(getFixtures().customerToken, payload)
      ]);

      expect([first.status, second.status].sort((a, b) => a - b)).toEqual([
        200, 201
      ]);
      expect(first.body.order._id).toBe(second.body.order._id);
      expect(
        await Order.countDocuments({ userId: getFixtures().customerId })
      ).toBe(1);
    });

    it("rejects unavailable products", async () => {
      await MenuItem.findByIdAndUpdate(getFixtures().pizzaId, {
        isAvailable: false
      });

      const response = await sendCreateOrder(getFixtures().customerToken);

      expect(response.status).toBe(409);
      expect(response.body.code).toBe("ITEM_UNAVAILABLE");
    });

    it("uses the latest database price", async () => {
      await MenuItem.findByIdAndUpdate(getFixtures().pizzaId, {
        variants: [
          { size: "small", price: 1500 },
          { size: "large", price: 3500 }
        ]
      });

      const response = await sendCreateOrder(getFixtures().customerToken);

      expect(response.status).toBe(201);
      expect(response.body.order.total).toBe(7000);
    });

    it("disables online payment until PayHere is integrated", async () => {
      const response = await sendCreateOrder(
        getFixtures().customerToken,
        makePayload({ paymentMethod: "online" })
      );

      expect(response.status).toBe(503);
      expect(response.body.code).toBe("ONLINE_PAYMENT_UNAVAILABLE");
    });
  });

  describe("GET /v1/orders/me and GET /v1/orders", () => {
    it("returns only the customer's own orders", async () => {
      const ownOrderId = await createCustomerOrder();
      const other = await sendCreateOrder(getFixtures().otherCustomerToken);
      expect(other.status).toBe(201);

      const response = await request(app)
        .get("/v1/orders/me")
        .set("Authorization", `Bearer ${getFixtures().customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(1);
      expect(response.body.orders[0]._id).toBe(ownOrderId);
      expect(response.body.orders[0]._id).not.toBe(other.body.order._id);
      expect(response.body.pagination.total).toBe(1);
    });

    it("forbids customers from administrative order listing", async () => {
      const response = await request(app)
        .get("/v1/orders")
        .set("Authorization", `Bearer ${getFixtures().customerToken}`);

      expect(response.status).toBe(403);
    });

    it("allows administrators to retrieve the order list", async () => {
      const response = await request(app)
        .get("/v1/orders?status=pending")
        .set("Authorization", `Bearer ${getFixtures().adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.orders)).toBe(true);
      expect(response.body.pagination).toBeDefined();

      // Do not assert global counts: other Jest workers share
      // the same test database.
    });

    it("allows staff to retrieve the order list", async () => {
      const response = await request(app)
        .get("/v1/orders?status=pending")
        .set("Authorization", `Bearer ${getFixtures().staffToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe("PATCH /v1/orders/:id/status", () => {
    it("allows administrators to confirm an order", async () => {
      const orderId = await createCustomerOrder();
      const response = await request(app)
        .patch(`/v1/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${getFixtures().adminToken}`)
        .send({ status: "confirmed" });

      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe("confirmed");
    });

    it("forbids customer status updates", async () => {
      const orderId = await createCustomerOrder();
      const response = await request(app)
        .patch(`/v1/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${getFixtures().customerToken}`)
        .send({ status: "confirmed" });

      expect(response.status).toBe(403);
    });

    it("rejects invalid status transitions", async () => {
      const orderId = await createCustomerOrder();
      const response = await request(app)
        .patch(`/v1/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${getFixtures().adminToken}`)
        .send({ status: "delivered" });

      expect(response.status).toBe(409);
      expect(response.body.code).toBe("INVALID_STATUS_TRANSITION");
    });

    it("allows staff to confirm an order", async () => {
      const orderId = await createCustomerOrder();
      const response = await request(app)
        .patch(`/v1/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${getFixtures().staffToken}`)
        .send({ status: "confirmed" });

      expect(response.status).toBe(200);
    });

    it("treats repeated status updates as idempotent", async () => {
      const orderId = await createCustomerOrder();
      for (let attempt = 0; attempt < 2; attempt++) {
        const response = await request(app)
          .patch(`/v1/orders/${orderId}/status`)
          .set("Authorization", `Bearer ${getFixtures().adminToken}`)
          .send({ status: "confirmed" });

        expect(response.status).toBe(200);
        expect(response.body.order.status).toBe("confirmed");
      }
    });
  });
});
