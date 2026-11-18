// src/contexts/AppProviders.tsx
"use client";

import React from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@contexts/AuthContext";
import { ThemeProvider } from "@contexts/ThemeContext";
import { CartProvider } from "@contexts/CartContext";
import FloatingThemeToggle from "@components/FloatingThemeToggle";

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
        <FloatingThemeToggle />
        <Toaster
          position="top-right"
          containerStyle={{
            top: 80
          }}
          toastOptions={{
            duration: 3000,
            style: {
              background: "var(--surface-inverse)",
              color: "var(--content-on-dark)"
            },
            success: {
              duration: 3000,
              style: {
                background: "var(--success-solid)",
                color: "var(--feedback-on)"
              },
              iconTheme: {
                primary: "var(--feedback-on)",
                secondary: "var(--success-solid)"
              }
            },
            error: {
              duration: 4000,
              style: {
                background: "var(--danger-solid)",
                color: "var(--feedback-on)"
              },
              iconTheme: {
                primary: "var(--feedback-on)",
                secondary: "var(--danger-solid)"
              }
            }
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
};
