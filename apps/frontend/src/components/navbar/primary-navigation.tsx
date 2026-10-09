import React from "react";
import Link from "next/link";
import type { PrimaryNavItem } from "@/config/navigation";

export interface PrimaryNavigationProps {
  items: PrimaryNavItem[];
  className?: string;
  onItemClick?: () => void;
}

/**
 * Centre Group: Primary desktop navigation menu.
 *
 * Displays exactly:
 * 1. Home
 * 2. Shop
 * 3. Contact
 * 4. New Arrivals
 *
 * Designed with editorial luxury proportions, balanced spacing, and semantic HTML.
 * Handles un-implemented routes safely without broken 404 links.
 */
export function PrimaryNavigation({ items, className = "", onItemClick }: PrimaryNavigationProps) {
  return (
    <nav aria-label="Main Navigation" className={className}>
      <ul className="flex items-center space-x-8 lg:space-x-14" role="list">
        {items.map((item) => (
          <li key={item.id}>
            {item.isImplemented && item.href ? (
              <Link
                href={item.href}
                onClick={onItemClick}
                className="relative py-2 text-sm lg:text-[15px] font-medium tracking-[0.05em] text-[#222222] transition-colors hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="relative py-2 text-sm lg:text-[15px] font-medium tracking-[0.05em] text-[#222222] transition-colors hover:text-black cursor-default select-none"
                title={`${item.label} (Coming Soon)`}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
