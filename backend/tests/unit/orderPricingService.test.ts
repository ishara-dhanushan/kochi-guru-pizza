// tests/unit/orderPricingService.test.ts
import { describe, expect, it } from "@jest/globals";
import {
  calculateOrderPricing,
  fromMinorUnits,
  toMinorUnits,
  type PricingMenuItem
} from "@services/orderPricingService";

const pizzaId = "699bee908b3c7b09a0bcb84f";
const bunId = "69a40f3d8bbc889da274ff37";

const pizza: PricingMenuItem = {
  _id: pizzaId,
  name: "Chicken Pizza",
  category: "pizza",
  variants: [
    { size: "small", price: 1500 },
    { size: "large", price: 3000 }
  ],
  isAvailable: true,
  images: []
};

const bun: PricingMenuItem = {
  _id: bunId,
  name: "Chicken Bun",
  category: "bun",
  price: 700,
  isAvailable: true,
  images: []
};

describe("Order pricing and amount validation", () => {
  it("should calculate totals using authoritative prices", () => {
    const result = calculateOrderPricing(
      [
        { menuItemId: pizzaId, selectedSize: "large", qty: 2 },
        { menuItemId: bunId, qty: 1 }
      ],
      "pickup",
      [pizza, bun]
    );

    expect(result.subtotal).toBe(6700);
    expect(result.total).toBe(6700);
    expect(result.items[0].unitPrice).toBe(3000);
  });

  it("should reject unavailable menu items", () => {
    expect(() =>
      calculateOrderPricing([{ menuItemId: bunId, qty: 1 }], "pickup", [
        { ...bun, isAvailable: false }
      ])
    ).toThrow("A selected menu item is no longer available");
  });

  it("should require a size for variant-priced pizzas", () => {
    expect(() =>
      calculateOrderPricing([{ menuItemId: pizzaId, qty: 1 }], "pickup", [
        pizza
      ])
    ).toThrow("Select a size");
  });

  it("should reject sizes for flat-priced products", () => {
    expect(() =>
      calculateOrderPricing(
        [{ menuItemId: bunId, selectedSize: "large", qty: 1 }],
        "pickup",
        [bun]
      )
    ).toThrow("does not support size selection");
  });

  it("should reject missing menu items", () => {
    expect(() =>
      calculateOrderPricing([{ menuItemId: bunId, qty: 1 }], "pickup", [])
    ).toThrow("A selected menu item is no longer available");
  });

  it("should reject discounts larger than item subtotals", () => {
    expect(() =>
      calculateOrderPricing(
        [{ menuItemId: bunId, qty: 1 }],
        "pickup",
        [bun],
        () => 70001
      )
    ).toThrow("A discount exceeds the item subtotal");
  });

  it("should preserve price precision in minor units", () => {
    expect(toMinorUnits(19.99)).toBe(1999);
    expect(fromMinorUnits(1999)).toBe(19.99);
    expect(fromMinorUnits(toMinorUnits(0.1) + toMinorUnits(0.2))).toBe(0.3);
  });
});
