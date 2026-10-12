"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useSyncExternalStore,
} from "react";
import type {
  CustomerReviewsSectionConfig,
  ReviewItem,
} from "@/config/reviews";
import { defaultReviewsConfig } from "@/config/reviews";

/* -------------------------------------------------------------------------
 * Responsive Breakpoint & Motion Subscriptions
 * ------------------------------------------------------------------------- */

function subscribeBreakpoint(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getBreakpointSnapshot(): number {
  if (typeof window === "undefined") return 3;
  if (window.innerWidth < 640) return 1;
  if (window.innerWidth < 1024) return 2;
  return 3;
}

function getBreakpointServerSnapshot(): number {
  return 3;
}

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

/* -------------------------------------------------------------------------
 * Component: StarRating
 * ------------------------------------------------------------------------- */

export interface StarRatingProps {
  rating: number;
  maxStars?: number;
  starColor?: string;
  className?: string;
}

export function StarRating({
  rating,
  maxStars = 5,
  starColor = "#D4A373",
  className = "",
}: StarRatingProps) {
  return (
    <div
      className={`flex items-center gap-1 ${className}`}
      aria-label={`Rated ${rating} out of ${maxStars} stars`}
      role="img"
    >
      <span className="sr-only">Rated {rating} out of {maxStars} stars</span>
      {Array.from({ length: maxStars }).map((_, i) => {
        const isFilled = i < rating;
        return (
          <svg
            key={i}
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-colors"
            viewBox="0 0 20 20"
            fill={isFilled ? starColor : "#E5E7EB"}
            aria-hidden="true"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Component: ReviewCard
 * ------------------------------------------------------------------------- */

export interface ReviewCardProps {
  review: ReviewItem;
  starColor?: string;
  className?: string;
}

export function ReviewCard({
  review,
  starColor = "#D4A373",
  className = "",
}: ReviewCardProps) {
  return (
    <article
      data-testid={`review-card-${review.id}`}
      className={`bg-white rounded-none p-6 sm:p-7 md:p-8 flex flex-col justify-between h-full border border-black/[0.04] shadow-none transition-shadow duration-300 hover:shadow-sm ${className}`}
    >
      <div>
        {/* Circular dark quotation-mark icon near upper-left */}
        <div
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#111111] text-white flex items-center justify-center shrink-0 mb-5"
          aria-hidden="true"
        >
          <svg
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
        </div>

        {/* Bold review headline */}
        <h3 className="font-semibold text-base sm:text-[17px] text-[#111111] leading-snug mb-2.5">
          {review.headline}
        </h3>

        {/* Short jewellery-specific review */}
        <p className="text-xs sm:text-[13px] md:text-sm text-[#555555] leading-relaxed">
          {review.reviewText}
        </p>
      </div>

      {/* Bottom row: Indian customer name (left) & Star rating (right) */}
      <div className="flex items-center justify-between pt-5 mt-6 border-t border-neutral-100">
        <span className="text-xs sm:text-[13px] font-medium text-[#111111]">
          {review.authorName}
        </span>
        <StarRating rating={review.rating} starColor={starColor} />
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------
 * Component: ReviewPagination
 * ------------------------------------------------------------------------- */

export interface ReviewPaginationProps {
  totalPages: number;
  activePage: number;
  onPageSelect: (pageIndex: number) => void;
  className?: string;
}

export function ReviewPagination({
  totalPages,
  activePage,
  onPageSelect,
  className = "",
}: ReviewPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div
      className={`flex items-center justify-center gap-2 sm:gap-2.5 mt-8 sm:mt-12 ${className}`}
      role="tablist"
      aria-label="Customer reviews pages"
    >
      {Array.from({ length: totalPages }).map((_, idx) => (
        <button
          key={`review-dot-${idx}`}
          type="button"
          role="tab"
          aria-selected={idx === activePage}
          aria-label={`Go to review page ${idx + 1}`}
          onClick={() => onPageSelect(idx)}
          className={`h-2 w-2 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
            idx === activePage
              ? "bg-[#222222] border border-[#222222]"
              : "bg-white border border-[#888888] hover:border-black"
          }`}
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Component: CustomerReviewsSection
 * ------------------------------------------------------------------------- */

export interface CustomerReviewsSectionProps {
  config?: CustomerReviewsSectionConfig;
  className?: string;
}

/**
 * CustomerReviewsSection Component — JAVIX JEWELLERY
 *
 * Implements:
 * 1. Exact Section Heading: "Customer Reviews" (centred, elegant dark charcoal)
 * 2. Soft muted blush-grey background (#F0E5E4) with subtle CSS concentric circles
 * 3. Review carousel presenting 3 cards on desktop, 2 on tablet, 1 on mobile
 * 4. Pure white minimal cards with quotation badge, headline, body, customer name, and 5-star rating
 * 5. Accessible pagination dots and keyboard arrow navigation
 */
export function CustomerReviewsSection({
  config = defaultReviewsConfig,
  className = "",
}: CustomerReviewsSectionProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const itemsPerPage = useSyncExternalStore(
    subscribeBreakpoint,
    getBreakpointSnapshot,
    getBreakpointServerSnapshot
  );

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const {
    heading = "Customer Reviews",
    backgroundColor = "#F0E5E4",
    starColor = "#D4A373",
    reviews = [],
    autoRotate = true,
    autoRotateIntervalMs = 5000,
  } = config;

  // Split reviews into pages based on responsive itemsPerPage
  const pages = useMemo(() => {
    if (!reviews || reviews.length === 0) return [];
    const chunks: ReviewItem[][] = [];
    for (let i = 0; i < reviews.length; i += itemsPerPage) {
      chunks.push(reviews.slice(i, i + itemsPerPage));
    }
    return chunks;
  }, [reviews, itemsPerPage]);

  const totalPages = pages.length;
  const activePage = Math.min(currentPage, Math.max(0, totalPages - 1));

  const goToNextPage = useCallback(() => {
    if (totalPages <= 1) return;
    setCurrentPage((prev) => (prev + 1) % totalPages);
  }, [totalPages]);

  const goToPrevPage = useCallback(() => {
    if (totalPages <= 1) return;
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  }, [totalPages]);

  // Continuous auto-loop flow timer
  React.useEffect(() => {
    if (!autoRotate || reducedMotion || totalPages <= 1 || isPaused) {
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
  }, [
    autoRotate,
    autoRotateIntervalMs,
    goToNextPage,
    totalPages,
    isPaused,
    reducedMotion,
  ]);

  // Pause on hover and focus so users can comfortably read reviews
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);
  const handleFocus = () => setIsPaused(true);
  const handleBlur = (e: React.FocusEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsPaused(false);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      goToPrevPage();
    } else if (e.key === "ArrowRight") {
      goToNextPage();
    }
  };

  // Touch swipe handlers
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

  // Graceful empty state: return null if no reviews provided
  if (!reviews || reviews.length === 0) {
    return null;
  }

  return (
    <section
      ref={containerRef}
      aria-labelledby="customer-reviews-heading"
      data-testid="customer-reviews-section"
      className={`relative w-full py-16 sm:py-20 lg:py-24 overflow-hidden select-none ${className}`}
      style={{ backgroundColor }}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Subtle, oversized concentric circular outlines in background */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden flex items-center justify-center"
        aria-hidden="true"
      >
        <div className="absolute w-[480px] h-[480px] sm:w-[680px] sm:h-[680px] lg:w-[860px] lg:h-[860px] rounded-full border border-black/[0.04]" />
        <div className="absolute w-[760px] h-[760px] sm:w-[1040px] sm:h-[1040px] lg:w-[1300px] lg:h-[1300px] rounded-full border border-black/[0.035]" />
        <div className="absolute w-[1040px] h-[1040px] sm:w-[1400px] sm:h-[1400px] lg:w-[1740px] lg:h-[1740px] rounded-full border border-black/[0.025]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Exact Section Heading: Customer Reviews */}
        <h2
          id="customer-reviews-heading"
          data-testid="customer-reviews-heading"
          className="text-center font-normal text-2xl sm:text-3xl md:text-[32px] lg:text-[36px] tracking-[-0.01em] text-[#111111] leading-tight mb-10 sm:mb-12 lg:mb-14"
        >
          {heading}
        </h2>

        {/* Carousel Container */}
        <div className="overflow-hidden w-full">
          <div
            className={`flex ${
              reducedMotion ? "transition-none" : "transition-transform duration-500 ease-out"
            }`}
            style={{
              transform: `translateX(-${activePage * 100}%)`,
            }}
          >
            {pages.map((pageReviews, pageIndex) => (
              <div
                key={`review-page-${pageIndex}`}
                className="w-full shrink-0"
                aria-hidden={pageIndex !== activePage}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 items-stretch">
                  {pageReviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      starColor={starColor}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Dots */}
        <ReviewPagination
          totalPages={totalPages}
          activePage={activePage}
          onPageSelect={setCurrentPage}
        />
      </div>
    </section>
  );
}
