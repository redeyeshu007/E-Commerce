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
  /** Optional pre-title subhead line (e.g. "Necklaces &", "Just Lunched", "Jewelry &") */
  subheading?: string;
  /** Main prominent title line (e.g. "Body Jewels", "Desk The Hals", "Charm Bracelets") */
  title: string;
  /** Optional small introductory badge */
  introHeading?: string;
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
 * reference composition and styling.
 */
export const defaultHeroBannersConfig: HeroBannersConfig = {
  featuredBanner: {
    id: "hero-featured-necklaces",
    subheading: "Necklaces &",
    title: "Body Jewels",
    description: "Look to our new season collection for girls.",
    cta: {
      label: "Shop Now",
      href: "/category/necklaces",
    },
    image: {
      src: "/images/hero/banner-necklaces.jpg",
      alt: "Necklaces & Body Jewels - JAVIX JEWELLERY",
      objectPosition: "80% center",
    },
    priority: true,
  },
  secondaryTopBanner: {
    id: "hero-secondary-desk-hals",
    subheading: "Just Lunched",
    title: "Desk The Hals",
    cta: {
      label: "Shop Now",
      href: "/category/rings",
    },
    image: {
      src: "/images/hero/banner-desk-hals.jpg",
      alt: "Just Lunched Desk The Hals - JAVIX JEWELLERY",
      objectPosition: "85% center",
    },
    priority: false,
  },
  secondaryBottomBanner: {
    id: "hero-secondary-charm-bracelets",
    subheading: "Jewelry &",
    title: "Charm Bracelets",
    cta: {
      label: "Shop Now",
      href: "/category/bracelets",
    },
    image: {
      src: "/images/hero/banner-charm-bracelets.jpg",
      alt: "Jewelry & Charm Bracelets - JAVIX JEWELLERY",
      objectPosition: "90% center",
    },
    priority: false,
  },
};
