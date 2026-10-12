"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  type EditorialCollectionItem,
  type EditorialCollectionsSectionConfig,
  defaultEditorialCollectionsConfig,
} from "@/config/editorial-collections";

export interface EditorialCollectionCardProps {
  item: EditorialCollectionItem;
  className?: string;
  onCtaClick?: (item: EditorialCollectionItem, e: React.MouseEvent) => void;
}

/**
 * EditorialCollectionCard Component
 *
 * Renders an individual luxury editorial card consisting of:
 * 1. Tall portrait lifestyle campaign image (3:4 aspect ratio)
 * 2. Collection title
 * 3. Short editorial descriptive sentence
 * 4. Refined underlined text-link CTA
 */
export function EditorialCollectionCard({
  item,
  className = "",
  onCtaClick,
}: EditorialCollectionCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onCtaClick) {
      onCtaClick(item, e);
    }
  };

  return (
    <article
      data-testid={`editorial-card-${item.id}`}
      className={`group flex flex-col items-center text-center ${className}`}
    >
      {/* 1. Large Lifestyle Jewellery Image (Tall 3:4 Portrait Ratio) */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F2F2F2]">
        <Image
          src={item.image.src}
          alt={item.image.alt}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          style={{ objectPosition: item.image.objectPosition || "center" }}
        />
      </div>

      {/* 2. Collection Title */}
      <h3 className="mt-5 sm:mt-6 text-lg sm:text-xl lg:text-[22px] font-normal tracking-[-0.01em] text-[#111111] leading-tight">
        {item.title}
      </h3>

      {/* 3. Short Descriptive Sentence */}
      <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-[#666666] font-normal leading-relaxed max-w-[280px] sm:max-w-xs mx-auto">
        {item.description}
      </p>

      {/* 4. Underlined Text-Link CTA */}
      <div className="mt-3.5 sm:mt-4">
        <Link
          href={item.href}
          onClick={handleClick}
          data-testid={`editorial-cta-${item.id}`}
          className="inline-block text-xs sm:text-[13px] font-medium tracking-[0.08em] uppercase text-[#111111] underline underline-offset-4 decoration-[#111111] transition-opacity duration-200 hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          title={
            item.isImplemented
              ? item.ctaText
              : `${item.ctaText} (Pending Catalogue Route)`
          }
          aria-label={`${item.ctaText}: ${item.title}`}
        >
          {item.ctaText}
        </Link>
      </div>
    </article>
  );
}

export interface EditorialCollectionsSectionProps {
  /**
   * Editorial collections section configuration.
   * Defaults to defaultEditorialCollectionsConfig.
   */
  config?: EditorialCollectionsSectionConfig;

  /**
   * Optional container className override.
   */
  className?: string;

  /**
   * Optional custom click callback for any card CTA.
   */
  onCtaClick?: (item: EditorialCollectionItem, e: React.MouseEvent) => void;
}

/**
 * EditorialCollectionsSection Component — PERALAGAE
 *
 * Implements:
 * 1. Centred Top Brand Tagline: "Designed in India. Crafted with timeless elegance."
 * 2. Three large editorial collection cards in a single row on desktop:
 *    - Lab Grown Diamonds ("EXPLORE NOW")
 *    - Tennis Bracelets ("SHOP COLLECTION")
 *    - Garden Variety ("DISCOVER NOW")
 * 3. Responsive layout: single column stacked cards on mobile/tablet, 3 columns on desktop.
 */
export function EditorialCollectionsSection({
  config = defaultEditorialCollectionsConfig,
  className = "",
  onCtaClick,
}: EditorialCollectionsSectionProps) {
  return (
    <section
      aria-labelledby="editorial-collections-tagline"
      data-testid="editorial-collections-section"
      className={`w-full bg-white pt-2 sm:pt-4 lg:pt-6 pb-16 sm:pb-20 lg:pb-24 ${className}`}
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        {/* Top Brand Tagline with Generous Whitespace */}
        <h2
          id="editorial-collections-tagline"
          data-testid="editorial-tagline"
          className="text-center font-normal text-2xl sm:text-3xl md:text-[32px] lg:text-[36px] tracking-[-0.015em] text-[#111111] leading-snug mb-10 sm:mb-14 lg:mb-16"
        >
          {config.tagline}
        </h2>

        {/* Three Editorial Collection Cards in a Single Horizontal Row on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 md:gap-6 lg:gap-8">
          {config.items.map((item) => (
            <EditorialCollectionCard
              key={item.id}
              item={item}
              onCtaClick={onCtaClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
