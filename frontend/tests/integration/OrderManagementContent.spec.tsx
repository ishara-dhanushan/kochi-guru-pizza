// tests/integration/OrderManagementContent.spec.tsx
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OrderManagementContent from "@app/dashboard/orders/components/OrderManagementContent";
import { ApiError } from "@lib/ApiError";
import { customer, makeOrder } from "../fixtures/data";

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  user: null as unknown,
  loading: false
}));

// Use real service methods and status helpers; mock only HTTP, auth and toast.
vi.mock("@lib/httpClient", () => ({ httpClient: mocks.request }));
vi.mock("@contexts/AuthContext", () => ({
  useAuth: () => ({ user: mocks.user, loading: mocks.loading })
}));
vi.mock("react-hot-toast", () => ({
  default: { success: mocks.success, error: mocks.error }
}));

const orderId = "dddddddddddddddddddddddd";
const reference = orderId.slice(-8).toUpperCase();

function response(
  orders = [makeOrder()],
  page = 1,
  totalPages = 1,
  total = orders.length
) {
  return {
    orders,
    pagination: { page, limit: 10, total, totalPages }
  };
}

beforeEach(() => {
  mocks.request.mockReset();
  mocks.success.mockReset();
  mocks.error.mockReset();
  mocks.user = { ...customer, role: "staff" };
  mocks.loading = false;
});

