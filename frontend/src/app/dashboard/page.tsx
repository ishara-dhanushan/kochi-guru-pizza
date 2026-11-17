// src/app/dashboard/page.tsx
"use client";

import {
  UtensilsCrossed,
  ShoppingCart,
  Users,
  TrendingUp,
  Hand
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@contexts/AuthContext";
import { motion } from "framer-motion";

const quickLinks = [
  {
    label: "Menu Management",
    description: "Add, edit, or remove menu items",
    href: "/dashboard/menu",
    icon: UtensilsCrossed,
    color: "from-orange-500 to-orange-600",
    lightBg: "bg-orange-50 dark:bg-orange-900/10",
    lightIcon: "text-orange-500"
  },
  {
    label: "Orders",
    description: "View and manage customer orders",
    href: "/dashboard/orders",
    icon: ShoppingCart,
    color: "from-blue-500 to-blue-600",
    lightBg: "bg-blue-50 dark:bg-blue-900/10",
    lightIcon: "text-blue-500"
  },
  {
    label: "Staff Management",
    description: "Manage staff accounts and roles",
    href: "/dashboard/staff",
    icon: Users,
    color: "from-purple-500 to-purple-600",
    lightBg: "bg-purple-50 dark:bg-purple-900/10",
    lightIcon: "text-purple-500",
    adminOnly: true
  },
  {
    label: "Analytics",
    description: "View sales and performance data",
    href: "/dashboard/analytics",
    icon: TrendingUp,
    color: "from-green-500 to-green-600",
    lightBg: "bg-green-50 dark:bg-green-900/10",
    lightIcon: "text-green-500",
    adminOnly: true
  }
];

export default function DashboardPage() {
  const { user } = useAuth();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const visibleLinks = quickLinks.filter(
    (l) => !l.adminOnly || user?.role === "admin"
  );

  return (
    <div>
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name?.split(" ")[0]}{" "}
          <Hand
            className="inline-block size-6 text-brand rotate-12 align-middle"
            aria-hidden="true"
          />
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{today}</p>
      </motion.div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visibleLinks.map((link, i) => {
            const Icon = link.icon;
            return (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Link
                  href={link.href}
                  className="flex items-center gap-4 p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-orange-200 dark:hover:border-orange-800/40 hover:shadow-md transition-all duration-200 group"
                >
                  <div
                    className={`w-12 h-12 rounded-xl ${link.lightBg} flex items-center justify-center shrink-0`}
                  >
                    <Icon size={22} className={link.lightIcon} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      {link.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {link.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
