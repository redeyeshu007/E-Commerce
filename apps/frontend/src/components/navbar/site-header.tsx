import React from "react";
import { AnnouncementBar } from "./announcement-bar";
import { UtilityBar } from "./utility-bar";
import { MainNavbar } from "./main-navbar";
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
 * Reproduces the Alukas & Co three-horizontal-row architecture:
 * 1. Announcement Bar — Soft pastel pink promotional banner (#FBC0CE) with centered text and dismiss X.
 * 2. Utility Bar — Top utility bar with English, ₹ Rupees (INR), promotional callout, and utility links.
 * 3. Main Navigation Bar — Left: "JAVIX", Centre: Home / Shop / Contact / New Arrivals, Right: Search / Account / Wishlist / Cart.
 *
 * Characteristics:
 * - Semantic <header> wrapper.
 * - Entirely configuration-driven for future backend / CMS integration.
 * - Zero dependency on fake backends or broken routes.
 */
export function SiteHeader({ config = defaultNavigationConfig, className = "" }: SiteHeaderProps) {
  return (
    <header className={`relative w-full z-30 bg-white text-black ${className}`} role="banner">
      {/* Row One: Announcement Bar */}
      <AnnouncementBar config={config.announcement} />

      {/* Row Two: Utility Bar */}
      <UtilityBar config={config.utility} />

      {/* Row Three: Main Navigation */}
      <MainNavbar config={config} />
    </header>
  );
}
