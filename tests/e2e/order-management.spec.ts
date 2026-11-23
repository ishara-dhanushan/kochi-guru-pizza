// e2e/order-management.spec.ts
import { randomUUID } from "node:crypto";
import { ObjectId } from "mongodb";
import { test, expect } from "../fixtures/customer";
import { withE2eDatabase } from "../helpers/database";

const backendURL = "http://127.0.0.1:5005";

test.describe("Order management staff workflow and customer access control", () => {
  test("should list a customer's order and advance its status", async ({
    page,
    request,
    customer,
    menuItem
  }) => {
    const staffEmail = `kochi-staff-e2e-${randomUUID()}@example.com`;
    const password = "KochiE2e#2026";
    let staffId: string | null = null;

    try {
      // Register an isolated test identity and promote it only in E2E MongoDB.
      const registration = await request.post(
        `${backendURL}/v1/auth/register`,
        {
          data: { name: "E2E Staff", email: staffEmail, password }
        }
      );
      expect(registration.status()).toBe(201);
      const registered = (await registration.json()) as {
        user: { _id: string };
      };
      staffId = registered.user._id;

      const promoted = await withE2eDatabase(async (database) =>
        database
          .collection("users")
          .updateOne(
            { _id: new ObjectId(staffId!), email: staffEmail },
            { $set: { role: "staff" } }
          )
      );
      expect(promoted.modifiedCount).toBe(1);

      // Create a real customer-owned order through the authenticated API.
      const customerLogin = await request.post(`${backendURL}/v1/auth/login`, {
        data: { email: customer.email, password: customer.password }
      });
      expect(customerLogin.ok()).toBe(true);
      const { accessToken } = (await customerLogin.json()) as {
        accessToken: string;
      };
      const created = await request.post(`${backendURL}/v1/orders`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          items: [{ menuItemId: menuItem.id, selectedSize: "large", qty: 1 }],
          deliveryType: "pickup",
          phone: "0771234567",
          paymentMethod: "cash",
          idempotencyKey: randomUUID()
        }
      });
      expect(created.status()).toBe(201);
      const createdOrder = (await created.json()) as {
        order: { _id: string };
      };
      const orderId = createdOrder.order._id;
      const shortReference = orderId.slice(-8).toUpperCase();

      // Exercise the real login page, dashboard and PATCH status endpoint.
      await page.goto("/login");
      await page.getByLabel("Email").fill(staffEmail);
      await page.getByLabel("Password").fill(password);
      await page.getByRole("button", { name: "Login", exact: true }).click();
      await expect(page).not.toHaveURL(/\/login(?:\?.*)?$/);

      await page.goto("/dashboard/orders");
      const card = page.locator("article").filter({
        has: page.getByRole("heading", { name: `#${shortReference}` })
      });
      await expect(card).toBeVisible();
      await expect(card.getByText("0771234567")).toBeVisible();
      await card
        .getByRole("combobox", {
          name: `Next status for order ${shortReference}`
        })
        .selectOption("confirmed");
      await card.getByRole("button", { name: "Update Status" }).click();

      await expect(card.getByText("Confirmed", { exact: true })).toBeVisible();
      await expect
        .poll(async () =>
          withE2eDatabase(async (database) => {
            const order = await database.collection("orders").findOne({
              _id: new ObjectId(orderId),
              userId: new ObjectId(customer.id)
            });
            return order?.status;
          })
        )
        .toBe("confirmed");
    } finally {
      // Customer fixture cleans its own orders; remove only this test staff user.
      if (staffId && ObjectId.isValid(staffId)) {
        await withE2eDatabase(async (database) => {
          await database.collection("users").deleteOne({
            _id: new ObjectId(staffId!),
            email: staffEmail
          });
        });
      }
    }
  });

  test("should reject customer access to order management", async ({
    page,
    customer
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(customer.email);
    await page.getByLabel("Password").fill(customer.password);
    await page.getByRole("button", { name: "Login", exact: true }).click();
    await expect(page).not.toHaveURL(/\/login(?:\?.*)?$/);

    await page.goto("/dashboard/orders");
    await expect(page).toHaveURL("/");
  });
});
