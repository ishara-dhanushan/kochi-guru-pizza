// src/app/checkout/components/CheckoutContent.tsx
"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShoppingBag
} from "lucide-react";

import { useAuth } from "@contexts/AuthContext";
import { useCart } from "@contexts/CartContext";
import { useCartMenu } from "@/hooks/useCartMenu";
import { ApiError } from "@lib/ApiError";
import { saveAuthReturnTo } from "@lib/authRedirect";
import {
  formatCartPrice,
  getCartItemKey,
  getSelectedCartSummary,
  resolveCartItems
} from "@lib/cartPricing";
import { orderService } from "@services/orderService";

import type {
  CreateOrderPayload,
  CreateOrderResponse,
  DeliveryType
} from "@typings/order";

const CHECKOUT_ATTEMPT_KEY = "kochi-checkout-attempt-v1";
const DELIVERY_ENABLED = false;

const MAX_ORDER_LINES = 100;
const MAX_LINE_QUANTITY = 1000;

interface PendingAttempt {
  userId: string;
  payload: CreateOrderPayload;
}

function isValidPhone(value: string): boolean {
  const phone = value.trim();
  const digits = phone.replace(/\D/g, "");

  return (
    phone.length >= 7 &&
    phone.length <= 25 &&
    /^\+?[0-9 ()-]+$/.test(phone) &&
    digits.length >= 7 &&
    digits.length <= 15
  );
}

function readPendingAttempt(): PendingAttempt | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_ATTEMPT_KEY);

    if (!raw) {
      return null;
    }

    const value = JSON.parse(raw) as Partial<PendingAttempt>;
    const payload = value?.payload;

    if (
      typeof value?.userId !== "string" ||
      !payload ||
      !Array.isArray(payload.items) ||
      payload.items.length === 0 ||
      payload.items.length > MAX_ORDER_LINES ||
      typeof payload.idempotencyKey !== "string" ||
      typeof payload.phone !== "string" ||
      !isValidPhone(payload.phone) ||
      payload.deliveryType !== "pickup" ||
      payload.paymentMethod !== "cash" ||
      payload.address !== undefined ||
      !payload.items.every(
        (item) =>
          typeof item.menuItemId === "string" &&
          /^[a-fA-F0-9]{24}$/.test(item.menuItemId) &&
          Number.isSafeInteger(item.qty) &&
          item.qty > 0 &&
          item.qty <= MAX_LINE_QUANTITY
      )
    ) {
      return null;
    }

    return {
      userId: value.userId,
      payload
    };
  } catch {
    return null;
  }
}

function savePendingAttempt(attempt: PendingAttempt): void {
  try {
    window.sessionStorage.setItem(
      CHECKOUT_ATTEMPT_KEY,
      JSON.stringify(attempt)
    );
  } catch {
    // The mounted checkout can still retry using React state.
  }
}

function clearPendingAttempt(): void {
  try {
    window.sessionStorage.removeItem(CHECKOUT_ATTEMPT_KEY);
  } catch {
    // Browser storage may be unavailable.
  }
}

