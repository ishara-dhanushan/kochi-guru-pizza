// src/app/cart/components/CartContent.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  ShoppingCart,
  ShoppingBag,
  Trash2
} from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "@contexts/CartContext";
import { useCartMenu } from "@/hooks/useCartMenu";
import {
  formatCartPrice,
  getCartItemKey,
  getCartLineSubtotal,
  getSelectedCartSummary,
  resolveCartItems
} from "@lib/cartPricing";
import type { CartItem, CartItemStatus } from "@typings/cart";
import QuantityControl from "@components/QuantityControl";

interface CartItemImageProps {
  name: string;
  imageUrl?: string;
}

// Display a fallback if the current menu image is missing or fails to load.
function CartItemImage({ name, imageUrl }: CartItemImageProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="size-20 sm:size-24 md:size-28 rounded-xl overflow-hidden bg-surface-placeholder shrink-0">
      {imageUrl && !imageFailed ? (
        <Image
          src={imageUrl}
          alt={name}
          width={112}
          height={112}
          className="w-full h-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ShoppingBag size={32} className="text-content-main opacity-20" />
        </div>
      )}
    </div>
  );
}

// Display an availability message only after successful menu validation.
function getAvailabilityMessage(status?: CartItemStatus): string | undefined {
  switch (status) {
    case "unavailable":
      return "This item is currently unavailable.";

    case "deleted":
      return "This item is no longer on the menu.";

    case "size_unavailable":
      return "The selected size is currently unavailable.";

    case "price_unavailable":
      return "Pricing is currently unavailable for this item.";

    default:
      return undefined;
  }
}

