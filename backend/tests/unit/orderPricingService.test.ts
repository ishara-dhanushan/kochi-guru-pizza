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

  describe("Pricing edge cases and minor units", () => {
    it("should reject an empty selection before calculating an order", () => {
      expect(() => calculateOrderPricing([], "pickup", [pizza])).toThrow(
        "An order must contain at least one item"
      );
    });

    it("should reject repeated item-and-size selections regardless of ID casing", () => {
      expect(() =>
        calculateOrderPricing(
          [
            { menuItemId: pizzaId, selectedSize: "large", qty: 1 },
            { menuItemId: pizzaId.toUpperCase(), selectedSize: "large", qty: 1 }
          ],
          "pickup",
          [pizza]
        )
      ).toThrow("Duplicate menu item and size combination");
    });

    it("should permit two different sizes of the same pizza", () => {
      const result = calculateOrderPricing(
        [
          { menuItemId: pizzaId, selectedSize: "small", qty: 1 },
          { menuItemId: pizzaId, selectedSize: "large", qty: 1 }
        ],
        "pickup",
        [pizza]
      );
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(4500);
    });

    it("should resolve uppercase IDs and snapshot the current product image", () => {
      const result = calculateOrderPricing(
        [{ menuItemId: pizzaId.toUpperCase(), selectedSize: "large", qty: 1 }],
        "pickup",
        [{ ...pizza, images: ["https://example.test/pizza.png"] }]
      );
      expect(result.items[0]).toMatchObject({
        menuItemId: pizzaId,
        imageUrlSnapshot: "https://example.test/pizza.png"
      });
    });

    it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
      "should reject invalid quantities: %s",
      (qty) => {
        expect(() =>
          calculateOrderPricing([{ menuItemId: bunId, qty }], "pickup", [bun])
        ).toThrow("Quantity must be a positive integer");
      }
    );

    it("should reject a size removed from the authoritative menu", () => {
      expect(() =>
        calculateOrderPricing(
          [{ menuItemId: pizzaId, selectedSize: "medium", qty: 1 }],
          "pickup",
          [pizza]
        )
      ).toThrow("The selected size is unavailable");
    });

    it("should reject duplicate variants for the same selected size", () => {
      expect(() =>
        calculateOrderPricing(
          [{ menuItemId: pizzaId, selectedSize: "large", qty: 1 }],
          "pickup",
          [
            {
              ...pizza,
              variants: [
                ...(pizza.variants ?? []),
                { size: "large", price: 3000 }
              ]
            }
          ]
        )
      ).toThrow("Invalid pricing configuration");
    });

    it("should reject a variant item that also declares a flat price", () => {
      expect(() =>
        calculateOrderPricing(
          [{ menuItemId: pizzaId, selectedSize: "large", qty: 1 }],
          "pickup",
          [{ ...pizza, price: 800 }]
        )
      ).toThrow("Invalid pricing configuration");
    });

    it("should reject a flat-priced product containing variants", () => {
      expect(() =>
        calculateOrderPricing([{ menuItemId: bunId, qty: 1 }], "pickup", [
          { ...bun, variants: [{ size: "small", price: 400 }] }
        ])
      ).toThrow("Invalid pricing configuration");
    });

    it("should reject a flat-priced product with no price", () => {
      expect(() =>
        calculateOrderPricing([{ menuItemId: bunId, qty: 1 }], "pickup", [
          { ...bun, price: undefined }
        ])
      ).toThrow("Invalid pricing configuration");
    });

    it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, 1.005])(
      "should reject invalid stored prices: %s",
      (price) => {
        expect(() =>
          calculateOrderPricing([{ menuItemId: bunId, qty: 1 }], "pickup", [
            { ...bun, price }
          ])
        ).toThrow("A menu item has an invalid price");
      }
    );

    it("should reject overflow when a valid integer quantity exceeds safe totals", () => {
      expect(() =>
        calculateOrderPricing(
          [{ menuItemId: bunId, qty: Number.MAX_SAFE_INTEGER }],
          "pickup",
          [bun]
        )
      ).toThrow("Unable to calculate a valid order amount");
    });

    it.each([-1, 1.5, Number.POSITIVE_INFINITY])(
      "should reject invalid discount amounts in minor units: %s",
      (discount) => {
        expect(() =>
          calculateOrderPricing(
            [{ menuItemId: bunId, qty: 1 }],
            "pickup",
            [bun],
            () => discount
          )
        ).toThrow("Unable to calculate a valid order amount");
      }
    );

    it("should apply a trusted discount without floating-point drift", () => {
      const result = calculateOrderPricing(
        [{ menuItemId: bunId, qty: 1 }],
        "pickup",
        [bun],
        () => 150
      );
      expect(result).toMatchObject({
        currency: "LKR",
        subtotal: 700,
        discountAmount: 1.5,
        deliveryFee: 0,
        total: 698.5
      });
      expect(result.items[0].lineTotal).toBe(698.5);
    });

    it("should keep delivery fees at zero under the current provisional policy", () => {
      const result = calculateOrderPricing(
        [{ menuItemId: bunId, qty: 1 }],
        "delivery",
        [bun]
      );
      expect(result.deliveryFee).toBe(0);
      expect(result.total).toBe(700);
    });

    it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, 1.005])(
      "should reject invalid LKR conversions: %s",
      (amount) => {
        expect(() => toMinorUnits(amount)).toThrow(
          "A menu item has an invalid price"
        );
      }
    );

    it.each([-1, 1.5, Number.POSITIVE_INFINITY])(
      "should reject invalid minor-unit conversions: %s",
      (amount) => {
        expect(() => fromMinorUnits(amount)).toThrow(
          "Unable to calculate a valid order amount"
        );
      }
    );

    it("should preserve zero-value amounts through both conversions", () => {
      expect(toMinorUnits(0)).toBe(0);
      expect(fromMinorUnits(0)).toBe(0);
    });
  });
});
