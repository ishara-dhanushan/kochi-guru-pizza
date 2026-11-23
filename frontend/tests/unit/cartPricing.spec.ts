// tests/unit/cartPricing.spec.ts
import { describe, expect, it } from "vitest";
import {
  formatCartPrice,
  getCartItemKey,
  getCartLineSubtotal,
  getCartUnitPrice,
  getSelectedCartSummary,
  resolveCartItems
} from "@lib/cartPricing";
import { cartPasta, cartPizza, pasta, pizza, PIZZA_ID } from "../fixtures/data";

describe("Cart pricing helpers", () => {
  it("should resolve prices for sized and flat-priced items", () => {
    expect(getCartUnitPrice(pizza, "medium")).toBe(1450.25);
    expect(getCartUnitPrice(pasta)).toBe(800.5);
    expect(getCartUnitPrice(pizza)).toBeUndefined();
    expect(getCartUnitPrice(pasta, "large")).toBeUndefined();
  });

  it("should reject invalid or conflicting menu prices", () => {
    expect(
      getCartUnitPrice({ ...pizza, price: 1000 }, "medium")
    ).toBeUndefined();
    expect(
      getCartUnitPrice({ ...pizza, variants: [] }, "medium")
    ).toBeUndefined();
    expect(
      getCartUnitPrice(
        {
          ...pizza,
          variants: [...pizza.variants!, { size: "medium", price: 2 }]
        },
        "medium"
      )
    ).toBeUndefined();
    expect(getCartUnitPrice({ ...pasta, price: -1 })).toBeUndefined();
    expect(
      getCartUnitPrice({ ...pasta, price: Number.POSITIVE_INFINITY })
    ).toBeUndefined();
    expect(getCartUnitPrice({ ...pasta, price: 1.005 })).toBeUndefined();
  });

  it("should validate precision, quantities and overflow", () => {
    expect(getCartLineSubtotal(0.1, 3)).toBe(0.3);
    expect(getCartLineSubtotal(1450.25, 2)).toBe(2900.5);
    expect(getCartLineSubtotal(800.5, 0)).toBeUndefined();
    expect(getCartLineSubtotal(800.5, 1.5)).toBeUndefined();
    expect(getCartLineSubtotal(Number.NaN, 2)).toBeUndefined();
    expect(getCartLineSubtotal(800.5, Number.MAX_SAFE_INTEGER)).toBeUndefined();
  });

  it("should key cart lines by item ID and size", () => {
    expect(getCartItemKey(cartPizza())).toBe(`${PIZZA_ID}-medium`);
    expect(getCartItemKey(cartPizza({ selectedSize: "large" }))).toBe(
      `${PIZZA_ID}-large`
    );
    expect(getCartItemKey(cartPasta())).toContain("-single");
  });
});

describe("Cart item resolution and checkout totals", () => {
  it("should refresh cart snapshots from current menu data", () => {
    const [item] = resolveCartItems([cartPizza({ name: "Old Name" })], [pizza]);
    expect(item).toMatchObject({
      name: pizza.name,
      status: "available",
      quantity: 2,
      unitPrice: 1450.25,
      lineSubtotal: 2900.5
    });
  });

  it("should distinguish deleted and unavailable items", () => {
    const items = resolveCartItems(
      [
        cartPizza(),
        cartPasta(),
        cartPizza({
          menuItemId: "eeeeeeeeeeeeeeeeeeeeeeee",
          name: "Removed item"
        }),
        cartPizza({ selectedSize: "large" })
      ],
      [
        { ...pizza, variants: [{ size: "medium", price: 1450.25 }] },
        { ...pasta, isAvailable: false }
      ]
    );
    expect(items.map((item) => item.status)).toEqual([
      "available",
      "unavailable",
      "deleted",
      "size_unavailable"
    ]);
    expect(items[2]).toMatchObject({ name: "Removed item", quantity: 2 });
  });

  it("should mark invalid menu prices as unavailable", () => {
    const [item] = resolveCartItems([cartPasta()], [{ ...pasta, price: -50 }]);
    expect(item.status).toBe("price_unavailable");
  });

  it("should exclude items not eligible for checkout", () => {
    const resolved = resolveCartItems(
      [cartPizza(), cartPasta({ selected: false })],
      [pizza, pasta]
    );
    expect(getSelectedCartSummary(resolved)).toMatchObject({
      selectedItemCount: 2,
      subtotal: 2900.5
    });
    expect(getSelectedCartSummary(resolved).selectedItems).toHaveLength(1);

    const unavailable = resolveCartItems(
      [cartPizza()],
      [{ ...pizza, isAvailable: false }]
    );
    expect(getSelectedCartSummary(unavailable)).toMatchObject({
      selectedItemCount: 0,
      subtotal: 0
    });
  });

  it("should omit totals when selected prices are invalid", () => {
    const resolved = resolveCartItems([cartPizza()], [pizza]);
    expect(
      getSelectedCartSummary([{ ...resolved[0], unitPrice: undefined }])
        .subtotal
    ).toBeUndefined();
  });

  it("should format LKR prices consistently", () => {
    expect(formatCartPrice(0)).toContain("Rs.");
    expect(formatCartPrice(1450.25)).toContain("1,450.25");
  });
});

