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

describe("safe authentication return paths", () => {
  it("preserves a checkout return path and consumes it only once", () => {
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
  ])("rejects an unsafe or circular return path: %s", (path) => {
    saveAuthReturnTo(path);
    expect(consumeAuthReturnTo()).toBe("/");
  });

  it("discards saved returns on explicit logout", () => {
    saveAuthReturnTo("/checkout");
    beginExplicitLogout();
    saveAuthReturnTo("/orders");
    expect(consumeAuthReturnTo()).toBe("/");
  });

  it("clears the logout guard when beginning another login journey", () => {
    beginExplicitLogout();
    clearAuthReturnTo();
    saveAuthReturnTo("/orders?page=2");
    expect(consumeAuthReturnTo()).toBe("/orders?page=2");
  });
});
