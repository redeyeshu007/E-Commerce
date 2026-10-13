"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface ShopHeroProps {
  title?: string;
  imageSrc?: string;
  imageAlt?: string;
}

/**
 * ShopHero Component — PERALAGAE
 *
 * Implements the wide horizontal page-title banner matching the reference:
 * - Wide full-width banner
 * - High-resolution luxury jewellery photography
 * - Subtle neutral/grey overlay ensuring crisp text contrast
 * - Large centered heading "Shop"
 * - Editorial breadcrumb beneath: Home > Shop
 */
export function ShopHero({
  title = "Shop",
  imageSrc = "/images/hero/banner-statement-rings.jpg",
  imageAlt = "PERALAGAE Fine Jewellery Catalogue Banner",
}: ShopHeroProps) {
  return (
    <section
      aria-label="Shop Page Title and Breadcrumb"
      className="relative w-full overflow-hidden bg-[#F5F5F5]"
    >
      {/* Background Image with Subtle Luxury Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center filter brightness-[0.92]"
        />
        {/* Soft luxury veil for readable typography */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-white/75 via-white/85 to-white/95 backdrop-blur-[1px]"
          aria-hidden="true"
        />
      </div>

      {/* Hero Content: Centred Title & Breadcrumb */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 text-center">
        {/* Large Centered Heading */}
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-[0.04em] text-[#111111] uppercase">
          {title}
        </h1>

        {/* Breadcrumb Navigation: Home > Shop */}
        <nav
          aria-label="Breadcrumb"
          className="mt-3 sm:mt-4 flex items-center justify-center gap-2 text-xs sm:text-[13px] tracking-wider text-[#666666]"
        >
          <ol className="flex items-center gap-1.5 sm:gap-2">
            <li>
              <Link
                href="/"
                className="transition-colors hover:text-black hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-[#999999] select-none">
              <ChevronRight className="h-3.5 w-3.5 stroke-[1.75]" />
            </li>
            <li aria-current="page" className="font-medium text-[#111111] select-none">
              Shop
            </li>
          </ol>
        </nav>
      </div>
    </section>
  );
}
