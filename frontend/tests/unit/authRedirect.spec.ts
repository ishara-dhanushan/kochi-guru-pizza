// tests/unit/authRedirect.spec.ts
import { beforeEach, describe, expect, it } from "vitest";
import {
  beginExplicitLogout,
  clearAuthReturnTo,
  consumeAuthReturnTo,
  saveAuthReturnTo
} from "@lib/authRedirect";

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  window.sessionStorage.clear();
});

describe("Authentication return-path security", () => {
  it("should consume a valid checkout return path once", () => {
    saveAuthReturnTo("/checkout?source=cart#details");
    expect(consumeAuthReturnTo()).toBe("/checkout?source=cart#details");
    expect(consumeAuthReturnTo()).toBe("/");
  });

  it.each([
    "//evil.example",
    "https://evil.example",
    "/login",
    "/register",
    "/auth/callback",
    "/\\evil.example"
  ])("should reject an unsafe or circular path: %s", (path) => {
    saveAuthReturnTo(path);
    expect(consumeAuthReturnTo()).toBe("/");
  });

  it("should discard saved destinations on logout", () => {
    saveAuthReturnTo("/checkout");
    beginExplicitLogout();
    saveAuthReturnTo("/orders");
    expect(consumeAuthReturnTo()).toBe("/");
  });

  it("should allow new return paths after logout resets", () => {
    beginExplicitLogout();
    clearAuthReturnTo();
    saveAuthReturnTo("/orders?page=2");
    expect(consumeAuthReturnTo()).toBe("/orders?page=2");
  });
});
