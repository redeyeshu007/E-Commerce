"use client";

import React from "react";
import { Menu, LogOut, Loader2 } from "lucide-react";
import { brandConfig } from "@/config/brand";

export interface AdminNavbarProps {
  onLogout: () => void | Promise<void>;
  isLoggingOut?: boolean;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

/**
 * Minimal Admin Top Navbar
 *
 * Requirements:
 * - Menu/Settings icon button at the far left before the PERALAGAE logo
 * - Left: Text logo PERALAGAE with subtle ADMIN label
 * - Right: Simple Logout action with minimal icon
 * - Visual design: White background, dark charcoal text, subtle light-grey bottom divider
 */
export function AdminNavbar({
  onLogout,
  isLoggingOut = false,
  onToggleSidebar,
  isSidebarOpen = false,
}: AdminNavbarProps) {
  return (
    <header className="w-full bg-white border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Side: Menu Trigger, PERALAGAE Brand & Subtle ADMIN Label */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isSidebarOpen}
            data-testid="admin-menu-button"
            className="p-1.5 -ml-1.5 text-[#444444] hover:text-[#1A1A1A] hover:bg-[#F5F5F5] rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
          >
            <Menu className="w-5 h-5 stroke-[1.75]" aria-hidden="true" />
          </button>

          <span className="text-lg sm:text-xl font-medium tracking-[0.18em] uppercase text-[#1A1A1A]">
            {brandConfig.name}
          </span>
        </div>

        {/* Right Side: Logout Action Only */}
        <div>
          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            aria-label="Logout"
            className="inline-flex items-center gap-2 p-1.5 sm:p-0 text-xs font-medium uppercase tracking-wider text-[#1A1A1A] hover:text-[#C5A572] transition-colors duration-150 disabled:opacity-50"
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 animate-spin text-[#C5A572]" aria-hidden="true" />
            ) : (
              <LogOut className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-[#666666]" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
