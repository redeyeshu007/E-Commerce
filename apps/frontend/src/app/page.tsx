import React from "react";
import { HeroBanners } from "@/components/home/hero-banners";
import { defaultHeroBannersConfig } from "@/config/hero-banners";
import { ShopOurCollections } from "@/components/home/shop-our-collections";
import { defaultCollectionsConfig } from "@/config/collections";

/**
 * JAVIX JEWELLERY Storefront Homepage
 *
 * Renders:
 * 1. Promotional hero banners featuring luxury fine jewellery
 * 2. "Shop Our Collections" category gallery section
 */
export default function HomePage() {
  return (
    <main className="flex-1 bg-white text-black pb-24 lg:pb-12">
      {/* Semantic Top-Level Heading */}
      <h1 className="sr-only">Gold Commerce Platform</h1>

      {/* Hero & Promotional Banner Grid */}
      <HeroBanners config={defaultHeroBannersConfig} />

      {/* Shop Our Collections Category Gallery Section */}
      <ShopOurCollections config={defaultCollectionsConfig} />
    </main>
  );
}
