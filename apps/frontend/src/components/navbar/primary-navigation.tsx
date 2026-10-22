"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { PrimaryNavItem } from "@/config/navigation";
import {
  scrollToSectionId,
  scrollToTop,
  isProgrammaticScrollActive,
} from "@/lib/navigation";

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
 * Displays:
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
  const pathname = usePathname();
  const router = useRouter();
  const routerPath = currentPath
    ? currentPath.split("?")[0].split("#")[0] || "/"
    : pathname || "/";

  const [activeHash, setActiveHash] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.location.hash || "";
    }
    return "";
  });

  // Synchronize hash with browser location and route changes
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const updateHash = () => {
      setActiveHash(window.location.hash || "");
    };

    updateHash();
    const raf = requestAnimationFrame(updateHash);
    const timeout = setTimeout(updateHash, 60);

    window.addEventListener("hashchange", updateHash);
    window.addEventListener("popstate", updateHash);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
      window.removeEventListener("hashchange", updateHash);
      window.removeEventListener("popstate", updateHash);
    };
  }, [routerPath]);

  // Scroll spy & intersection observer on homepage
  React.useEffect(() => {
    if (typeof window === "undefined" || routerPath !== "/") return;

    const newArrivalsEl = document.getElementById("new-arrivals");
    let observer: IntersectionObserver | null = null;

    if (newArrivalsEl && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          if (isProgrammaticScrollActive()) return;

          for (const entry of entries) {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
              setActiveHash("#new-arrivals");
            }
          }
        },
        { threshold: [0.25, 0.5] }
      );
      observer.observe(newArrivalsEl);
    }

    const handleScroll = () => {
      if (isProgrammaticScrollActive()) return;

      if (window.scrollY < 150) {
        if (
          window.location.hash === "#new-arrivals" ||
          window.location.hash === "#new-collection"
        ) {
          window.history.replaceState(window.history.state, "", window.location.pathname);
          setActiveHash("");
        } else if (activeHash) {
          setActiveHash("");
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [routerPath, activeHash]);

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href?: string
  ) => {
    if (!href) {
      onItemClick?.();
      return;
    }

    if (href.startsWith("/#") && typeof window !== "undefined") {
      const targetId = href.replace("/#", "");

      if (routerPath === "/") {
        e.preventDefault();
        scrollToSectionId(targetId);
        setActiveHash(`#${targetId}`);
      } else {
        e.preventDefault();
        setActiveHash(`#${targetId}`);
        router.push(href);
      }
    } else if (href === "/" && routerPath === "/" && typeof window !== "undefined") {
      if (window.location.hash || window.scrollY > 50) {
        e.preventDefault();
        scrollToTop();
        setActiveHash("");
      }
    } else if (href.startsWith("/")) {
      setActiveHash("");
    }

    onItemClick?.();
  };

  const isItemActive = (href?: string, _itemId?: string) => {
    if (!href) return false;

    // 1. Explicit path override passed (unit testing or specific routing harness)
    if (currentPath) {
      if (href === "/#new-arrivals" || href === "/#new-collection") {
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

    if (href === "/#new-arrivals" || href === "/#new-collection") {
      return onHomepage && (activeHash === "#new-arrivals" || activeHash === "#new-collection");
    }

    if (href === "/") {
      return onHomepage && activeHash !== "#new-arrivals" && activeHash !== "#new-collection";
    }

    const cleanHref = href.split("?")[0].split("#")[0];
    return routerPath === cleanHref || routerPath.startsWith(`${cleanHref}/`);
  };

  const navItems = items.filter(
    (item) => item.id !== "materials" && item.label.toLowerCase() !== "materials"
  );

  return (
    <nav aria-label="Main Navigation" className={className}>
      <ul className="flex items-center space-x-8 lg:space-x-14" role="list">
        {navItems.map((item) => {
          const isActive = isItemActive(item.href, item.id);

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