describe("Staff/admin order management", () => {
  it("should deny customer access without requesting all orders", () => {
    mocks.user = customer;
    render(<OrderManagementContent />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "You don't have permission to manage orders."
    );
    expect(mocks.request).not.toHaveBeenCalled();
  });

  it("should wait for authentication before fetching orders", () => {
    mocks.user = null;
    mocks.loading = true;
    render(<OrderManagementContent />);

    expect(screen.getByRole("status")).toHaveTextContent("Preparing orders");
    expect(mocks.request).not.toHaveBeenCalled();
  });

  it.each(["staff", "admin"] as const)(
    "should show saved customer order details for %s",
    async (role) => {
      mocks.user = { ...customer, role };
      mocks.request.mockResolvedValue(response());
      render(<OrderManagementContent />);

      expect(
        await screen.findByRole("heading", { name: `#${reference}` })
      ).toBeVisible();
      expect(mocks.request).toHaveBeenCalledWith("/orders?page=1&limit=10", {
        cache: "no-store"
      });
      expect(screen.getByText("0771234567")).toBeVisible();

      await userEvent.setup().click(screen.getByText("View Order Details"));

      expect(screen.getByText("Margherita Pizza (medium)")).toBeVisible();
      expect(screen.getByText(customer._id)).toBeVisible();
      expect(screen.getAllByText("Rs. 2,900.5").length).toBeGreaterThan(0);
    }
  );

  it("should filter operational orders by status", async () => {
    mocks.request.mockResolvedValue(response([]));
    render(<OrderManagementContent />);
    await screen.findByRole("heading", { name: "No Orders Yet" });

    await userEvent
      .setup()
      .selectOptions(
        screen.getByRole("combobox", { name: "Filter by status" }),
        "ready"
      );

    await screen.findByRole("heading", { name: "No Matching Orders" });
    expect(mocks.request).toHaveBeenLastCalledWith(
      "/orders?page=1&limit=10&status=ready",
      { cache: "no-store" }
    );
  });

  it("should paginate and fetch the next page", async () => {
    const firstPage = Array.from({ length: 10 }, (_, index) =>
      makeOrder({ _id: String(index + 1).padStart(24, "0") })
    );
    mocks.request
      .mockResolvedValueOnce(response(firstPage, 1, 2, 11))
      .mockResolvedValueOnce(
        response([makeOrder({ _id: "e".repeat(24) })], 2, 2, 11)
      );
    render(<OrderManagementContent />);
    await screen.findByText("Page 1 of 2");

    await userEvent.setup().click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("Page 2 of 2");
    expect(mocks.request).toHaveBeenLastCalledWith("/orders?page=2&limit=10", {
      cache: "no-store"
    });
  });

  it("should update a valid status and refresh the order list", async () => {
    let listRequests = 0;
    mocks.request.mockImplementation((path: string) => {
      if (path.startsWith("/orders?")) {
        listRequests += 1;
        return Promise.resolve(
          response([
            makeOrder({ status: listRequests > 1 ? "confirmed" : "pending" })
          ])
        );
      }
      return Promise.resolve({ order: makeOrder({ status: "confirmed" }) });
    });

    render(<OrderManagementContent />);
    await screen.findByRole("heading", { name: `#${reference}` });
    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByRole("combobox", {
        name: `Next status for order ${reference}`
      }),
      "confirmed"
    );
    await user.click(screen.getByRole("button", { name: "Update Status" }));

    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "confirmed" }),
        cache: "no-store"
      })
    );
    await waitFor(() => expect(listRequests).toBe(2));
    expect(
      await within(screen.getByRole("article")).findByText("Confirmed")
    ).toBeVisible();
    expect(mocks.success).toHaveBeenCalledWith("Order marked as confirmed.");
  });

  it("should require confirmation before a terminal cancellation", async () => {
    mocks.request.mockImplementation((path: string) =>
      Promise.resolve(
        path.startsWith("/orders?")
          ? response()
          : { order: makeOrder({ status: "cancelled" }) }
      )
    );
    render(<OrderManagementContent />);
    await screen.findByRole("heading", { name: `#${reference}` });
    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByRole("combobox", {
        name: `Next status for order ${reference}`
      }),
      "cancelled"
    );
    await user.click(screen.getByRole("button", { name: "Update Status" }));

    const dialog = screen.getByRole("group", {
      name: `Confirm cancellation for order ${reference}`
    });
    expect(
      within(dialog).getByText(/This action cannot be undone/)
    ).toBeVisible();
    expect(mocks.request).toHaveBeenCalledTimes(1);

    await user.click(
      within(dialog).getByRole("button", { name: "Keep Order" })
    );
    expect(
      screen.queryByRole("group", {
        name: `Confirm cancellation for order ${reference}`
      })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Update Status" }));
    await user.click(
      within(
        screen.getByRole("group", {
          name: `Confirm cancellation for order ${reference}`
        })
      ).getByRole("button", {
        name: "Confirm Cancellation"
      })
    );
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith(
        `/orders/${orderId}/status`,
        expect.objectContaining({
          body: JSON.stringify({ status: "cancelled" })
        })
      )
    );
  });

  it("should dismiss cancellation confirmation when a different status is selected", async () => {
    mocks.request.mockResolvedValue(response());
    render(<OrderManagementContent />);
    await screen.findByRole("heading", { name: `#${reference}` });
    const user = userEvent.setup();
    const nextStatus = screen.getByRole("combobox", {
      name: `Next status for order ${reference}`
    });

    await user.selectOptions(nextStatus, "cancelled");
    await user.click(screen.getByRole("button", { name: "Update Status" }));
    expect(
      screen.getByRole("group", {
        name: `Confirm cancellation for order ${reference}`
      })
    ).toBeVisible();

    await user.selectOptions(nextStatus, "confirmed");
    expect(
      screen.queryByRole("group", {
        name: `Confirm cancellation for order ${reference}`
      })
    ).not.toBeInTheDocument();
    expect(mocks.request).toHaveBeenCalledTimes(1);
  });

  it("should offer no status actions for a completed order", async () => {
    mocks.request.mockResolvedValue(
      response([makeOrder({ status: "delivered" })])
    );
    render(<OrderManagementContent />);

    await screen.findByText(
      "No further status changes are available for this order."
    );
    expect(
      screen.queryByRole("button", { name: "Update Status" })
    ).not.toBeInTheDocument();
  });

  it("should reload rather than silently overwrite a conflicting status", async () => {
    let lists = 0;
    mocks.request.mockImplementation((path: string) => {
      if (path.startsWith("/orders?")) {
        lists += 1;
        return Promise.resolve(response());
      }
      return Promise.reject(new ApiError("Order state changed", 409));
    });
    render(<OrderManagementContent />);
    await screen.findByRole("heading", { name: `#${reference}` });
    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByRole("combobox", {
        name: `Next status for order ${reference}`
      }),
      "confirmed"
    );
    await user.click(screen.getByRole("button", { name: "Update Status" }));

    await waitFor(() => expect(lists).toBe(2));
    expect(mocks.error).toHaveBeenCalledWith(
      "The order could not be updated. Latest details will be loaded."
    );
  });

  it("should show an access message when the order-list API responds with 403", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.request.mockRejectedValue(new ApiError("Forbidden", 403));

    render(<OrderManagementContent />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You don't have permission to manage orders."
    );
    expect(mocks.request).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", { name: "Update Status" })
    ).not.toBeInTheDocument();
  });

  it("should reload unchanged order details after a failed status update", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    let listRequests = 0;
    mocks.request.mockImplementation((path: string) => {
      if (path.startsWith("/orders?")) {
        listRequests += 1;
        return Promise.resolve(response());
      }
      return Promise.reject(new Error("Service unavailable"));
    });
    render(<OrderManagementContent />);
    await screen.findByRole("heading", { name: `#${reference}` });
    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByRole("combobox", {
        name: `Next status for order ${reference}`
      }),
      "confirmed"
    );
    await user.click(screen.getByRole("button", { name: "Update Status" }));

    await waitFor(() => expect(listRequests).toBe(2));
    expect(mocks.error).toHaveBeenCalledWith(
      "We couldn't confirm the update. Loading the latest details."
    );
    expect(
      within(screen.getByRole("article")).getByText("Pending")
    ).toBeVisible();
    expect(mocks.success).not.toHaveBeenCalled();
    expect(mocks.request).toHaveBeenCalledTimes(3);
  });

  it("should display the saved status when a response is lost after a successful update", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    let listRequests = 0;
    mocks.request.mockImplementation((path: string) => {
      if (path.startsWith("/orders?")) {
        listRequests += 1;
        return Promise.resolve(
          response([
            makeOrder({ status: listRequests > 1 ? "confirmed" : "pending" })
          ])
        );
      }
      return Promise.reject(new Error("The response was lost"));
    });
    render(<OrderManagementContent />);
    await screen.findByRole("heading", { name: `#${reference}` });
    const user = userEvent.setup();
    await user.selectOptions(
      screen.getByRole("combobox", {
        name: `Next status for order ${reference}`
      }),
      "confirmed"
    );
    await user.click(screen.getByRole("button", { name: "Update Status" }));

    await waitFor(() => expect(listRequests).toBe(2));
    expect(
      await within(screen.getByRole("article")).findByText("Confirmed")
    ).toBeVisible();
    expect(mocks.error).toHaveBeenCalledWith(
      "We couldn't confirm the update. Loading the latest details."
    );
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it("should disable duplicate status updates while one request is pending", async () => {
    let finishUpdate!: (value: { order: ReturnType<typeof makeOrder> }) => void;
    const pending = new Promise<{ order: ReturnType<typeof makeOrder> }>(
      (resolve) => {
        finishUpdate = resolve;
      }
    );
    mocks.request.mockImplementation((path: string) =>
      path.startsWith("/orders?") ? Promise.resolve(response()) : pending
    );
    render(<OrderManagementContent />);
    await screen.findByRole("heading", { name: `#${reference}` });
    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByRole("combobox", {
        name: `Next status for order ${reference}`
      }),
      "confirmed"
    );
    await user.click(screen.getByRole("button", { name: "Update Status" }));
    expect(
      screen.getByRole("button", { name: "Update Status" })
    ).toBeDisabled();
    expect(
      mocks.request.mock.calls.filter(([path]) =>
        (path as string).endsWith("/status")
      )
    ).toHaveLength(1);

    finishUpdate({ order: makeOrder({ status: "confirmed" }) });
    await waitFor(() => expect(mocks.success).toHaveBeenCalled());
  });

  it("should ignore stale results after changing the status filter", async () => {
    let finishOldRequest!: (value: ReturnType<typeof response>) => void;
    const oldRequest = new Promise<ReturnType<typeof response>>((resolve) => {
      finishOldRequest = resolve;
    });
    mocks.request.mockImplementation((path: string) =>
      path.includes("status=ready") ? Promise.resolve(response([])) : oldRequest
    );
    render(<OrderManagementContent />);
    await userEvent
      .setup()
      .selectOptions(
        screen.getByRole("combobox", { name: "Filter by status" }),
        "ready"
      );
    await screen.findByRole("heading", { name: "No Matching Orders" });

    finishOldRequest(response());
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: `#${reference}` })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "No Matching Orders" })
      ).toBeVisible();
    });
  });

  it("should not show a previous staff member's orders after an account switch", async () => {
    let resolvePrevious!: (value: ReturnType<typeof response>) => void;
    const previousResponse = new Promise<ReturnType<typeof response>>(
      (resolve) => {
        resolvePrevious = resolve;
      }
    );
    const differentOrderId = "e".repeat(24);
    mocks.request
      .mockReturnValueOnce(previousResponse)
      .mockResolvedValueOnce(response([makeOrder({ _id: differentOrderId })]));

    const { rerender } = render(<OrderManagementContent />);
    await waitFor(() => expect(mocks.request).toHaveBeenCalledTimes(1));

    mocks.user = { ...customer, _id: "f".repeat(24), role: "staff" };
    rerender(<OrderManagementContent />);
    expect(
      await screen.findByRole("heading", {
        name: `#${differentOrderId.slice(-8).toUpperCase()}`
      })
    ).toBeVisible();

    await act(async () => {
      resolvePrevious(response([makeOrder()]));
      await previousResponse;
    });
    expect(
      screen.queryByRole("heading", { name: `#${reference}` })
    ).not.toBeInTheDocument();
  });

  it("should retry a failed order-list request", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.request
      .mockRejectedValueOnce(new Error("Offline"))
      .mockResolvedValueOnce(response([]));

    render(<OrderManagementContent />);
    await screen.findByRole("alert");
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Try Again" }));
    await screen.findByRole("heading", { name: "No Orders Yet" });
    expect(mocks.request).toHaveBeenCalledTimes(2);
  });
});
