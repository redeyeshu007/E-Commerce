"use client";

import { useState, useEffect, useMemo } from "react";
import { defaultHeroSettingsData, type HeroSettingsData } from "@/types/hero";
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
export function useHeroSettings(initialData?: HeroSettingsData) {
  const [data, setData] = useState<HeroSettingsData>(initialData ?? defaultHeroSettingsData);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      try {
        const settings = await fetchPublicHeroSettings();
        if (isMounted && settings) {
          setData(settings);
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

    return () => {
      isMounted = false;
      window.removeEventListener("focus", handleSync);
      window.removeEventListener(HERO_SETTINGS_UPDATED_EVENT, handleSync);
    };
  }, []);

  const config = useMemo(() => transformHeroSettingsToConfig(data), [data]);

  return { data, config, isLoading, isError };
}
