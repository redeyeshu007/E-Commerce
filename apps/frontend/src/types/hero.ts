/**
 * Hero Images Management Types — PERALAGAE
 *
 * Types for the three independently editable hero image slots:
 * - Hero Image 1: Large left column banner (tall, full height)
 * - Hero Image 2: Upper right banner (landscape)
 * - Hero Image 3: Lower right banner (landscape)
 */

export interface HeroImageSlot1 {
  id: "heroImage1";
  name: "Hero Image 1";
  imageUrl: string;
  imageAlt: string;
  normalHeadline: string;
  boldHeadline: string;
  description: string;
  categoryId?: string | null;
  categorySlug?: string | null;
}

export interface HeroImageSlot2 {
  id: "heroImage2";
  name: "Hero Image 2";
  imageUrl: string;
  imageAlt: string;
  normalHeadline: string;
  boldHeadline: string;
  categoryId?: string | null;
  categorySlug?: string | null;
}

export interface HeroImageSlot3 {
  id: "heroImage3";
  name: "Hero Image 3";
  imageUrl: string;
  imageAlt: string;
  normalHeadline: string;
  boldHeadline: string;
  categoryId?: string | null;
  categorySlug?: string | null;
}

export interface HeroSettingsData {
  id: string;
  heroImage1: HeroImageSlot1;
  heroImage2: HeroImageSlot2;
  heroImage3: HeroImageSlot3;
  version: number;
  heroImage1Version: number;
  heroImage2Version: number;
  heroImage3Version: number;
  updatedAt: string;
  updatedBy: string;
}

export interface HeroSlot1UpdateInput {
  imageUrl?: string;
  imageAlt?: string;
  normalHeadline?: string;
  boldHeadline?: string;
  description?: string;
  categoryId?: string | null;
  categorySlug?: string | null;
}

export interface HeroSlot2UpdateInput {
  imageUrl?: string;
  imageAlt?: string;
  normalHeadline?: string;
  boldHeadline?: string;
  categoryId?: string | null;
  categorySlug?: string | null;
}

export interface HeroSlot3UpdateInput {
  imageUrl?: string;
  imageAlt?: string;
  normalHeadline?: string;
  boldHeadline?: string;
  categoryId?: string | null;
  categorySlug?: string | null;
}

export interface HeroSettingsUpdateInput {
  heroImage1?: HeroSlot1UpdateInput;
  heroImage2?: HeroSlot2UpdateInput;
  heroImage3?: HeroSlot3UpdateInput;
}

export interface HeroHistoryItem {
  id: string;
  slotId: "heroImage1" | "heroImage2" | "heroImage3";
  version: number;
  imageUrl: string;
  normalHeadline: string;
  boldHeadline: string;
  description?: string;
  categoryId?: string | null;
  categorySlug?: string | null;
  createdAt: string;
  createdBy: string;
  isCurrent?: boolean;
}

export const defaultHeroSettingsData: HeroSettingsData = {
  id: "current",
  heroImage1: {
    id: "heroImage1",
    name: "Hero Image 1",
    imageUrl: "/images/hero/banner-necklaces.jpg",
    imageAlt: "Necklaces & Body Jewels - PERALAGAE",
    normalHeadline: "Necklaces &",
    boldHeadline: "Body Jewels",
    description: "Look to our new season collection for girls.",
  },
  heroImage2: {
    id: "heroImage2",
    name: "Hero Image 2",
    imageUrl: "/images/hero/banner-desk-hals.jpg",
    imageAlt: "Just Lunched Desk The Hals - PERALAGAE",
    normalHeadline: "Just Lunched",
    boldHeadline: "Desk The Hals",
  },
  heroImage3: {
    id: "heroImage3",
    name: "Hero Image 3",
    imageUrl: "/images/hero/banner-charm-bracelets.jpg",
    imageAlt: "Jewelry & Charm Bracelets - PERALAGAE",
    normalHeadline: "Jewelry &",
    boldHeadline: "Charm Bracelets",
  },
  version: 1,
  heroImage1Version: 1,
  heroImage2Version: 1,
  heroImage3Version: 1,
  updatedAt: new Date().toISOString(),
  updatedBy: "system",
};

/**
 * Read-only dimension specifications based on the actual homepage implementation.
 */
export const HERO_SLOT_SPECS = {
  heroImage1: {
    name: "Hero Image 1",
    position: "Left Column (Tall / Full Height)",
    recommendedDimensions: "896 × 1200 px",
    recommendedAspectRatio: "~3:4 Portrait",
    desktopHeight: "Spans ~660px+ (full height of right column)",
  },
  heroImage2: {
    name: "Hero Image 2",
    position: "Upper Right Column",
    recommendedDimensions: "1376 × 768 px",
    recommendedAspectRatio: "~16:9 Landscape",
    desktopHeight: "Min ~314px",
  },
  heroImage3: {
    name: "Hero Image 3",
    position: "Lower Right Column",
    recommendedDimensions: "1376 × 768 px",
    recommendedAspectRatio: "~16:9 Landscape",
    desktopHeight: "Min ~314px",
  },
} as const;
