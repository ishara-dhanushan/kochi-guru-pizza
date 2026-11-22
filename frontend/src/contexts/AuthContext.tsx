// src/contexts/AuthContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo
} from "react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authService } from "@services/authService";
import { getAccessToken } from "@lib/httpClient";
import { beginExplicitLogout, clearAuthReturnTo } from "@lib/authRedirect";
import { User } from "@typings/user";
import { AuthContextType } from "@typings/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check if user is logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();

      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error: unknown) {
          console.error("Failed to fetch user:", error);
          setUser(null);
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  useEffect(() => {
    const isPublicPage =
      pathname === "/" ||
      ["/menu", "/about", "/contact", "/cart"].some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
      );

    if (isPublicPage) {
      clearAuthReturnTo();
    }
  }, [pathname]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      toast.success("Login successful!");
      // Don't redirect - let the modal handle closing
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Login failed";
      toast.error(message);
      throw error;
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        const response = await authService.register(name, email, password);
        setUser(response.user);
        toast.success("Registration successful!");
        // Don't redirect - let the modal handle closing
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Registration failed";
        toast.error(message);
        throw error;
      }
    },
    []
  );

  const loginWithGoogle = useCallback(() => {
    authService.loginWithGoogle();
  }, []);

  const logout = useCallback(async () => {
    beginExplicitLogout();

    try {
      await authService.logout();
      toast.success("Logged out successfully");
    } catch (error: unknown) {
      console.error("Logout error:", error);
      toast.success("You have been signed out.");
    } finally {
      setUser(null);
      router.replace("/");
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error: unknown) {
      console.error("Failed to refresh user:", error);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      loginWithGoogle,
      logout,
      refreshUser
    }),
    [user, loading, login, register, loginWithGoogle, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
