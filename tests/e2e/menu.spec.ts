// e2e/menu.spec.ts
import { test, expect } from "../fixtures/menu";

test.describe("Menu browsing browser workflows", () => {
  test("should filter seeded menu items through search", async ({
    page,
    menuItem
  }) => {
    await page.goto("/menu");

    // Confirm that the product inserted into MongoDB reaches the public menu.
    const heading = page.getByRole("heading", {
      name: menuItem.name,
      exact: true
    });

    await expect(heading).toBeVisible();

    const search = page.getByPlaceholder("Search menu items...");

    await search.fill(menuItem.name);

    await expect(heading).toBeVisible();

    // An unmatched query should show the empty-result state.
    await search.fill(`unknown-${menuItem.id}`);

    await expect(page.getByText("No items found")).toBeVisible();

    await search.clear();

    await expect(heading).toBeVisible();
  });

  test("should update visible prices when pizza sizes change", async ({
    page,
    menuItem
  }) => {
    await page.goto("/menu");

    // Scope the price and size assertions to the seeded product card.
    const card = page.locator("div.group").filter({
      has: page.getByRole("heading", {
        name: menuItem.name,
        exact: true
      })
    });

    await expect(card).toBeVisible();

    const sizeSelect = card.getByRole("combobox", {
      name: `Size for ${menuItem.name}`
    });

    // The existing menu component selects the large variant by default.
    await expect(sizeSelect).toHaveValue("large");

    await expect(card.getByText("Rs. 1,900", { exact: true })).toBeVisible();

    await sizeSelect.selectOption("medium");

    await expect(card.getByText("Rs. 1,450", { exact: true })).toBeVisible();

    await sizeSelect.selectOption("small");

    await expect(card.getByText("Rs. 1,000", { exact: true })).toBeVisible();
  });
});
