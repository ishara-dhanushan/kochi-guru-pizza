// src/lib/cartPricing.ts
import {
  VARIANT_CATEGORIES,
  type MenuItem,
  type PizzaSize
} from "@typings/menu";
import type { CartItem, CartItemStatus, ResolvedCartItem } from "@typings/cart";

// A product and its selected size identify a unique cart entry.
export function getCartItemKey(
  item: Pick<CartItem, "menuItemId" | "selectedSize">
): string {
  return `${item.menuItemId}-${item.selectedSize ?? "single"}`;
}

// Convert a valid LKR price into integer minor units.
function toMinorUnits(price: number): number | undefined {
  if (!Number.isFinite(price) || price < 0) {
    return undefined;
  }

  const minorUnits = Math.round(price * 100);

  if (!Number.isSafeInteger(minorUnits) || minorUnits / 100 !== price) {
    return undefined;
  }

  return minorUnits;
}

// Resolve the current display price using the existing pricing model.
// Availability is deliberately checked separately from pricing.
export function getCartUnitPrice(
  item: MenuItem,
  selectedSize?: PizzaSize
): number | undefined {
  const usesVariants = VARIANT_CATEGORIES.includes(item.category);

  let price: number | undefined;

  if (usesVariants) {
    if (!selectedSize || item.price != null) {
      return undefined;
    }

    const variants = item.variants?.filter(
      (variant) => variant.size === selectedSize
    );

    if (variants?.length !== 1) {
      return undefined;
    }

    price = variants[0].price;
  } else {
    if (selectedSize !== undefined || item.variants?.length) {
      return undefined;
    }

    price = item.price;
  }

  return typeof price === "number" && toMinorUnits(price) !== undefined
    ? price
    : undefined;
}

// Calculate display totals without accumulating floating-point errors.
export function getCartLineSubtotal(
  unitPrice: number,
  quantity: number
): number | undefined {
  const unitPriceMinor = toMinorUnits(unitPrice);

  if (
    unitPriceMinor === undefined ||
    !Number.isSafeInteger(quantity) ||
    quantity <= 0
  ) {
    return undefined;
  }

  const subtotalMinor = unitPriceMinor * quantity;

  return Number.isSafeInteger(subtotalMinor) ? subtotalMinor / 100 : undefined;
}

// Only retain image URLs supported by the existing Next.js configuration.
function getValidImageUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !value) {
    return undefined;
  }

  try {
    const url = new URL(value);

    if (url.protocol === "https:" || url.protocol === "http:") {
      return value;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

// Determine whether the stored size still belongs to the product.
function hasValidSelectedSize(
  item: MenuItem,
  selectedSize?: PizzaSize
): boolean {
  const usesVariants = VARIANT_CATEGORIES.includes(item.category);

  if (usesVariants) {
    return (
      selectedSize !== undefined &&
      (item.variants?.some((variant) => variant.size === selectedSize) ?? false)
    );
  }

  return selectedSize === undefined;
}

// Resolve cart entries only after a successful, complete menu response.
export function resolveCartItems(
  cartItems: CartItem[],
  menuItems: MenuItem[]
): ResolvedCartItem[] {
  const menuMap = new Map(
    menuItems.map((item) => [item._id.toLowerCase(), item])
  );

  return cartItems.map((cartItem) => {
    const menuItem = menuMap.get(cartItem.menuItemId.toLowerCase());

    // Missing products retain their stored name and quantity.
    if (!menuItem) {
      return {
        ...cartItem,
        status: "deleted"
      };
    }

    const unitPrice = getCartUnitPrice(menuItem, cartItem.selectedSize);

    const lineSubtotal =
      unitPrice !== undefined
        ? getCartLineSubtotal(unitPrice, cartItem.quantity)
        : undefined;

    let status: CartItemStatus = "available";

    // Unavailable products can still have valid prices and images.
    if (!menuItem.isAvailable) {
      status = "unavailable";
    } else if (!hasValidSelectedSize(menuItem, cartItem.selectedSize)) {
      status = "size_unavailable";
    } else if (unitPrice === undefined || lineSubtotal === undefined) {
      status = "price_unavailable";
    }

    return {
      ...cartItem,
      name: menuItem.name,
      imageUrl: getValidImageUrl(menuItem.images[0]),
      unitPrice,
      lineSubtotal,
      status
    };
  });
}

// Only selected, currently orderable products contribute to checkout.
export function getSelectedCartSummary(items: ResolvedCartItem[]) {
  const selectedItems = items.filter(
    (item) => item.selected && item.status === "available"
  );

  const selectedItemCount = selectedItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  let subtotalMinor = 0;

  for (const item of selectedItems) {
    const unitPriceMinor =
      item.unitPrice !== undefined ? toMinorUnits(item.unitPrice) : undefined;

    if (unitPriceMinor === undefined) {
      return {
        selectedItems,
        selectedItemCount,
        subtotal: undefined
      };
    }

    subtotalMinor += unitPriceMinor * item.quantity;

    if (!Number.isSafeInteger(subtotalMinor)) {
      return {
        selectedItems,
        selectedItemCount,
        subtotal: undefined
      };
    }
  }

  return {
    selectedItems,
    selectedItemCount,
    subtotal: subtotalMinor / 100
  };
}

// Keep monetary formatting consistent across cart and checkout.
export function formatCartPrice(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-LK", {
    maximumFractionDigits: 2
  })}`;
}
