import { API_BASE_URL, getBackendOrigin } from "@/lib/api-client";
import { defaultHeroSettingsData, type HeroSettingsData } from "@/types/hero";
import {
  type HeroBannersConfig,
  defaultHeroBannersConfig,
} from "@/config/hero-banners";

export const HERO_SETTINGS_QUERY_KEY = ["hero-settings"] as const;
export const HERO_SETTINGS_UPDATED_EVENT = "peralagae:hero-settings-updated";

import type { CategoryItem } from "@/types/category";

/**
 * Resolves the destination URL for a hero slot CTA button.
 * - Resolves to /shop?category=${category.slug} from the selected category record.
 * - If the category was selected but is deleted/unavailable, safely falls back to /shop.
 * - If no category was selected, falls back to the default banner href.
 */
export function resolveHeroCtaHref(
  slot: { categoryId?: string | null; categorySlug?: string | null },
  defaultHref: string,
  categories?: CategoryItem[]
): string {
  if (!slot.categoryId) {
    return defaultHref;
  }

  if (categories && categories.length > 0) {
    const match = categories.find(
      (c) =>
        c.id === slot.categoryId ||
        c.slug === slot.categoryId ||
        (slot.categorySlug && c.slug === slot.categorySlug)
    );
    if (match) {
      return `/shop?category=${encodeURIComponent(match.slug)}`;
    }
    // Selected category is not available or deleted — fall back safely to shop
    return "/shop";
  }

  // If category list is not yet loaded, fall back to stored slug if available
  if (slot.categorySlug) {
    return `/shop?category=${encodeURIComponent(slot.categorySlug)}`;
  }

  return defaultHref;
}

/**
 * Transforms backend HeroSettingsData into the frontend HeroBannersConfig
 * format expected by the HeroBanners component, preserving all CTA buttons and destinations.
 */
export function transformHeroSettingsToConfig(
  settings: HeroSettingsData,
  categories?: CategoryItem[]
): HeroBannersConfig {
  return {
    featuredBanner: {
      id: "hero-featured-necklaces",
      subheading: settings.heroImage1.normalHeadline,
      title: settings.heroImage1.boldHeadline,
      description: settings.heroImage1.description,
      cta: {
        ...defaultHeroBannersConfig.featuredBanner.cta,
        href: resolveHeroCtaHref(
          settings.heroImage1,
          defaultHeroBannersConfig.featuredBanner.cta.href,
          categories
        ),
      },
      image: {
        src: settings.heroImage1.imageUrl,
        alt:
          settings.heroImage1.imageAlt ||
          `${settings.heroImage1.normalHeadline} ${settings.heroImage1.boldHeadline} - PERALAGAE`,
        objectPosition:
          defaultHeroBannersConfig.featuredBanner.image.objectPosition || "80% top",
      },
      priority: true,
    },
    secondaryTopBanner: {
      id: "hero-secondary-desk-hals",
      subheading: settings.heroImage2.normalHeadline,
      title: settings.heroImage2.boldHeadline,
      cta: {
        ...defaultHeroBannersConfig.secondaryTopBanner.cta,
        href: resolveHeroCtaHref(
          settings.heroImage2,
          defaultHeroBannersConfig.secondaryTopBanner.cta.href,
          categories
        ),
      },
      image: {
        src: settings.heroImage2.imageUrl,
        alt:
          settings.heroImage2.imageAlt ||
          `${settings.heroImage2.normalHeadline} ${settings.heroImage2.boldHeadline} - PERALAGAE`,
        objectPosition:
          defaultHeroBannersConfig.secondaryTopBanner.image.objectPosition || "85% top",
      },
      priority: false,
    },
    secondaryBottomBanner: {
      id: "hero-secondary-charm-bracelets",
      subheading: settings.heroImage3.normalHeadline,
      title: settings.heroImage3.boldHeadline,
      cta: {
        ...defaultHeroBannersConfig.secondaryBottomBanner.cta,
        href: resolveHeroCtaHref(
          settings.heroImage3,
          defaultHeroBannersConfig.secondaryBottomBanner.cta.href,
          categories
        ),
      },
      image: {
        src: settings.heroImage3.imageUrl,
        alt:
          settings.heroImage3.imageAlt ||
          `${settings.heroImage3.normalHeadline} ${settings.heroImage3.boldHeadline} - PERALAGAE`,
        objectPosition:
          defaultHeroBannersConfig.secondaryBottomBanner.image.objectPosition || "90% top",
      },
      priority: false,
    },
  };
}

/**
 * Fetches the currently published hero settings from the public endpoint.
 * Works seamlessly both on the server (SSR / Server Component) and in the browser.
 * Returns default fallback values if the request fails or backend is unreachable.
 */
export async function fetchPublicHeroSettings(
  retries: number = 3,
  delayMs: number = 2000,
): Promise<HeroSettingsData | null> {
  const isServer = typeof window === "undefined";
  const url = isServer
    ? `${getBackendOrigin()}/api/v1/hero`
    : (typeof window !== "undefined" && window.location?.origin ? "/api/v1/hero" : `${getBackendOrigin()}/api/v1/hero`);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      if (
        [502, 503, 504].includes(res.status) &&
        retries > 0 &&
        !isServer &&
        !process.env["VITEST"]
      ) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return fetchPublicHeroSettings(retries - 1, delayMs * 1.5);
      }
      return null;
    }

    const json = await res.json();
    if (json?.success && json?.data) {
      return json.data as HeroSettingsData;
    }
  } catch (err) {
    if (retries > 0 && !isServer && !process.env["VITEST"]) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return fetchPublicHeroSettings(retries - 1, delayMs * 1.5);
    }
    return null;
  }

  return null;
}
