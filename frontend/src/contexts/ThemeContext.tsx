// src/contexts/ThemeContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  useMemo,
  useCallback,
  useSyncExternalStore
} from "react";

type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Listen for system theme changes.
const subscribe = (callback: () => void) => {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  mediaQuery.addEventListener("change", callback);

  return () => mediaQuery.removeEventListener("change", callback);
};

// Get the saved theme preference.
const getStoredTheme = (): ThemeMode => {
  const storedTheme = localStorage.getItem("theme");

  return storedTheme === "light" || storedTheme === "dark"
    ? storedTheme
    : "system";
};

// Get the current system theme.
const getSystemTheme = (): ResolvedTheme => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [selectedTheme, setThemeState] = useState<ThemeMode | null>(null);

  const snapshot = useSyncExternalStore(
    subscribe,
    () => {
      const theme = selectedTheme ?? getStoredTheme();

      return theme === "system"
        ? (`system-${getSystemTheme()}` as const)
        : theme;
    },
    () => "system-light" as const
  );

  const theme: ThemeMode =
    snapshot === "light" || snapshot === "dark" ? snapshot : "system";

  const resolvedTheme: ResolvedTheme =
    snapshot === "dark" || snapshot === "system-dark" ? "dark" : "light";

  // Apply dark class to HTML element before the browser repaints.
  useLayoutEffect(() => {
    const storedTheme = selectedTheme ?? getStoredTheme();
    const actualTheme =
      storedTheme === "system" ? getSystemTheme() : storedTheme;

    document.documentElement.classList.toggle("dark", actualTheme === "dark");
  }, [selectedTheme, resolvedTheme]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    localStorage.setItem("theme", newTheme);
    setThemeState(newTheme);
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
