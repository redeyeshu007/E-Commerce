import React from "react";
import Link from "next/link";
import type { UtilityConfig, UtilityLinkItem } from "@/config/navigation";

export interface UtilityBarProps {
  config: UtilityConfig;
}

/**
 * Renders the right-side utility links (Store Location, Services, Subscribe, Gift Cards).
 * Handles unimplemented routes gracefully without dead links or broken 404 navigation.
 */
export function UtilityLinks({ links }: { links: UtilityLinkItem[] }) {
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
 * 1. English (static, no dropdown)
 * 2. ₹ Rupees (INR) (static, no dropdown, Indian rupee symbol strictly)
 * 3. Summer Sale 15% off! Shop Now!
 *
 * Right group:
 * - Store Location, Services, Subscribe, Gift Cards
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
          {/* 1. Language (English only, static) */}
          <span className="whitespace-nowrap font-normal text-black">{config.language}</span>

          <span className="h-3 lg:h-3.5 w-px bg-[#E5E5E5]" aria-hidden="true" />

          {/* 2. Currency (₹ Rupees INR only, static) */}
          <span className="whitespace-nowrap font-normal text-black">
            <span className="font-sans font-medium">{config.currencySymbol}</span> {config.currency}
          </span>

          <span
            className="hidden h-3 lg:h-3.5 w-px bg-[#E5E5E5] sm:inline-block"
            aria-hidden="true"
          />

          {/* 3. Promotional info */}
          <span className="hidden whitespace-nowrap text-black sm:inline-block">
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
