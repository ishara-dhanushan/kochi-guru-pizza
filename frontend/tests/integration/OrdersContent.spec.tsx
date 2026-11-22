import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OrdersContent from "@app/orders/components/OrdersContent";
import { customer, makeOrder } from "../fixtures/data";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  saveReturnTo: vi.fn(),
  request: vi.fn(),
  user: null as unknown,
  authLoading: false
}));

// The real orderService constructs URLs and performs the no-store HTTP call.
// Only the transport and the authentication/router boundaries are mocked.
vi.mock("@lib/httpClient", () => ({ httpClient: mocks.request }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace })
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  )
}));
vi.mock("@contexts/AuthContext", () => ({
  useAuth: () => ({ user: mocks.user, loading: mocks.authLoading })
}));
vi.mock("@lib/authRedirect", () => ({
  saveAuthReturnTo: mocks.saveReturnTo
}));

function response(page = 1, totalPages = 1) {
  return {
    orders: [makeOrder({ _id: `${page}`.repeat(24) })],
    pagination: { page, limit: 10, total: totalPages * 10, totalPages }
  };
}

beforeEach(() => {
  mocks.replace.mockReset();
  mocks.saveReturnTo.mockReset();
  mocks.request.mockReset();
  mocks.user = customer;
  mocks.authLoading = false;
  window.history.replaceState(null, "", "/orders");
});

describe("order history: screen + real order service", () => {
  it("redirects guests and avoids fetching private orders", async () => {
    mocks.user = null;
    render(<OrdersContent />);

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/login"));
    expect(mocks.saveReturnTo).toHaveBeenCalledWith("/orders");
    expect(mocks.request).not.toHaveBeenCalled();
  });

  it("renders stored order snapshots from the first customer page", async () => {
    mocks.request.mockResolvedValue(response());
    render(<OrdersContent />);

    await screen.findByText("Margherita Pizza");
    expect(mocks.request).toHaveBeenCalledWith("/orders/me?page=1&limit=10", {
      cache: "no-store"
    });
    expect(screen.getAllByText("Rs. 2,900.5").length).toBeGreaterThan(0);
  });

  it("filters by status using the real service query string", async () => {
    mocks.request.mockResolvedValue({
      orders: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
    });
    render(<OrdersContent />);
    await screen.findByRole("heading", { name: "No Orders Yet" });

    await userEvent
      .setup()
      .selectOptions(screen.getByLabelText("Status"), "confirmed");
    await screen.findByRole("heading", { name: "No Matching Orders" });
    expect(mocks.request).toHaveBeenLastCalledWith(
      "/orders/me?page=1&limit=10&status=confirmed",
      { cache: "no-store" }
    );
  });

  it("requests the next page and displays its result", async () => {
    mocks.request
      .mockResolvedValueOnce(response(1, 2))
      .mockResolvedValueOnce(response(2, 2));
    render(<OrdersContent />);
    await screen.findByText("Page 1 of 2");

    await userEvent.setup().click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("Page 2 of 2");
    expect(mocks.request).toHaveBeenLastCalledWith(
      "/orders/me?page=2&limit=10",
      { cache: "no-store" }
    );
  });

  it("shows a recovery button and retries the same page after failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.request
      .mockRejectedValueOnce(new Error("Network unavailable"))
      .mockResolvedValueOnce({
        orders: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      });
    render(<OrdersContent />);

    await screen.findByRole("alert");
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Try Again" }));
    await screen.findByRole("heading", { name: "No Orders Yet" });
    expect(mocks.request).toHaveBeenCalledTimes(2);
  });
});
