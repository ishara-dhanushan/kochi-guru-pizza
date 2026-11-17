// src/app/dashboard/components/DashboardGuard.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@contexts/AuthContext";
import toast from "react-hot-toast";

interface DashboardGuardProps {
  children: React.ReactNode;
}

export default function DashboardGuard({ children }: DashboardGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role === "customer") {
      toast.error("You don't have permission to access the dashboard.");
      router.replace("/");
      return;
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-content-muted text-sm font-medium">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!user || user.role === "customer") {
    return null;
  }

  return <>{children}</>;
}
