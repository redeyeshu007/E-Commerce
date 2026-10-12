import React from "react";
import { HeroBanners } from "@/components/home/hero-banners";
import { defaultHeroBannersConfig } from "@/config/hero-banners";
import { ShopOurCollections } from "@/components/home/shop-our-collections";
import { defaultCollectionsConfig } from "@/config/collections";
import { NewCollectionSection } from "@/components/home/new-collection";
import { defaultNewCollectionConfig } from "@/config/new-collection";
import { StoreLocatorBanner } from "@/components/home/store-locator-banner";
import { defaultStoreLocatorConfig } from "@/config/store-locator";
import { EditorialCollectionsSection } from "@/components/home/editorial-collections";
import { defaultEditorialCollectionsConfig } from "@/config/editorial-collections";

/**
 * JAVIX JEWELLERY Storefront Homepage
 *
 * Renders:
 * 1. Promotional hero banners featuring luxury fine jewellery
 * 2. "Shop Our Collections" category gallery section
 * 3. "New Collection" product carousel with quick-view, wishlist, and cart interactions
 * 4. "Find Jewelry Shops Near You" store locator banner
 * 5. Editorial collection banners ("Designed in India. Crafted with timeless elegance.")
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

      {/* New Collection Product Carousel Section */}
      <NewCollectionSection config={defaultNewCollectionConfig} />

      {/* Find Jewelry Shops Near You Store Locator Banner */}
      <StoreLocatorBanner config={defaultStoreLocatorConfig} />

      {/* Editorial Collection Banners Section */}
      <EditorialCollectionsSection config={defaultEditorialCollectionsConfig} />
    </main>
  );
}

