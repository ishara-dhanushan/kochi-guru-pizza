// fixtures/customer.ts
import { randomUUID } from "node:crypto";
import { ObjectId } from "mongodb";
import { test as menuTest, expect } from "./menu";
import { withE2eDatabase } from "../helpers/database";

const backendURL = "http://127.0.0.1:5005";

interface TestCustomer {
  id: string;
  email: string;
  password: string;
}

interface CustomerFixtures {
  customer: TestCustomer;
}

// Register a separate real customer per test. No shared credentials or users.
export const test = menuTest.extend<CustomerFixtures>({
  customer: async ({ request }, use) => {
    const suffix = randomUUID();
    const name = `E2E Customer ${suffix.slice(0, 8)}`;
    const email = `kochi-e2e-${suffix}@example.com`;
    const password = "KochiE2e#2026";
    const response = await request.post(`${backendURL}/v1/auth/register`, {
      data: { name, email, password }
    });

    if (response.status() !== 201) {
      throw new Error(
        `E2E customer registration failed: HTTP ${response.status()}`
      );
    }

    const result = (await response.json()) as { user: { _id: string } };
    const userId = result.user._id;
    if (!ObjectId.isValid(userId)) {
      throw new Error("The registration response has no valid customer ID");
    }

    try {
      await use({ id: userId, email, password });
    } finally {
      // Scope cleanup to this unique customer, even after failed assertions.
      await withE2eDatabase(async (database) => {
        await database
          .collection("orders")
          .deleteMany({ userId: new ObjectId(userId) });
        await database.collection("users").deleteOne({
          _id: new ObjectId(userId),
          email
        });
      });
    }
  }
});

export { expect };
