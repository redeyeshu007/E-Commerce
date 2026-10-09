/**
 * Hero & Promotional Banner Configuration — JAVIX JEWELLERY
 *
 * Configuration-driven architecture separating promotional content,
 * imagery, and routing from presentation components.
 * Ready for future backend CMS or tenant configuration integration.
 */

export interface BannerButtonConfig {
  /** Label text displayed on the rectangular outline CTA */
  label: string;
  /** Destination route or URL */
  href: string;
}

export interface BannerImageConfig {
  /** Image source path or URL */
  src: string;
  /** Accessible alternative text */
  alt: string;
  /** CSS object-position for fine-tuning focal points (e.g. 'center right') */
  objectPosition?: string;
}

export interface HeroBannerItem {
  /** Stable unique identifier */
  id: string;
  /** Optional small introductory heading */
  introHeading?: string;
  /** Main promotional headline (supports newlines for editorial styling) */
  title: string;
  /** Optional descriptive supporting text */
  description?: string;
  /** Call-to-action button configuration */
  cta: BannerButtonConfig;
  /** Editorial image asset configuration */
  image: BannerImageConfig;
  /** Whether image should load with high priority (LCP optimization) */
  priority?: boolean;
}

export interface HeroBannersConfig {
  /** Left column featured tall banner */
  featuredBanner: HeroBannerItem;
  /** Right column upper landscape banner */
  secondaryTopBanner: HeroBannerItem;
  /** Right column lower landscape banner */
  secondaryBottomBanner: HeroBannerItem;
}

/**
 * Default promotional banner content matching the JAVIX JEWELLERY
 * brand identity and reference composition.
 */
export const defaultHeroBannersConfig: HeroBannersConfig = {
  featuredBanner: {
    id: "hero-featured-necklaces",
    introHeading: "2024 Collection",
    title: "Necklaces &\nBody Jewels",
    description: "Look to our new season\ncollection for girls.",
    cta: {
      label: "Shop Now",
      href: "/category/necklaces",
    },
    image: {
      src: "/images/hero/banner-necklaces.jpg",
      alt: "Luxury gold necklace and body jewel editorial by JAVIX JEWELLERY",
      objectPosition: "center right",
    },
    priority: true,
  },
  secondaryTopBanner: {
    id: "hero-secondary-charm-rings",
    introHeading: "New Collection",
    title: "Jewelry &\nCharm Rings",
    cta: {
      label: "Shop Now",
      href: "/category/charms",
    },
    image: {
      src: "/images/hero/banner-charm-rings.jpg",
      alt: "Delicate gold charm rings styled on neutral stone surface",
      objectPosition: "center right",
    },
    priority: false,
  },
  secondaryBottomBanner: {
    id: "hero-secondary-statement-rings",
    introHeading: "Modern Classics",
    title: "Desk The Hals",
    cta: {
      label: "Shop Now",
      href: "/category/rings",
    },
    image: {
      src: "/images/hero/banner-statement-rings.jpg",
      alt: "Editorial model hand adorned with gold cocktail rings and bands",
      objectPosition: "center right",
    },
    priority: false,
  },
};
