"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface ContactHeroProps {
  title?: string;
  subtitle?: string;
  imageSrc?: string;
  imageAlt?: string;
}

/**
 * ContactHero Component — PERALAGAE
 *
 * Implements the horizontal page-title banner for the Contact page:
 * - High-resolution luxury jewellery photography background
 * - Soft neutral/white gradient overlay ensuring crisp typography contrast
 * - Centered semantic breadcrumb: Home > Contact
 * - Elegant serif page heading: Contact Us
 * - Understated subtitle: "We're here to help with your jewellery enquiries."
 */
export function ContactHero({
  title = "Contact Us",
  subtitle = "We're here to help with your jewellery enquiries.",
  imageSrc = "/images/hero/banner-necklaces.jpg",
  imageAlt = "PERALAGAE Luxury Jewellery Contact Banner",
}: ContactHeroProps) {
  return (
    <section
      data-testid="contact-hero-banner"
      aria-label="Contact Title and Breadcrumb"
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
        {/* Soft luxury veil for readable typography matching Shop and Wishlist banners */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/85 to-white/95 backdrop-blur-[0.5px]"
          aria-hidden="true"
        />
      </div>

      {/* Hero Content: Centred Breadcrumb, Title & Subtitle */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16 flex flex-col items-center text-center">
        {/* Breadcrumb Navigation: Home > Contact */}
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
              <span>Contact</span>
            </li>
          </ol>
        </nav>

        {/* Page Title */}
        <h1 className="mt-2.5 sm:mt-3 text-3xl sm:text-4xl lg:text-5xl font-serif font-normal text-[#111111] tracking-wide">
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="mt-2.5 sm:mt-3 text-sm sm:text-base text-[#666666] font-light max-w-md">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
