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
import { CustomerReviewsSection } from "@/components/home/customer-reviews";
import { defaultReviewsConfig } from "@/config/reviews";
import { InstagramGallerySection } from "@/components/home/instagram-gallery";
import { defaultInstagramConfig } from "@/config/instagram";
import { NewsletterSignupSection } from "@/components/home/newsletter-section";
import { defaultNewsletterConfig } from "@/config/newsletter";
import { HomePageAnchorManager } from "@/components/home/anchor-manager";

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
 * 7. "Follow Us on Instagram" 6-photo editorial gallery
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
      <HeroBanners config={defaultHeroBannersConfig} />

      {/* Shop Our Collections Category Gallery Section */}
      <ShopOurCollections config={defaultCollectionsConfig} />

      {/* New Collection Product Carousel Section */}
      <NewCollectionSection config={defaultNewCollectionConfig} />

      {/* Find Jewelry Shops Near You Store Locator Banner */}
      <StoreLocatorBanner config={defaultStoreLocatorConfig} />

      {/* Editorial Collection Banners Section */}
      <EditorialCollectionsSection config={defaultEditorialCollectionsConfig} />

      {/* Customer Reviews Testimonials Carousel Section */}
      <CustomerReviewsSection config={defaultReviewsConfig} />

      {/* Follow Us on Instagram Gallery Section */}
      <InstagramGallerySection config={defaultInstagramConfig} />

      {/* Newsletter Subscription Section */}
      <NewsletterSignupSection config={defaultNewsletterConfig} />
    </main>
  );
}