// Mount the menu-fetching hook only when the cart contains items.
function CartItemsContent() {
  const {
    items,
    removeItem,
    updateQuantity,
    setItemSelected,
    setItemsSelected
  } = useCart();

  const { menuState, refreshMenu } = useCartMenu();

  // Do not classify products as missing unless the menu was
  // successfully retrieved and validated.
  const resolvedItems =
    menuState.status === "success"
      ? resolveCartItems(items, menuState.items)
      : [];

  const resolvedItemMap = new Map(
    resolvedItems.map((item) => [getCartItemKey(item), item])
  );

  // Unavailable products remain visible but cannot be selected.
  const availableItems = resolvedItems.filter(
    (item) => item.status === "available"
  );

  const { selectedItems, selectedItemCount, subtotal } =
    getSelectedCartSummary(resolvedItems);

  const allSelected =
    availableItems.length > 0 && selectedItems.length === availableItems.length;

  const partiallySelected = selectedItems.length > 0 && !allSelected;

  const hasVerifiedMenu = menuState.status === "success";

  const displaySubtotal =
    hasVerifiedMenu && subtotal !== undefined ? formatCartPrice(subtotal) : "—";

  const checkoutReady =
    hasVerifiedMenu && selectedItems.length > 0 && subtotal !== undefined;

  const handleRemoveItem = (item: CartItem, name: string) => {
    removeItem(item.menuItemId, item.selectedSize);

    toast.success(`${name} removed from cart`);
  };

  const handleQuantityChange = (
    item: CartItem,
    quantity: number,
    unitPrice?: number
  ) => {
    // Validate the calculated total when current pricing is known.
    if (
      unitPrice !== undefined &&
      getCartLineSubtotal(unitPrice, quantity) === undefined
    ) {
      toast.error("Unable to update quantity");

      return;
    }

    const updated = updateQuantity(
      item.menuItemId,
      item.selectedSize,
      quantity
    );

    if (!updated) {
      toast.error("Unable to update quantity");
    }
  };

  const handleSelectAll = (selected: boolean) => {
    // Only update selections for currently orderable products.
    setItemsSelected(availableItems, selected);
  };

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6 lg:gap-8 items-start">
      {/* Cart items */}
      <div className="space-y-4">
        {/* Current menu loading state */}
        {menuState.status === "loading" && (
          <div
            role="status"
            className="flex items-center gap-3 p-4 rounded-xl border border-divider-card bg-surface-card"
          >
            <RefreshCw size={18} className="animate-spin text-brand shrink-0" />

            <p className="text-sm text-content-muted">
              Loading current menu prices and availability...
            </p>
          </div>
        )}

        {/* Preserve cart items when the menu API is unavailable. */}
        {menuState.status === "error" && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-warning-wash border border-warning-border"
          >
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-warning shrink-0" />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-warning">
                  {menuState.message}
                </p>

                <p className="text-sm text-content-muted mt-1">
                  Your cart items are still saved. Please try again to retrieve
                  the latest product details.
                </p>

                <button
                  type="button"
                  onClick={refreshMenu}
                  className="inline-flex items-center gap-2 mt-3 px-3 py-2 rounded-lg text-sm font-semibold bg-brand hover:bg-brand-hover text-brand-on transition-colors"
                >
                  <RefreshCw size={15} />
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Select all available cart entries */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-divider-card bg-surface-card">
          <label className="inline-flex items-center gap-3 text-sm font-semibold text-content-main">
            <input
              type="checkbox"
              checked={allSelected}
              disabled={availableItems.length === 0}
              ref={(element) => {
                if (element) {
                  element.indeterminate = partiallySelected;
                }
              }}
              onChange={(event) => handleSelectAll(event.target.checked)}
              className="size-5 accent-brand cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            />
            Select all available items
          </label>

          <span className="text-xs text-content-muted">
            {hasVerifiedMenu
              ? `${selectedItems.length} of ${availableItems.length} selected`
              : menuState.status === "error"
                ? "Availability unknown"
                : "Checking availability..."}
          </span>
        </div>

        {items.map((item) => {
          const itemKey = getCartItemKey(item);
          const resolvedItem = resolvedItemMap.get(itemKey);

          // Prefer current product details and retain the stored
          // name as a fallback when the API is unavailable.
          const name = resolvedItem?.name ?? item.name;

          const imageUrl = resolvedItem?.imageUrl;
          const unitPrice = resolvedItem?.unitPrice;
          const lineSubtotal = resolvedItem?.lineSubtotal;

          const canSelect = resolvedItem?.status === "available";

          const availabilityMessage = getAvailabilityMessage(
            resolvedItem?.status
          );

          const itemLabel = item.selectedSize
            ? `${name}, ${item.selectedSize}`
            : name;

          // Product details are only linked when the product's
          // existence has been confirmed by the menu API.
          const hasProductDetails =
            resolvedItem !== undefined && resolvedItem.status !== "deleted";

          const image = (
            <CartItemImage
              key={imageUrl ?? "placeholder"}
              name={name}
              imageUrl={imageUrl}
            />
          );

          return (
            <article
              key={itemKey}
              className="bg-surface-card border border-divider-card rounded-2xl p-4 sm:p-5"
            >
              <div className="flex gap-2 sm:gap-4 items-center">
                {/* Select the product for checkout */}
                <input
                  type="checkbox"
                  aria-label={`Select ${itemLabel} for checkout`}
                  checked={canSelect && item.selected}
                  disabled={!canSelect}
                  onChange={(event) =>
                    setItemSelected(
                      item.menuItemId,
                      item.selectedSize,
                      event.target.checked
                    )
                  }
                  className="size-5 accent-brand shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                />

                {/* Product image */}
                {hasProductDetails ? (
                  <Link
                    href={`/menu/${item.menuItemId}`}
                    aria-label={name}
                    className="shrink-0"
                  >
                    {image}
                  </Link>
                ) : (
                  image
                )}

                {/* Product information */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {hasProductDetails ? (
                        <Link
                          href={`/menu/${item.menuItemId}`}
                          className="font-heading font-bold text-content-main hover:text-brand transition-colors wrap-break-word"
                        >
                          {name}
                        </Link>
                      ) : (
                        <p className="font-heading font-bold text-content-main wrap-break-word">
                          {name}
                        </p>
                      )}

                      {item.selectedSize && (
                        <p className="text-sm text-content-muted capitalize mt-1">
                          Size: {item.selectedSize}
                        </p>
                      )}

                      <p className="text-sm font-semibold text-brand mt-2">
                        {unitPrice !== undefined
                          ? formatCartPrice(unitPrice)
                          : "Price unavailable"}
                      </p>
                    </div>

                    {/* Remove item */}
                    <button
                      type="button"
                      aria-label={`Remove ${itemLabel} from cart`}
                      onClick={() => handleRemoveItem(item, name)}
                      className="p-2 rounded-lg text-content-muted hover:text-danger hover:bg-danger-wash transition-colors shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Quantity and line subtotal */}
                  <div className="flex flex-wrap items-end justify-between gap-3 mt-4">
                    <QuantityControl
                      quantity={item.quantity}
                      onChange={(quantity) =>
                        handleQuantityChange(item, quantity, unitPrice)
                      }
                      disabled={hasVerifiedMenu && !canSelect}
                      label={itemLabel}
                    />

                    <div className="text-right">
                      <p className="text-xs text-content-muted">Subtotal</p>

                      <p className="font-bold text-content-main">
                        {lineSubtotal !== undefined
                          ? formatCartPrice(lineSubtotal)
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Availability feedback */}
              {availabilityMessage && (
                <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-danger-wash border border-danger-border">
                  <AlertCircle
                    size={16}
                    className="text-danger shrink-0 mt-0.5"
                  />

                  <p className="text-xs sm:text-sm font-medium text-danger">
                    {availabilityMessage}
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Order summary */}
      <aside className="bg-surface-card border border-divider-card rounded-2xl p-5 sm:p-6 lg:sticky lg:top-24">
        <h2 className="font-heading text-xl font-bold text-content-main mb-6">
          Order Summary
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-content-muted">Selected items</span>

            <span className="font-semibold text-content-main">
              {hasVerifiedMenu ? selectedItemCount : "—"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-content-muted">Subtotal</span>

            <span className="font-semibold text-content-main">
              {displaySubtotal}
            </span>
          </div>

          <div className="h-px bg-divider-standard" />

          <div className="flex items-center justify-between gap-3">
            <span className="font-bold text-content-main">Total</span>

            <span className="text-xl font-extrabold text-brand">
              {displaySubtotal}
            </span>
          </div>
        </div>

        <p className="text-xs text-content-muted mt-4">
          Only selected, available items are included in this total. Unselected
          items will remain in your cart.
        </p>

        {/* Checkout will be enabled when the order workflow is implemented. */}
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 mt-6 rounded-xl bg-brand text-brand-on font-semibold opacity-50 cursor-not-allowed"
        >
          Proceed to Checkout
          {selectedItemCount > 0 && <span>({selectedItemCount})</span>}
          <ArrowRight size={17} />
        </button>

        <p className="text-xs text-center text-content-muted mt-3">
          {menuState.status === "error"
            ? "Retry loading the menu before proceeding."
            : menuState.status === "loading"
              ? "Checking current prices and availability..."
              : selectedItems.length === 0
                ? "Select available items to continue."
                : !checkoutReady
                  ? "Unable to calculate the selected items total."
                  : "Checkout is not available yet."}
        </p>

        <Link
          href="/menu"
          className="flex items-center justify-center w-full gap-2 text-sm font-semibold text-content-muted hover:text-brand transition-colors mt-5"
        >
          <ArrowLeft size={15} />
          Continue Shopping
        </Link>
      </aside>
    </div>
  );
}

export default function CartContent() {
  const { items, itemCount, isHydrated, clearCart } = useCart();

  const handleClearCart = () => {
    clearCart();

    toast.success("Cart cleared");
  };

  return (
    <section className="bg-surface min-h-[65vh] pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Back to menu */}
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 text-sm font-semibold text-content-muted hover:text-brand transition-colors group mb-8"
        >
          <ArrowLeft
            size={15}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          Continue Shopping
        </Link>

        {/* Cart heading */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-content-main">
              Shopping Cart
            </h1>

            {isHydrated && (
              <p className="text-sm text-content-muted mt-2">
                {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
              </p>
            )}
          </div>

          {isHydrated && items.length > 0 && (
            <button
              type="button"
              onClick={handleClearCart}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-danger-action hover:bg-danger-action-hover text-feedback-on transition-colors"
            >
              <Trash2 size={16} />
              Clear Cart
            </button>
          )}
        </div>

        {!isHydrated ? (
          // Wait for localStorage to load before showing cart contents.
          <div
            role="status"
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin" />

            <p className="text-sm text-content-muted">Loading your cart...</p>
          </div>
        ) : items.length === 0 ? (
          // Empty cart state.
          <div className="flex flex-col items-center justify-center text-center py-16 md:py-24 px-4 bg-surface-card rounded-2xl border border-divider-card">
            <div className="w-20 h-20 rounded-full bg-brand-wash dark:bg-brand-wash/25 flex items-center justify-center mb-6">
              <ShoppingCart size={36} className="text-brand" />
            </div>

            <h2 className="font-heading text-xl md:text-2xl font-bold text-content-main mb-3">
              Your cart is empty
            </h2>

            <p className="text-sm text-content-muted max-w-sm mb-6">
              Explore our menu and add your favourite items to your cart.
            </p>

            <Link
              href="/menu"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand hover:bg-brand-hover text-brand-on font-semibold transition-colors"
            >
              Browse Menu
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <CartItemsContent />
        )}
      </div>
    </section>
  );
}
