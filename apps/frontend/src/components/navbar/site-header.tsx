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
import { useNavbarSettings } from "@/services/navbar-settings-service";

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
  const { data: dynamicNavbar, isLoading } = useNavbarSettings();

  let pathname = "/";
  try {
    const p = usePathname();
    if (p) pathname = p;
  } catch {
    pathname = "/";
  }

  const announcementConfig = React.useMemo(() => {
    if (!dynamicNavbar?.topBar) return config.announcement;
    return {
      text: dynamicNavbar.topBar.text,
      backgroundColor: dynamicNavbar.topBar.backgroundColor || config.announcement.backgroundColor,
      textColor: dynamicNavbar.topBar.textColor || config.announcement.textColor,
      dismissible: dynamicNavbar.topBar.dismissible,
    };
  }, [dynamicNavbar?.topBar, config.announcement]);

  const isPromoLoading = isLoading || !dynamicNavbar?.secondNavbar;

  const utilityConfig = React.useMemo(() => {
    const sec = dynamicNavbar?.secondNavbar;
    return {
      ...config.utility,
      phone: sec?.phone ?? config.utility.phone,
      phoneHref: sec?.phoneHref || config.utility.phoneHref,
      promotion: {
        text: sec?.promoText ?? "",
        linkText: sec?.ctaText ?? (isPromoLoading ? "" : config.utility.promotion.linkText),
        href: sec?.ctaHref || config.utility.promotion.href,
        isLoading: isPromoLoading,
      },
      links: sec?.links
        ? sec.links.map((link) => ({
            id: link.id,
            label: link.label,
            href: link.href,
            isImplemented: link.isImplemented,
          }))
        : config.utility.links,
      showPhone: sec ? sec.showPhone : (config.utility.showPhone ?? true),
      showPromotion: sec ? sec.showPromotion : (config.utility.showPromotion ?? true),
      showLinks: sec ? sec.showLinks : (config.utility.showLinks ?? true),
    };
  }, [dynamicNavbar?.secondNavbar, isPromoLoading, config.utility]);

  const showTopBar = dynamicNavbar?.topBar?.visible ?? true;

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <header className={`relative w-full z-30 bg-white text-black ${className}`} role="banner">
        {/* Row One: Announcement Bar */}
        {showTopBar && <AnnouncementBar config={announcementConfig} />}

        {/* Row Two: Utility Bar */}
        <UtilityBar config={utilityConfig} />

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
