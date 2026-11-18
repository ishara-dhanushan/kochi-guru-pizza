// src/app/menu/[id]/components/ItemPricing.tsx
"use client";

import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import toast from "react-hot-toast";
import { MenuItem, IPriceVariant, PizzaSize } from "@typings/menu";
import { useCart, getCartUnitPrice } from "@contexts/CartContext";
import QuantityControl from "@components/QuantityControl";

interface ItemPricingProps {
  item: MenuItem;
}

const SIZE_LABEL: Record<PizzaSize, string> = {
  large: "Large",
  medium: "Medium",
  small: "Small"
};

const SIZE_HINT: Record<PizzaSize, string> = {
  large: '14"',
  medium: '10"',
  small: '7"'
};

export default function ItemPricing({ item }: ItemPricingProps) {
  const { addItem, isHydrated } = useCart();

  const hasVariants = item.variants && item.variants.length > 0;

  const sorted = hasVariants
    ? [...item.variants!].sort((a: IPriceVariant, b: IPriceVariant) => {
        const order: Record<PizzaSize, number> = {
          large: 0,
          medium: 1,
          small: 2
        };

        return order[a.size] - order[b.size];
      })
    : [];

  const [selectedSize, setSelectedSize] = useState<PizzaSize | undefined>(
    sorted[0]?.size
  );

  const [quantity, setQuantity] = useState(1);

  // Resolve the selection using the current menu item data.
  const selectedVariant =
    sorted.find((variant) => variant.size === selectedSize) ?? sorted[0];

  const unitPrice = getCartUnitPrice(item, selectedVariant?.size);

  const lineSubtotal =
    unitPrice !== undefined ? unitPrice * quantity : undefined;

  const canAddToCart =
    isHydrated &&
    item.isAvailable &&
    unitPrice !== undefined &&
    lineSubtotal !== undefined &&
    Number.isFinite(lineSubtotal);

  const handleAddToCart = () => {
    if (!canAddToCart) {
      return;
    }

    const added = addItem(item, selectedVariant?.size, quantity);

    if (added) {
      toast.success(`${item.name} added to cart`);
    } else {
      toast.error("Unable to add item to cart");
    }
  };

  return (
    <div className="space-y-6">
      {hasVariants ? (
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand">
            Choose your size
          </p>

          <div className="flex flex-col gap-2">
            {sorted.map((v) => {
              const isSelected = selectedVariant?.size === v.size;

              return (
                <button
                  key={v.size}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedSize(v.size)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-left transition-smooth ${
                    isSelected
                      ? "bg-brand-wash dark:bg-brand-wash/25 border-brand"
                      : "bg-surface-soft border-divider-subtle hover:border-brand/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-extrabold text-brand uppercase">
                        {v.size[0]}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-content-main leading-none">
                        {SIZE_LABEL[v.size]}
                      </p>

                      {SIZE_HINT[v.size] && (
                        <p className="text-xs text-content-muted mt-0.5">
                          {SIZE_HINT[v.size]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-brand">
                      Rs. {v.price.toLocaleString()}
                    </span>

                    {isSelected && <Check size={16} className="text-brand" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : item.price != null ? (
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand">
            Price
          </p>

          <p className="text-4xl font-extrabold text-content-main tracking-tight">
            Rs.{" "}
            <span className="text-brand">{item.price.toLocaleString()}</span>
          </p>
        </div>
      ) : null}

      {/* Quantity and selected item total */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-content-muted">
            Quantity
          </p>

          <QuantityControl
            quantity={quantity}
            onChange={setQuantity}
            disabled={
              !isHydrated || !item.isAvailable || unitPrice === undefined
            }
            label={item.name}
          />
        </div>

        {lineSubtotal !== undefined && Number.isFinite(lineSubtotal) && (
          <div className="text-right">
            <p className="text-xs text-content-muted">Subtotal</p>

            <p className="text-xl font-extrabold text-brand">
              Rs. {lineSubtotal.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Add the selected size and quantity to the cart. */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!canAddToCart}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand hover:bg-brand-hover text-brand-on font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand"
      >
        <ShoppingCart size={20} />
        {!item.isAvailable
          ? "Currently Unavailable"
          : unitPrice === undefined
            ? "Price Unavailable"
            : "Add to Cart"}
      </button>
    </div>
  );
}
