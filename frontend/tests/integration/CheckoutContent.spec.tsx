// tests/integration/CheckoutContent.spec.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CheckoutContent from "@app/checkout/components/CheckoutContent";
import { CartProvider } from "@contexts/CartContext";
import { ApiError } from "@lib/ApiError";
import {
  cartPasta,
  cartPizza,
  customer,
  makeOrder,
  pasta,
  pizza
} from "../fixtures/data";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  request: vi.fn(),
  saveReturnTo: vi.fn(),
  user: null as unknown,
  authLoading: false,
  menuItems: [] as unknown[]
}));

// Keep the actual CartProvider, useCartMenu hook, menuService, orderService,
// pricing logic, checkout state machine, and local/session storage active.
// Authentication, HTTP transport, and router navigation are test boundaries.
vi.mock("@lib/httpClient", () => ({ httpClient: mocks.request }));
vi.mock("@contexts/AuthContext", () => ({
  useAuth: () => ({ user: mocks.user, loading: mocks.authLoading })
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace })
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  )
}));
vi.mock("@lib/authRedirect", () => ({
  saveAuthReturnTo: mocks.saveReturnTo
}));

const CART_KEY = "kochi-guru-pizza-cart-v1";
const ATTEMPT_KEY = "kochi-checkout-attempt-v1";
const TEST_KEY = "123e4567-e89b-42d3-a456-426614174000";

let orderHandler: () => Promise<unknown>;

function orderCalls(): unknown[][] {
  return mocks.request.mock.calls.filter(
    ([endpoint]) => endpoint === "/orders"
  );
}

function storedCart(): Array<{ menuItemId: string; selected: boolean }> {
  return JSON.parse(window.localStorage.getItem(CART_KEY) ?? "[]");
}

function renderCheckout(items = [cartPizza(), cartPasta({ selected: false })]) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));

  return render(
    <CartProvider>
      <CheckoutContent />
    </CartProvider>
  );
}

async function submitOrder() {
  const submit = await screen.findByRole("button", {
    name: "Place Order"
  });

  await waitFor(() => {
    expect(submit).toBeEnabled();
  });

  await userEvent.setup().click(submit);
}

beforeEach(() => {
  mocks.replace.mockReset();
  mocks.request.mockReset();
  mocks.saveReturnTo.mockReset();
  mocks.user = customer;
  mocks.authLoading = false;
  mocks.menuItems = [pizza, pasta];
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState(null, "", "/checkout");

  Object.defineProperty(window.crypto, "randomUUID", {
    configurable: true,
    value: vi.fn(() => TEST_KEY)
  });

  orderHandler = async () => ({ order: makeOrder(), replayed: false });
  mocks.request.mockImplementation((endpoint: string) => {
    if (endpoint === "/menu") {
      return Promise.resolve({ items: mocks.menuItems });
    }
    if (endpoint === "/orders") {
      return orderHandler();
    }
    return Promise.reject(new Error(`Unexpected API request: ${endpoint}`));
  });
});

describe("CheckoutContent order submission and recovery", () => {
  it("should redirect guests before creating orders", async () => {
    mocks.user = null;
    renderCheckout();

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/login"));
    expect(mocks.saveReturnTo).toHaveBeenCalledWith("/checkout");
    expect(orderCalls()).toHaveLength(0);
  });

  it("should submit selected items and clear purchased units", async () => {
    renderCheckout();
    await submitOrder();

    await screen.findByRole("heading", { name: "Order Placed Successfully" });
    const requests = orderCalls();
    expect(requests).toHaveLength(1);
    const [endpoint, options] = requests[0] as [string, RequestInit];
    expect(endpoint).toBe("/orders");
    expect(options.method).toBe("POST");
    expect(options.cache).toBe("no-store");

    const payload = JSON.parse(String(options.body));
    expect(payload).toMatchObject({
      items: [{ menuItemId: pizza._id, selectedSize: "medium", qty: 2 }],
      deliveryType: "pickup",
      phone: "0771234567",
      paymentMethod: "cash",
      idempotencyKey: TEST_KEY
    });
    expect(payload.items).toHaveLength(1);
    expect(payload).not.toHaveProperty("total");
    expect(payload).not.toHaveProperty("unitPrice");
    expect(window.sessionStorage.getItem(ATTEMPT_KEY)).toBeNull();

    // Unselected pasta remains in the actual CartProvider's persisted cart.
    await waitFor(() => {
      expect(storedCart()).toMatchObject([
        { menuItemId: pasta._id, selected: false }
      ]);
    });
  });

  it("should reuse pending payloads after uncertain errors", async () => {
    let attempts = 0;
    orderHandler = async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new ApiError("Service unavailable", 503);
      }
      return { order: makeOrder(), replayed: true };
    };

    renderCheckout();
    await submitOrder();

    const retry = await screen.findByRole("button", {
      name: /Retry Same Order Request/
    });
    await waitFor(() => expect(retry).toBeEnabled());
    expect(storedCart()).toHaveLength(2);
    expect(window.sessionStorage.getItem(ATTEMPT_KEY)).not.toBeNull();

    await userEvent.setup().click(retry);
    await screen.findByRole("heading", { name: "Order Placed Successfully" });

    const requests = orderCalls();
    expect(requests).toHaveLength(2);
    expect((requests[0][1] as RequestInit).body).toBe(
      (requests[1][1] as RequestInit).body
    );
    expect(screen.getByText(/No duplicate order was created/)).toBeVisible();
    expect(window.sessionStorage.getItem(ATTEMPT_KEY)).toBeNull();
  });

  it("should refresh prices after definitive conflicts", async () => {
    orderHandler = async () => {
      throw new ApiError("Menu changed", 409);
    };

    renderCheckout();
    await submitOrder();

    await waitFor(() => {
      expect(
        mocks.request.mock.calls.filter(([url]) => url === "/menu")
      ).toHaveLength(2);
    });
    expect(window.sessionStorage.getItem(ATTEMPT_KEY)).toBeNull();
    expect(storedCart()).toHaveLength(2);
    expect(orderCalls()).toHaveLength(1);
  });

  it("should block checkout when size prices disappear", async () => {
    mocks.menuItems = [{ ...pizza, variants: [] }, pasta];
    renderCheckout();

    expect(
      await screen.findByRole("heading", {
        name: "No Available Items Selected"
      })
    ).toBeVisible();
    expect(orderCalls()).toHaveLength(0);
    expect(storedCart()).toHaveLength(2);
  });

  it("should prevent replaying another user's checkout", async () => {
    window.sessionStorage.setItem(
      ATTEMPT_KEY,
      JSON.stringify({
        userId: "ffffffffffffffffffffffff",
        payload: {
          items: [{ menuItemId: pizza._id, selectedSize: "medium", qty: 2 }],
          deliveryType: "pickup",
          phone: "0771234567",
          paymentMethod: "cash",
          idempotencyKey: TEST_KEY
        }
      })
    );
    renderCheckout();

    expect(
      await screen.findByRole("heading", {
        name: "Previous Order Requires Attention"
      })
    ).toBeVisible();
    expect(orderCalls()).toHaveLength(0);
    expect(window.sessionStorage.getItem(ATTEMPT_KEY)).not.toBeNull();
  });
});
