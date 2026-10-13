"use client";

import React from "react";
import Image from "next/image";
import { CartBreadcrumb } from "./cart-breadcrumb";

export interface CartHeroProps {
  title?: string;
  imageSrc?: string;
  imageAlt?: string;
}

/**
 * CartHero Component — PERALAGAE
 *
 * Implements the luxury horizontal page-title banner for the Shopping Cart page:
 * - High-resolution luxury jewellery photography background
 * - Soft neutral/white gradient overlay ensuring crisp typography contrast
 * - Centered semantic breadcrumb: Home > Shop > Cart
 * - Elegant serif page heading
 */
export function CartHero({
  title = "Cart",
  imageSrc = "/images/hero/banner-charm-bracelets.jpg",
  imageAlt = "PERALAGAE Luxury Jewellery Shopping Bag Banner",
}: CartHeroProps) {
  return (
    <section
      data-testid="cart-hero-banner"
      aria-label="Shopping Cart Title and Breadcrumb"
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
          className="object-cover object-center filter brightness-[0.92]"
        />
        {/* Soft luxury veil for readable typography */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/85 to-white/95 backdrop-blur-[0.5px]"
          aria-hidden="true"
        />
      </div>

      {/* Hero Content: Centred Breadcrumb & Title */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16 flex flex-col items-center text-center">
        {/* Breadcrumb Navigation: Home > Shop > Cart */}
        <CartBreadcrumb />

        {/* Page Title */}
        <h1 className="mt-2.5 sm:mt-3 text-3xl sm:text-4xl lg:text-5xl font-serif font-normal text-[#111111] tracking-wide">
          {title}
        </h1>
      </div>
    </section>
  );
}
