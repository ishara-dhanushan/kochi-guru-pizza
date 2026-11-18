// src/app/cart/components/CartContent.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
  ShoppingBag,
  Trash2
} from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "@contexts/CartContext";
import type { CartItem } from "@typings/cart";
import QuantityControl from "@components/QuantityControl";

// Display a fallback if a stored menu image is missing or fails to load.
function CartItemImage({ item }: { item: CartItem }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-surface-placeholder shrink-0">
      {item.imageUrl && !imageFailed ? (
        <Image
          src={item.imageUrl}
          alt={item.name}
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

export default function CartContent() {
  const {
    items,
    itemCount,
    subtotal,
    isHydrated,
    removeItem,
    updateQuantity,
    clearCart
  } = useCart();

  const handleRemoveItem = (item: CartItem) => {
    removeItem(item.menuItemId, item.selectedSize);

    toast.success(`${item.name} removed from cart`);
  };

  const handleQuantityChange = (item: CartItem, quantity: number) => {
    const updated = updateQuantity(
      item.menuItemId,
      item.selectedSize,
      quantity
    );

    if (!updated) {
      toast.error("Unable to update quantity");
    }
  };

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
          <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6 lg:gap-8 items-start">
            {/* Cart items */}
            <div className="space-y-4">
              {items.map((item) => {
                const itemKey = `${item.menuItemId}-${item.selectedSize ?? "single"}`;

                const lineSubtotal = item.unitPrice * item.quantity;

                const itemLabel = item.selectedSize
                  ? `${item.name}, ${item.selectedSize}`
                  : item.name;

                return (
                  <article
                    key={itemKey}
                    className="bg-surface-card border border-divider-card rounded-2xl p-4 sm:p-5"
                  >
                    <div className="flex gap-4">
                      {/* Product image */}
                      <Link
                        href={`/menu/${item.menuItemId}`}
                        aria-label={item.name}
                        className="shrink-0"
                      >
                        <CartItemImage
                          key={item.imageUrl ?? "placeholder"}
                          item={item}
                        />
                      </Link>

                      {/* Product information */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              href={`/menu/${item.menuItemId}`}
                              className="font-heading font-bold text-content-main hover:text-brand transition-colors"
                            >
                              {item.name}
                            </Link>

                            {item.selectedSize && (
                              <p className="text-sm text-content-muted capitalize mt-1">
                                Size: {item.selectedSize}
                              </p>
                            )}

                            <p className="text-sm font-semibold text-brand mt-2">
                              Rs. {item.unitPrice.toLocaleString()}
                            </p>
                          </div>

                          {/* Remove item */}
                          <button
                            type="button"
                            aria-label={`Remove ${itemLabel} from cart`}
                            onClick={() => handleRemoveItem(item)}
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
                              handleQuantityChange(item, quantity)
                            }
                            label={itemLabel}
                          />

                          <div className="text-right">
                            <p className="text-xs text-content-muted">
                              Subtotal
                            </p>

                            <p className="font-bold text-content-main">
                              Rs. {lineSubtotal.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
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
                  <span className="text-content-muted">Items</span>

                  <span className="font-semibold text-content-main">
                    {itemCount}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-content-muted">Subtotal</span>

                  <span className="font-semibold text-content-main">
                    Rs. {subtotal.toLocaleString()}
                  </span>
                </div>

                <div className="h-px bg-divider-standard" />

                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-content-main">Total</span>

                  <span className="text-xl font-extrabold text-brand">
                    Rs. {subtotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-content-muted mt-4">
                Prices and item availability are subject to confirmation at
                checkout.
              </p>

              {/* Checkout will be enabled when the order workflow is implemented. */}
              <button
                type="button"
                disabled
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 mt-6 rounded-xl bg-brand text-brand-on font-semibold opacity-50 cursor-not-allowed"
              >
                Proceed to Checkout
                <ArrowRight size={17} />
              </button>

              <p className="text-xs text-center text-content-muted mt-3">
                Online checkout is not available yet.
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
        )}
      </div>
    </section>
  );
}
