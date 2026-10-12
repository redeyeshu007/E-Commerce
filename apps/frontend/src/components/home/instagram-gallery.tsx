"use client";

import React from "react";
import Image from "next/image";
import type {
  InstagramGalleryConfig,
  InstagramGalleryItem,
} from "@/config/instagram";
import { defaultInstagramConfig } from "@/config/instagram";

/* -------------------------------------------------------------------------
 * Component: InstagramGalleryItemCard
 * ------------------------------------------------------------------------- */

export interface InstagramGalleryItemCardProps {
  item: InstagramGalleryItem;
  profileUrl?: string | null;
  className?: string;
}

export function InstagramGalleryItemCard({
  item,
  profileUrl,
  className = "",
}: InstagramGalleryItemCardProps) {
  const destinationUrl = item.postUrl || profileUrl;

  const content = (
    <div
      data-testid={`instagram-item-${item.id}`}
      className={`group relative aspect-square w-full overflow-hidden bg-[#F5F5F5] select-none ${className}`}
    >
      <Image
        src={item.image.src}
        alt={item.image.alt}
        fill
        sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 16vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />

      {/* Subtle luxury Instagram icon overlay on hover */}
      <div
        className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        <div className="w-10 h-10 rounded-full bg-white/90 text-[#111111] flex items-center justify-center shadow-sm">
          <svg
            className="w-5 h-5 fill-current"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.13-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        </div>
      </div>
    </div>
  );

  if (destinationUrl) {
    return (
      <a
        href={destinationUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`View Instagram post: ${item.image.alt}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
      >
        {content}
      </a>
    );
  }

  return content;
}

/* -------------------------------------------------------------------------
 * Component: InstagramGalleryGrid
 * ------------------------------------------------------------------------- */

export interface InstagramGalleryGridProps {
  items: InstagramGalleryItem[];
  profileUrl?: string | null;
  className?: string;
}

export function InstagramGalleryGrid({
  items,
  profileUrl,
  className = "",
}: InstagramGalleryGridProps) {
  return (
    <div
      data-testid="instagram-gallery-grid"
      className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5 ${className}`}
    >
      {items.map((item) => (
        <InstagramGalleryItemCard
          key={item.id}
          item={item}
          profileUrl={profileUrl}
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Component: InstagramGallerySection
 * ------------------------------------------------------------------------- */

export interface InstagramGallerySectionProps {
  config?: InstagramGalleryConfig;
  className?: string;
}

/**
 * InstagramGallerySection Component — JAVIX JEWELLERY
 *
 * Implements:
 * 1. Centred exact heading: "Follow Us on Instagram"
 * 2. Muted grey configurable handle beneath heading (e.g. "@yourjavixhandle")
 * 3. Exactly six separate jewellery images in a single row on desktop (lg:grid-cols-6)
 * 4. Responsive arrangement (2 columns on mobile, 3 on tablet, 6 on desktop)
 * 5. Clean editorial photography without captions, prices, or card borders
 */
export function InstagramGallerySection({
  config = defaultInstagramConfig,
  className = "",
}: InstagramGallerySectionProps) {
  const {
    heading = "Follow Us on Instagram",
    handle = "@yourjavixhandle",
    profileUrl,
    items = [],
  } = config;

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="instagram-gallery-heading"
      data-testid="instagram-gallery-section"
      className={`w-full bg-white pt-16 sm:pt-20 lg:pt-24 pb-8 sm:pb-10 lg:pb-12 ${className}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Exact Section Heading: Follow Us on Instagram */}
        <h2
          id="instagram-gallery-heading"
          data-testid="instagram-gallery-heading"
          className="text-center font-normal text-2xl sm:text-3xl md:text-[32px] lg:text-[36px] tracking-[-0.01em] text-[#111111] leading-tight mb-2"
        >
          {heading}
        </h2>

        {/* Configurable Instagram Handle */}
        {profileUrl ? (
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="instagram-handle-link"
            className="block text-center text-sm sm:text-base text-[#666666] hover:text-[#111111] transition-colors mb-10 sm:mb-12 lg:mb-14 font-normal"
          >
            {handle}
          </a>
        ) : (
          <p
            data-testid="instagram-handle-text"
            className="text-center text-sm sm:text-base text-[#666666] mb-10 sm:mb-12 lg:mb-14 font-normal"
          >
            {handle}
          </p>
        )}

        {/* Six-Image Gallery Grid */}
        <InstagramGalleryGrid items={items} profileUrl={profileUrl} />
      </div>
    </section>
  );
}
