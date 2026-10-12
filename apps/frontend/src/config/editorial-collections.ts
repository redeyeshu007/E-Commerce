/**
 * Editorial Collections Section Configuration — PERALAGAE
 *
 * Configurable metadata, copywriting, lifestyle imagery, and destination routes
 * for the premium 3-card editorial collection campaign section.
 */

export interface EditorialImageConfig {
  /** Path to the high-resolution lifestyle photograph */
  src: string;
  /** Accessible alt text describing model and featured jewellery */
  alt: string;
  /** Optional focal-point CSS position (defaults to 'center') */
  objectPosition?: string;
}

export interface EditorialCollectionItem {
  /** Unique stable card identifier */
  id: string;
  /** Collection title */
  title: string;
  /** Short editorial descriptive sentence */
  description: string;
  /** Exact uppercase call-to-action text */
  ctaText: string;
  /** Configurable route destination */
  href: string;
  /** Whether the destination catalogue route is currently implemented */
  isImplemented: boolean;
  /** Lifestyle image asset configuration */
  image: EditorialImageConfig;
}

export interface EditorialCollectionsSectionConfig {
  /** Exact top brand tagline */
  tagline: string;
  /** Array of editorial collection cards (3 cards) */
  items: EditorialCollectionItem[];
}

/**
 * Approved configuration for PERALAGAE Editorial Collections section.
 * Faithful reproduction of the brand tagline and 3 collection cards.
 */
export const defaultEditorialCollectionsConfig: EditorialCollectionsSectionConfig = {
  tagline: "Designed in India. Crafted with timeless elegance.",
  items: [
    {
      id: "lab-grown-diamonds",
      title: "Lab Grown Diamonds",
      description: "Discover the exceptional quality & sparkle.",
      ctaText: "EXPLORE NOW",
      href: "/collections/lab-grown-diamonds",
      isImplemented: false,
      image: {
        src: "/images/editorial/lab-grown-diamonds.jpg",
        alt: "Model wearing brilliant-cut lab-grown diamond bracelets and a solitaire diamond ring",
        objectPosition: "center",
      },
    },
    {
      id: "tennis-bracelets",
      title: "Tennis Bracelets",
      description: "Classic tennis bracelets designed for a lifetime.",
      ctaText: "SHOP COLLECTION",
      href: "/collections/tennis-bracelets",
      isImplemented: false,
      image: {
        src: "/images/editorial/tennis-bracelets.jpg",
        alt: "Model in tailored charcoal blazer showcasing a classic diamond tennis bracelet",
        objectPosition: "center",
      },
    },
    {
      id: "garden-variety",
      title: "Garden Variety",
      description: "Add our new arrivals to your weekly lineup.",
      ctaText: "DISCOVER NOW",
      href: "/collections/garden-variety",
      isImplemented: false,
      image: {
        src: "/images/editorial/garden-variety.jpg",
        alt: "Editorial portrait showcasing sparkling floral cluster diamond drop earrings",
        objectPosition: "center",
      },
    },
  ],
};
