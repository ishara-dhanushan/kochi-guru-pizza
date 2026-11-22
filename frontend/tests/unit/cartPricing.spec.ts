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

describe("cart pricing", () => {
  it("resolves prices for a selected pizza size and flat-priced pasta", () => {
    expect(getCartUnitPrice(pizza, "medium")).toBe(1450.25);
    expect(getCartUnitPrice(pasta)).toBe(800.5);
    expect(getCartUnitPrice(pizza)).toBeUndefined();
    expect(getCartUnitPrice(pasta, "large")).toBeUndefined();
  });

  it("rejects conflicting, missing, duplicate, and invalid prices", () => {
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

  it("uses minor units and rejects invalid quantities and overflowing totals", () => {
    expect(getCartLineSubtotal(0.1, 3)).toBe(0.3);
    expect(getCartLineSubtotal(1450.25, 2)).toBe(2900.5);
    expect(getCartLineSubtotal(800.5, 0)).toBeUndefined();
    expect(getCartLineSubtotal(800.5, 1.5)).toBeUndefined();
    expect(getCartLineSubtotal(Number.NaN, 2)).toBeUndefined();
    expect(getCartLineSubtotal(800.5, Number.MAX_SAFE_INTEGER)).toBeUndefined();
  });

  it("uses product ID and selected size as the line identity", () => {
    expect(getCartItemKey(cartPizza())).toBe(`${PIZZA_ID}-medium`);
    expect(getCartItemKey(cartPizza({ selectedSize: "large" }))).toBe(
      `${PIZZA_ID}-large`
    );
    expect(getCartItemKey(cartPasta())).toContain("-single");
  });
});

describe("cart resolution and checkout summary", () => {
  it("refreshes names, pricing, and subtotals from the current menu", () => {
    const [item] = resolveCartItems([cartPizza({ name: "Old Name" })], [pizza]);
    expect(item).toMatchObject({
      name: pizza.name,
      status: "available",
      quantity: 2,
      unitPrice: 1450.25,
      lineSubtotal: 2900.5
    });
  });

  it("preserves deleted entries and distinguishes unavailability reasons", () => {
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

  it("marks invalid current pricing as unavailable", () => {
    const [item] = resolveCartItems([cartPasta()], [{ ...pasta, price: -50 }]);
    expect(item.status).toBe("price_unavailable");
  });

  it("excludes unselected and unavailable entries from checkout", () => {
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

  it("does not calculate a total for missing or invalid resolved prices", () => {
    const resolved = resolveCartItems([cartPizza()], [pizza]);
    expect(
      getSelectedCartSummary([{ ...resolved[0], unitPrice: undefined }])
        .subtotal
    ).toBeUndefined();
  });

  it("formats currency using the existing application format", () => {
    expect(formatCartPrice(0)).toContain("Rs.");
    expect(formatCartPrice(1450.25)).toContain("1,450.25");
  });
});
