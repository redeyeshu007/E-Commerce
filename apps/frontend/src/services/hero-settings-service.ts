import { API_BASE_URL } from "@/lib/api-client";
import { defaultHeroSettingsData, type HeroSettingsData } from "@/types/hero";
import {
  type HeroBannersConfig,
  defaultHeroBannersConfig,
} from "@/config/hero-banners";

export const HERO_SETTINGS_QUERY_KEY = ["hero-settings"] as const;
export const HERO_SETTINGS_UPDATED_EVENT = "peralagae:hero-settings-updated";

/**
 * Transforms backend HeroSettingsData into the frontend HeroBannersConfig
 * format expected by the HeroBanners component, preserving all CTA buttons and destinations.
 */
export function transformHeroSettingsToConfig(
  settings: HeroSettingsData
): HeroBannersConfig {
  return {
    featuredBanner: {
      id: "hero-featured-necklaces",
      subheading: settings.heroImage1.normalHeadline,
      title: settings.heroImage1.boldHeadline,
      description: settings.heroImage1.description,
      cta: defaultHeroBannersConfig.featuredBanner.cta,
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
      cta: defaultHeroBannersConfig.secondaryTopBanner.cta,
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
      cta: defaultHeroBannersConfig.secondaryBottomBanner.cta,
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
export async function fetchPublicHeroSettings(): Promise<HeroSettingsData> {
  const isServer = typeof window === "undefined";
  const backendBase =
    process.env["NEXT_PUBLIC_BACKEND_URL"] ||
    process.env["BACKEND_URL"] ||
    "http://localhost:4000";

  const url = isServer ? `${backendBase}/api/v1/hero` : `${API_BASE_URL}/hero`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return defaultHeroSettingsData;
    }

    const json = await res.json();
    if (json?.success && json?.data) {
      return json.data as HeroSettingsData;
    }
  } catch {
    // Graceful fallback to baseline hero configuration
  }

  return defaultHeroSettingsData;
}
