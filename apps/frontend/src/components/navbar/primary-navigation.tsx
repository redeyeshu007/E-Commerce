"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PrimaryNavItem } from "@/config/navigation";

export interface PrimaryNavigationProps {
  items: PrimaryNavItem[];
  className?: string;
  onItemClick?: () => void;
  /** Optional override for active path (useful for testing or custom router environments) */
  currentPath?: string;
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
 * Implements PERALAGAE luxury brand navigation:
 * - Subtle, elegant hover state: text transitions to champagne gold (#C5A572) and a refined
 *   thin underline expands smoothly from left to right directly beneath the text.
 * - Route-aware active state: current route maintains permanent champagne gold underline and
 *   accent color across page reloads and direct visits.
 * - Non-destructive hover interaction: active underline stays visible when hovered or when
 *   moving between navigation items without duplicate borders or flickering.
 * - Semantic accessibility: semantic HTML links, :focus-visible rings, aria-current="page",
 *   and prefers-reduced-motion compatibility.
 */
export function PrimaryNavigation({
  items,
  className = "",
  onItemClick,
  currentPath,
}: PrimaryNavigationProps) {
  let routerPath = "";
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const hookPath = usePathname();
    if (hookPath) {
      routerPath = hookPath;
    }
  } catch {
    // Fallback for non-router environments (e.g. unit tests without router context)
    routerPath = "/";
  }

  const activePath = currentPath ?? routerPath ?? "/";

  const isItemActive = (href?: string) => {
    if (!activePath || !href) return false;
    const cleanHref = href.split("?")[0].split("#")[0];
    if (cleanHref === "/") {
      return activePath === "/";
    }
    return activePath === cleanHref || activePath.startsWith(`${cleanHref}/`);
  };

  return (
    <nav aria-label="Main Navigation" className={className}>
      <ul className="flex items-center space-x-8 lg:space-x-14" role="list">
        {items.map((item) => {
          const isActive = isItemActive(item.href);

          return (
            <li key={item.id} className="relative flex items-center">
              <Link
                href={item.href || "#"}
                onClick={onItemClick}
                aria-current={isActive ? "page" : undefined}
                className={`peralagae-nav-link group relative inline-flex items-center py-2 text-sm lg:text-[15px] font-medium tracking-[0.05em] transition-colors duration-250 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A572] focus-visible:ring-offset-2 rounded-sm ${
                  isActive ? "active text-[#C5A572]" : "text-[#222222] hover:text-[#C5A572]"
                }`}
              >
                <span className="relative inline-block">
                  {item.label}
                  {/* Refined Champagne Gold Underline */}
                  <span
                    className={`peralagae-nav-underline absolute -bottom-1 left-0 h-[1.5px] w-full bg-[#C5A572] origin-left transition-all duration-300 ease-out motion-reduce:transition-none pointer-events-none ${
                      isActive
                        ? "scale-x-100 opacity-100"
                        : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100 group-focus-visible:scale-x-100 group-focus-visible:opacity-100"
                    }`}
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
