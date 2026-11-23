// tests/integration/CartContent.spec.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import CartContent from "@app/cart/components/CartContent";
import { CartProvider } from "@contexts/CartContext";
import { cartPasta, cartPizza, pasta, pizza } from "../fixtures/data";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  request: vi.fn(),
  success: vi.fn(),
  error: vi.fn()
}));

// Exercise the real cart provider, menu hook, menu service, and UI.
// Replace only the HTTP boundary, browser navigation, and toast delivery.
vi.mock("@lib/httpClient", () => ({ httpClient: mocks.request }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push })
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  )
}));
vi.mock("react-hot-toast", () => ({
  default: { success: mocks.success, error: mocks.error }
}));

const STORAGE_KEY = "kochi-guru-pizza-cart-v1";

beforeEach(() => {
  mocks.request.mockReset();
  mocks.push.mockReset();
  mocks.success.mockReset();
  mocks.error.mockReset();
  window.localStorage.clear();
  mocks.request.mockResolvedValue({ items: [pizza, pasta] });
});

function renderCart(items = [cartPizza(), cartPasta({ selected: false })]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

  return render(
    <CartProvider>
      <CartContent />
    </CartProvider>
  );
}

describe("CartContent with real cart state and menu hooks", () => {
  it("should total only selected items at current prices", async () => {
    renderCart();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Proceed to Checkout/ })
      ).toBeEnabled();
    });

    expect(mocks.request).toHaveBeenCalledWith("/menu", {
      cache: "no-store"
    });
    expect(screen.getAllByText("Rs. 2,900.5").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("checkbox", {
        name: "Select Alfredo Pasta for checkout"
      })
    ).not.toBeChecked();
  });

  it("should retain unavailable items but disable selection", async () => {
    mocks.request.mockResolvedValue({
      items: [pizza, { ...pasta, isAvailable: false }]
    });
    renderCart([cartPizza(), cartPasta()]);

    const pastaCheckbox = await screen.findByRole("checkbox", {
      name: "Select Alfredo Pasta for checkout"
    });
    await waitFor(() => expect(pastaCheckbox).toBeDisabled());
    expect(
      screen.getByText("This item is currently unavailable.")
    ).toBeVisible();
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]")
    ).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: /Proceed to Checkout/ })
    ).toBeEnabled();
  });

  it("should disable checkout after deselecting all items", async () => {
    const user = userEvent.setup();
    renderCart([cartPizza()]);

    const increase = await screen.findByRole("button", {
      name: "Increase Margherita Pizza, medium quantity"
    });
    await waitFor(() => expect(increase).toBeEnabled());
    await user.click(increase);

    await waitFor(() => {
      const stored = JSON.parse(
        window.localStorage.getItem(STORAGE_KEY) ?? "[]"
      );
      expect(stored[0].quantity).toBe(3);
    });

    await user.click(
      screen.getByRole("checkbox", {
        name: "Select Margherita Pizza, medium for checkout"
      })
    );
    expect(
      screen.getByRole("button", { name: /Proceed to Checkout/ })
    ).toBeDisabled();
  });

  it("should open checkout only after menu validation", async () => {
    const user = userEvent.setup();
    renderCart([cartPizza()]);

    const checkout = screen.getByRole("button", {
      name: /Proceed to Checkout/
    });
    await waitFor(() => expect(checkout).toBeEnabled());
    await user.click(checkout);

    expect(mocks.push).toHaveBeenCalledWith("/checkout");
  });

  it("should preserve the cart and recover after API errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.request
      .mockRejectedValueOnce(new Error("Offline"))
      .mockResolvedValueOnce({ items: [pizza, pasta] });
    renderCart([cartPizza()]);

    const retry = await screen.findByRole("button", { name: "Retry" });
    expect(screen.getByText(/Your cart items are still saved/)).toBeVisible();
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]")
    ).toHaveLength(1);

    await userEvent.setup().click(retry);
    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledTimes(2);
      expect(
        screen.getByRole("button", { name: /Proceed to Checkout/ })
      ).toBeEnabled();
    });
  });
});
