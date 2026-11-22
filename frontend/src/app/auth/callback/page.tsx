// src/app/auth/callback/page.tsx
"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setTokens } from "@lib/httpClient";
import { consumeAuthReturnTo } from "@lib/authRedirect";
import { useAuth } from "@contexts/AuthContext";
import toast from "react-hot-toast";
import { CheckCircle, XCircle } from "lucide-react";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const timeoutIds: NodeJS.Timeout[] = [];

    // Helper to track timeouts
    const activeSetTimeout = (callback: () => void, ms: number) => {
      const id = setTimeout(callback, ms);
      timeoutIds.push(id);
      return id;
    };

    const processAuth = async () => {
      const startTime = Date.now();
      const accessToken = searchParams.get("accessToken");
      const refreshToken = searchParams.get("refreshToken");
      const error = searchParams.get("error");

      if (error) {
        // Ensure loading shows for at least 2 seconds
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, 2000 - elapsed);

        activeSetTimeout(() => {
          setStatus("error");
          toast.error("Authentication failed");
          activeSetTimeout(() => router.push("/login"), 2000);
        }, delay);
        return;
      }

      if (accessToken && refreshToken) {
        // Store tokens
        setTokens(accessToken, refreshToken);

        // Sync user state with simple error handling
        try {
          await refreshUser();
        } catch (err) {
          console.error("User refresh failed", err);
          // Continue anyway as we have tokens
        }

        // Ensure loading shows for at least 2 seconds
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, 2000 - elapsed);

        activeSetTimeout(() => {
          setStatus("success");

          // Show success message for 3 seconds then redirect
          activeSetTimeout(() => {
            toast.success("Login successful!");
            router.replace(consumeAuthReturnTo());
          }, 3000);
        }, delay);
      } else {
        // Ensure loading shows for at least 2 seconds
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, 2000 - elapsed);

        activeSetTimeout(() => {
          setStatus("error");
          toast.error("Authentication failed - missing tokens");
          activeSetTimeout(() => router.push("/login"), 2000);
        }, delay);
      }
    };

    processAuth();

    // Cleanup function
    return () => {
      timeoutIds.forEach((id) => clearTimeout(id));
    };
  }, [searchParams, router, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface transition-colors">
      <div className="text-center w-full max-w-sm mx-auto p-8">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-divider-subtle border-t-brand mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-content-main mb-2">
              Authenticating
            </h2>
            <p className="text-content-muted font-medium">Please wait...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-success mx-auto animate-pulse drop-shadow-md" />
            </div>
            <h2 className="text-2xl font-bold text-content-main mb-2">
              Authentication Success
            </h2>
            <p className="text-content-muted font-medium">Redirecting you...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mb-6">
              <XCircle className="w-16 h-16 text-danger mx-auto drop-shadow-md" />
            </div>
            <h2 className="text-2xl font-bold text-content-main mb-2">
              Authentication Failed
            </h2>
            <p className="text-content-muted font-medium">
              Redirecting you back...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface transition-colors">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-divider-subtle border-t-brand mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-content-main mb-2">
              Loading...
            </h2>
            <p className="text-content-muted font-medium">Please wait</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
