/**
 * Shop Our Collections Configuration — JAVIX JEWELLERY
 *
 * Configuration-driven architecture separating collection metadata,
 * image references, routes, and ordering from presentation components.
 * Ready for future backend API / CMS integration without component rewrites.
 */

export interface CollectionImageConfig {
  /** Source URL or path to the collection image asset */
  src: string;
  /** Accessible alternative text describing the jewellery piece */
  alt: string;
  /** Optional focal-point CSS position adjustment */
  objectPosition?: string;
}

export interface CollectionItem {
  /** Unique stable collection identifier */
  id: string;
  /** URL slug for the collection */
  slug: string;
  /** Exact uppercase display name (e.g. "NECKLACES", "CHARMS & BANGLES") */
  title: string;
  /** Image configuration with neutral background art direction */
  image: CollectionImageConfig;
  /** Destination route if available */
  href?: string;
  /**
   * Whether the destination route is implemented in the frontend.
   * If false, renders without broken links or dead 404 navigations.
   */
  isImplemented: boolean;
  /** Display sequence / sorting order */
  order: number;
  /** Whether the collection is currently active and published */
  isActive: boolean;
}

export interface CollectionsSectionConfig {
  /** Section heading text. Must read "Shop Our Collections" */
  heading: string;
  /** Array of active collection items in display order */
  items: CollectionItem[];
}

/**
 * Default JAVIX JEWELLERY collections configuration.
 * Strictly reproduces the 6 categories in required order with
 * uniform light-grey catalogue imagery.
 */
export const defaultCollectionsConfig: CollectionsSectionConfig = {
  heading: "Shop Our Collections",
  items: [
    {
      id: "collection-necklaces",
      slug: "necklaces",
      title: "NECKLACES",
      image: {
        src: "/images/collections/collection-necklaces.jpg",
        alt: "Necklaces Collection - Delicate White Gold & Diamond Pendant",
      },
      href: "/category/necklaces",
      isImplemented: false,
      order: 1,
      isActive: true,
    },
    {
      id: "collection-rings",
      slug: "rings",
      title: "RINGS",
      image: {
        src: "/images/collections/collection-rings.jpg",
        alt: "Rings Collection - Sculptural 18k Yellow Gold Band",
      },
      href: "/category/rings",
      isImplemented: false,
      order: 2,
      isActive: true,
    },
    {
      id: "collection-bracelets",
      slug: "bracelets",
      title: "BRACELETS",
      image: {
        src: "/images/collections/collection-bracelets.jpg",
        alt: "Bracelets Collection - Minimalist Dual-Tone Gold & Silver Bangle",
      },
      href: "/category/bracelets",
      isImplemented: false,
      order: 3,
      isActive: true,
    },
    {
      id: "collection-earrings",
      slug: "earrings",
      title: "EARRINGS",
      image: {
        src: "/images/collections/collection-earrings.jpg",
        alt: "Earrings Collection - Coordinated White Gold & Diamond Teardrop Earrings",
      },
      href: "/category/earrings",
      isImplemented: false,
      order: 4,
      isActive: true,
    },
    {
      id: "collection-charms-bangles",
      slug: "charms-bangles",
      title: "CHARMS & BANGLES",
      image: {
        src: "/images/collections/collection-charms-bangles.jpg",
        alt: "Charms & Bangles Collection - Warm Rose Gold Charm Bangle",
      },
      href: "/category/charms-bangles",
      isImplemented: false,
      order: 5,
      isActive: true,
    },
    {
      id: "collection-gift-ideas",
      slug: "gift-ideas",
      title: "GIFT IDEAS",
      image: {
        src: "/images/collections/collection-gift-ideas.jpg",
        alt: "Gift Ideas Collection - Solitaire Diamond Engagement Ring",
      },
      href: "/category/gift-ideas",
      isImplemented: false,
      order: 6,
      isActive: true,
    },
  ],
};
