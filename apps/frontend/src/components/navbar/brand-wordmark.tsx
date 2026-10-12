import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { BrandConfig } from "@/config/navigation";

export interface BrandWordmarkProps {
  config: BrandConfig;
  className?: string;
}

/**
 * PERALAGAE brand logo / wordmark.
 *
 * Characteristics:
 * - High-definition visual logo image with fallback to typographic wordmark.
 * - Accessible link to homepage ("/") with aria-label.
 * - Responsive sizing (h-9 on mobile, h-11 on tablet, h-12 to h-14 on desktop)
 * - Clean hover transition.
 */
export function BrandWordmark({ config, className = "" }: BrandWordmarkProps) {
  return (
    <Link
      href={config.href}
      aria-label={`${config.name} Fine Jewellery — Home`}
      className={`inline-flex items-center select-none transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${className}`}
    >
      {config.logoSrc ? (
        <>
          <Image
            src={config.logoSrc}
            alt={`${config.name} Fine Jewellery`}
            width={config.logoWidth ?? 1308}
            height={config.logoHeight ?? 537}
            priority
            className="h-10 sm:h-12 lg:h-16 w-auto max-h-16 max-w-[190px] sm:max-w-[220px] lg:max-w-[260px] object-contain"
          />
          <span className="sr-only">{config.name}</span>
        </>
      ) : (
        <span className="text-2xl sm:text-[28px] lg:text-[32px] font-medium tracking-[0.24em] text-[#111111] uppercase">
          {config.name}
        </span>
      )}
    </Link>
  );
}
