"use client";

import React from "react";
import Link from "next/link";
import { Store } from "lucide-react";
import {
  type StoreLocatorBannerConfig,
  defaultStoreLocatorConfig,
} from "@/config/store-locator";

export interface StoreLocatorBannerProps {
  /**
   * Banner configuration parameters.
   * Defaults to defaultStoreLocatorConfig.
   */
  config?: StoreLocatorBannerConfig;

  /**
   * Optional container className override.
   */
  className?: string;

  /**
   * Optional custom click handler for the Find Store button.
   */
  onButtonClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * StoreLocatorBanner Component — JAVIX JEWELLERY
 *
 * Implements the "Find Jewelry Shops Near You" spacious horizontal banner
 * positioned directly below the New Collection carousel.
 *
 * Visual Specifications:
 * - Content group centered horizontally & vertically.
 * - Soft pastel lavender-pink background (#F8E8F8).
 * - Simple outline storefront icon on the left (dark charcoal #111111).
 * - Heading: "Find Jewelry Shops Near You" (editorial sans/serif, dark charcoal).
 * - Rectangular outline button: "Find Store" (thin dark charcoal border, transparent bg).
 * - Fully responsive: single horizontal line on desktop; elegant stacked wrapping on mobile.
 */
export function StoreLocatorBanner({
  config = defaultStoreLocatorConfig,
  className = "",
  onButtonClick,
}: StoreLocatorBannerProps) {
  return (
    <section
      id="store-locator"
      aria-labelledby="store-locator-heading"
      data-testid="store-locator-section"
      className={`w-full bg-white pb-14 sm:pb-20 lg:pb-24 ${className}`}
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div
          data-testid="store-locator-banner"
          className="w-full py-8 sm:py-10 md:py-12 lg:py-14 px-6 sm:px-10 lg:px-16 transition-colors"
          style={{ backgroundColor: config.backgroundColor }}
        >
          {/* Centred horizontal content group on desktop, stacking gracefully on mobile */}
          <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left gap-4 sm:gap-6 md:gap-8 lg:gap-10">
            {/* Store Icon + Heading Group */}
            <div className="flex items-center justify-center gap-3 sm:gap-3.5 md:gap-4 shrink-0">
              <Store
                data-testid="store-locator-icon"
                className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 shrink-0 stroke-[1.5]"
                style={{ color: config.textColor }}
                aria-hidden="true"
              />
              <h2
                id="store-locator-heading"
                className="text-lg sm:text-xl md:text-2xl lg:text-[26px] font-normal tracking-[-0.01em] leading-tight"
                style={{ color: config.textColor }}
              >
                {config.heading}
              </h2>
            </div>

            {/* Rectangular Outline CTA Button */}
            <Link
              href={config.buttonHref}
              onClick={onButtonClick}
              data-testid="store-locator-cta"
              className="inline-flex items-center justify-center border border-[#111111] bg-transparent px-6 py-2.5 sm:px-7 sm:py-3 text-xs sm:text-[13px] font-medium tracking-[0.06em] uppercase whitespace-nowrap text-[#111111] transition-colors duration-200 hover:bg-[#111111] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              title={
                config.isImplemented
                  ? config.buttonLabel
                  : `${config.buttonLabel} (Pending Catalogue Integration)`
              }
              aria-label={`${config.buttonLabel}: ${config.heading}`}
            >
              {config.buttonLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
