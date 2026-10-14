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
import { usePathname } from "next/navigation";
import { defaultNavigationConfig, type NavigationConfig } from "@/config/navigation";

export interface SiteHeaderProps {
  /**
   * Optional custom navigation configuration.
   * Defaults to defaultNavigationConfig.
   */
  config?: NavigationConfig;
  className?: string;
}

export function SiteHeader({ config = defaultNavigationConfig, className = "" }: SiteHeaderProps) {
  const storefront = useStorefront();
  let pathname = "/";
  try {
    const p = usePathname();
    if (p) pathname = p;
  } catch {
    pathname = "/";
  }

  if (pathname.startsWith("/admin")) {
    return null;
  }

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
