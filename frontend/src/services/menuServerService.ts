// src/services/menuServerService.ts
import { MenuItem, MenuListResponse } from "@typings/menu";
import { httpServerClient } from "@lib/httpServerClient";

/**
 * Fetch available menu items on the server with 60-second revalidation.
 */
export async function fetchMenuItems(): Promise<MenuItem[]> {
  try {
    const data = await httpServerClient<MenuListResponse>(
      "/menu?isAvailable=true",
      {
        next: { revalidate: 60 }
      }
    );

    const items: MenuItem[] = data.items ?? [];

    console.info(`✅ Successfully fetched ${items.length} menu items`);

    return items;
  } catch (error) {
    console.error("❌ Failed to fetch menu items despite retries:", error);
    return [];
  }
}
