// src/services/orderPricingService.ts
import MenuItem from "@models/MenuItem";
import type { IMenuItem, PizzaSize } from "@models/MenuItem";
import type { DeliveryType } from "@models/Order";
import type { OrderItemInput } from "@schemas/orderSchemas";
import { OrderError } from "@utils/OrderError";

export type PricingMenuItem = Pick<
  IMenuItem,
  "name" | "category" | "variants" | "price" | "isAvailable" | "images"
> & {
  _id: unknown;
};

interface PricingDiscountContext {
  menuItem: PricingMenuItem;
  selectedSize?: PizzaSize;
  qty: number;
  unitPriceMinor: number;
  lineSubtotalMinor: number;
}

export type DiscountPolicy = (context: PricingDiscountContext) => number;

// Future extension point for administrator-configured discounts.
// Discount amounts must be returned in integer minor units.
const noDiscount: DiscountPolicy = () => 0;

const VARIANT_CATEGORIES = ["pizza", "add_on"];

// Validate integer minor-unit amounts before performing calculations.
function validateMinorUnits(amount: number): number {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new OrderError(
      409,
      "INVALID_ORDER_AMOUNT",
      "Unable to calculate a valid order amount"
    );
  }

  return amount;
}

// Convert stored LKR prices into integer cents.
// This follows the same precision rules as the frontend cart.
export function toMinorUnits(price: number): number {
  if (!Number.isFinite(price) || price < 0) {
    throw new OrderError(
      409,
      "INVALID_MENU_PRICE",
      "A menu item has an invalid price"
    );
  }

  const amount = Math.round(price * 100);

  if (!Number.isSafeInteger(amount) || amount / 100 !== price) {
    throw new OrderError(
      409,
      "INVALID_MENU_PRICE",
      "A menu item has an invalid price"
    );
  }

  return amount;
}

// Convert integer minor units back to LKR for order snapshots.
export function fromMinorUnits(amount: number): number {
  const validAmount = validateMinorUnits(amount);
  const price = validAmount / 100;

  if (Math.round(price * 100) !== validAmount) {
    throw new OrderError(
      409,
      "INVALID_ORDER_AMOUNT",
      "Unable to represent the calculated order amount"
    );
  }

  return price;
}

// Resolve the authoritative unit price from the database record.
function resolveUnitPrice(
  menuItem: PricingMenuItem,
  selectedSize?: PizzaSize
): number {
  const usesVariants = VARIANT_CATEGORIES.includes(menuItem.category);

  if (usesVariants) {
    if (!selectedSize) {
      throw new OrderError(
        400,
        "SIZE_REQUIRED",
        `Select a size for ${menuItem.name}`
      );
    }

    const variants = menuItem.variants?.filter(
      (variant) => variant.size === selectedSize
    );

    if (!variants?.length) {
      throw new OrderError(
        409,
        "SIZE_UNAVAILABLE",
        `The selected size is unavailable for ${menuItem.name}`
      );
    }

    if (variants.length !== 1 || menuItem.price != null) {
      throw new OrderError(
        409,
        "INVALID_MENU_PRICE",
        `Invalid pricing configuration for ${menuItem.name}`
      );
    }

    return toMinorUnits(variants[0].price);
  }

  if (selectedSize !== undefined) {
    throw new OrderError(
      400,
      "INVALID_SIZE",
      `${menuItem.name} does not support size selection`
    );
  }

  if (menuItem.price == null || menuItem.variants?.length) {
    throw new OrderError(
      409,
      "INVALID_MENU_PRICE",
      `Invalid pricing configuration for ${menuItem.name}`
    );
  }

  return toMinorUnits(menuItem.price);
}

// Calculate delivery charges using server-side rules.
function calculateDeliveryFee(deliveryType: DeliveryType): number {
  if (deliveryType === "pickup") {
    return 0;
  }

  // Delivery pricing will be finalized after the restaurant's
  // delivery area and fee policies have been confirmed.
  return 0;
}

