// src/components/FloatingThemeToggle.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@contexts/ThemeContext";

export default function FloatingThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = [
    { value: "light" as const, icon: Sun, label: "Light" },
    { value: "dark" as const, icon: Moon, label: "Dark" },
    { value: "system" as const, icon: Monitor, label: "System" }
  ];

  const currentOption =
    options.find((opt) => opt.value === theme) || options[2];
  const CurrentIcon = currentOption.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 hidden md:block"
      ref={dropdownRef}
    >
      {/* Popup Menu (appears above the button) */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 mb-2 w-40 rounded-xl shadow-xl bg-surface-card border border-divider-standard overflow-hidden transform transition-all duration-200 origin-bottom-right">
          {options.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => {
                setTheme(value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                theme === value
                  ? "bg-brand/15 text-brand"
                  : "hover:bg-surface-card-hover text-content-muted"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
              {theme === value && <span className="ml-auto text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-14 h-14 rounded-full! bg-surface-card text-content-muted shadow-floating shadow-elevation/12 border border-divider-subtle hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand/20 z-50 overflow-hidden"
        style={{ borderRadius: "50%" }}
        aria-label="Toggle theme"
      >
        <CurrentIcon className="w-6 h-6 stroke-[1.5]" />
      </button>
    </div>
  );
}
