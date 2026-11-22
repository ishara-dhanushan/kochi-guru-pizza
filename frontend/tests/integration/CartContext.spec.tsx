import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { CartProvider, useCart } from "@contexts/CartContext";
import { cartPasta, cartPizza, pasta, pizza, PIZZA_ID } from "../fixtures/data";

const STORAGE_KEY = "kochi-guru-pizza-cart-v1";

function CartProbe() {
  const cart = useCart();
  return (
    <>
      <output data-testid="hydrated">{String(cart.isHydrated)}</output>
      <output data-testid="count">{cart.itemCount}</output>
      <output data-testid="items">{JSON.stringify(cart.items)}</output>
      <button type="button" onClick={() => cart.addItem(pizza, "medium", 2)}>
        Add pizza
      </button>
      <button type="button" onClick={() => cart.addItem(pizza, "medium", 1)}>
        Add another pizza
      </button>
      <button type="button" onClick={() => cart.addItem(pizza, "large", 1)}>
        Add large pizza
      </button>
      <button type="button" onClick={() => cart.addItem(pasta, undefined, 1)}>
        Add pasta
      </button>
      <button
        type="button"
        onClick={() => cart.setItemSelected(PIZZA_ID, "medium", false)}
      >
        Unselect pizza
      </button>
      <button
        type="button"
        onClick={() => cart.updateQuantity(PIZZA_ID, "medium", 0)}
      >
        Set invalid quantity
      </button>
      <button type="button" onClick={() => cart.removeItem(PIZZA_ID, "medium")}>
        Remove pizza
      </button>
      <button
        type="button"
        onClick={() =>
          cart.removePurchasedItems([
            { menuItemId: PIZZA_ID, selectedSize: "medium", quantity: 2 }
          ])
        }
      >
        Confirm two pizzas
      </button>
      <button type="button" onClick={cart.clearCart}>
        Clear cart
      </button>
    </>
  );
}

function readItems() {
  return JSON.parse(screen.getByTestId("items").textContent ?? "[]");
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("CartProvider persisted cart workflow", () => {
  it("hydrates an empty cart and persists newly added sizes as separate lines", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>
    );
    expect(screen.getByTestId("hydrated")).toHaveTextContent("true");

    await user.click(screen.getByRole("button", { name: "Add pizza" }));
    await user.click(screen.getByRole("button", { name: "Add another pizza" }));
    await user.click(screen.getByRole("button", { name: "Add large pizza" }));

    await waitFor(() =>
      expect(screen.getByTestId("count")).toHaveTextContent("4")
    );
    expect(readItems()).toMatchObject([
      { menuItemId: PIZZA_ID, selectedSize: "medium", quantity: 3 },
      { menuItemId: PIZZA_ID, selectedSize: "large", quantity: 1 }
    ]);
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]")
    ).toHaveLength(2);
  });

  it("restores legacy data but never persists outdated price or image fields", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          ...cartPizza({ selected: false }),
          price: 20,
          imageUrl: "https://stale.test/pizza.jpg"
        },
        { ...cartPizza({ selected: false }), price: 200 }, // Duplicate line is ignored.
        { ...cartPasta(), menuItemId: "invalid" } // Invalid IDs are ignored.
      ])
    );

    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>
    );
    await waitFor(() => expect(readItems()).toHaveLength(1));
    expect(readItems()[0]).toMatchObject({ quantity: 2, selected: false });

    await waitFor(() => {
      const stored = JSON.parse(
        window.localStorage.getItem(STORAGE_KEY) ?? "[]"
      );
      expect(stored).toHaveLength(1);
      expect(stored[0]).not.toHaveProperty("price");
      expect(stored[0]).not.toHaveProperty("imageUrl");
    });
  });

  it("rejects invalid quantities and preserves the checkbox selection", async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([cartPizza()]));
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>
    );

    await user.click(screen.getByRole("button", { name: "Unselect pizza" }));
    await user.click(
      screen.getByRole("button", { name: "Set invalid quantity" })
    );
    await user.click(screen.getByRole("button", { name: "Add another pizza" }));

    expect(readItems()[0]).toMatchObject({ quantity: 3, selected: false });
  });

  it("subtracts only confirmed purchased quantities and keeps other items", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        cartPizza({ quantity: 4 }),
        cartPasta({ selected: false })
      ])
    );
    const user = userEvent.setup();
    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>
    );

    await user.click(
      screen.getByRole("button", { name: "Confirm two pizzas" })
    );
    expect(readItems()).toMatchObject([
      { menuItemId: PIZZA_ID, quantity: 2 },
      { menuItemId: pasta._id, selected: false, quantity: 1 }
    ]);

    await user.click(screen.getByRole("button", { name: "Remove pizza" }));
    expect(readItems()).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Clear cart" }));
    expect(readItems()).toEqual([]);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
