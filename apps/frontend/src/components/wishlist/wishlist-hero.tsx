"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface WishlistHeroProps {
  title?: string;
  imageSrc?: string;
  imageAlt?: string;
}

/**
 * WishlistHero Component — PERALAGAE
 *
 * Implements the luxury horizontal page-title banner for the Wishlist page:
 * - High-resolution luxury jewellery photography background
 * - Soft neutral/white gradient overlay ensuring crisp typography contrast
 * - Centered semantic breadcrumb: Home > Wishlist
 * - Elegant serif page heading
 */
export function WishlistHero({
  title = "Wishlist",
  imageSrc = "/images/hero/banner-charm-rings.jpg",
  imageAlt = "PERALAGAE Luxury Jewellery Wishlist Banner",
}: WishlistHeroProps) {
  return (
    <section
      data-testid="wishlist-hero-banner"
      aria-label="Wishlist Title and Breadcrumb"
      className="relative w-full overflow-hidden bg-[#F5F5F5] border-b border-[#EBEBEB]"
    >
      {/* Background Image with Subtle Luxury Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center sm:object-[center_35%] filter brightness-[0.92]"
        />
        {/* Soft luxury veil for readable typography */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/85 to-white/95 backdrop-blur-[0.5px]"
          aria-hidden="true"
        />
      </div>

      {/* Hero Content: Centred Breadcrumb & Title */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16 flex flex-col items-center text-center">
        {/* Breadcrumb Navigation: Home > Wishlist */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center text-xs tracking-wider uppercase text-[#777777]"
        >
          <ol className="flex items-center flex-wrap gap-1.5 sm:gap-2">
            <li className="flex items-center">
              <Link
                href="/"
                className="hover:text-black transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
              >
                Home
              </Link>
            </li>
            <li className="flex items-center text-[#999999]" aria-hidden="true">
              <ChevronRight className="h-3 w-3 stroke-[1.5]" />
            </li>
            <li className="flex items-center font-medium text-[#111111]" aria-current="page">
              <span>Wishlist</span>
            </li>
          </ol>
        </nav>

        {/* Page Title */}
        <h1 className="mt-2.5 sm:mt-3 text-3xl sm:text-4xl lg:text-5xl font-serif font-normal text-[#111111] tracking-wide">
          {title}
        </h1>
      </div>
    </section>
  );
}
