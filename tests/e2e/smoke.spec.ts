// e2e/smoke.spec.ts
import { expect, test } from "@playwright/test";

test.describe("Application startup and connectivity smoke tests", () => {
  test("should render the login page in Chromium", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("heading", {
        name: "Login",
        exact: true
      })
    ).toBeVisible();
  });

  test("should reach the backend connected to E2E MongoDB", async ({
    request
  }) => {
    const response = await request.get(
      "http://127.0.0.1:5005/v1/menu?isAvailable=true"
    );

    expect(response.ok()).toBeTruthy();

    const body = await response.json();

    expect(Array.isArray(body.items)).toBe(true);
  });
});
