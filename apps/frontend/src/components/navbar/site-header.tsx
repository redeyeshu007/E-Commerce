"use client";

import React from "react";
import { AnnouncementBar } from "./announcement-bar";
import { UtilityBar } from "./utility-bar";
import { MainNavbar } from "./main-navbar";
import { MobileBottomBar } from "./mobile-bottom-bar";
import { AuthModal } from "@/components/auth";
import { SearchOverlay } from "@/components/search";
import { NewsletterPopup } from "@/components/newsletter";
import { useStorefront } from "@/providers/storefront-provider";
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
 * Top-Level Storefront Header for PERALAGAE.
 *
 * Reproduces the luxury header reference design across desktop and mobile:
 *
 * Desktop:
 * 1. Announcement Bar — Soft pastel pink promotional banner (#FBC0CE) with centered text and dismiss X.
 * 2. Utility Bar — Top utility bar with contact number, promotional callout, and utility links.
 * 3. Main Navigation Bar — Left: "PERALAGAE", Centre: Home / Shop / Contact / New Arrivals, Right: Search / Account / Wishlist / Cart.
 *
 * Mobile:
 * 1. Top Navbar — Left: Hamburger Menu, Centre: "PERALAGAE" (centered), Right: Shopping Cart with "0" badge.
 * 2. Bottom Sticky Navigation Bar — Fixed at bottom with HOME, SEARCH, WISHLIST (with "0" badge), and ACCOUNT.
 */
export function SiteHeader({ config = defaultNavigationConfig, className = "" }: SiteHeaderProps) {
  const storefront = useStorefront();

  return (
    <>
      <header className={`sticky top-0 w-full z-40 bg-white text-black ${className}`} role="banner">
        {/* Row One: Announcement Bar */}
        <AnnouncementBar config={config.announcement} />

        {/* Row Two: Utility Bar */}
        <UtilityBar config={config.utility} />

        {/* Row Three: Main Navigation */}
        <MainNavbar config={config} />
      </header>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <MobileBottomBar config={config} />

      {/* Premium Authentication Modal */}
      <AuthModal
        isOpen={storefront.isAuthModalOpen}
        onClose={storefront.closeAuthModal}
        initialView={storefront.authModalView}
      />

      {/* Premium Glass Search Overlay */}
      <SearchOverlay
        isOpen={storefront.isSearchOpen}
        onClose={storefront.closeSearch}
      />

      {/* Premium Newsletter Subscription Popup */}
      <NewsletterPopup
        isOpen={storefront.isNewsletterOpen}
        onClose={storefront.closeNewsletter}
      />
    </>
  );
}
