// src/app/dashboard/orders/components/OrderManagementContent.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ClipboardList,
  Loader2,
  RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@contexts/AuthContext";
import { ApiError } from "@lib/ApiError";
import { formatCartPrice } from "@lib/cartPricing";
import { getAllowedNextStatuses, ORDER_STATUS_LABELS } from "@lib/orderStatus";
import { orderService } from "@services/orderService";
import type {
  ListAllOrdersResponse,
  OrderRecord,
  OrderStatus
} from "@typings/order";

const PAGE_SIZE = 10;
type StatusFilter = OrderStatus | "all";

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All statuses", value: "all" },
  ...(
    [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "delivered",
      "cancelled"
    ] as const
  ).map((status) => ({ label: ORDER_STATUS_LABELS[status], value: status }))
];

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-warning-wash text-warning",
  confirmed: "bg-brand-wash text-brand",
  preparing: "bg-brand-wash text-brand",
  ready: "bg-success-wash text-success",
  delivered: "bg-success-wash text-success",
  cancelled: "bg-danger-wash text-danger"
};

function formatOrderDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

interface OrderCardProps {
  order: OrderRecord;
  updating: boolean;
  onUpdate: (order: OrderRecord, status: OrderStatus) => Promise<void>;
}

function OrderManagementCard({ order, updating, onUpdate }: OrderCardProps) {
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [confirmCancellation, setConfirmCancellation] = useState(false);
  const allowedStatuses = getAllowedNextStatuses(order);
  const reference = order._id.slice(-8).toUpperCase();
  const quantity = order.items.reduce((count, item) => count + item.qty, 0);

  const applyStatus = () => {
    if (!nextStatus || updating || !allowedStatuses.includes(nextStatus)) {
      return;
    }

    // Cancellation is terminal, so require an explicit second action.
    if (nextStatus === "cancelled") {
      setConfirmCancellation(true);
      return;
    }

    void onUpdate(order, nextStatus);
  };

  return (
    <article className="rounded-2xl border border-divider-card bg-surface-card overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-content-muted">Order Reference</p>
            <h2 className="text-lg font-bold text-content-main mt-1">
              #{reference}
            </h2>
            <p className="text-xs text-content-muted mt-1">
              {formatOrderDate(order.createdAt)}
            </p>
          </div>
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[order.status]}`}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mt-5 text-sm">
          <div>
            <p className="text-xs text-content-muted">Customer Contact</p>
            <p className="font-semibold text-content-main mt-1">
              {order.phone}
            </p>
          </div>
          <div>
            <p className="text-xs text-content-muted">Order Type</p>
            <p className="font-semibold text-content-main mt-1 capitalize">
              {order.deliveryType} · {quantity}{" "}
              {quantity === 1 ? "item" : "items"}
            </p>
          </div>
          <div>
            <p className="text-xs text-content-muted">Total</p>
            <p className="font-bold text-brand mt-1">
              {formatCartPrice(order.total)}
            </p>
          </div>
        </div>
      </div>

      <details className="group border-t border-divider-standard">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 sm:px-6 py-3 text-sm font-semibold text-brand [&::-webkit-details-marker]:hidden">
          View Order Details
          <ChevronDown
            size={17}
            className="transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>

        <div className="border-t border-divider-subtle px-5 sm:px-6 py-5 space-y-5">
          <div>
            <h3 className="font-semibold text-content-main mb-3">
              Order Items
            </h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div
                  key={`${item.menuItemId}-${item.selectedSize ?? "single"}-${index}`}
                  className="flex flex-wrap justify-between gap-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-content-main">
                      {item.nameSnapshot}
                      {item.selectedSize ? ` (${item.selectedSize})` : ""}
                    </p>
                    <p className="text-xs text-content-muted mt-1">
                      {item.qty} × {formatCartPrice(item.unitPrice)}
                      {item.discountAmount > 0
                        ? ` · Discount ${formatCartPrice(item.discountAmount)}`
                        : ""}
                    </p>
                  </div>
                  <span className="font-semibold text-content-main">
                    {formatCartPrice(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <dl className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-content-muted">Customer ID</dt>
              <dd className="text-content-main break-all mt-1">
                {order.userId}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-content-muted">
                Full Order Reference
              </dt>
              <dd className="text-content-main break-all mt-1">{order._id}</dd>
            </div>
            <div>
              <dt className="text-xs text-content-muted">Payment Method</dt>
              <dd className="text-content-main mt-1">
                {order.paymentMethod === "cash" ? "Cash" : "Online Payment"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-content-muted">Payment Status</dt>
              <dd className="text-content-main mt-1 capitalize">
                {order.paymentStatus.replaceAll("_", " ")}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-content-muted">Last Updated</dt>
              <dd className="text-content-main mt-1">
                {formatOrderDate(order.updatedAt)}
              </dd>
            </div>
            {order.deliveryType === "delivery" && order.address && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-content-muted">Delivery Address</dt>
                <dd className="text-content-main mt-1 whitespace-pre-wrap">
                  {order.address}
                </dd>
              </div>
            )}
          </dl>

          <div className="border-t border-divider-standard pt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-content-muted">Subtotal</span>
              <span className="text-content-main">
                {formatCartPrice(order.subtotal)}
              </span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between gap-3">
                <span className="text-content-muted">Discount</span>
                <span className="text-success">
                  -{formatCartPrice(order.discountAmount)}
                </span>
              </div>
            )}
            {order.deliveryFee > 0 && (
              <div className="flex justify-between gap-3">
                <span className="text-content-muted">Delivery Fee</span>
                <span className="text-content-main">
                  {formatCartPrice(order.deliveryFee)}
                </span>
              </div>
            )}
            <div className="flex justify-between gap-3 border-t border-divider-standard pt-3">
              <span className="font-semibold text-content-main">Total</span>
              <span className="font-bold text-brand">
                {formatCartPrice(order.total)}
              </span>
            </div>
          </div>
        </div>
      </details>

      <div className="border-t border-divider-standard px-5 sm:px-6 py-4">
        {allowedStatuses.length > 0 ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <label className="flex-1 text-sm font-medium text-content-main">
                Next Status
                <select
                  aria-label={`Next status for order ${reference}`}
                  value={nextStatus}
                  disabled={updating}
                  onChange={(event) => {
                    setNextStatus(event.target.value as OrderStatus | "");
                    setConfirmCancellation(false);
                  }}
                  className="block w-full mt-2 px-3 py-2.5 rounded-xl border border-divider-control bg-surface text-content-main focus:outline-none focus:border-brand disabled:opacity-60"
                >
                  <option value="">Select next status</option>
                  {allowedStatuses.map((status) => (
                    <option key={status} value={status}>
                      {ORDER_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={!nextStatus || updating}
                onClick={applyStatus}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-brand-on text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating && <Loader2 size={16} className="animate-spin" />}
                Update Status
              </button>
            </div>
            {confirmCancellation && (
              <div
                role="group"
                aria-label={`Confirm cancellation for order ${reference}`}
                aria-describedby={`cancel-description-${order._id}`}
                className="rounded-xl bg-danger-wash border border-danger-border p-4 mt-4"
              >
                <p
                  id={`cancel-description-${order._id}`}
                  className="text-sm text-content-main"
                >
                  Cancel this order? This action cannot be undone.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => void onUpdate(order, "cancelled")}
                    className="px-4 py-2 rounded-lg bg-danger-solid text-white text-sm font-semibold disabled:opacity-50"
                  >
                    Confirm Cancellation
                  </button>
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => setConfirmCancellation(false)}
                    className="px-4 py-2 rounded-lg border border-divider-control text-content-main text-sm"
                  >
                    Keep Order
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-content-muted">
            No further status changes are available for this order.
          </p>
        )}
      </div>
    </article>
  );
}

interface OrdersFetchState {
  key: string;
  result: ListAllOrdersResponse | null;
  errorMessage: string | null;
}

export default function OrderManagementContent() {
  const { user, loading: authLoading } = useAuth();
  const authorized = user?.role === "admin" || user?.role === "staff";
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [fetchState, setFetchState] = useState<OrdersFetchState | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const updatingRef = useRef<string | null>(null);

  // Include the user identity so an account switch cannot show stale data.
  const requestKey = `${user?._id ?? "guest"}:${page}:${statusFilter}:${refreshVersion}`;
  const fetching = authorized && fetchState?.key !== requestKey;
  const result = fetching ? null : (fetchState?.result ?? null);
  const errorMessage = fetching ? null : (fetchState?.errorMessage ?? null);

  useEffect(() => {
    if (authLoading || !authorized) {
      return;
    }

    let active = true;

    const loadOrders = async () => {
      try {
        const response = await orderService.getAllOrders({
          page,
          limit: PAGE_SIZE,
          status: statusFilter === "all" ? undefined : statusFilter
        });

        if (!active) {
          return;
        }

        // A status change can empty the last page of a filtered list.
        const finalPage = Math.max(1, response.pagination.totalPages);
        if (page > finalPage) {
          setPage(finalPage);
          return;
        }

        setFetchState({
          key: requestKey,
          result: response,
          errorMessage: null
        });
      } catch (error) {
        if (active) {
          console.error("Unable to load staff orders:", error);
          setFetchState({
            key: requestKey,
            result: null,
            errorMessage:
              error instanceof ApiError && error.status === 403
                ? "You don't have permission to manage orders."
                : "We couldn't load the orders. Please try again."
          });
        }
      }
    };

    void loadOrders();

    // Ignore requests superseded by a filter/page change or unmount.
    return () => {
      active = false;
    };
  }, [authLoading, authorized, page, statusFilter, refreshVersion, requestKey]);

  const updateStatus = async (order: OrderRecord, nextStatus: OrderStatus) => {
    if (
      !authorized ||
      updatingRef.current !== null ||
      !getAllowedNextStatuses(order).includes(nextStatus)
    ) {
      return;
    }

    updatingRef.current = order._id;
    setUpdatingOrderId(order._id);

    try {
      const response = await orderService.updateOrderStatus(
        order._id,
        nextStatus
      );
      toast.success(
        `Order marked as ${ORDER_STATUS_LABELS[response.order.status].toLowerCase()}.`
      );
      // Always refetch to respect the active status filter and pagination.
      setRefreshVersion((version) => version + 1);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error(
          "The order could not be updated. Latest details will be loaded."
        );
        setRefreshVersion((version) => version + 1);
      } else {
        // The server may have saved the change even if the response was lost.
        // Reload the order instead of offering a potentially stale transition.
        console.error("Unable to update order status:", error);
        toast.error(
          "We couldn't confirm the update. Loading the latest details."
        );
        setRefreshVersion((version) => version + 1);
      }
    } finally {
      updatingRef.current = null;
      setUpdatingOrderId(null);
    }
  };

  if (authLoading || !user) {
    return (
      <div
        role="status"
        className="flex items-center justify-center gap-3 py-24 text-content-muted"
      >
        <Loader2 size={24} className="animate-spin text-brand" />
        Preparing orders...
      </div>
    );
  }

  if (!authorized) {
    return (
      <p role="alert" className="py-16 text-center text-danger">
        You don&apos;t have permission to manage orders.
      </p>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-content-main">
            Order Management
          </h1>
          <p className="text-sm text-content-muted mt-1">
            Review customer orders and update their preparation status.
          </p>
        </div>
        <button
          type="button"
          disabled={Boolean(fetching) || updatingOrderId !== null}
          onClick={() => setRefreshVersion((version) => version + 1)}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-divider-control rounded-xl text-sm text-content-main hover:bg-surface-soft transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={fetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="text-sm font-medium text-content-main">
          Filter by status
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilter);
              setPage(1);
            }}
            className="block mt-2 w-full sm:w-56 px-4 py-2.5 bg-surface-card border border-divider-control rounded-xl text-content-main focus:outline-none focus:border-brand"
          >
            {STATUS_FILTERS.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </label>
        {result && (
          <p className="text-sm text-content-muted">
            {result.pagination.total}{" "}
            {result.pagination.total === 1 ? "order" : "orders"}
          </p>
        )}
      </div>

      {fetching ? (
        <div
          role="status"
          className="flex items-center justify-center gap-3 py-20 text-content-muted"
        >
          <Loader2 size={24} className="animate-spin text-brand" />
          Loading orders...
        </div>
      ) : errorMessage ? (
        <div className="border border-danger-border bg-surface-card rounded-2xl p-8 text-center">
          <AlertCircle size={32} className="text-danger mx-auto" />
          <p role="alert" className="text-content-main mt-3">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={() => setRefreshVersion((version) => version + 1)}
            className="mt-5 rounded-xl bg-brand hover:bg-brand-hover text-brand-on px-5 py-2.5 text-sm font-semibold"
          >
            Try Again
          </button>
        </div>
      ) : result && result.orders.length === 0 ? (
        <div className="border border-divider-card bg-surface-card rounded-2xl p-10 text-center">
          <ClipboardList size={40} className="text-brand mx-auto" />
          <h2 className="font-bold text-xl text-content-main mt-4">
            {statusFilter === "all" ? "No Orders Yet" : "No Matching Orders"}
          </h2>
          <p className="text-sm text-content-muted mt-2">
            {statusFilter === "all"
              ? "Customer orders will appear here once they are placed."
              : "There are no orders with the selected status."}
          </p>
        </div>
      ) : result ? (
        <>
          <div className="space-y-4">
            {result.orders.map((order) => (
              <OrderManagementCard
                key={`${order._id}:${order.status}:${order.updatedAt}`}
                order={order}
                updating={updatingOrderId !== null}
                onUpdate={updateStatus}
              />
            ))}
          </div>

          {result.pagination.totalPages > 1 && (
            <nav
              aria-label="Order management pagination"
              className="flex flex-wrap justify-between items-center gap-4"
            >
              <button
                type="button"
                disabled={fetching || page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-xl border border-divider-control px-5 py-2.5 text-sm text-content-main hover:bg-surface-soft disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-content-muted">
                Page {result.pagination.page} of {result.pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={fetching || page >= result.pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-xl border border-divider-control px-5 py-2.5 text-sm text-content-main hover:bg-surface-soft disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          )}
        </>
      ) : null}
    </section>
  );
}
