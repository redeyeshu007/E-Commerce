"use client";

import React from "react";
import Link from "next/link";
import { useStorefront } from "@/providers/storefront-provider";
import type { UtilityConfig, UtilityLinkItem } from "@/config/navigation";

export interface UtilityBarProps {
  config: UtilityConfig;
}

/**
 * Renders the right-side utility links (Find a Store, FAQs, Subscribe).
 * Handles unimplemented routes gracefully without dead links or broken 404 navigation.
 */
export function UtilityLinks({ links }: { links: UtilityLinkItem[] }) {
  const storefront = useStorefront();

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: UtilityLinkItem
  ) => {
    if (item.id === "subscribe") {
      e.preventDefault();
      storefront.openNewsletter();
      return;
    }

    const href = item.href;
    if (href && href.startsWith("/#") && typeof window !== "undefined") {
      const targetId = href.replace("/#", "");
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", href);
      }
    }
  };

  return (
    <ul
      className="flex items-center space-x-6 lg:space-x-8 text-xs lg:text-[13px] text-black"
      role="list"
    >
      {links.map((item) => (
        <li key={item.id}>
          {item.isImplemented && item.href ? (
            <Link
              href={item.href}
              data-testid={item.id === "subscribe" ? "navbar-subscribe-link" : undefined}
              onClick={(e) => handleLinkClick(e, item)}
              className="text-black transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
            >
              {item.label}
            </Link>
          ) : (
            <span
              className="cursor-default select-none text-black transition-opacity hover:opacity-75"
              title={`${item.label} (Coming Soon)`}
            >
              {item.label}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Row Two: Full-width utility information bar.
 *
 * Left group:
 * 1. Indian Phone Number (10 digits)
 * 2. Summer Sale 15% off! Shop Now!
 *
 * Right group:
 * - Find a Store, FAQs, Subscribe
 *
 * Style:
 * - Clean white background with subtle #E5E5E5 bottom border.
 * - Solid black typography with minimalist editorial spacing.
 */
export function UtilityBar({ config }: UtilityBarProps) {
  return (
    <div
      className="hidden lg:block w-full border-b border-[#E5E5E5] bg-white text-xs lg:text-[13px] text-black"
      role="region"
      aria-label="Utility navigation and store information"
    >
      <div className="mx-auto flex h-10 lg:h-12 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left group */}
        <div className="flex items-center space-x-4 sm:space-x-5 lg:space-x-6 overflow-x-auto no-scrollbar py-1">
          {/* 1. Indian Phone Number (10 digits) */}
          <a
            href={config.phoneHref ?? "tel:+919876543210"}
            className="whitespace-nowrap font-normal text-black transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
          >
            {config.phone ?? "+91 98765 43210"}
          </a>

          <span
            className="h-3 lg:h-3.5 w-px bg-[#E5E5E5] inline-block"
            aria-hidden="true"
          />

          {/* 2. Promotional info */}
          <span className="whitespace-nowrap text-black inline-block">
            {config.promotion.text}{" "}
            {config.promotion.linkText && (
              <span className="font-semibold text-black transition-opacity hover:underline hover:opacity-75 cursor-pointer">
                {config.promotion.linkText}
              </span>
            )}
          </span>
        </div>

        {/* Right group (Desktop) */}
        <div className="hidden lg:flex items-center">
          <UtilityLinks links={config.links} />
        </div>
      </div>
    </div>
  );
}
