// fixtures/menu.ts
import { ObjectId } from "mongodb";
import { test as base, expect } from "@playwright/test";
import { withE2eDatabase } from "../helpers/database";

interface TestMenuItem {
  id: string;
  name: string;
  largePrice: number;
}

interface TestFixtures {
  menuItem: TestMenuItem;
}

export const test = base.extend<TestFixtures>({
  menuItem: async ({}, use) => {
    // Give each test its own product to avoid conflicts between workers.
    const menuId = new ObjectId();
    const name = `E2E Margherita ${menuId.toHexString()}`;
    const now = new Date();

    // Insert a real menu document so both the API and browser can access it.
    await withE2eDatabase(async (database) => {
      await database.collection("menuitems").insertOne({
        _id: menuId,
        name,
        description: "Pizza used for automated testing.",
        category: "pizza",
        variants: [
          { size: "small", price: 1000 },
          { size: "medium", price: 1450 },
          { size: "large", price: 1900 }
        ],
        isAvailable: true,
        images: [],
        sortOrder: 0,
        createdAt: now,
        updatedAt: now
      });
    });

    try {
      // Make the seeded product available to the current Playwright test.
      await use({
        id: menuId.toHexString(),
        name,
        largePrice: 1900
      });
    } finally {
      // Delete only this test's product, even when its assertions fail.
      await withE2eDatabase(async (database) => {
        await database.collection("menuitems").deleteOne({
          _id: menuId,
          name
        });
      });
    }
  }
});

export { expect };
