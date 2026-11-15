// src/app/dashboard/components/DashboardSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  Users,
  BarChart2,
  Tag,
  Store,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Home
} from "lucide-react";
import { useAuth } from "@contexts/AuthContext";
import Image from "next/image";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Menu Management", href: "/dashboard/menu", icon: UtensilsCrossed },
  { label: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  {
    label: "Staff Management",
    href: "/dashboard/staff",
    icon: Users,
    adminOnly: true
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart2,
    adminOnly: true
  },
  { label: "Promotions", href: "/dashboard/promotions", icon: Tag },
  {
    label: "Store Management",
    href: "/dashboard/store",
    icon: Store,
    adminOnly: true
  },
  { label: "Settings", href: "/dashboard/settings", icon: Settings }
];

interface SidebarContentProps {
  onNavigate: () => void;
}

// Shared sidebar content for desktop and mobile layouts.
function SidebarContent({ onNavigate }: SidebarContentProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === "admin"
  );

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <Image
          src="/logo.svg"
          alt="Kochi Guru Pizza"
          width={36}
          height={36}
          className="rounded-lg"
        />
        <div>
          <p className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
            Kochi Guru Pizza
          </p>
          <p className="text-xs text-orange-500 font-medium capitalize">
            {user?.role} Panel
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {visibleItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                active
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "text-gray-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 hover:text-orange-600 dark:hover:text-orange-400"
              }`}
            >
              <Icon
                size={18}
                className={`shrink-0 ${active ? "text-white" : "text-gray-400 group-hover:text-orange-500"}`}
              />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={14} className="text-white/70" />}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0 overflow-hidden">
            {user?.profilePicture ? (
              <Image
                src={user.profilePicture}
                alt={user.name}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">
              {user?.role}
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-200 group mb-0.5"
        >
          <Home
            size={18}
            className="shrink-0 text-gray-400 group-hover:text-orange-500"
          />
          Back to Homepage
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 group"
        >
          <LogOut
            size={18}
            className="shrink-0 text-gray-400 group-hover:text-red-500"
          />
          Logout
        </button>
      </div>
    </div>
  );
}

export default function DashboardSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobileSidebar = () => {
    setMobileOpen(false);
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 shadow-sm">
        <SidebarContent onNavigate={closeMobileSidebar} />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={28}
            height={28}
            className="rounded-md"
          />
          <span className="font-bold text-gray-900 dark:text-white text-sm">
            Dashboard
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Menu size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-white dark:bg-gray-900 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <span className="font-bold text-gray-900 dark:text-white">
                  Menu
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <SidebarContent onNavigate={closeMobileSidebar} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
