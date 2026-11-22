// src/app/orders/components/OrdersContent.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  Loader2,
  RefreshCw,
  ShoppingBag
} from "lucide-react";

import { useAuth } from "@contexts/AuthContext";
import { saveAuthReturnTo } from "@lib/authRedirect";
import { formatCartPrice } from "@lib/cartPricing";
import { orderService } from "@services/orderService";

import type {
  ListMyOrdersResponse,
  OrderRecord,
  OrderStatus
} from "@typings/order";

const PAGE_SIZE = 10;

type StatusFilter = OrderStatus | "all";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-warning-wash text-warning",
  confirmed: "bg-brand-wash text-brand",
  preparing: "bg-brand-wash text-brand",
  ready: "bg-success-wash text-success",
  delivered: "bg-success-wash text-success",
  cancelled: "bg-danger-wash text-danger"
};

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" }
];

function formatOrderDate(date: string): string {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "Date unavailable";
  }

  return value.toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function OrderHistoryCard({ order }: { order: OrderRecord }) {
  const itemCount = order.items.reduce((total, item) => total + item.qty, 0);

  return (
    <details className="group bg-surface-card border border-divider-card rounded-2xl overflow-hidden">
      <summary className="cursor-pointer list-none p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-content-muted">Order Reference</p>

            <h2 className="font-heading text-lg font-bold text-content-main mt-1">
              #{order._id.slice(-8).toUpperCase()}
            </h2>

            <p className="text-sm text-content-muted mt-2">
              {formatOrderDate(order.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[order.status]}`}
            >
              {STATUS_LABELS[order.status]}
            </span>

            <ChevronDown
              size={18}
              className="text-content-muted transition-transform group-open:rotate-180"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-5">
          <div>
            <p className="text-sm text-content-muted">
              {itemCount} {itemCount === 1 ? "item" : "items"}
              {" · "}
              {order.deliveryType === "pickup" ? "Pickup" : "Delivery"}
            </p>

            <p className="text-sm text-brand font-semibold mt-2">
              View Order Details
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-content-muted">Order Total</p>

            <p className="text-xl font-bold text-brand mt-1">
              {formatCartPrice(order.total)}
            </p>
          </div>
        </div>
      </summary>

      <div className="border-t border-divider-standard p-5 sm:p-6">
        <h3 className="font-heading font-bold text-content-main mb-4">
          Order Items
        </h3>

        <div className="space-y-4">
          {order.items.map((item, index) => (
            <div
              key={`${item.menuItemId}-${item.selectedSize ?? "single"}-${index}`}
              className="flex flex-wrap justify-between items-start gap-3"
            >
              <div className="min-w-0">
                <p className="font-semibold text-content-main">
                  {item.nameSnapshot}
                </p>

                {item.selectedSize && (
                  <p className="text-sm text-content-muted capitalize mt-1">
                    Size: {item.selectedSize}
                  </p>
                )}

                <p className="text-xs text-content-muted mt-1">
                  {item.qty} × {formatCartPrice(item.unitPrice)}
                </p>

                {item.discountAmount > 0 && (
                  <p className="text-xs text-success mt-1">
                    Discount: -{formatCartPrice(item.discountAmount)}
                  </p>
                )}
              </div>

              <p className="font-semibold text-content-main">
                {formatCartPrice(item.lineTotal)}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-divider-standard mt-6 pt-5">
          <h3 className="font-heading font-bold text-content-main mb-4">
            Order Information
          </h3>

          <dl className="grid sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-content-muted">
                Full Order Reference
              </dt>
              <dd className="text-sm font-medium text-content-main mt-1 break-all">
                {order._id}
              </dd>
            </div>

            <div>
              <dt className="text-xs text-content-muted">Last Updated</dt>
              <dd className="text-sm font-medium text-content-main mt-1">
                {formatOrderDate(order.updatedAt)}
              </dd>
            </div>

            <div>
              <dt className="text-xs text-content-muted">Order Type</dt>
              <dd className="text-sm font-medium text-content-main mt-1 capitalize">
                {order.deliveryType}
              </dd>
            </div>

            <div>
              <dt className="text-xs text-content-muted">Contact Number</dt>
              <dd className="text-sm font-medium text-content-main mt-1">
                {order.phone}
              </dd>
            </div>

            <div>
              <dt className="text-xs text-content-muted">Payment Method</dt>
              <dd className="text-sm font-medium text-content-main mt-1">
                {order.paymentMethod === "cash" ? "Cash" : "Online Payment"}
              </dd>
            </div>

            <div>
              <dt className="text-xs text-content-muted">Payment Status</dt>
              <dd className="text-sm font-medium text-content-main mt-1 capitalize">
                {order.paymentStatus.replaceAll("_", " ")}
              </dd>
            </div>

            {order.deliveryType === "delivery" && order.address && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-content-muted">Delivery Address</dt>
                <dd className="text-sm font-medium text-content-main mt-1 whitespace-pre-wrap">
                  {order.address}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="border-t border-divider-standard mt-6 pt-5 space-y-3">
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-content-muted">Subtotal</span>
            <span className="text-content-main">
              {formatCartPrice(order.subtotal)}
            </span>
          </div>

          {order.discountAmount > 0 && (
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-content-muted">Discount</span>
              <span className="text-success">
                -{formatCartPrice(order.discountAmount)}
              </span>
            </div>
          )}

          {order.deliveryFee > 0 && (
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-content-muted">Delivery Fee</span>
              <span className="text-content-main">
                {formatCartPrice(order.deliveryFee)}
              </span>
            </div>
          )}

          <div className="flex justify-between gap-3 border-t border-divider-standard pt-4">
            <span className="font-bold text-content-main">Total</span>
            <span className="text-xl font-bold text-brand">
              {formatCartPrice(order.total)}
            </span>
          </div>
        </div>
      </div>
    </details>
  );
}

interface OrderFetchState {
  key: string;
  result: ListMyOrdersResponse | null;
  errorMessage: string | null;
}

export default function OrdersContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [refreshVersion, setRefreshVersion] = useState(0);

  const [fetchState, setFetchState] = useState<OrderFetchState | null>(null);

  const userId = user?._id;

  const requestKey = `${userId ?? "guest"}:${page}:${statusFilter}:${refreshVersion}`;

  const fetching = fetchState?.key !== requestKey;
  const result = fetching ? null : (fetchState?.result ?? null);
  const errorMessage = fetching ? null : (fetchState?.errorMessage ?? null);

  // Reuse the existing protected-route login flow.
  useEffect(() => {
    if (authLoading || userId) {
      return;
    }

    saveAuthReturnTo(window.location.pathname + window.location.search);

    router.replace("/login");
  }, [authLoading, userId, router]);

  useEffect(() => {
    if (authLoading || !userId) {
      return;
    }

    let active = true;

    const loadOrders = async () => {
      try {
        const response = await orderService.getMyOrders({
          page,
          limit: PAGE_SIZE,
          status: statusFilter === "all" ? undefined : statusFilter
        });

        if (active) {
          setFetchState({
            key: requestKey,
            result: response,
            errorMessage: null
          });
        }
      } catch (error) {
        if (active) {
          console.error("Failed to retrieve order history:", error);

          setFetchState({
            key: requestKey,
            result: null,
            errorMessage: "We couldn't load your orders. Please try again."
          });
        }
      }
    };

    void loadOrders();

    // Ignore responses from an outdated page or filter request.
    return () => {
      active = false;
    };
  }, [authLoading, userId, page, statusFilter, refreshVersion, requestKey]);

  if (authLoading || !user) {
    return (
      <section className="bg-surface min-h-[65vh] flex items-center justify-center">
        <div
          role="status"
          className="flex items-center gap-3 text-content-muted"
        >
          <Loader2 size={20} className="animate-spin text-brand" />
          Preparing your orders...
        </div>
      </section>
    );
  }

  return (
    <section className="bg-surface min-h-[65vh] pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 text-sm font-semibold text-content-muted hover:text-brand transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Menu
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-content-main">
              My Orders
            </h1>

            <p className="text-content-muted mt-2">
              View your previous orders and check their status.
            </p>
          </div>

          <button
            type="button"
            disabled={fetching}
            onClick={() => setRefreshVersion((version) => version + 1)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-divider-control text-content-main hover:bg-surface-soft transition-colors disabled:opacity-50"
          >
            <RefreshCw size={17} className={fetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <label
            htmlFor="order-status-filter"
            className="flex items-center gap-3 text-sm font-medium text-content-main"
          >
            Status
            <select
              id="order-status-filter"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as StatusFilter);
                setPage(1);
              }}
              className="rounded-xl border border-divider-control bg-surface-card px-4 py-2.5 text-content-main outline-none focus:border-brand"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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
            className="bg-surface-card border border-divider-card rounded-2xl p-12 flex items-center justify-center gap-3 text-content-muted"
          >
            <Loader2 size={20} className="animate-spin text-brand" />
            Loading your orders...
          </div>
        ) : errorMessage ? (
          <div className="bg-surface-card border border-danger-border rounded-2xl p-8 text-center">
            <AlertCircle size={36} className="text-danger mx-auto mb-4" />

            <p role="alert" className="text-content-main font-medium">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => setRefreshVersion((version) => version + 1)}
              className="inline-flex items-center gap-2 px-5 py-3 mt-6 rounded-xl bg-brand hover:bg-brand-hover text-brand-on font-semibold transition-colors"
            >
              <RefreshCw size={17} />
              Try Again
            </button>
          </div>
        ) : result && result.orders.length === 0 ? (
          <div className="bg-surface-card border border-divider-card rounded-2xl p-8 sm:p-12 text-center">
            <ShoppingBag size={48} className="text-brand mx-auto mb-5" />

            <h2 className="font-heading text-2xl font-bold text-content-main">
              {statusFilter === "all" ? "No Orders Yet" : "No Matching Orders"}
            </h2>

            <p className="text-content-muted mt-3">
              {statusFilter === "all"
                ? "Your orders will appear here after you place them."
                : "You don't have any orders with this status."}
            </p>

            {statusFilter === "all" ? (
              <Link
                href="/menu"
                className="inline-flex items-center justify-center px-6 py-3 mt-6 rounded-xl bg-brand hover:bg-brand-hover text-brand-on font-semibold transition-colors"
              >
                Browse Menu
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("all");
                  setPage(1);
                }}
                className="inline-flex items-center justify-center px-6 py-3 mt-6 rounded-xl bg-brand hover:bg-brand-hover text-brand-on font-semibold transition-colors"
              >
                View All Orders
              </button>
            )}
          </div>
        ) : result ? (
          <>
            <div className="space-y-4">
              {result.orders.map((order) => (
                <OrderHistoryCard key={order._id} order={order} />
              ))}
            </div>

            {result.pagination.totalPages > 1 && (
              <nav
                aria-label="Order history pagination"
                className="flex flex-wrap items-center justify-between gap-4 mt-8"
              >
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="px-5 py-2.5 rounded-xl border border-divider-control text-content-main hover:bg-surface-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <span className="text-sm text-content-muted">
                  Page {result.pagination.page} of{" "}
                  {result.pagination.totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= result.pagination.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="px-5 py-2.5 rounded-xl border border-divider-control text-content-main hover:bg-surface-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}
