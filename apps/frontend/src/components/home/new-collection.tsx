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

export interface NewCollectionSectionProps {
  config?: NewCollectionConfig;
  className?: string;
}

/**
 * NewCollectionSection Component — JAVIX JEWELLERY
 *
 * Implements:
 * 1. Centred Section Header with flanking subtle divider lines and subtitle
 * 2. Product Carousel displaying 4 products at a time on desktop (8 configured products across 2 pages)
 * 3. 10-second automatic rotation with pause-on-hover & focus handling
 * 4. Minimalist Previous & Next arrow controls and pagination indicator dots
 * 5. Full keyboard navigation and reduced-motion compliance
 * 6. Quick View modal integration
 */
export function NewCollectionSection({
  config = defaultNewCollectionConfig,
  className = "",
}: NewCollectionSectionProps) {
  const { quickViewProduct, closeQuickView, openQuickView } = useStorefront();
  const [currentPage, setCurrentPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { products, heading, subtitle, autoRotateIntervalMs = 10000 } = config;

  // Chunk products into groups of 4 for desktop 4-per-page display
  const itemsPerPage = 4;
  const pages = useMemo(() => {
    const chunks: Product[][] = [];
    for (let i = 0; i < products.length; i += itemsPerPage) {
      chunks.push(products.slice(i, i + itemsPerPage));
    }
    return chunks;
  }, [products]);

  const totalPages = pages.length;

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
    // Disable auto-rotation if reduced motion is preferred, only 1 page, or currently paused
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
    // Only resume if focus left the entire section container
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

  return (
    <section
      ref={containerRef}
      aria-labelledby="new-collection-heading"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`relative w-full overflow-hidden bg-white pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-20 lg:pb-24 ${className}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 1. SECTION HEADER: Centred heading with flanking horizontal lines and subtitle */}
        <div className="flex flex-col items-center justify-center text-center mb-10 sm:mb-12 lg:mb-14">
          <div className="flex items-center justify-center w-full gap-4 sm:gap-6">
            <span
              className="h-[1px] w-12 sm:w-20 lg:w-28 bg-[#D8D8D8]"
              aria-hidden="true"
            />
            <h2
              id="new-collection-heading"
              className="text-2xl sm:text-3xl lg:text-[32px] font-normal tracking-[-0.01em] text-[#111111] leading-tight px-2 whitespace-nowrap"
            >
              {heading}
            </h2>
            <span
              className="h-[1px] w-12 sm:w-20 lg:w-28 bg-[#D8D8D8]"
              aria-hidden="true"
            />
          </div>

          {subtitle && (
            <p className="mt-2.5 text-xs sm:text-sm text-[#666666] font-normal tracking-normal max-w-md">
              {subtitle}
            </p>
          )}
        </div>

        {/* 2. PRODUCT CAROUSEL WRAPPER WITH NAVIGATION ARROWS */}
        <div className="relative group/carousel">
          {/* Previous Arrow Button */}
          {totalPages > 1 && (
            <button
              type="button"
              onClick={goToPrevPage}
              aria-label="Previous products"
              className="absolute left-1 sm:-left-5 lg:-left-6 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white text-[#222222] shadow-md border border-neutral-100 transition-all duration-200 hover:bg-black hover:text-white hover:border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              <ChevronLeft className="h-5 w-5 stroke-[1.5]" aria-hidden="true" />
            </button>
          )}

          {/* Next Arrow Button */}
          {totalPages > 1 && (
            <button
              type="button"
              onClick={goToNextPage}
              aria-label="Next products"
              className="absolute right-1 sm:-right-5 lg:-right-6 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white text-[#222222] shadow-md border border-neutral-100 transition-all duration-200 hover:bg-black hover:text-white hover:border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
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
              style={{ transform: `translateX(-${currentPage * 100}%)` }}
            >
              {pages.map((pageProducts, pageIdx) => (
                <div
                  key={`page-${pageIdx}`}
                  className="w-full shrink-0"
                  aria-hidden={pageIdx !== currentPage}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
                    {pageProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onQuickView={openQuickView}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. PAGINATION DOTS */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-center gap-2 mt-8 sm:mt-10"
            role="tablist"
            aria-label="Product carousel pages"
          >
            {pages.map((_, idx) => (
              <button
                key={`dot-${idx}`}
                type="button"
                role="tab"
                aria-selected={idx === currentPage}
                aria-label={`Go to carousel page ${idx + 1}`}
                onClick={() => setCurrentPage(idx)}
                className={`transition-all duration-300 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                  idx === currentPage
                    ? "w-6 h-1.5 bg-[#111111]"
                    : "w-1.5 h-1.5 bg-[#D1D5DB] hover:bg-[#9CA3AF]"
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
