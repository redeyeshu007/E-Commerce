"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api-client";
import { defaultNavbarSettingsData, type NavbarSettingsData } from "@/types/navbar";

export const NAVBAR_SETTINGS_QUERY_KEY = ["navbar-settings"] as const;
export const NAVBAR_SETTINGS_UPDATED_EVENT = "peralagae:navbar-settings-updated";

/**
 * Fetches the currently published navbar configuration from the public endpoint.
 * Returns default fallback values if the request fails or backend is unreachable.
 */
export async function fetchPublicNavbarSettings(): Promise<NavbarSettingsData | null> {
  const url = `${API_BASE_URL}/navbar`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to retrieve navbar settings from database API: ${res.status}`);
  }

  const json = await res.json();
  if (json?.success && json?.data) {
    return json.data as NavbarSettingsData;
  }

  return null;
}

/**
 * Prerender-safe hook for storefront navbar settings.
 *
 * Avoids evaluating unstable Date.now() / clocks during Next.js SSR/prerender passes.
 * Uses initial baseline during prerendering, then asynchronously syncs latest published
 * settings inside useEffect on the client.
 */
export function useNavbarSettings(initialData?: NavbarSettingsData) {
  const [data, setData] = useState<NavbarSettingsData | null>(initialData ?? null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      try {
        const settings = await fetchPublicNavbarSettings();
        if (isMounted) {
          if (settings) {
            setData(settings);
          }
          setIsError(false);
        }
      } catch (err) {
        if (isMounted) {
          setIsError(true);
          console.error("Safe error: Failed to retrieve authoritative navbar settings from database:", err);
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
    window.addEventListener(NAVBAR_SETTINGS_UPDATED_EVENT, handleSync);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", handleSync);
      window.removeEventListener(NAVBAR_SETTINGS_UPDATED_EVENT, handleSync);
    };
  }, []);

  return { data, isLoading, isError };
}
