/**
 * New Collection Configuration — JAVIX JEWELLERY
 *
 * Strongly typed configuration for the New Collection carousel section.
 * Configures the heading, subtitle, auto-rotate interval, and the eight
 * curated fine jewellery products.
 */

import type { Product } from "@/types/product";

export interface NewCollectionConfig {
  /** Centred main heading text (defaults to "New Collection") */
  heading: string;
  /** Subtitle text underneath heading (defaults to "Collect your loves with our newest arrivals.") */
  subtitle: string;
  /** Auto-rotation timer duration in milliseconds (defaults to 10000 / 10s) */
  autoRotateIntervalMs: number;
  /** Curated product catalog entries */
  products: Product[];
}

export const defaultNewCollectionConfig: NewCollectionConfig = {
  heading: "New Collection",
  subtitle: "Collect your loves with our newest arrivals.",
  autoRotateIntervalMs: 10000,
  products: [
    {
      id: "prod-solitaire-pendant",
      slug: "solitaire-diamond-pendant-necklace",
      name: "Solitaire Diamond Pendant Necklace",
      category: "NECKLACES",
      image: {
        src: "/images/products/product-necklaces-solitaire.jpg",
        alt: "Solitaire Diamond Pendant Necklace - 18k Gold & Bezel-set Diamond",
      },
      priceInr: 24999,
      compareAtPriceInr: 29999,
      isNew: true,
      isAvailable: true,
      material: "18k Yellow Gold & Platinum",
      description:
        "A delicate fine link chain cradling a lustrous yellow gold circular pendant with a precision bezel-set brilliant diamond.",
    },
    {
      id: "prod-sculpted-gold-ring",
      slug: "sculpted-18k-yellow-gold-band",
      name: "Sculpted 18k Yellow Gold Band",
      category: "RINGS",
      image: {
        src: "/images/products/product-rings-sculpted-gold.jpg",
        alt: "Sculpted 18k Yellow Gold Band - Mirror-polished Solid Gold",
      },
      priceInr: 18500,
      isHot: true,
      isAvailable: true,
      material: "Solid 18k Yellow Gold",
      description:
        "Substantial solid 18k gold band sculpted with architectural soft chamfers and mirror-polished finish for everyday elegance.",
    },
    {
      id: "prod-dual-tone-bangle",
      slug: "dual-tone-minimalist-bangle",
      name: "Dual-Tone Minimalist Bangle",
      category: "BRACELETS",
      image: {
        src: "/images/products/product-bracelets-dual-tone.jpg",
        alt: "Dual-Tone Minimalist Bangle - Gold & Silver with Pavé Accent",
      },
      priceInr: 32000,
      isNew: true,
      isAvailable: true,
      material: "18k Yellow Gold & Sterling Silver",
      description:
        "Refined oval contour bangle featuring a dual-metal finish and delicate pavé diamond center bar with a secure luxury clasp.",
    },
    {
      id: "prod-pave-teardrop-earrings",
      slug: "pave-diamond-teardrop-earrings",
      name: "Pavé Diamond Teardrop Earrings",
      category: "EARRINGS",
      image: {
        src: "/images/products/product-earrings-pave-diamond.jpg",
        alt: "Pavé Diamond Teardrop Earrings - White Gold Teardrop Huggies",
      },
      priceInr: 28750,
      compareAtPriceInr: 34000,
      isHot: true,
      isAvailable: true,
      material: "14k White Gold & Round Brilliant Diamonds",
      description:
        "Coordinated pair of teardrop huggie earrings encrusted with sparkling micro-pavé diamonds that catch the light from every angle.",
    },
    {
      id: "prod-celestial-charm-bracelet",
      slug: "celestial-sun-heart-charm-bracelet",
      name: "Celestial Sun & Heart Charm Bracelet",
      category: "CHARMS & BANGLES",
      image: {
        src: "/images/products/product-charms-celestial.jpg",
        alt: "Celestial Sun & Heart Charm Bracelet - Multi-charm Gold Link",
      },
      priceInr: 21999,
      isNew: true,
      isAvailable: true,
      material: "18k Yellow & Rose Gold",
      description:
        "Handcrafted link bracelet with three distinctive dangling charms: an embossed sun medallion, dimensional star, and rose gold heart.",
    },
    {
      id: "prod-solitaire-diamond-ring",
      slug: "classic-solitaire-diamond-ring",
      name: "Classic Solitaire Diamond Ring",
      category: "RINGS",
      image: {
        src: "/images/products/product-rings-solitaire-diamond.jpg",
        alt: "Classic Solitaire Diamond Ring - Six-Prong Platinum Crown",
      },
      priceInr: 45000,
      isHot: true,
      isAvailable: true,
      material: "18k Yellow Gold & Platinum",
      description:
        "Signature showpiece engagement ring featuring a sparkling brilliant-cut solitaire diamond held in a classic platinum six-prong crown.",
    },
    {
      id: "prod-emerald-cut-pendant",
      slug: "emerald-cut-solitaire-pendant",
      name: "Emerald Cut Solitaire Pendant",
      category: "NECKLACES",
      image: {
        src: "/images/products/product-necklaces-emerald-cut.jpg",
        alt: "Emerald Cut Solitaire Pendant - Vibrant Green Step-cut Gemstone",
      },
      priceInr: 38500,
      isNew: true,
      isAvailable: true,
      material: "18k Yellow Gold & Natural Colombian Emerald",
      description:
        "Captivating emerald-cut green gemstone encased in a sleek 18k yellow gold bezel setting on a delicate cable chain.",
    },
    {
      id: "prod-diamond-tennis-bracelet",
      slug: "classic-diamond-tennis-bracelet",
      name: "Classic Diamond Tennis Bracelet",
      category: "BRACELETS",
      image: {
        src: "/images/products/product-bracelets-diamond-tennis.jpg",
        alt: "Classic Diamond Tennis Bracelet - Continuous Brilliant Diamonds",
      },
      priceInr: 56000,
      isHot: true,
      isAvailable: true,
      material: "Platinum & 2.0ctw Diamonds",
      description:
        "Timeless line bracelet featuring a continuous circle of four-prong set round brilliant diamonds with an invisible box-lock clasp.",
    },
  ],
};
