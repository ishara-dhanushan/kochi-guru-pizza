// src/lib/httpClient.ts
import { ApiError } from "@lib/ApiError";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/v1";

// Token storage keys
const ACCESS_TOKEN_KEY = "kochi_access_token";
const REFRESH_TOKEN_KEY = "kochi_refresh_token";

const publicRoutes = ["/", "/menu", "/about", "/contact"];

const isPublicRoute = (pathname: string) => {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
};

/**
 * Get access token from localStorage
 */
export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Get refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Set access token in localStorage
 */
export const setAccessToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
};

/**
 * Set refresh token in localStorage
 */
export const setRefreshToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
};

/**
 * Set both tokens in localStorage
 */
export const setTokens = (accessToken: string, refreshToken: string): void => {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
};

/**
 * Clear all tokens from localStorage
 */
export const clearTokens = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

/**
 * Base HTTP client with automatic token refresh
 */
export const httpClient = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_URL}${endpoint}`;
  const MAX_ATTEMPTS = 4;
  let retryDelay = 1000;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const accessToken = getAccessToken();

    // Add authorization header if token exists
    // Normalize headers using Headers API
    const headers = new Headers(options.headers);

    // Set default Content-Type if not provided
    // Set default Content-Type if not provided and body is not FormData
    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    // Add authorization header if token exists
    if (accessToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // Handle 401 - Token expired, try to refresh
      // Skip for login endpoint to avoid page refresh loop on invalid credentials
      if (
        response.status === 401 &&
        !endpoint.includes("/auth/login") &&
        !endpoint.includes("/auth/register")
      ) {
        const refreshToken = getRefreshToken();

        if (refreshToken) {
          try {
            // Try to refresh the access token
            const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ refreshToken })
            });

            if (refreshResponse.ok) {
              const {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
              } = await refreshResponse.json();
              setTokens(newAccessToken, newRefreshToken);

              // Retry original request with new token
              headers.set("Authorization", `Bearer ${newAccessToken}`);
              const retryResponse = await fetch(url, {
                ...options,
                headers
              });

              if (!retryResponse.ok) {
                if (retryResponse.status === 401) {
                  clearTokens();
                  if (
                    typeof window !== "undefined" &&
                    !isPublicRoute(window.location.pathname)
                  ) {
                    window.location.href = new URL(
                      "/login",
                      window.location.origin
                    ).href;
                  }
                  throw new ApiError(
                    "Session expired. Please login again.",
                    401
                  );
                }

                let errorData;
                try {
                  errorData = await retryResponse.json();
                } catch {
                  errorData = { error: "Unknown error" };
                }

                throw new ApiError(
                  errorData.error ||
                    `HTTP error! status: ${retryResponse.status}`,
                  retryResponse.status,
                  errorData.details
                );
              }

              try {
                return await retryResponse.json();
              } catch {
                throw new Error("Failed to parse JSON response");
              }
            } else {
              // Only force logout if the backend explicitly tells us the token is invalid (400, 401)
              if ([400, 401].includes(refreshResponse.status)) {
                clearTokens();
                if (
                  typeof window !== "undefined" &&
                  !isPublicRoute(window.location.pathname)
                ) {
                  window.location.href = new URL(
                    "/login",
                    window.location.origin
                  ).href;
                }
                throw new ApiError(
                  "Session expired. Please login again.",
                  refreshResponse.status
                );
              }
              throw new ApiError(
                `HTTP error! status: ${refreshResponse.status}`,
                refreshResponse.status
              );
            }
          } catch (error: unknown) {
            // Network errors or other exceptions. Do not force logout.
            if (error instanceof Error) {
              throw error;
            }
            throw new Error(String(error));
          }
        } else {
          // No refresh token, clear tokens
          clearTokens();
          if (
            typeof window !== "undefined" &&
            !isPublicRoute(window.location.pathname)
          ) {
            window.location.href = new URL(
              "/login",
              window.location.origin
            ).href;
          }
          throw new Error("Unauthorized");
        }
      }

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: "Unknown error" };
        }

        throw new ApiError(
          errorData.error || `HTTP error! status: ${response.status}`,
          response.status,
          errorData.details
        );
      }

      try {
        return await response.json();
      } catch {
        throw new Error("Failed to parse JSON response");
      }
    } catch (error) {
      // Do not retry 4xx errors or explicit authentication terminations
      const isAuthError =
        (error instanceof ApiError &&
          error.message === "Session expired. Please login again.") ||
        (error instanceof Error &&
          (error.message === "Session expired. Please login again." ||
            error.message === "Unauthorized"));

      const isClientError =
        error instanceof ApiError && error.status >= 400 && error.status < 500;

      // Don't retry if it's an auth error or client error
      if (isAuthError || isClientError) {
        throw error;
      }

      // Wait before retrying (Exponential backoff)
      await new Promise((res) => setTimeout(res, retryDelay));
      retryDelay *= 2;
    }
  }

  throw new Error("Network error");
};
