// src/services/authService.ts
import {
  httpClient,
  setTokens,
  clearTokens,
  getRefreshToken
} from "@lib/httpClient";
import { User } from "@typings/user";
import { AuthResponse } from "@typings/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/v1";

/**
 * Register a new user with email and password
 */
export const register = async (
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await httpClient<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password })
  });

  // Store tokens
  setTokens(response.accessToken, response.refreshToken);

  return response;
};

/**
 * Login with email and password
 */
export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await httpClient<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

  // Store tokens
  setTokens(response.accessToken, response.refreshToken);

  return response;
};

/**
 * Initiate Google OAuth flow
 */
export const loginWithGoogle = (): void => {
  window.location.href = new URL(
    `${API_URL}/auth/google`,
    window.location.origin
  ).href;
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (): Promise<User> => {
  return httpClient<User>("/auth/me");
};

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
  try {
    await httpClient("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken: getRefreshToken() })
    });
  } finally {
    // Clear tokens even if request fails
    clearTokens();
  }
};

export const authService = {
  register,
  login,
  loginWithGoogle,
  getCurrentUser,
  logout
};
