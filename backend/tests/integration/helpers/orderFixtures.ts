// tests/integration/helpers/orderFixtures.ts
import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, beforeEach } from "@jest/globals";
import jwt from "jsonwebtoken";
import mongoose, { Types } from "mongoose";

import connectDB from "@config/db";
import config from "@config/index";
import User from "@models/User";
import MenuItem from "@models/MenuItem";
import Order from "@models/Order";

export interface OrderTestData {
  customerId: Types.ObjectId;
  otherCustomerId: Types.ObjectId;
  adminId: Types.ObjectId;
  staffId: Types.ObjectId;
  pizzaId: Types.ObjectId;
  customerToken: string;
  otherCustomerToken: string;
  adminToken: string;
  staffToken: string;
}

class OrderFixtureScope {
  private readonly userIds: Types.ObjectId[] = [];
  private readonly menuItemIds: Types.ObjectId[] = [];

  async seed(): Promise<OrderTestData> {
    const suffix = randomUUID();

    const customerId = new Types.ObjectId();
    const otherCustomerId = new Types.ObjectId();
    const adminId = new Types.ObjectId();
    const staffId = new Types.ObjectId();
    const pizzaId = new Types.ObjectId();

    // Register IDs before insertion so partially created fixtures
    // can still be cleaned up after a failed test setup.
    this.userIds.push(customerId, otherCustomerId, adminId, staffId);
    this.menuItemIds.push(pizzaId);

    await User.create([
      {
        _id: customerId,
        name: "Test Customer",
        email: `customer-${suffix}@example.test`,
        password: "unused-in-jwt-tests",
        authProvider: "local",
        role: "customer",
        emailVerified: true
      },
      {
        _id: otherCustomerId,
        name: "Other Test Customer",
        email: `other-customer-${suffix}@example.test`,
        password: "unused-in-jwt-tests",
        authProvider: "local",
        role: "customer",
        emailVerified: true
      },
      {
        _id: adminId,
        name: "Test Administrator",
        email: `admin-${suffix}@example.test`,
        password: "unused-in-jwt-tests",
        authProvider: "local",
        role: "admin",
        emailVerified: true
      },
      {
        _id: staffId,
        name: "Test Staff",
        email: `staff-${suffix}@example.test`,
        password: "unused-in-jwt-tests",
        authProvider: "local",
        role: "staff",
        emailVerified: true
      }
    ]);

    await MenuItem.create({
      _id: pizzaId,
      name: "Chicken Pizza",
      category: "pizza",
      variants: [
        { size: "small", price: 1500 },
        { size: "large", price: 3000 }
      ],
      images: [],
      isAvailable: true
    });

    // Read the suite's mocked config rather than a production JWT secret.
    const signToken = (userId: Types.ObjectId) =>
      jwt.sign({ id: userId.toString() }, config.JWT_SECRET, {
        expiresIn: "1h"
      });

    return {
      customerId,
      otherCustomerId,
      adminId,
      staffId,
      pizzaId,
      customerToken: signToken(customerId),
      otherCustomerToken: signToken(otherCustomerId),
      adminToken: signToken(adminId),
      staffToken: signToken(staffId)
    };
  }

  async cleanup(): Promise<void> {
    // Never delete all records from a shared test collection.
    await Order.deleteMany({
      userId: { $in: this.userIds }
    });

    await MenuItem.deleteMany({
      _id: { $in: this.menuItemIds }
    });

    await User.deleteMany({
      _id: { $in: this.userIds }
    });
  }
}

/**
 * Retry transient DNS discovery failures in the integration worker.
 * Global setup checks connectivity first, but workers must connect themselves.
 * Authentication and other non-DNS errors are never retried.
 */
async function connectTestDatabase(): Promise<void> {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await connectDB();
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const transientDnsError =
        /\b(?:ENOTFOUND|EAI_AGAIN|ETIMEOUT|ESERVFAIL)\b/.test(message);

      if (!transientDnsError || attempt === maxAttempts) {
        throw error;
      }

      console.warn(
        `MongoDB test connection DNS lookup failed (attempt ${attempt}/${maxAttempts}); retrying.`
      );

      await new Promise<void>((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
}

/**
 * Register lifecycle hooks for a single integration test suite.
 * Each test owns its own fixtures and does not affect other workers.
 */
export function useOrderFixtures() {
  let scope: OrderFixtureScope | undefined;
  let fixtures: OrderTestData | undefined;

  beforeAll(async () => {
    await connectTestDatabase();

    // Verify the actual selected database before creating records.
    if (mongoose.connection.name !== "kochi_guru_pizza_test") {
      throw new Error(
        "Refusing to run integration tests outside the test database"
      );
    }

    // Create/verify indexes required for authentication and checkout.
    await Promise.all([User.init(), MenuItem.init(), Order.init()]);
  });

  beforeEach(async () => {
    scope = new OrderFixtureScope();
    fixtures = await scope.seed();
  });

  afterEach(async () => {
    try {
      await scope?.cleanup();
    } finally {
      // Clear references even if cleanup fails; Jest still reports the error.
      fixtures = undefined;
      scope = undefined;
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  return (): OrderTestData => {
    if (!fixtures) {
      throw new Error("Integration fixtures are not initialized");
    }

    return fixtures;
  };
}
