// src/components/Header.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent
} from "framer-motion";
import { useAuth } from "@contexts/AuthContext";
import { useCart } from "@contexts/CartContext";
import {
  Menu,
  X,
  User,
  ShoppingCart,
  Clock,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Monitor
} from "lucide-react";
import { useTheme } from "@contexts/ThemeContext";

const NavLinks = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
] as const;

const Header: React.FC = () => {
  const { user, logout, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const { itemCount, isHydrated } = useCart();

  const currentPathname = usePathname();
  // Normalize the homepage pathname after Vercel ISR regeneration.
  const pathname = currentPathname === "/index" ? "/" : currentPathname;

  const cartIsActive = pathname === "/cart";
  const showCartBadge = isHydrated && itemCount > 0;
  const cartBadgeLabel = itemCount > 99 ? "99+" : itemCount;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isThemeExpanded, setIsThemeExpanded] = useState(false);

  // Portal-based dropdown positioning
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

  // Recompute dropdown position whenever it opens
  useEffect(() => {
    if (dropdownOpen && dropdownButtonRef.current) {
      const rect = dropdownButtonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [dropdownOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        dropdownButtonRef.current &&
        !dropdownButtonRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node) &&
        mobileMenuButtonRef.current &&
        !mobileMenuButtonRef.current.contains(e.target as Node)
      ) {
        setMobileMenuOpen(false);
        setIsThemeExpanded(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileMenuOpen]);

  const { scrollY } = useScroll();
  const [isVisible, setIsVisible] = useState(true);
  const lastYRef = React.useRef(0);
  const directionRef = React.useRef<"up" | "down">("up");
  const lastScrollYRef = React.useRef(0); // Track previous scroll position for direction detection

  useMotionValueEvent(scrollY, "change", (latest) => {
    // Never hide the header while the mobile menu is open
    if (dropdownOpen || mobileMenuOpen) return;

    const currentScrollY = latest;
    const previousScrollY = lastScrollYRef.current;

    // Determine current direction
    const currentDirection = currentScrollY > previousScrollY ? "down" : "up";

    // Update last scroll position
    lastScrollYRef.current = currentScrollY;

    // Check if direction changed
    if (currentDirection !== directionRef.current) {
      directionRef.current = currentDirection;
      lastYRef.current = currentScrollY; // Reset anchor point on direction change
    }

    // Always show at the top
    if (currentScrollY < 64) {
      setIsVisible(true);
      return;
    }

    // Caclulate delta from the anchor point (lastXRef)
    const delta = Math.abs(currentScrollY - lastYRef.current);

    if (currentDirection === "down" && delta > 100) {
      setIsVisible(false);
    } else if (currentDirection === "up" && delta > 50) {
      setIsVisible(true);
    }
  });

  return (
    <>
      <div className="h-16 w-full" />
      <motion.header
        initial={{ y: 0 }}
        animate={{ y: isVisible || mobileMenuOpen ? 0 : "-100%" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed top-0 left-0 right-0 h-16 w-full z-50 bg-surface/75 backdrop-blur-lg border-b border-divider-standard/50 shadow-sm shadow-black/10 transition-colors"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 transition-transform group-hover:scale-105">
                <Image
                  src="/logo.svg"
                  alt="Kochi Guru Pizza"
                  fill
                  className="object-contain dark:hidden"
                />
                <Image
                  src="/logo.svg"
                  alt="Kochi Guru Pizza"
                  fill
                  className="object-contain hidden dark:block"
                />
              </div>
              <span className="text-xl font-bold text-brand tracking-tight">
                Kochi Guru Pizza
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {NavLinks.map(({ href, label }) => {
                const isActive =
                  pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`group relative font-medium transition-colors ${
                      isActive
                        ? "text-brand"
                        : "text-content-subtle hover:text-brand"
                    }`}
                  >
                    {label}
                    <span className="absolute -bottom-0.5 left-0 h-0.5 bg-brand transition-[width] w-0 group-hover:w-full" />
                  </Link>
                );
              })}
            </nav>

            {/* Right Side (Opening Hours + Cart + Profile/Auth) */}
            <div className="hidden md:flex items-center gap-3">
              {/* Opening hours */}
              <div className="flex items-center gap-2 rounded-full border border-divider-standard/50 bg-surface-soft/25 hover:bg-surface-soft-hover/25 transition-colors px-3 py-2">
                <Clock className="w-4 h-4 text-brand" />
                <div className="leading-tight">
                  <p className="text-xs font-semibold text-content-main">
                    10AM - 10PM
                  </p>
                  <p className="text-[11px] text-content-muted -mt-0.5">
                    Daily
                  </p>
                </div>
              </div>
              {/* Shopping cart */}
              <Link
                href="/cart"
                aria-label={`Cart, ${itemCount} items`}
                aria-current={cartIsActive ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 rounded-full border backdrop-blur px-3 py-2 shadow-sm transition-colors ${
                  cartIsActive
                    ? "border-brand bg-brand/10"
                    : "border-divider-standard/60 bg-surface-card/60 hover:bg-surface-card-hover/75"
                }`}
              >
                <ShoppingCart className="w-5 h-5 text-brand" />

                <span className="text-sm font-semibold text-content-main">
                  Cart
                </span>

                {showCartBadge && (
                  <span className="min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-brand text-brand-on text-[10px] font-bold">
                    {cartBadgeLabel}
                  </span>
                )}
              </Link>

              <div className="h-7 w-px bg-divider-standard/70" />

              {!loading ? (
                user ? (
                  <div className="relative">
                    <button
                      ref={dropdownButtonRef}
                      onClick={() => {
                        if (!dropdownOpen && dropdownButtonRef.current) {
                          const rect =
                            dropdownButtonRef.current.getBoundingClientRect();
                          setDropdownPos({
                            top: rect.bottom + 8,
                            right: window.innerWidth - rect.right
                          });
                        }
                        setDropdownOpen(!dropdownOpen);
                      }}
                      className="flex items-center gap-2 transition py-1 px-2 rounded-full! hover:bg-surface-hover/75"
                    >
                      {user.profilePicture ? (
                        <Image
                          src={user.profilePicture}
                          alt={user.name}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-brand/30"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center ring-2 ring-brand/30">
                          <User className="w-4 h-4 text-brand" />
                        </div>
                      )}
                      <span className="text-content-subtle font-medium text-sm">
                        {user.name}
                      </span>
                      <ChevronDown className="w-4 h-4 text-content-faint" />
                    </button>

                    {typeof window !== "undefined" &&
                      ReactDOM.createPortal(
                        <AnimatePresence>
                          {dropdownOpen && (
                            <motion.div
                              ref={dropdownRef}
                              initial={{ opacity: 0, scale: 0.95, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -4 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              style={{
                                top: dropdownPos.top,
                                right: dropdownPos.right
                              }}
                              className="fixed w-56 bg-surface-card/80 backdrop-blur-lg rounded-2xl shadow-xl border border-divider-standard py-2 overflow-hidden ring-1 ring-edge/5 z-1000"
                            >
                              <div className="px-4 py-3 border-b border-divider-subtle mb-1">
                                <p className="text-sm font-semibold text-content-main truncate">
                                  {user.name}
                                </p>
                                <p className="text-xs text-content-muted truncate">
                                  {user.email}
                                </p>
                              </div>

                              <Link
                                href="/orders"
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-content-subtle hover:bg-brand/10 hover:text-brand transition-colors"
                              >
                                <ShoppingCart className="w-4 h-4" />
                                My Orders
                              </Link>

                              {(user.role === "admin" ||
                                user.role === "staff") && (
                                <>
                                  <Link
                                    href="/dashboard"
                                    onClick={() => setDropdownOpen(false)}
                                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-content-subtle hover:bg-brand/10 hover:text-brand transition-colors"
                                  >
                                    <LayoutDashboard className="w-4 h-4" />
                                    Dashboard
                                  </Link>
                                  <div className="h-px bg-divider-subtle my-1" />
                                </>
                              )}

                              <button
                                onClick={() => {
                                  logout();
                                  setDropdownOpen(false);
                                }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-danger-wash transition-colors bg-transparent border-none text-left"
                              >
                                <LogOut className="w-4 h-4" />
                                Logout
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>,
                        document.body
                      )}
                  </div>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="px-5 py-2.5 text-content-subtle hover:text-brand font-semibold transition-colors text-sm"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-brand-on font-semibold rounded-full shadow-lg shadow-brand/20 transition-all hover:shadow-brand/30 text-sm"
                    >
                      Sign Up
                    </Link>
                  </>
                )
              ) : (
                <div className="w-9 h-9 rounded-full bg-surface-soft animate-pulse ring-2 ring-divider-subtle" />
              )}
            </div>

            {/* Mobile cart and navigation controls */}
            <div className="flex items-center gap-1 md:hidden">
              <Link
                href="/cart"
                aria-label={`Cart, ${itemCount} items`}
                aria-current={cartIsActive ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className={`relative p-2 rounded-lg transition-colors ${
                  cartIsActive
                    ? "bg-brand/10 text-brand"
                    : "text-content-subtle hover:bg-surface-hover/75"
                }`}
              >
                <ShoppingCart className="w-6 h-6" />

                {showCartBadge && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-brand text-brand-on text-[10px] font-bold">
                    {cartBadgeLabel}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Button */}
              <button
                ref={mobileMenuButtonRef}
                onClick={() => {
                  setMobileMenuOpen(!mobileMenuOpen);
                  setIsThemeExpanded(false);
                }}
                className="md:hidden p-2 rounded-lg text-content-subtle hover:bg-surface-hover/75 transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{
              opacity: 1,
              y: isVisible || mobileMenuOpen ? 0 : "-100%"
            }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-16 left-0 w-full md:hidden border-t border-divider-subtle bg-surface/75 backdrop-blur-lg shadow-lg z-40 overflow-y-auto max-h-[calc(100vh-4rem)]"
          >
            <nav className="px-4 py-6 space-y-1">
              {NavLinks.map(({ href, label }) => {
                const isActive =
                  pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 text-base font-medium rounded-xl transition-colors hover:bg-brand/10 hover:text-brand ${
                      isActive ? "text-brand" : "text-content-subtle"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}

              <div className="h-px bg-divider-subtle my-4 mx-4" />

              {!loading ? (
                user ? (
                  <>
                    <div className="px-4 py-2 flex items-center gap-3 mb-2">
                      {user.profilePicture ? (
                        <Image
                          src={user.profilePicture}
                          alt={user.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover ring-1 ring-brand/30"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center ring-2 ring-brand/30">
                          <User className="w-5 h-5 text-brand" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-content-main">
                          {user.name}
                        </p>
                        <p className="text-xs text-content-muted">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-base font-medium text-content-subtle hover:bg-brand/10 hover:text-brand rounded-xl transition-colors"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      My Orders
                    </Link>

                    {(user.role === "admin" || user.role === "staff") && (
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 text-base font-medium text-content-subtle hover:bg-brand/10 hover:text-brand rounded-xl transition-colors"
                      >
                        <LayoutDashboard className="w-5 h-5" />
                        Dashboard
                      </Link>
                    )}

                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-danger hover:bg-danger-wash rounded-xl transition-colors text-left"
                    >
                      <LogOut className="w-5 h-5" />
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="p-4 grid gap-3">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center w-full px-4 py-3 text-base font-semibold text-content-subtle hover:text-brand bg-surface-soft/75 hover:bg-surface-soft-hover rounded-xl transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center w-full px-4 py-3 text-base font-semibold text-brand-on bg-brand hover:bg-brand-hover rounded-xl shadow-lg shadow-brand/20 transition-all hover:shadow-brand/30"
                    >
                      Sign Up
                    </Link>
                  </div>
                )
              ) : (
                <div className="py-4 px-4 text-center text-content-muted">
                  <div className="w-8 h-8 mx-auto border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {/* Mobile Theme Toggle Button */}
              <div className="pt-2 mt-2 border-t border-divider-subtle">
                <button
                  onClick={() => setIsThemeExpanded(!isThemeExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 text-content-muted hover:bg-brand/10 hover:text-brand rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg">
                      {theme === "dark" ? (
                        <Moon className="w-5 h-5" />
                      ) : theme === "light" ? (
                        <Sun className="w-5 h-5" />
                      ) : (
                        <Monitor className="w-5 h-5" />
                      )}
                    </div>
                    <span className="font-medium">Appearance</span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform ${
                      isThemeExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Expanded Theme Options */}
                <AnimatePresence>
                  {isThemeExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="space-y-1 overflow-hidden mt-1 px-4 pb-2"
                    >
                      <button
                        onClick={() => setTheme("light")}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          theme === "light"
                            ? "bg-brand/15 text-brand"
                            : "text-content-muted hover:bg-surface-hover/75"
                        }`}
                      >
                        <Sun className="w-4 h-4" />
                        Light
                        {theme === "light" && (
                          <span className="ml-auto text-xs">✓</span>
                        )}
                      </button>

                      <button
                        onClick={() => setTheme("dark")}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          theme === "dark"
                            ? "bg-brand/15 text-brand"
                            : "text-content-muted hover:bg-surface-hover/75"
                        }`}
                      >
                        <Moon className="w-4 h-4" />
                        Dark
                        {theme === "dark" && (
                          <span className="ml-auto text-xs">✓</span>
                        )}
                      </button>

                      <button
                        onClick={() => setTheme("system")}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          theme === "system"
                            ? "bg-brand/15 text-brand"
                            : "text-content-muted hover:bg-surface-hover/75"
                        }`}
                      >
                        <Monitor className="w-4 h-4" />
                        System
                        {theme === "system" && (
                          <span className="ml-auto text-xs">✓</span>
                        )}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
