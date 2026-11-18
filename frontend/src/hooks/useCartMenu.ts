// src/hooks/useCartMenu.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { menuService } from "@services/menuService";
import type { MenuItem } from "@typings/menu";

export type CartMenuState =
  | {
      status: "loading";
    }
  | {
      status: "success";
      items: MenuItem[];
    }
  | {
      status: "error";
      message: string;
    };

export function useCartMenu() {
  const [menuState, setMenuState] = useState<CartMenuState>({
    status: "loading"
  });

  const [requestVersion, setRequestVersion] = useState(0);

  // Request the complete menu, including unavailable products.
  useEffect(() => {
    let active = true;

    const loadMenu = async () => {
      try {
        const items = await menuService.getMenuItems();

        if (!active) {
          return;
        }

        setMenuState({
          status: "success",
          items
        });
      } catch (error) {
        if (!active) {
          return;
        }

        console.error("Failed to retrieve current cart menu:", error);

        setMenuState({
          status: "error",
          message: "Unable to retrieve current menu prices and availability."
        });
      }
    };

    void loadMenu();

    // Ignore stale responses after navigation or another request.
    return () => {
      active = false;
    };
  }, [requestVersion]);

  // Start a fresh request without changing the customer's cart.
  const refreshMenu = useCallback(() => {
    setMenuState({
      status: "loading"
    });

    setRequestVersion((version) => version + 1);
  }, []);

  return {
    menuState,
    refreshMenu
  };
}
