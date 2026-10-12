/**
 * Brand Identity Configuration — PERALAGAE
 *
 * Central source of truth for the brand identity, typography tokens,
 * meta tags, tagline, and customer-facing identifiers.
 */

export const brandConfig = {
  /** Primary uppercase wordmark: PERALAGAE */
  name: "PERALAGAE",

  /** Natural title case for sentences: Peralagae */
  titleCase: "Peralagae",

  /** Descriptive brand representation where appropriate */
  fullName: "PERALAGAE JEWELLERY",

  /** Approved brand tagline */
  tagline: "Designed in India. Crafted with timeless elegance.",

  /** Default browser tab title */
  metaTitle: "Peralagae Jewellery",

  /** Default meta description */
  metaDescription: "PERALAGAE — Luxury Gold & Fine Jewellery. Designed in India. Crafted with timeless elegance.",

  /** Copyright information */
  copyrightYear: 2026,
  copyrightText: "© 2026 PERALAGAE. All Rights Reserved.",

  /** Support & inquiry email */
  contactEmail: "contact@peralagae.com",
} as const;

export type BrandConfig = typeof brandConfig;
