"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  type CollectionItem,
  type CollectionsSectionConfig,
  defaultCollectionsConfig,
} from "@/config/collections";
import {
  fetchPublicCategories,
  CATEGORIES_UPDATED_EVENT,
} from "@/services/category-public-service";
import type { CategoryItem } from "@/types/category";

export interface CollectionCardProps {
  item: CollectionItem;
  className?: string;
}

/**
 * Single Collection Item Card
 *
 * Implements a square catalogue tile on a uniform light-grey background,
 * centered jewellery composition, and an uppercase category title underneath
 * with a subtle hover underline treatment.
 *
 * Handles unimplemented destination routes safely without 404 links.
 */
export function CollectionCard({ item, className = "" }: CollectionCardProps) {
  const isDynamicImage =
    item.image.src.startsWith("http") || item.image.src.startsWith("/uploads");

  const content = (
    <article
      data-testid={`collection-card-${item.slug}`}
      className={`group flex flex-col items-center text-center cursor-pointer ${className}`}
    >
      {/* Square Image Box with Uniform Neutral Light-Grey Studio Background */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#F2F2F2]">
        <Image
          src={item.image.src}
          alt={item.image.alt}
          fill
          unoptimized={isDynamicImage}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          style={{ objectPosition: item.image.objectPosition || "center" }}
        />
      </div>

      {/* Uppercase Category Label directly underneath with subtle hover underline */}
      <div className="mt-3 sm:mt-3.5 lg:mt-4">
        <span className="inline-block relative pb-0.5 text-xs sm:text-[13px] font-medium tracking-[0.08em] uppercase text-[#111111] transition-colors duration-200">
          {item.title}
          {/* Subtle underline transition on hover */}
          <span
            className="absolute bottom-0 left-0 h-[1px] w-0 bg-[#111111] transition-all duration-300 ease-out group-hover:w-full"
            aria-hidden="true"
          />
        </span>
      </div>
    </article>
  );

  // If destination route is implemented, wrap with Next.js Link
  if (item.isImplemented && item.href) {
    return (
      <Link
        href={item.href}
        className="block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        aria-label={`Shop ${item.title} Collection`}
      >
        {content}
      </Link>
    );
  }

  // Graceful fallback for planned collections pending backend/catalog route deployment
  return (
    <div
      role="region"
      aria-label={`${item.title} Collection`}
      title={`${item.title} (Coming Soon)`}
      className="block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
    >
      {content}
    </div>
  );
}

export interface ShopOurCollectionsProps {
  /**
   * Collections section configuration.
   * Defaults to defaultCollectionsConfig.
   */
  config?: CollectionsSectionConfig;
  initialCategories?: CategoryItem[];
  className?: string;
}

/**
 * PERALAGAE "Shop Our Collections" Section
 *
 * Appears immediately below the three promotional hero banners.
 * Renders:
 * - Centred heading: "Shop Our Collections"
 * - Six baseline categories by default:
 *   1. NECKLACES
 *   2. RINGS
 *   3. BRACELETS
 *   4. EARRINGS
 *   5. CHARMS & BANGLES
 *   6. GIFT IDEAS
 * - Responsive layout:
 *   - When <= 6 categories: clean grid (grid-cols-2 sm:grid-cols-3 lg:grid-cols-6)
 *   - When > 6 categories: smooth horizontal scrollable carousel with desktop arrow buttons,
 *     touch scrolling on mobile, and full keyboard accessibility.
 */
export function ShopOurCollections({
  config = defaultCollectionsConfig,
  initialCategories,
  className = "",
}: ShopOurCollectionsProps) {
  // Map initial categories if provided by server
  const initialMapped = useMemo(() => {
    if (!initialCategories || initialCategories.length === 0) return null;
    return initialCategories
      .filter((c) => c.isActive)
      .sort((a, b) => a.order - b.order)
      .map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.name,
        image: {
          src: c.imageUrl || `/images/collections/collection-${c.slug}.jpg`,
          alt: `${c.name} Collection`,
        },
        href: `/shop?category=${c.slug}`,
        isImplemented: true,
        order: c.order,
        isActive: c.isActive,
      }));
  }, [initialCategories]);

  const [dynamicItems, setDynamicItems] = useState<CollectionItem[] | null>(initialMapped);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Sync initialMapped if changed
  useEffect(() => {
    if (initialMapped && initialMapped.length > 0) {
      setDynamicItems(initialMapped);
    }
  }, [initialMapped]);

  // Check if custom config was passed (different from default)
  const isCustomConfig = useMemo(() => {
    return config !== defaultCollectionsConfig && config.items !== defaultCollectionsConfig.items;
  }, [config]);

  // Load public categories from backend API
  useEffect(() => {
    if (isCustomConfig) return;

    let isMounted = true;

    const loadCategories = async () => {
      try {
        const categories = await fetchPublicCategories();
        if (isMounted && categories && categories.length > 0) {
          const mapped: CollectionItem[] = categories
            .filter((c) => c.isActive)
            .sort((a, b) => a.order - b.order)
            .map((c) => ({
              id: c.id,
              slug: c.slug,
              title: c.name,
              image: {
                src: c.imageUrl || `/images/collections/collection-${c.slug}.jpg`,
                alt: `${c.name} Collection`,
              },
              href: `/shop?category=${c.slug}`,
              isImplemented: true,
              order: c.order,
              isActive: c.isActive,
            }));

          setDynamicItems(mapped);
        }
      } catch {
        // Fall back to default config if network fails
      }
    };

    loadCategories();

    // Re-fetch when categories are modified in admin
    const handleUpdated = () => {
      loadCategories();
    };

    window.addEventListener(CATEGORIES_UPDATED_EVENT, handleUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener(CATEGORIES_UPDATED_EVENT, handleUpdated);
    };
  }, [isCustomConfig]);

  // Resolve active items (prioritizing dynamic categories unless custom config supplied)
  const activeItems = useMemo(() => {
    if (isCustomConfig) {
      return [...config.items]
        .filter((item) => item.isActive)
        .sort((a, b) => a.order - b.order);
    }

    if (dynamicItems && dynamicItems.length > 0) {
      return dynamicItems;
    }

    return [...config.items]
      .filter((item) => item.isActive)
      .sort((a, b) => a.order - b.order);
  }, [isCustomConfig, dynamicItems, config.items]);

  // Determine whether carousel mode is needed (> 6 items)
  const isCarouselMode = activeItems.length > 6;

  // Scroll button visibility check
  const updateScrollButtons = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  }, []);

  useEffect(() => {
    if (!isCarouselMode) return;

    updateScrollButtons();
    const timer = setTimeout(updateScrollButtons, 100);

    const el = scrollContainerRef.current;
    if (!el) return () => clearTimeout(timer);

    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [isCarouselMode, activeItems.length, updateScrollButtons]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scroll("left");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      scroll("right");
    }
  };

  return (
    <section
      id="shop-our-collections"
      aria-labelledby="shop-our-collections-heading"
      className={`w-full overflow-hidden bg-white pt-8 sm:pt-10 lg:pt-14 pb-12 sm:pb-16 lg:pb-20 scroll-mt-28 lg:scroll-mt-32 ${className}`}
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
        {/* Centred Heading */}
        <h2
          id="shop-our-collections-heading"
          className="text-center font-normal text-2xl sm:text-3xl lg:text-[32px] tracking-[-0.01em] text-[#111111] leading-tight mb-8 sm:mb-10 lg:mb-12"
        >
          {config.heading}
        </h2>

        {/* Categories Display */}
        {isCarouselMode ? (
          /* Carousel mode with desktop arrows & touch scroll for > 6 categories */
          <div className="relative group/collections">
            {/* Left Desktop Arrow Button */}
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Previous categories"
              disabled={!canScrollLeft}
              className={`hidden lg:flex absolute -left-4 xl:-left-6 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-white text-[#222222] shadow-md border border-neutral-100 transition-all duration-200 hover:bg-black hover:text-white hover:border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                !canScrollLeft ? "opacity-30 cursor-not-allowed pointer-events-none" : "opacity-100 cursor-pointer"
              }`}
            >
              <ChevronLeft className="h-5 w-5 stroke-[1.5]" aria-hidden="true" />
            </button>

            {/* Scrollable Container */}
            <div
              ref={scrollContainerRef}
              tabIndex={0}
              role="region"
              aria-label="Collections carousel"
              onKeyDown={handleKeyDown}
              className="flex gap-4 sm:gap-5 lg:gap-6 overflow-x-auto scroll-smooth pb-2 focus:outline-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {activeItems.map((item) => (
                <div
                  key={item.id}
                  className="w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.85rem)] lg:w-[calc(16.666%-1.25rem)] min-w-[140px] sm:min-w-[160px] lg:min-w-[170px] shrink-0"
                >
                  <CollectionCard item={item} />
                </div>
              ))}
            </div>

            {/* Right Desktop Arrow Button */}
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Next categories"
              disabled={!canScrollRight}
              className={`hidden lg:flex absolute -right-4 xl:-right-6 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-white text-[#222222] shadow-md border border-neutral-100 transition-all duration-200 hover:bg-black hover:text-white hover:border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                !canScrollRight ? "opacity-30 cursor-not-allowed pointer-events-none" : "opacity-100 cursor-pointer"
              }`}
            >
              <ChevronRight className="h-5 w-5 stroke-[1.5]" aria-hidden="true" />
            </button>
          </div>
        ) : (
          /* Standard 6-category responsive grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
            {activeItems.map((item) => (
              <CollectionCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
