"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./product-card";
import { ProductQuickView } from "./product-quick-view";
import type { Product } from "@/types/product";
import {
  type NewCollectionConfig,
  defaultNewCollectionConfig,
} from "@/config/new-collection";
import { useStorefront } from "@/providers/storefront-provider";

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!mediaQuery.addEventListener) return () => {};
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

function subscribeMobile(callback: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const mediaQuery = window.matchMedia("(max-width: 639px)");
  if (!mediaQuery.addEventListener) return () => {};
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getMobileSnapshot() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(max-width: 639px)").matches;
}

function getMobileServerSnapshot() {
  return false;
}

export interface NewCollectionSectionProps {
  config?: NewCollectionConfig;
  className?: string;
}

/**
 * NewCollectionSection Component — PERALAGAE
 *
 * Implements:
 * 1. Centred Section Header with flanking subtle divider lines and subtitle (stacked on mobile)
 * 2. Product Carousel displaying 2 products on mobile, 4 on desktop
 * 3. 10-second automatic rotation with pause-on-hover & touch swipe support
 * 4. Minimalist Previous & Next arrow controls (desktop) and circular pagination dots (matching reference)
 * 5. Full keyboard navigation and reduced-motion compliance
 * 6. Quick View modal integration
 */
export function NewCollectionSection({
  config = defaultNewCollectionConfig,
  className = "",
}: NewCollectionSectionProps) {
  const { quickViewProduct, closeQuickView } = useStorefront();
  const [currentPage, setCurrentPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const isMobile = useSyncExternalStore(
    subscribeMobile,
    getMobileSnapshot,
    getMobileServerSnapshot,
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const { products, heading, subtitle, autoRotateIntervalMs = 10000 } = config;
  const headingWords = heading.split(" ");
  const firstHeadingPart = headingWords[0] ?? "New";
  const secondHeadingPart = headingWords.slice(1).join(" ") || "Collection";

  // On mobile (<640px): 2 items per page (4 pages for 8 items, matching reference screenshot)
  // On tablet & desktop (>=640px): 4 items per page (2 pages for 8 items)
  const itemsPerPage = isMobile ? 2 : 4;
  const pages = useMemo(() => {
    const chunks: Product[][] = [];
    for (let i = 0; i < products.length; i += itemsPerPage) {
      chunks.push(products.slice(i, i + itemsPerPage));
    }
    return chunks;
  }, [products, itemsPerPage]);

  const totalPages = pages.length;
  const activePage = currentPage >= totalPages ? 0 : currentPage;

  const goToNextPage = useCallback(() => {
    if (totalPages <= 1) return;
    setCurrentPage((prev) => (prev + 1) % totalPages);
  }, [totalPages]);

  const goToPrevPage = useCallback(() => {
    if (totalPages <= 1) return;
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  }, [totalPages]);

  // 10-second automatic rotation timer
  useEffect(() => {
    if (reducedMotion || totalPages <= 1 || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      goToNextPage();
    }, autoRotateIntervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [goToNextPage, totalPages, isPaused, reducedMotion, autoRotateIntervalMs]);

  // Pause timer on hover and focus
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);
  const handleFocus = () => setIsPaused(true);
  const handleBlur = (e: React.FocusEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsPaused(false);
    }
  };

  // Keyboard navigation for arrow keys
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      goToPrevPage();
    } else if (e.key === "ArrowRight") {
      goToNextPage();
    }
  };

  // Touch swipe handlers for smooth mobile swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 45) {
      goToNextPage();
    } else if (distance < -45) {
      goToPrevPage();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section
      ref={containerRef}
      id="new-collection"
      aria-labelledby="new-collection-heading"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full overflow-hidden bg-white pt-10 sm:pt-16 lg:pt-20 pb-14 sm:pb-20 lg:pb-24 scroll-mt-24 sm:scroll-mt-28 ${className}`}
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        {/* 1. SECTION HEADER: Centred heading with flanking horizontal lines and subtitle */}
        <div className="flex flex-col items-center justify-center text-center mb-7 sm:mb-12 lg:mb-14">
          <div className="flex items-center justify-center w-full gap-3 sm:gap-6">
            <span
              className="h-[1px] w-8 sm:w-20 lg:w-28 bg-[#D8D8D8]"
              aria-hidden="true"
            />
            <h2
              id="new-collection-heading"
              className="text-2xl sm:text-3xl lg:text-[32px] font-normal tracking-[-0.01em] text-[#111111] leading-[1.2] px-2 text-center"
            >
              <span className="block sm:inline">{firstHeadingPart} </span>
              {headingWords.length > 1 && (
                <span className="block sm:inline">{secondHeadingPart}</span>
              )}
            </h2>
            <span
              className="h-[1px] w-8 sm:w-20 lg:w-28 bg-[#D8D8D8]"
              aria-hidden="true"
            />
          </div>

          {subtitle && (
            <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm text-[#666666] font-normal tracking-normal max-w-[280px] sm:max-w-md mx-auto text-center leading-relaxed">
              Collect your loves with our newest<br className="sm:hidden" /> arrivals.
            </p>
          )}
        </div>

        {/* 2. PRODUCT CAROUSEL WRAPPER WITH NAVIGATION ARROWS */}
        <div className="relative group/carousel">
          {/* Previous Arrow Button (Desktop & Tablet) */}
          {totalPages > 1 && (
            <button
              type="button"
              onClick={goToPrevPage}
              aria-label="Previous products"
              suppressHydrationWarning
              className="hidden sm:flex absolute -left-3 sm:-left-5 lg:-left-6 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white text-[#222222] shadow-md border border-neutral-100 transition-all duration-200 hover:bg-black hover:text-white hover:border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              <ChevronLeft className="h-5 w-5 stroke-[1.5]" aria-hidden="true" />
            </button>
          )}

          {/* Next Arrow Button (Desktop & Tablet) */}
          {totalPages > 1 && (
            <button
              type="button"
              onClick={goToNextPage}
              aria-label="Next products"
              suppressHydrationWarning
              className="hidden sm:flex absolute -right-3 sm:-right-5 lg:-right-6 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white text-[#222222] shadow-md border border-neutral-100 transition-all duration-200 hover:bg-black hover:text-white hover:border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              <ChevronRight className="h-5 w-5 stroke-[1.5]" aria-hidden="true" />
            </button>
          )}

          {/* Carousel Viewport Container */}
          <div className="overflow-hidden w-full">
            <div
              className={`flex ${
                reducedMotion ? "" : "transition-transform duration-700 ease-in-out"
              }`}
              style={{ transform: `translateX(-${activePage * 100}%)` }}
            >
              {pages.map((pageProducts, pageIdx) => (
                <div
                  key={`page-${pageIdx}`}
                  className="w-full shrink-0"
                  aria-hidden={pageIdx !== activePage}
                >
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
                    {pageProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. PAGINATION DOTS: Clean circular indicators matching reference */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-center gap-2 sm:gap-2.5 mt-7 sm:mt-10"
            role="tablist"
            aria-label="Product carousel pages"
          >
            {pages.map((_, idx) => (
              <button
                key={`dot-${idx}`}
                type="button"
                role="tab"
                aria-selected={idx === activePage}
                aria-label={`Go to carousel page ${idx + 1}`}
                onClick={() => setCurrentPage(idx)}
                suppressHydrationWarning
                className={`h-2 w-2 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                  idx === activePage
                    ? "bg-[#222222] border border-[#222222]"
                    : "bg-white border border-[#888888] hover:border-black"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 4. ACCESSIBLE PRODUCT QUICK VIEW DIALOG */}
      <ProductQuickView
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={closeQuickView}
      />
    </section>
  );
}
