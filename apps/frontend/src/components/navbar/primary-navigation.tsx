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

  const [activeHash, setActiveHash] = React.useState<string>("");

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const updateHash = () => {
      setActiveHash(window.location.hash || "");
    };

    updateHash();
    window.addEventListener("hashchange", updateHash);
    window.addEventListener("popstate", updateHash);

    // Scroll listener on homepage: if user scrolls back to the very top, revert active item to Home
    const handleScroll = () => {
      if (routerPath === "/" && window.scrollY < 200) {
        if (
          window.location.hash === "#new-arrivals" ||
          window.location.hash === "#new-collection"
        ) {
          window.history.replaceState(null, "", window.location.pathname);
          setActiveHash("");
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("hashchange", updateHash);
      window.removeEventListener("popstate", updateHash);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [routerPath]);

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href?: string
  ) => {
    if (href?.startsWith("/#") && typeof window !== "undefined") {
      const targetId = href.replace("/#", "");
      const targetElement = document.getElementById(targetId);

      // If already on the homepage where target exists, smoothly scroll
      if (targetElement) {
        e.preventDefault();
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        targetElement.scrollIntoView({
          behavior: prefersReduced ? "auto" : "smooth",
          block: "start",
        });
        window.history.pushState(null, "", href);
        setActiveHash(`#${targetId}`);
      }
    } else if (href === "/" && routerPath === "/" && typeof window !== "undefined") {
      // If clicking Home while on homepage with an active section hash, scroll to top
      if (window.location.hash) {
        e.preventDefault();
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({
          top: 0,
          behavior: prefersReduced ? "auto" : "smooth",
        });
        window.history.pushState(null, "", "/");
        setActiveHash("");
      }
    }

    onItemClick?.();
  };

  const isItemActive = (href?: string) => {
    if (!href) return false;

    // 1. Explicit path override passed (unit testing or specific routing harness)
    if (currentPath) {
      if (href === "/#new-arrivals") {
        return (
          currentPath === "/#new-arrivals" ||
          currentPath === "#new-arrivals" ||
          currentPath === "/new-arrivals"
        );
      }
      if (href === "/") {
        return currentPath === "/" && !currentPath.includes("#");
      }
      const cleanHref = href.split("?")[0].split("#")[0];
      return currentPath === cleanHref || currentPath.startsWith(`${cleanHref}/`);
    }

    // 2. Runtime route & hash matching
    const onHomepage = routerPath === "/";

    if (href === "/#new-arrivals") {
      return onHomepage && (activeHash === "#new-arrivals" || activeHash === "#new-collection");
    }

    if (href === "/") {
      return onHomepage && activeHash !== "#new-arrivals" && activeHash !== "#new-collection";
    }

    const cleanHref = href.split("?")[0].split("#")[0];
    return routerPath === cleanHref || routerPath.startsWith(`${cleanHref}/`);
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
                onClick={(e) => handleLinkClick(e, item.href)}
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
