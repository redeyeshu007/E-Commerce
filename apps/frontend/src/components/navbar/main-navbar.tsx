"use client";

import React, { useState } from "react";
import { Menu } from "lucide-react";
import { BrandWordmark } from "./brand-wordmark";
import { PrimaryNavigation } from "./primary-navigation";
import { NavbarActions } from "./navbar-actions";
import { MobileNavigation } from "./mobile-navigation";
import type { NavigationConfig } from "@/config/navigation";

export interface MainNavbarProps {
  config: NavigationConfig;
}

/**
 * Row Three: Main Navigation Bar.
 *
 * 3-Group Architecture:
 * - Left Group: Brand ("JAVIX")
 * - Centre Group: Primary Navigation ("Home", "Shop", "Contact", "New Arrivals")
 * - Right Group: Action Icons ("Search", "Account", "Wishlist", "Cart")
 *
 * Responsive:
 * - Desktop: Full three-column luxury layout with perfectly balanced center navigation.
 * - Mobile/Tablet: Accessible hamburger trigger, prominent wordmark, and action icons.
 */
export function MainNavbar({ config }: MainNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Main Storefront Header"
        className="w-full border-b border-[#E5E5E5] bg-white transition-colors"
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Mobile hamburger trigger (visible on screens < lg) */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#222222] transition-colors hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              <Menu className="h-6 w-6 stroke-[1.4]" aria-hidden="true" />
            </button>
          </div>

          {/* Left Group: Brand Wordmark */}
          <div className="flex items-center justify-start lg:w-1/4">
            <BrandWordmark config={config.brand} />
          </div>

          {/* Centre Group: Primary Navigation Links (Desktop) */}
          <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center">
            <PrimaryNavigation items={config.primaryNav} />
          </div>

          {/* Right Group: Action Icons (Search, Account, Wishlist, Cart) */}
          <div className="flex items-center justify-end lg:w-1/4">
            <NavbarActions actions={config.actions} />
          </div>
        </div>
      </nav>

      {/* Responsive Mobile Drawer */}
      <MobileNavigation
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        config={config}
      />
    </>
  );
}
