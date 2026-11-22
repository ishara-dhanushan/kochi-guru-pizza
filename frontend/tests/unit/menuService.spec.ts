import { beforeEach, describe, expect, it, vi } from "vitest";
import { menuService } from "@services/menuService";
import { pasta, pizza } from "../fixtures/data";

const mocks = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@lib/httpClient", () => ({ httpClient: mocks.request }));

beforeEach(() => {
  mocks.request.mockReset();
});

describe("menu retrieval used by cart and checkout", () => {
  it("retrieves the complete current menu without cached results", async () => {
    mocks.request.mockResolvedValue({ items: [pizza, pasta] });
    await expect(menuService.getMenuItems()).resolves.toEqual([pizza, pasta]);
    expect(mocks.request).toHaveBeenCalledWith("/menu", { cache: "no-store" });
  });

  it("passes category and availability parameters to the API", async () => {
    mocks.request.mockResolvedValue({ items: [pizza] });
    await menuService.getMenuItems({ category: "pizza", isAvailable: false });
    expect(mocks.request).toHaveBeenCalledWith(
      "/menu?category=pizza&isAvailable=false",
      { cache: "no-store" }
    );
  });

  it("rejects missing or malformed menu lists rather than showing an empty menu", async () => {
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

  it("rejects duplicate IDs even when letter casing differs", async () => {
    mocks.request.mockResolvedValue({
      items: [pizza, { ...pizza, _id: pizza._id.toUpperCase() }]
    });
    await expect(menuService.getMenuItems()).rejects.toThrow(
      "Duplicate menu item identifiers"
    );
  });
});