export default function CheckoutContent() {
  const router = useRouter();

  const { user, loading: authLoading } = useAuth();
  const { items, isHydrated, removePurchasedItems } = useCart();
  const { menuState, refreshMenu } = useCartMenu();

  const [editedPhone, setEditedPhone] = useState<string | null>(null);
  const phone = editedPhone ?? user?.phone ?? "";

  const [deliveryType, setDeliveryType] = useState<DeliveryType>("pickup");

  const [address, setAddress] = useState("");

  const [pendingAttempt, setPendingAttempt] = useState<PendingAttempt | null>(
    readPendingAttempt
  );

  const [confirmation, setConfirmation] = useState<CreateOrderResponse | null>(
    null
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submittingRef = useRef(false);

  // Preserve the current internal URL before authentication.
  useEffect(() => {
    if (authLoading || confirmation) {
      return;
    }

    if (!user) {
      saveAuthReturnTo(window.location.pathname + window.location.search);

      router.replace("/login");
    }
  }, [authLoading, user, confirmation, router]);

  const resolvedItems = useMemo(() => {
    if (menuState.status !== "success") {
      return [];
    }

    return resolveCartItems(items, menuState.items);
  }, [items, menuState]);

  const { selectedItems, selectedItemCount, subtotal } =
    getSelectedCartSummary(resolvedItems);

  const unavailableSelectedItems = resolvedItems.filter(
    (item) => item.selected && item.status !== "available"
  );

  const withinOrderLimits =
    selectedItems.length <= MAX_ORDER_LINES &&
    selectedItems.every(
      (item) =>
        Number.isSafeInteger(item.quantity) &&
        item.quantity > 0 &&
        item.quantity <= MAX_LINE_QUANTITY
    );

  const checkoutReady =
    isHydrated &&
    menuState.status === "success" &&
    selectedItems.length > 0 &&
    subtotal !== undefined &&
    withinOrderLimits;

  const submitAttempt = async (attempt: PendingAttempt) => {
    if (
      submittingRef.current ||
      confirmation ||
      !user ||
      attempt.userId !== user._id
    ) {
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await orderService.createOrder(attempt.payload);

      setConfirmation(response);
      clearPendingAttempt();
      setPendingAttempt(null);

      // Remove only quantities included in the confirmed order.
      removePurchasedItems(
        attempt.payload.items.map((item) => ({
          menuItemId: item.menuItemId,
          selectedSize: item.selectedSize,
          quantity: item.qty
        }))
      );
    } catch (error) {
      const authenticationFailed =
        (error instanceof ApiError && error.status === 401) ||
        (error instanceof Error &&
          (error.message === "Unauthorized" ||
            error.message === "Session expired. Please login again."));

      if (authenticationFailed) {
        saveAuthReturnTo("/checkout");
        router.replace("/login");
      } else if (
        error instanceof ApiError &&
        error.code === "IDEMPOTENCY_CONFLICT"
      ) {
        setErrorMessage(
          "This order request conflicts with an existing request. " +
            "Do not create another order until the previous order has been checked."
        );
      } else if (
        error instanceof ApiError &&
        (error.code === "ORDER_CONCURRENCY_CONFLICT" ||
          error.status === 408 ||
          error.status === 429 ||
          error.status >= 500)
      ) {
        setErrorMessage(
          "The order result could not be confirmed. " +
            "Retry the same request to avoid creating a duplicate order."
        );
      } else if (
        error instanceof ApiError &&
        error.status >= 400 &&
        error.status < 500
      ) {
        clearPendingAttempt();
        setPendingAttempt(null);

        if (error.status === 409) {
          refreshMenu();
        }

        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          "The order result is uncertain. Retry the same request " +
            "rather than submitting a new order."
        );
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      submittingRef.current ||
      pendingAttempt ||
      confirmation ||
      !user ||
      !checkoutReady
    ) {
      return;
    }

    const normalizedPhone = phone.trim();
    const normalizedAddress = address.trim();

    if (!isValidPhone(normalizedPhone)) {
      setErrorMessage("Enter a valid contact phone number.");
      return;
    }

    if (deliveryType === "delivery" && !DELIVERY_ENABLED) {
      setErrorMessage("Delivery ordering is not available yet.");
      return;
    }

    if (
      deliveryType === "delivery" &&
      (normalizedAddress.length === 0 || normalizedAddress.length > 500)
    ) {
      setErrorMessage("Enter a valid delivery address.");
      return;
    }

    // Prices and totals are calculated by the backend.
    const payload: CreateOrderPayload = {
      items: selectedItems.map((item) => ({
        menuItemId: item.menuItemId,
        selectedSize: item.selectedSize,
        qty: item.quantity
      })),
      deliveryType,
      phone: normalizedPhone,
      ...(deliveryType === "delivery" ? { address: normalizedAddress } : {}),
      paymentMethod: "cash",
      idempotencyKey: window.crypto.randomUUID()
    };

    const attempt: PendingAttempt = {
      userId: user._id,
      payload
    };

    savePendingAttempt(attempt);
    setPendingAttempt(attempt);

    void submitAttempt(attempt);
  };

  if (confirmation) {
    const { order, replayed } = confirmation;

    return (
      <section className="bg-surface min-h-[65vh] py-12 md:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="bg-surface-card border border-divider-card rounded-2xl p-6 sm:p-10">
            <CheckCircle2 size={56} className="text-success mx-auto mb-5" />

            <h1 className="font-heading text-3xl font-bold text-content-main">
              Order Placed Successfully
            </h1>

            <p className="text-content-muted mt-3">
              Your order has been received and is awaiting confirmation.
            </p>

            {replayed && (
              <p className="text-sm text-content-muted mt-3">
                Your previous order request was recovered. No duplicate order
                was created.
              </p>
            )}

            <div className="bg-surface rounded-xl p-5 mt-8 space-y-4">
              <div>
                <p className="text-xs text-content-muted">Order Reference</p>
                <p className="font-semibold text-content-main break-all">
                  {order._id}
                </p>
              </div>

              <div>
                <p className="text-xs text-content-muted">Order Date</p>
                <p className="text-sm font-semibold text-content-main">
                  {new Date(order.createdAt).toLocaleString("en-LK")}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-content-muted">Status</span>
                <span className="font-semibold text-content-main capitalize">
                  {order.status}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-content-muted">Order Type</span>
                <span className="font-semibold text-content-main capitalize">
                  {order.deliveryType}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-content-muted">Payment Method</span>
                <span className="font-semibold text-content-main capitalize">
                  {order.paymentMethod}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-content-muted">Payment Status</span>
                <span className="font-semibold text-content-main capitalize">
                  {order.paymentStatus}
                </span>
              </div>

              <div className="border-t border-divider-standard pt-4 space-y-3">
                {order.items.map((item) => (
                  <div
                    key={`${item.menuItemId}-${item.selectedSize ?? "single"}`}
                    className="flex items-start justify-between gap-4 text-sm"
                  >
                    <span className="text-content-main">
                      {item.nameSnapshot}
                      {item.selectedSize ? ` (${item.selectedSize})` : ""}
                      {" × "}
                      {item.qty}
                    </span>

                    <span className="font-semibold text-content-main shrink-0">
                      {formatCartPrice(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-divider-standard pt-4 space-y-3">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-content-muted">Subtotal</span>
                  <span className="text-content-main">
                    {formatCartPrice(order.subtotal)}
                  </span>
                </div>

                {order.discountAmount > 0 && (
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-content-muted">Discount</span>
                    <span className="text-content-main">
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

                <div className="border-t border-divider-standard pt-3 flex justify-between gap-3">
                  <span className="font-bold text-content-main">
                    Final Total
                  </span>
                  <span className="text-xl font-bold text-brand">
                    {formatCartPrice(order.total)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-content-muted mt-4">
              The final amount is taken from the order saved by the backend.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                href="/orders"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand hover:bg-brand-hover text-brand-on font-semibold transition-colors"
              >
                View My Orders
              </Link>

              <Link
                href="/menu"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-divider-control text-content-main hover:bg-surface-soft font-semibold transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (authLoading || !user || !isHydrated) {
    return (
      <section className="bg-surface min-h-[65vh] flex items-center justify-center">
        <div
          role="status"
          className="flex items-center gap-3 text-content-muted"
        >
          <Loader2 size={20} className="animate-spin text-brand" />
          Preparing checkout...
        </div>
      </section>
    );
  }

  if (pendingAttempt && pendingAttempt.userId !== user._id) {
    return (
      <section className="bg-surface min-h-[65vh] py-16">
        <div className="max-w-xl mx-auto px-4">
          <div className="bg-surface-card border border-warning-border rounded-2xl p-6">
            <AlertCircle size={32} className="text-warning mb-4" />

            <h1 className="font-heading text-2xl font-bold text-content-main">
              Previous Order Requires Attention
            </h1>

            <p className="text-content-muted mt-3">
              This browser tab contains an unresolved order request from another
              account. Sign in with the original account to recover that
              request.
            </p>

            <Link
              href="/cart"
              className="inline-flex items-center gap-2 text-brand font-semibold mt-6"
            >
              <ArrowLeft size={16} />
              Return to Cart
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (pendingAttempt) {
    return (
      <section className="bg-surface min-h-[65vh] py-16">
        <div className="max-w-xl mx-auto px-4">
          <div className="bg-surface-card border border-warning-border rounded-2xl p-6 sm:p-8">
            <RefreshCw size={32} className="text-warning mb-4" />

            <h1 className="font-heading text-2xl font-bold text-content-main">
              {submitting
                ? "Processing Your Order"
                : "Check Your Previous Order"}
            </h1>

            <p className="text-content-muted mt-3">
              Your order request is being checked. If the previous request
              reached the server, retrying it will return the same order.
            </p>

            <p className="text-sm text-content-muted mt-4">
              Requested items:{" "}
              {pendingAttempt.payload.items.reduce(
                (total, item) => total + item.qty,
                0
              )}
            </p>

            {errorMessage && (
              <div
                role="alert"
                className="mt-5 p-3 rounded-xl bg-danger-wash border border-danger-border"
              >
                <p className="text-sm text-danger">{errorMessage}</p>
              </div>
            )}

            <button
              type="button"
              disabled={submitting}
              onClick={() => void submitAttempt(pendingAttempt)}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 mt-6 rounded-xl bg-brand hover:bg-brand-hover text-brand-on font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Retry Same Order Request
                </>
              )}
            </button>

            <p className="text-xs text-content-muted mt-4">
              Do not create a separate order while the result of this request is
              unknown.
            </p>

            <Link
              href="/cart"
              className="inline-flex items-center gap-2 text-sm text-content-muted hover:text-brand mt-5"
            >
              <ArrowLeft size={16} />
              Return to Cart
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (
    items.length === 0 ||
    (menuState.status === "success" && selectedItems.length === 0)
  ) {
    return (
      <section className="bg-surface min-h-[65vh] py-16">
        <div className="max-w-xl mx-auto px-4 text-center">
          <ShoppingBag size={48} className="text-brand mx-auto mb-5" />

          <h1 className="font-heading text-3xl font-bold text-content-main">
            {items.length === 0
              ? "Your Cart Is Empty"
              : "No Available Items Selected"}
          </h1>

          <p className="text-content-muted mt-3">
            Add or select available products before checkout.
          </p>

          <Link
            href="/cart"
            className="inline-flex items-center gap-2 mt-7 px-6 py-3 rounded-xl bg-brand hover:bg-brand-hover text-brand-on font-semibold transition-colors"
          >
            <ArrowLeft size={17} />
            Return to Cart
          </Link>
        </div>
      </section>
    );
  }

  if (menuState.status === "loading") {
    return (
      <section className="bg-surface min-h-[65vh] flex items-center justify-center">
        <div
          role="status"
          className="flex items-center gap-3 text-content-muted"
        >
          <Loader2 size={20} className="animate-spin text-brand" />
          Loading current menu prices...
        </div>
      </section>
    );
  }

  if (menuState.status === "error") {
    return (
      <section className="bg-surface min-h-[65vh] py-16">
        <div className="max-w-xl mx-auto px-4">
          <div className="bg-surface-card border border-warning-border rounded-2xl p-6">
            <AlertCircle size={28} className="text-warning mb-4" />

            <h1 className="font-heading text-2xl font-bold text-content-main">
              Unable to Load Checkout
            </h1>

            <p className="text-content-muted mt-3">{menuState.message}</p>

            <button
              type="button"
              onClick={refreshMenu}
              className="inline-flex items-center gap-2 mt-6 px-5 py-3 rounded-xl bg-brand hover:bg-brand-hover text-brand-on font-semibold transition-colors"
            >
              <RefreshCw size={17} />
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-surface min-h-[65vh] pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-sm font-semibold text-content-muted hover:text-brand transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Cart
        </Link>

        <div className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-content-main">
            Checkout
          </h1>

          <p className="text-content-muted mt-2">
            Review your selected items and provide your order details.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6 lg:gap-8 items-start"
        >
          <div className="space-y-6">
            <div className="bg-surface-card border border-divider-card rounded-2xl p-5 sm:p-6">
              <h2 className="font-heading text-xl font-bold text-content-main mb-5">
                Contact Details
              </h2>

              <p className="font-semibold text-content-main">{user.name}</p>
              <p className="text-sm text-content-muted mt-1">{user.email}</p>

              <label
                htmlFor="checkout-phone"
                className="block text-sm font-semibold text-content-main mt-5 mb-2"
              >
                Contact Phone Number
              </label>

              <input
                id="checkout-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                maxLength={25}
                required
                onChange={(event) => setEditedPhone(event.target.value)}
                placeholder="Enter your contact number"
                className="w-full rounded-xl border border-divider-control bg-surface px-4 py-3 text-content-main outline-none focus:border-brand"
              />

              <p className="text-xs text-content-muted mt-2">
                We will use this number to contact you about your order.
              </p>
            </div>

            <div className="bg-surface-card border border-divider-card rounded-2xl p-5 sm:p-6">
              <h2 className="font-heading text-xl font-bold text-content-main mb-5">
                Order Type
              </h2>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border border-divider-control rounded-xl cursor-pointer">
                  <input
                    type="radio"
                    name="deliveryType"
                    checked={deliveryType === "pickup"}
                    onChange={() => setDeliveryType("pickup")}
                    className="size-4 accent-brand"
                  />

                  <div>
                    <p className="font-semibold text-content-main">Pickup</p>
                    <p className="text-sm text-content-muted">
                      Collect your order from the restaurant.
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border border-divider-control rounded-xl">
                  <input
                    type="radio"
                    name="deliveryType"
                    checked={deliveryType === "delivery"}
                    onChange={() => setDeliveryType("delivery")}
                    disabled={!DELIVERY_ENABLED}
                    className="size-4 accent-brand"
                  />

                  <div>
                    <p className="font-semibold text-content-main">Delivery</p>
                    <p className="text-sm text-content-muted">
                      {DELIVERY_ENABLED
                        ? "Deliver your order to an address."
                        : "Not available for online orders yet."}
                    </p>
                  </div>
                </label>
              </div>

              {deliveryType === "delivery" && DELIVERY_ENABLED && (
                <div className="mt-5">
                  <label
                    htmlFor="checkout-address"
                    className="block text-sm font-semibold text-content-main mb-2"
                  >
                    Delivery Address
                  </label>

                  <textarea
                    id="checkout-address"
                    name="address"
                    rows={4}
                    maxLength={500}
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    required
                    className="w-full rounded-xl border border-divider-control bg-surface px-4 py-3 text-content-main outline-none focus:border-brand"
                  />
                </div>
              )}
            </div>

            <div className="bg-surface-card border border-divider-card rounded-2xl p-5 sm:p-6">
              <h2 className="font-heading text-xl font-bold text-content-main mb-5">
                Payment Method
              </h2>

              <div className="p-4 border border-divider-control rounded-xl">
                <p className="font-semibold text-content-main">
                  Cash at Pickup
                </p>

                <p className="text-sm text-content-muted mt-1">
                  Pay when collecting your order.
                </p>
              </div>
            </div>
          </div>

          <aside className="bg-surface-card border border-divider-card rounded-2xl p-5 sm:p-6 lg:sticky lg:top-24">
            <h2 className="font-heading text-xl font-bold text-content-main mb-5">
              Your Order
            </h2>

            {unavailableSelectedItems.length > 0 && (
              <div className="flex items-start gap-2 p-3 mb-5 rounded-lg bg-warning-wash border border-warning-border">
                <AlertCircle
                  size={17}
                  className="text-warning shrink-0 mt-0.5"
                />

                <p className="text-xs text-content-muted">
                  {unavailableSelectedItems.length} selected{" "}
                  {unavailableSelectedItems.length === 1
                    ? "item is"
                    : "items are"}{" "}
                  unavailable and excluded from checkout.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {selectedItems.map((item) => (
                <div
                  key={getCartItemKey(item)}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-content-main">
                      {item.name}
                    </p>

                    {item.selectedSize && (
                      <p className="text-xs text-content-muted capitalize">
                        Size: {item.selectedSize}
                      </p>
                    )}

                    <p className="text-xs text-content-muted mt-1">
                      {item.quantity} ×{" "}
                      {item.unitPrice !== undefined
                        ? formatCartPrice(item.unitPrice)
                        : "—"}
                    </p>
                  </div>

                  <span className="font-semibold text-content-main shrink-0">
                    {item.lineSubtotal !== undefined
                      ? formatCartPrice(item.lineSubtotal)
                      : "—"}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-divider-standard mt-5 pt-5 space-y-4">
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-content-muted">Selected Items</span>
                <span className="font-semibold text-content-main">
                  {selectedItemCount}
                </span>
              </div>

              <div className="flex justify-between gap-3 text-sm">
                <span className="text-content-muted">Subtotal</span>
                <span className="font-semibold text-content-main">
                  {subtotal !== undefined ? formatCartPrice(subtotal) : "—"}
                </span>
              </div>

              <div className="border-t border-divider-standard pt-4 flex justify-between gap-3">
                <span className="font-bold text-content-main">
                  Estimated Total
                </span>

                <span className="text-xl font-bold text-brand">
                  {subtotal !== undefined ? formatCartPrice(subtotal) : "—"}
                </span>
              </div>
            </div>

            <p className="text-xs text-content-muted mt-4">
              Current menu prices are shown. The final order total is calculated
              by the backend.
            </p>

            {!withinOrderLimits && (
              <p role="alert" className="text-sm text-danger mt-4">
                The current selection exceeds the order request limits. Update
                your cart quantities before continuing.
              </p>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="mt-5 p-3 rounded-xl bg-danger-wash border border-danger-border"
              >
                <p className="text-sm text-danger">{errorMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!checkoutReady || submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 mt-6 rounded-xl bg-brand hover:bg-brand-hover text-brand-on font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing Order...
                </>
              ) : (
                "Place Order"
              )}
            </button>

            <p className="text-xs text-center text-content-muted mt-3">
              Only selected, available products will be ordered.
            </p>
          </aside>
        </form>
      </div>
    </section>
  );
}
