// src/services/menuServerService.ts
import { MenuItem, MenuListResponse } from "@typings/menu";
import { httpServerClient } from "@lib/httpServerClient";

/**
 * Fetch available menu items on the server with 60-second revalidation.
 */
export async function fetchMenuItems(): Promise<MenuItem[]> {
  try {
    // Test fixtures change menu data between runs, so E2E requests must bypass caching.
    const data = await httpServerClient<MenuListResponse>(
      "/menu?isAvailable=true",
      process.env.E2E_TEST_MODE === "true"
        ? { cache: "no-store" }
        : { next: { revalidate: 60 } }
    );

    // Only display currently available items on the public menu.
    const items: MenuItem[] = (data.items ?? []).filter(
      (item) => item.isAvailable === true
    );

    console.info(`✅ Successfully fetched ${items.length} menu items`);

    return items;
  } catch (error) {
    console.error("❌ Failed to fetch menu items despite retries:", error);
    return [];
  }
}
