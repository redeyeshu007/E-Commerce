import React from "react";
import { AnnouncementBar } from "./announcement-bar";
import { UtilityBar } from "./utility-bar";
import { MainNavbar } from "./main-navbar";
import { MobileBottomBar } from "./mobile-bottom-bar";
import { defaultNavigationConfig, type NavigationConfig } from "@/config/navigation";

export interface SiteHeaderProps {
  /**
   * Optional custom navigation configuration.
   * Defaults to defaultNavigationConfig.
   */
  config?: NavigationConfig;
  className?: string;
}

/**
 * Top-Level Storefront Header for JAVIX JEWELLERY.
 *
 * Reproduces the Alukas & Co reference design across desktop and mobile:
 *
 * Desktop:
 * 1. Announcement Bar — Soft pastel pink promotional banner (#FBC0CE) with centered text and dismiss X.
 * 2. Utility Bar — Top utility bar with English, ₹ Rupees (INR), promotional callout, and utility links.
 * 3. Main Navigation Bar — Left: "JAVIX", Centre: Home / Shop / Contact / New Arrivals, Right: Search / Account / Wishlist / Cart.
 *
 * Mobile:
 * 1. Top Navbar — Left: Hamburger Menu, Centre: "JAVIX" (centered), Right: Shopping Cart with "0" badge.
 * 2. Bottom Sticky Navigation Bar — Fixed at bottom with HOME, SEARCH, WISHLIST (with "0" badge), and ACCOUNT.
 */
export function SiteHeader({ config = defaultNavigationConfig, className = "" }: SiteHeaderProps) {
  return (
    <>
      <header className={`relative w-full z-30 bg-white text-black ${className}`} role="banner">
        {/* Row One: Announcement Bar */}
        <AnnouncementBar config={config.announcement} />

        {/* Row Two: Utility Bar */}
        <UtilityBar config={config.utility} />

        {/* Row Three: Main Navigation */}
        <MainNavbar config={config} />
      </header>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <MobileBottomBar config={config} />
    </>
  );
}
