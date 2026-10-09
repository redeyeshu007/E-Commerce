import React from "react";
import { HeroBanners } from "@/components/home/hero-banners";
import { defaultHeroBannersConfig } from "@/config/hero-banners";

/**
 * JAVIX JEWELLERY Storefront Homepage
 *
 * Renders the primary hero and promotional banner section featuring
 * luxury fine jewellery collections.
 */
export default function HomePage() {
  return (
    <main className="flex-1 bg-white text-black pb-24 lg:pb-12">
      {/* Semantic Top-Level Heading */}
      <h1 className="sr-only">Gold Commerce Platform</h1>

      {/* Hero & Promotional Banner Grid */}
      <HeroBanners config={defaultHeroBannersConfig} />
    </main>
  );
}
