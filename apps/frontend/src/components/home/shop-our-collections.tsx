import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  type CollectionItem,
  type CollectionsSectionConfig,
  defaultCollectionsConfig,
} from "@/config/collections";

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
  const content = (
    <article
      data-testid={`collection-card-${item.slug}`}
      className={`group flex flex-col items-center text-center cursor-pointer ${className}`}
    >
      {/* Square Image Box with Uniform Neutral Light-Grey Studio Background */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#F2F2F2] transition-colors duration-300 group-hover:bg-[#EAEAEA]">
        <Image
          src={item.image.src}
          alt={item.image.alt}
          fill
          unoptimized
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          className="object-contain p-3.5 sm:p-5 lg:p-6 transition-transform duration-500 ease-out group-hover:scale-105"
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
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
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
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
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
  className?: string;
}

/**
 * JAVIX JEWELLERY "Shop Our Collections" Section
 *
 * Appears immediately below the three promotional hero banners.
 * Renders:
 * - Centred heading: "Shop Our Collections"
 * - Six equally-spaced square product category tiles in a single row on desktop:
 *   1. NECKLACES
 *   2. RINGS
 *   3. BRACELETS
 *   4. EARRINGS
 *   5. CHARMS & BANGLES
 *   6. GIFT IDEAS
 * - Responsive grid: 6 columns on desktop (lg:grid-cols-6), 3 on tablet (sm:grid-cols-3), 2 on mobile (grid-cols-2).
 */
export function ShopOurCollections({
  config = defaultCollectionsConfig,
  className = "",
}: ShopOurCollectionsProps) {
  // Only render active collection items sorted by display order
  const activeItems = [...config.items]
    .filter((item) => item.isActive)
    .sort((a, b) => a.order - b.order);

  return (
    <section
      aria-labelledby="shop-our-collections-heading"
      className={`w-full bg-white pt-8 sm:pt-10 lg:pt-14 pb-12 sm:pb-16 lg:pb-20 ${className}`}
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
        {/* Centred Heading */}
        <h2
          id="shop-our-collections-heading"
          className="text-center font-normal text-2xl sm:text-3xl lg:text-[32px] tracking-[-0.01em] text-[#111111] leading-tight mb-8 sm:mb-10 lg:mb-12"
        >
          {config.heading}
        </h2>

        {/* Six Category Tiles in a Single Row on Desktop (Grid: 2 cols mobile, 3 cols tablet, 6 cols desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
          {activeItems.map((item) => (
            <CollectionCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
