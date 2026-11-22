// src/lib/authRedirect.ts

const AUTH_RETURN_TO_KEY = "kochi-auth-return-to";
const AUTH_LOGOUT_KEY = "kochi-auth-logout-in-progress";
const AUTH_ROUTES = ["/login", "/register", "/auth/callback"];

function getSafeReturnPath(path: string): string | null {
  if (
    typeof window === "undefined" ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    /[\u0000-\u001f]/.test(path)
  ) {
    return null;
  }

  try {
    const url = new URL(path, window.location.origin);

    if (url.origin !== window.location.origin) {
      return null;
    }

    const isAuthRoute = AUTH_ROUTES.some(
      (route) => url.pathname === route || url.pathname.startsWith(`${route}/`)
    );

    if (isAuthRoute) {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function saveAuthReturnTo(path: string): void {
  const safePath = getSafeReturnPath(path);

  if (!safePath) {
    return;
  }

  try {
    if (window.sessionStorage.getItem(AUTH_LOGOUT_KEY) === "1") {
      return;
    }

    window.sessionStorage.setItem(AUTH_RETURN_TO_KEY, safePath);
  } catch {
    // Authentication can continue without browser storage.
  }
}

export function consumeAuthReturnTo(): string {
  if (typeof window === "undefined") {
    return "/";
  }

  try {
    const path = window.sessionStorage.getItem(AUTH_RETURN_TO_KEY);

    if (!path) {
      return "/";
    }

    const safePath = getSafeReturnPath(path);

    window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);

    return safePath ?? "/";
  } catch {
    return "/";
  }
}

export function clearAuthReturnTo(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
    window.sessionStorage.removeItem(AUTH_LOGOUT_KEY);
  } catch {
    // Browser storage may be unavailable.
  }
}

export function beginExplicitLogout(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
    window.sessionStorage.setItem(AUTH_LOGOUT_KEY, "1");
  } catch {
    // Continue logout even if browser storage is unavailable.
  }
}