// Pure pricing function, independently testable without MongoDB.
export function calculateOrderPricing(
  items: OrderItemInput[],
  deliveryType: DeliveryType,
  menuItems: PricingMenuItem[],
  discountPolicy: DiscountPolicy = noDiscount
) {
  const menuMap = new Map(
    menuItems.map((item) => [String(item._id).toLowerCase(), item])
  );

  let subtotalMinor = 0;
  let discountMinor = 0;

  const seen = new Set<string>();

  if (items.length === 0) {
    throw new OrderError(
      400,
      "EMPTY_ORDER",
      "An order must contain at least one item"
    );
  }

  const snapshots = items.map((selection) => {
    const menuItemId = selection.menuItemId.toLowerCase();

    const key = `${menuItemId}:${selection.selectedSize ?? "single"}`;

    if (seen.has(key)) {
      throw new OrderError(
        400,
        "DUPLICATE_ITEM",
        "Duplicate menu item and size combination"
      );
    }

    seen.add(key);

    const menuItem = menuMap.get(menuItemId);

    if (!menuItem || menuItem.isAvailable !== true) {
      throw new OrderError(
        409,
        "ITEM_UNAVAILABLE",
        "A selected menu item is no longer available",
        {
          menuItemId
        }
      );
    }

    if (!Number.isSafeInteger(selection.qty) || selection.qty <= 0) {
      throw new OrderError(
        400,
        "INVALID_QUANTITY",
        "Quantity must be a positive integer"
      );
    }

    const unitPriceMinor = resolveUnitPrice(menuItem, selection.selectedSize);

    const lineSubtotalMinor = validateMinorUnits(
      unitPriceMinor * selection.qty
    );

    // Apply trusted server-side product discounts.
    const lineDiscountMinor = validateMinorUnits(
      discountPolicy({
        menuItem,
        selectedSize: selection.selectedSize,
        qty: selection.qty,
        unitPriceMinor,
        lineSubtotalMinor
      })
    );

    if (lineDiscountMinor > lineSubtotalMinor) {
      throw new OrderError(
        409,
        "INVALID_DISCOUNT",
        "A discount exceeds the item subtotal"
      );
    }

    const lineTotalMinor = lineSubtotalMinor - lineDiscountMinor;

    subtotalMinor = validateMinorUnits(subtotalMinor + lineSubtotalMinor);

    discountMinor = validateMinorUnits(discountMinor + lineDiscountMinor);

    return {
      menuItemId,
      nameSnapshot: menuItem.name,
      selectedSize: selection.selectedSize,
      qty: selection.qty,

      unitPrice: fromMinorUnits(unitPriceMinor),
      lineSubtotal: fromMinorUnits(lineSubtotalMinor),
      discountAmount: fromMinorUnits(lineDiscountMinor),
      lineTotal: fromMinorUnits(lineTotalMinor),

      imageUrlSnapshot: menuItem.images?.[0]
    };
  });

  const deliveryFeeMinor = validateMinorUnits(
    calculateDeliveryFee(deliveryType)
  );

  const totalMinor = validateMinorUnits(
    subtotalMinor - discountMinor + deliveryFeeMinor
  );

  return {
    items: snapshots,
    currency: "LKR" as const,
    subtotal: fromMinorUnits(subtotalMinor),
    discountAmount: fromMinorUnits(discountMinor),
    deliveryFee: fromMinorUnits(deliveryFeeMinor),
    total: fromMinorUnits(totalMinor)
  };
}

// Fetch authoritative menu data in a single database query.
export async function getOrderPricing(
  items: OrderItemInput[],
  deliveryType: DeliveryType
) {
  const menuItemIds = [...new Set(items.map((item) => item.menuItemId))];

  const menuItems = await MenuItem.find({
    _id: {
      $in: menuItemIds
    }
  })
    .select("name category variants price isAvailable images")
    .lean();

  return calculateOrderPricing(items, deliveryType, menuItems);
}
