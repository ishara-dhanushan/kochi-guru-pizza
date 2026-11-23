// tests/unit/orderStatus.spec.ts
import { describe, expect, it } from "vitest";
import { getAllowedNextStatuses, ORDER_STATUS_LABELS } from "@lib/orderStatus";
import { makeOrder } from "../fixtures/data";

describe("Operational order transition policy", () => {
  it.each([
    ["pending", ["confirmed", "cancelled"]],
    ["confirmed", ["preparing", "cancelled"]],
    ["preparing", ["ready"]],
    ["ready", ["delivered"]],
    ["delivered", []],
    ["cancelled", []]
  ] as const)("should limit %s transitions", (status, expected) => {
    expect(getAllowedNextStatuses(makeOrder({ status }))).toEqual(expected);
  });

  it("should block cancelling payments that need a refund", () => {
    for (const paymentStatus of [
      "paid",
      "refund_pending",
      "chargeback"
    ] as const) {
      expect(
        getAllowedNextStatuses(makeOrder({ status: "pending", paymentStatus }))
      ).toEqual(["confirmed"]);
    }
  });

  it("should block fulfilment of unverified online payments", () => {
    expect(
      getAllowedNextStatuses(
        makeOrder({
          status: "confirmed",
          paymentMethod: "online",
          paymentStatus: "unpaid"
        })
      )
    ).toEqual(["cancelled"]);
  });

  it("should allow paid online orders to advance but not cancel", () => {
    expect(
      getAllowedNextStatuses(
        makeOrder({
          status: "confirmed",
          paymentMethod: "online",
          paymentStatus: "paid"
        })
      )
    ).toEqual(["preparing"]);
  });

  it.each([
    ["pending", "Pending"],
    ["confirmed", "Confirmed"],
    ["preparing", "Preparing"],
    ["ready", "Ready"],
    ["delivered", "Delivered"],
    ["cancelled", "Cancelled"]
  ] as const)(
    "should show the correct label for %s orders",
    (status, label) => {
      expect(ORDER_STATUS_LABELS[status]).toBe(label);
    }
  );
});