describe("Cart pricing and menu edge cases", () => {
  it("should resolve current products even when stored IDs use uppercase", () => {
    const [item] = resolveCartItems(
      [cartPizza({ menuItemId: PIZZA_ID.toUpperCase() })],
      [pizza]
    );
    expect(item.status).toBe("available");
    expect(item.unitPrice).toBe(1450.25);
  });

  it("should recognize zero as a valid current price", () => {
    expect(getCartUnitPrice({ ...pasta, price: 0 })).toBe(0);
    expect(getCartLineSubtotal(0, 3)).toBe(0);
  });

  it("should reject prices that overflow integer minor units", () => {
    expect(
      getCartUnitPrice({ ...pasta, price: Number.MAX_SAFE_INTEGER })
    ).toBeUndefined();
    expect(getCartLineSubtotal(Number.MAX_SAFE_INTEGER, 2)).toBeUndefined();
  });

  it("should keep an invalid stored quantity unavailable for checkout", () => {
    const [item] = resolveCartItems([cartPizza({ quantity: 0 })], [pizza]);
    expect(item.status).toBe("price_unavailable");
    expect(item.lineSubtotal).toBeUndefined();
  });

  it("should mark discontinued pizza sizes as unavailable", () => {
    const [item] = resolveCartItems(
      [cartPizza()],
      [{ ...pizza, variants: [{ size: "small", price: 1000 }] }]
    );
    expect(item.status).toBe("size_unavailable");
  });

  it("should keep unavailable products in the cart without selecting them", () => {
    const [item] = resolveCartItems(
      [cartPasta()],
      [{ ...pasta, isAvailable: false }]
    );
    expect(item.status).toBe("unavailable");
    expect(item.name).toBe(pasta.name);
    expect(getSelectedCartSummary([item])).toMatchObject({
      selectedItems: [],
      selectedItemCount: 0,
      subtotal: 0
    });
  });

  it.each([
    "ftp://example.test/file.png",
    "javascript:alert(1)",
    "/relative.png",
    ""
  ])("should ignore unsupported product image URLs: %s", (image) => {
    const [item] = resolveCartItems(
      [cartPizza()],
      [{ ...pizza, images: [image] }]
    );
    expect(item.imageUrl).toBeUndefined();
  });

  it("should retain an HTTPS product image from the current menu", () => {
    const [item] = resolveCartItems(
      [cartPizza()],
      [{ ...pizza, images: ["https://example.test/pizza.png"] }]
    );
    expect(item.imageUrl).toBe("https://example.test/pizza.png");
  });

  it("should total multiple selected products without floating-point drift", () => {
    const items = resolveCartItems([cartPizza(), cartPasta()], [pizza, pasta]);
    expect(getSelectedCartSummary(items)).toMatchObject({
      selectedItemCount: 3,
      subtotal: 3701
    });
  });

  it("should keep different sizes as different cart-line identifiers", () => {
    expect(getCartItemKey(cartPizza())).not.toBe(
      getCartItemKey(cartPizza({ selectedSize: "large" }))
    );
  });
});
