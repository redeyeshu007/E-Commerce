"use client";

import { useState, useEffect, useMemo } from "react";
import { defaultHeroSettingsData, type HeroSettingsData } from "@/types/hero";
import type { CategoryItem } from "@/types/category";
import {
  fetchPublicCategories,
  CATEGORIES_UPDATED_EVENT,
} from "@/services/category-public-service";
import {
  fetchPublicHeroSettings,
  transformHeroSettingsToConfig,
  HERO_SETTINGS_UPDATED_EVENT,
} from "@/services/hero-settings-service";

/**
 * Prerender-safe hook for storefront hero banner settings.
 *
 * Uses initial baseline during prerendering, then asynchronously syncs latest published
 * settings inside useEffect on the client, and listens to instant updates.
 */
export function useHeroSettings(
  initialData?: HeroSettingsData,
  initialCategories?: CategoryItem[]
) {
  const [data, setData] = useState<HeroSettingsData>(initialData ?? defaultHeroSettingsData);
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      try {
        const [settings, fetchedCategories] = await Promise.all([
          fetchPublicHeroSettings(),
          fetchPublicCategories(),
        ]);
        if (isMounted) {
          if (settings) {
            setData(settings);
          }
          if (fetchedCategories && fetchedCategories.length > 0) {
            setCategories(fetchedCategories);
          }
        }
      } catch {
        if (isMounted) {
          setIsError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    const handleSync = () => {
      load();
    };

    window.addEventListener("focus", handleSync);
    window.addEventListener(HERO_SETTINGS_UPDATED_EVENT, handleSync);
    window.addEventListener(CATEGORIES_UPDATED_EVENT, handleSync);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", handleSync);
      window.removeEventListener(HERO_SETTINGS_UPDATED_EVENT, handleSync);
      window.removeEventListener(CATEGORIES_UPDATED_EVENT, handleSync);
    };
  }, []);

  // Update initial categories if provided or changed
  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories);
    }
  }, [initialCategories]);

  const config = useMemo(
    () => transformHeroSettingsToConfig(data, categories),
    [data, categories]
  );

  return { data, categories, config, isLoading, isError };
}
