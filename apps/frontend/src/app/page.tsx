import { HeroBanners } from "@/components/home/hero-banners";
import { ShopOurCollections } from "@/components/home/shop-our-collections";
import { defaultCollectionsConfig } from "@/config/collections";
import { NewCollectionSection } from "@/components/home/new-collection";
import { defaultNewCollectionConfig } from "@/config/new-collection";
import { StoreLocatorBanner } from "@/components/home/store-locator-banner";
import { defaultStoreLocatorConfig } from "@/config/store-locator";
import { HotTrendingSection } from "@/components/home/hot-trending";
import {
  EditorialCollectionsSection,
  EditorialCollectionsSkeleton,
} from "@/components/home/editorial-collections";
import { CustomerReviewsSection } from "@/components/home/customer-reviews";
import { defaultReviewsConfig } from "@/config/reviews";
import {
  InstagramGallerySection,
  InstagramGallerySkeleton,
} from "@/components/home/instagram-gallery";
import { defaultInstagramConfig } from "@/config/instagram";
import { NewsletterSignupSection } from "@/components/home/newsletter-section";
import { defaultNewsletterConfig } from "@/config/newsletter";
import { HomePageAnchorManager } from "@/components/home/anchor-manager";

import React, { Suspense } from "react";
import { fetchPublicCategories } from "@/services/category-public-service";
import { fetchPublicHeroSettings } from "@/services/hero-settings-service";
import { fetchPublicMaterialsSection } from "@/services/material-service";
import { fetchPublicInstagramSection } from "@/services/instagram-service";

export const dynamic = "force-dynamic";

function HeroBannersSkeleton() {
  return (
    <section aria-label="Promotional Collections Loading" className="w-full bg-white pt-1 sm:pt-1.5 lg:pt-2 pb-6 sm:pb-8 lg:pb-10">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 items-stretch">
          <div className="h-full min-h-[500px] sm:min-h-[580px] lg:min-h-[660px] bg-neutral-100 animate-pulse rounded" />
          <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6 justify-between h-full">
            <div className="flex-1 min-h-[240px] sm:min-h-[280px] lg:min-h-[314px] bg-neutral-100 animate-pulse rounded" />
            <div className="flex-1 min-h-[240px] sm:min-h-[280px] lg:min-h-[314px] bg-neutral-100 animate-pulse rounded" />
          </div>
        </div>
      </div>
    </section>
  );
}

async function DynamicHeroBanners() {
  const [heroSettings, categories] = await Promise.all([
    fetchPublicHeroSettings(),
    fetchPublicCategories(),
  ]);
  return (
    <HeroBanners
      initialSettings={heroSettings ?? undefined}
      initialCategories={categories}
    />
  );
}

async function DynamicShopOurCollections() {
  const categories = await fetchPublicCategories();
  return <ShopOurCollections initialCategories={categories} />;
}

async function DynamicEditorialCollections() {
  const section = await fetchPublicMaterialsSection();
  return <EditorialCollectionsSection initialSection={section} />;
}

async function DynamicInstagramGallery() {
  const section = await fetchPublicInstagramSection();
  return <InstagramGallerySection initialConfig={section} />;
}

/**
 * PERALAGAE Storefront Homepage
 *
 * Renders:
 * 1. Promotional hero banners featuring luxury fine jewellery
 * 2. "Shop Our Collections" category gallery section
 * 3. "New Collection" product carousel with quick-view, wishlist, and cart interactions
 * 4. "Find Jewelry Shops Near You" store locator banner
 * 5. Editorial collection banners ("Designed in India. Crafted with timeless elegance.")
 * 6. "Customer Reviews" testimonial carousel section
 * 7. "Follow Us on Instagram" editorial gallery (Database-backed)
 * 8. "Sign up now & get 10% off" newsletter subscription section
 */
export default function HomePage() {
  return (
    <main className="flex-1 bg-white text-black pb-12 lg:pb-0">
      {/* Anchor scroll manager for in-page section navigation */}
      <HomePageAnchorManager />

      {/* Semantic Top-Level Heading */}
      <h1 className="sr-only">Gold Commerce Platform</h1>

      {/* Hero & Promotional Banner Grid */}
      <Suspense fallback={<HeroBannersSkeleton />}>
        <DynamicHeroBanners />
      </Suspense>

      {/* Shop Our Collections Category Gallery Section */}
      <Suspense fallback={<div className="h-64 animate-pulse bg-neutral-50" />}>
        <DynamicShopOurCollections />
      </Suspense>

      {/* New Collection Product Carousel Section */}
      <NewCollectionSection config={defaultNewCollectionConfig} />

      {/* Find Jewelry Shops Near You Store Locator Banner */}
      <StoreLocatorBanner config={defaultStoreLocatorConfig} />

      {/* Database-Driven Hot / Trending Product Collection */}
      <HotTrendingSection />

      {/* Database-Driven Materials Collection Editorial Section */}
      <Suspense fallback={<EditorialCollectionsSkeleton />}>
        <DynamicEditorialCollections />
      </Suspense>

      {/* Customer Reviews Testimonials Carousel Section */}
      <CustomerReviewsSection config={defaultReviewsConfig} />

      {/* Follow Us on Instagram Gallery Section (Database-Driven) */}
      <Suspense fallback={<InstagramGallerySkeleton />}>
        <DynamicInstagramGallery />
      </Suspense>

      {/* Newsletter Subscription Section */}
      <NewsletterSignupSection config={defaultNewsletterConfig} />
    </main>
  );
}

