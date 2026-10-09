import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  type HeroBannerItem,
  type HeroBannersConfig,
  defaultHeroBannersConfig,
} from "@/config/hero-banners";

export interface OutlineButtonProps {
  label: string;
  href: string;
  className?: string;
  "aria-label"?: string;
}

/**
 * Rectangular outline call-to-action button matching the reference design.
 * Features crisp square corners, thin border, and subtle hover transition.
 */
export function OutlineButton({
  label,
  href,
  className = "",
  "aria-label": ariaLabel,
}: OutlineButtonProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel || label}
      className={`inline-flex items-center justify-center border border-[#111111] bg-transparent px-6 py-2.5 sm:px-7 sm:py-3 text-xs sm:text-[13px] font-medium tracking-[0.1em] uppercase text-[#111111] transition-colors duration-200 hover:bg-[#111111] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${className}`}
    >
      {label}
    </Link>
  );
}

export interface BannerCardProps {
  item: HeroBannerItem;
  isFeatured?: boolean;
  className?: string;
}

/**
 * Single editorial banner card with image background, subtle contrast
 * treatment, and left-aligned text hierarchy.
 */
export function BannerCard({ item, isFeatured = false, className = "" }: BannerCardProps) {
  const HeadingTag = isFeatured ? "h2" : "h3";

  return (
    <article
      data-testid={`banner-${item.id}`}
      className={`group relative overflow-hidden bg-[#F6F6F6] ${
        isFeatured
          ? "h-full min-h-[460px] sm:min-h-[540px] lg:min-h-[620px]"
          : "h-full min-h-[250px] sm:min-h-[280px] lg:min-h-[294px]"
      } ${className}`}
    >
      {/* Background Image with Focal Point Alignment */}
      <div className="absolute inset-0 z-0">
        <Image
          src={item.image.src}
          alt={item.image.alt}
          fill
          priority={item.priority}
          sizes={isFeatured ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 1024px) 100vw, 50vw"}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          style={{ objectPosition: item.image.objectPosition || "center right" }}
        />
      </div>

      {/* Subtle Legibility Gradient Overlay (does not obscure imagery) */}
      <div
        className="pointer-events-none absolute inset-0 z-1 bg-gradient-to-r from-white/70 via-white/20 to-transparent sm:from-white/55 sm:to-transparent"
        aria-hidden="true"
      />

      {/* Left-Aligned Text Content Block */}
      <div className="relative z-10 flex h-full flex-col justify-center p-6 sm:p-10 lg:p-12 xl:p-14 max-w-[72%] sm:max-w-[62%]">
        {/* Optional Introductory Small Heading */}
        {item.introHeading && (
          <span className="mb-2 text-[11px] sm:text-xs font-semibold tracking-[0.14em] uppercase text-[#666666]">
            {item.introHeading}
          </span>
        )}

        {/* Main Headline */}
        <HeadingTag
          className={`font-normal tracking-[-0.01em] text-[#111111] leading-[1.18] whitespace-pre-line ${
            isFeatured
              ? "text-2xl sm:text-3xl lg:text-[36px] xl:text-[40px] mb-3"
              : "text-xl sm:text-2xl lg:text-[27px] xl:text-[30px] mb-3"
          }`}
        >
          {item.title}
        </HeadingTag>

        {/* Optional Supporting Description */}
        {item.description && (
          <p className="mb-5 sm:mb-6 max-w-xs text-xs sm:text-sm font-normal text-[#555555] leading-relaxed whitespace-pre-line">
            {item.description}
          </p>
        )}

        {/* Rectangular Outline CTA Button */}
        <div>
          <OutlineButton
            label={item.cta.label}
            href={item.cta.href}
            aria-label={`${item.cta.label} - ${item.title.replace(/\n/g, " ")}`}
          />
        </div>
      </div>
    </article>
  );
}

export interface HeroBannersProps {
  /**
   * Promotional banner configuration.
   * Defaults to defaultHeroBannersConfig.
   */
  config?: HeroBannersConfig;
  className?: string;
}

/**
 * JAVIX JEWELLERY Hero & Promotional Banner Section
 *
 * Implements a 2-column desktop composition:
 * - Left column: One large vertically-oriented promotional banner spanning full height.
 * - Right column: Two stacked landscape promotional banners with consistent gap.
 * - Mobile (< lg): Seamless vertical stack preserving visual hierarchy.
 */
export function HeroBanners({
  config = defaultHeroBannersConfig,
  className = "",
}: HeroBannersProps) {
  return (
    <section
      aria-label="Promotional Collections"
      className={`w-full bg-white py-4 sm:py-6 lg:py-8 ${className}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 lg:gap-8 items-stretch">
          {/* Left Column: Vertically Oriented Featured Banner */}
          <div className="h-full">
            <BannerCard item={config.featuredBanner} isFeatured />
          </div>

          {/* Right Column: Two Stacked Landscape Banners */}
          <div className="flex flex-col gap-5 sm:gap-6 lg:gap-8 justify-between h-full">
            <div className="flex-1">
              <BannerCard item={config.secondaryTopBanner} />
            </div>
            <div className="flex-1">
              <BannerCard item={config.secondaryBottomBanner} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
