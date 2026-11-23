// e2e/checkout.spec.ts
import { ObjectId } from "mongodb";
import type { Page } from "@playwright/test";
import { test, expect } from "../fixtures/customer";
import { withE2eDatabase } from "../helpers/database";

async function prepareCheckout(
  page: Page,
  customer: { email: string; password: string },
  menuItem: { id: string; name: string }
): Promise<void> {
  // Authenticate through the actual login form and backend.
  await page.goto("/login");
  await page.getByLabel("Email").fill(customer.email);
  await page.getByLabel("Password").fill(customer.password);
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login(?:\?.*)?$/);

  await page.goto("/menu");
  const card = page.locator("div.group").filter({
    has: page.getByRole("heading", { name: menuItem.name, exact: true })
  });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Add to Cart" }).click();
  await page.goto("/cart");
  const checkout = page.getByRole("button", { name: /Proceed to Checkout/ });
  await expect(checkout).toBeEnabled();
  await checkout.click();
  await expect(
    page.getByRole("heading", { name: "Checkout", exact: true })
  ).toBeVisible();
}

test.describe("Authenticated customer checkout and order history", () => {
  test("should place one order, show its history, and clear purchased items", async ({
    page,
    customer,
    menuItem
  }) => {
    await prepareCheckout(page, customer, menuItem);
    await page.getByLabel("Contact Phone Number").fill("0771234567");
    await page.getByRole("button", { name: "Place Order" }).click();
    await expect(
      page.getByRole("heading", { name: "Order Placed Successfully" })
    ).toBeVisible();

    const id = new ObjectId(customer.id);
    const order = await withE2eDatabase(async (database) =>
      database.collection("orders").findOne({ userId: id })
    );
    expect(order).not.toBeNull();
    expect(order?.items).toHaveLength(1);
    expect(order?.items[0].menuItemId.toHexString()).toBe(menuItem.id);
    expect(order?.total).toBe(menuItem.largePrice);

    await page.getByRole("link", { name: "View My Orders" }).click();
    await expect(
      page.getByRole("heading", { name: "My Orders" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: `#${order!._id.toHexString().slice(-8).toUpperCase()}`
      })
    ).toBeVisible();

    await page.goto("/cart");
    await expect(
      page.getByRole("heading", { name: "Your cart is empty" })
    ).toBeVisible();
  });

  test("should reject invalid contact details without creating an order", async ({
    page,
    customer,
    menuItem
  }) => {
    await prepareCheckout(page, customer, menuItem);
    await page.getByLabel("Contact Phone Number").fill("abc");
    await page.getByRole("button", { name: "Place Order" }).click();
    await expect(
      page.getByRole("alert").filter({
        hasText: "Enter a valid contact phone number."
      })
    ).toBeVisible();

    expect(
      await withE2eDatabase(async (database) =>
        database
          .collection("orders")
          .countDocuments({ userId: new ObjectId(customer.id) })
      )
    ).toBe(0);
  });
});
