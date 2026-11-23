// e2e/cart.spec.ts
import type { Page } from "@playwright/test";
import { test, expect } from "../fixtures/menu";

async function getStoredQuantity(
  page: Page,
  menuItemId: string
): Promise<number> {
  // Read the real cart storage rather than injecting artificial cart data.
  return page.evaluate((id) => {
    const raw = localStorage.getItem("kochi-guru-pizza-cart-v1");

    if (!raw) {
      return 0;
    }

    const items = JSON.parse(raw) as Array<{
      menuItemId: string;
      selectedSize?: string;
      quantity: number;
    }>;

    // A product with different sizes can have separate cart entries.
    return (
      items.find(
        (item) => item.menuItemId === id && item.selectedSize === "large"
      )?.quantity ?? 0
    );
  }, menuItemId);
}

test.describe("Shopping cart browser workflows", () => {
  test("should persist item quantities after a page reload", async ({
    page,
    menuItem
  }) => {
    await page.goto("/menu");

    const card = page.locator("div.group").filter({
      has: page.getByRole("heading", {
        name: menuItem.name,
        exact: true
      })
    });

    await expect(card).toBeVisible();

    // Add the product through the UI to exercise the actual CartContext.
    await card.getByRole("button", { name: "Add to Cart" }).click();

    await expect.poll(() => getStoredQuantity(page, menuItem.id)).toBe(1);

    await page.goto("/cart");

    await expect(
      page.getByRole("heading", { name: "Shopping Cart" })
    ).toBeVisible();

    const cartItem = page.locator("article").filter({
      hasText: menuItem.name
    });

    await expect(cartItem).toBeVisible();

    await cartItem
      .getByRole("button", {
        name: `Increase ${menuItem.name}, large quantity`
      })
      .click();

    await expect.poll(() => getStoredQuantity(page, menuItem.id)).toBe(2);

    // Verify that the subtotal reflects the updated quantity.
    await expect(
      cartItem.getByText("Rs. 3,800", { exact: true })
    ).toBeVisible();

    await page.reload();

    await expect(cartItem).toBeVisible();

    // Cart data must survive a full reload, not just client-side navigation.
    await expect.poll(() => getStoredQuantity(page, menuItem.id)).toBe(2);
  });

  test("should redirect guests before checkout", async ({ page, menuItem }) => {
    await page.goto("/menu");

    const card = page.locator("div.group").filter({
      has: page.getByRole("heading", {
        name: menuItem.name,
        exact: true
      })
    });

    await expect(card).toBeVisible();

    await card.getByRole("button", { name: "Add to Cart" }).click();

    await expect.poll(() => getStoredQuantity(page, menuItem.id)).toBe(1);

    await page.goto("/cart");

    const checkoutButton = page.getByRole("button", {
      name: /Proceed to Checkout/
    });

    await expect(checkoutButton).toBeEnabled();

    await checkoutButton.click();

    // Checkout must not allow unauthenticated customers to place orders.
    await expect(page).toHaveURL(/\/login(?:\?.*)?$/);

    await expect(
      page.getByRole("heading", {
        name: "Login",
        exact: true
      })
    ).toBeVisible();
  });
});
