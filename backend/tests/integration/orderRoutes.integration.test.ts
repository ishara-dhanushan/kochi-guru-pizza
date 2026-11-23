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
describe("Order API with real MongoDB", () => {
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
    it("should return 201 with server-calculated prices", async () => {
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

    it("should return 401 for unauthenticated checkout", async () => {
      const response = await request(app)
        .post("/v1/orders")
        .send(makePayload());

      expect(response.status).toBe(401);
    });

    it("should return 400 for client-supplied totals", async () => {
      const response = await sendCreateOrder(
        getFixtures().customerToken,
        makePayload({ total: 1 })
      );

      expect(response.status).toBe(400);
    });

    it("should replay an order for a matching request key", async () => {
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

    it("should return 409 for conflicting checkout retries", async () => {
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

    it("should create one order for concurrent retries", async () => {
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

    it("should return 409 when a product is unavailable", async () => {
      await MenuItem.findByIdAndUpdate(getFixtures().pizzaId, {
        isAvailable: false
      });

      const response = await sendCreateOrder(getFixtures().customerToken);

      expect(response.status).toBe(409);
      expect(response.body.code).toBe("ITEM_UNAVAILABLE");
    });

    it("should use the latest stored menu price", async () => {
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

    it("should reject online payment before integration", async () => {
      const response = await sendCreateOrder(
        getFixtures().customerToken,
        makePayload({ paymentMethod: "online" })
      );

      expect(response.status).toBe(503);
      expect(response.body.code).toBe("ONLINE_PAYMENT_UNAVAILABLE");
    });
  });

  describe("GET /v1/orders/me", () => {
    it("should return only the signed-in customer's orders", async () => {
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
  });

  describe("GET /v1/orders", () => {
    it("should return 403 for customer order listing access", async () => {
      const response = await request(app)
        .get("/v1/orders")
        .set("Authorization", `Bearer ${getFixtures().customerToken}`);

      expect(response.status).toBe(403);
    });

    it("should permit administrators to list orders", async () => {
      const response = await request(app)
        .get("/v1/orders?status=pending")
        .set("Authorization", `Bearer ${getFixtures().adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.orders)).toBe(true);
      expect(response.body.pagination).toBeDefined();

      // Do not assert global counts: other Jest workers share
      // the same test database.
    });

    it("should permit staff to list orders", async () => {
      const response = await request(app)
        .get("/v1/orders?status=pending")
        .set("Authorization", `Bearer ${getFixtures().staffToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe("PATCH /v1/orders/:id/status", () => {
    it("should allow administrators to confirm pending orders", async () => {
      const orderId = await createCustomerOrder();
      const response = await request(app)
        .patch(`/v1/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${getFixtures().adminToken}`)
        .send({ status: "confirmed" });

      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe("confirmed");
    });

    it("should return 403 for customer status updates", async () => {
      const orderId = await createCustomerOrder();
      const response = await request(app)
        .patch(`/v1/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${getFixtures().customerToken}`)
        .send({ status: "confirmed" });

      expect(response.status).toBe(403);
    });

    it("should reject invalid status transitions", async () => {
      const orderId = await createCustomerOrder();
      const response = await request(app)
        .patch(`/v1/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${getFixtures().adminToken}`)
        .send({ status: "delivered" });

      expect(response.status).toBe(409);
      expect(response.body.code).toBe("INVALID_STATUS_TRANSITION");
    });

    it("should allow staff to confirm pending orders", async () => {
      const orderId = await createCustomerOrder();
      const response = await request(app)
        .patch(`/v1/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${getFixtures().staffToken}`)
        .send({ status: "confirmed" });

      expect(response.status).toBe(200);
    });

    it("should preserve status for repeated updates", async () => {
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

  describe("Additional order API validation", () => {
    describe("POST /v1/orders: request validation", () => {
      it("should reject a cart without items", async () => {
        const response = await sendCreateOrder(
          getFixtures().customerToken,
          makePayload({ items: [] })
        );
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Validation failed");
      });

      it("should reject malformed product identifiers", async () => {
        const response = await sendCreateOrder(
          getFixtures().customerToken,
          makePayload({ items: [{ menuItemId: "invalid", qty: 1 }] })
        );
        expect(response.status).toBe(400);
      });

      it("should reject quantities exceeding the request limit", async () => {
        const response = await sendCreateOrder(
          getFixtures().customerToken,
          makePayload({
            items: [
              {
                menuItemId: getFixtures().pizzaId.toString(),
                selectedSize: "large",
                qty: 1001
              }
            ]
          })
        );
        expect(response.status).toBe(400);
      });

      it("should reject duplicate product and size entries", async () => {
        const item = {
          menuItemId: getFixtures().pizzaId.toString(),
          selectedSize: "large",
          qty: 1
        };
        const response = await sendCreateOrder(
          getFixtures().customerToken,
          makePayload({ items: [item, item] })
        );
        expect(response.status).toBe(400);
      });

      it("should reject invalid contact details", async () => {
        const response = await sendCreateOrder(
          getFixtures().customerToken,
          makePayload({ phone: "invalid-phone" })
        );
        expect(response.status).toBe(400);
      });

      it("should reject client-supplied payment state", async () => {
        const response = await sendCreateOrder(
          getFixtures().customerToken,
          makePayload({ paymentStatus: "paid" })
        );
        expect(response.status).toBe(400);
      });

      it("should reject a pickup address", async () => {
        const response = await sendCreateOrder(
          getFixtures().customerToken,
          makePayload({ address: "123 Main Street" })
        );
        expect(response.status).toBe(400);
      });

      it("should save a delivery address and the authoritative menu total", async () => {
        // Delivery charges are currently zero pending restaurant policy approval.
        const response = await sendCreateOrder(
          getFixtures().customerToken,
          makePayload({ deliveryType: "delivery", address: "123 Main Street" })
        );
        expect(response.status).toBe(201);
        expect(response.body.order).toMatchObject({
          deliveryType: "delivery",
          address: "123 Main Street",
          subtotal: 6000,
          deliveryFee: 0,
          total: 6000
        });
        expect(response.headers["cache-control"]).toBe("no-store");
      });

      it("should reject a pizza size not in the current menu", async () => {
        const response = await sendCreateOrder(
          getFixtures().customerToken,
          makePayload({
            items: [
              {
                menuItemId: getFixtures().pizzaId.toString(),
                selectedSize: "medium",
                qty: 1
              }
            ]
          })
        );
        expect(response.status).toBe(409);
        expect(response.body.code).toBe("SIZE_UNAVAILABLE");
      });
    });

    describe("GET /v1/orders/me: pagination and filters", () => {
      it("should reject invalid customer pagination", async () => {
        const response = await request(app)
          .get("/v1/orders/me?page=0&limit=200")
          .set("Authorization", `Bearer ${getFixtures().customerToken}`);
        expect(response.status).toBe(400);
      });

      it("should filter the current customer's orders by status", async () => {
        const id = await createCustomerOrder();
        const response = await request(app)
          .get("/v1/orders/me?status=pending&page=1&limit=1")
          .set("Authorization", `Bearer ${getFixtures().customerToken}`);
        expect(response.status).toBe(200);
        expect(response.headers["cache-control"]).toBe("no-store");
        expect(response.body.pagination).toMatchObject({
          page: 1,
          limit: 1,
          total: 1
        });
        expect(response.body.orders[0]._id).toBe(id);
      });
    });

    describe("GET /v1/orders: staff authorization", () => {
      it("should require authentication for the staff listing", async () => {
        const response = await request(app).get("/v1/orders");
        expect(response.status).toBe(401);
      });

      it("should reject unsupported staff status filters", async () => {
        const response = await request(app)
          .get("/v1/orders?status=unknown")
          .set("Authorization", `Bearer ${getFixtures().staffToken}`);
        expect(response.status).toBe(400);
      });
    });

    describe("PATCH /v1/orders/:id/status: invalid requests", () => {
      it("should require authorization before changing an order", async () => {
        const response = await request(app)
          .patch(
            `/v1/orders/${getFixtures().otherCustomerId.toString()}/status`
          )
          .send({ status: "confirmed" });
        expect(response.status).toBe(401);
      });

      it("should reject malformed order IDs", async () => {
        const response = await request(app)
          .patch("/v1/orders/not-an-object-id/status")
          .set("Authorization", `Bearer ${getFixtures().staffToken}`)
          .send({ status: "confirmed" });
        expect(response.status).toBe(400);
      });

      it("should return 404 for a nonexistent order", async () => {
        const response = await request(app)
          .patch(
            `/v1/orders/${getFixtures().otherCustomerId.toString()}/status`
          )
          .set("Authorization", `Bearer ${getFixtures().adminToken}`)
          .send({ status: "confirmed" });
        expect(response.status).toBe(404);
        expect(response.body.code).toBe("ORDER_NOT_FOUND");
      });

      it("should reject changes to payment status through the order route", async () => {
        const response = await request(app)
          .patch(
            `/v1/orders/${getFixtures().otherCustomerId.toString()}/status`
          )
          .set("Authorization", `Bearer ${getFixtures().adminToken}`)
          .send({ status: "confirmed", paymentStatus: "paid" });
        expect(response.status).toBe(400);
      });
    });
  });
});
