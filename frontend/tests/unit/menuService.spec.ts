// tests/unit/menuService.spec.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { menuService } from "@services/menuService";
import { pasta, pizza } from "../fixtures/data";

const mocks = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@lib/httpClient", () => ({ httpClient: mocks.request }));

beforeEach(() => {
  mocks.request.mockReset();
});

describe("MenuService current-menu retrieval", () => {
  it("should fetch fresh menu items without caching", async () => {
    mocks.request.mockResolvedValue({ items: [pizza, pasta] });
    await expect(menuService.getMenuItems()).resolves.toEqual([pizza, pasta]);
    expect(mocks.request).toHaveBeenCalledWith("/menu", { cache: "no-store" });
  });

  it("should pass category and availability query filters", async () => {
    mocks.request.mockResolvedValue({ items: [pizza] });
    await menuService.getMenuItems({ category: "pizza", isAvailable: false });
    expect(mocks.request).toHaveBeenCalledWith(
      "/menu?category=pizza&isAvailable=false",
      { cache: "no-store" }
    );
  });

  it("should reject malformed menu responses", async () => {
    for (const response of [
      {},
      { items: null },
      { items: [{ ...pizza, _id: "bad" }] }
    ]) {
      mocks.request.mockResolvedValueOnce(response);
      await expect(menuService.getMenuItems()).rejects.toThrow(
        "Invalid menu response"
      );
    }
  });

  it("should reject duplicate IDs regardless of casing", async () => {
    mocks.request.mockResolvedValue({
      items: [pizza, { ...pizza, _id: pizza._id.toUpperCase() }]
    });
    await expect(menuService.getMenuItems()).rejects.toThrow(
      "Duplicate menu item identifiers"
    );
  });
});
