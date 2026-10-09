import React from "react";
import Link from "next/link";
import type { BrandConfig } from "@/config/navigation";

export interface BrandWordmarkProps {
  config: BrandConfig;
  className?: string;
}

/**
 * JAVIX brand wordmark.
 *
 * Characteristics:
 * - Pure typographic understated luxury wordmark (replaces "ALUKAS & CO").
 * - Dark black/charcoal text with sophisticated letter spacing.
 * - Clickable, navigating cleanly to homepage ("/").
 * - No taglines, no decorative icons, no preloader duplication.
 */
export function BrandWordmark({ config, className = "" }: BrandWordmarkProps) {
  return (
    <Link
      href={config.href}
      aria-label={`${config.name} Fine Jewellery — Home`}
      className={`inline-block select-none text-2xl sm:text-[28px] lg:text-[32px] font-medium tracking-[0.24em] text-[#111111] uppercase transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${className}`}
    >
      {config.name}
    </Link>
  );
}
