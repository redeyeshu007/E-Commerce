"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL, getBackendOrigin } from "@/lib/api-client";
import { defaultNavbarSettingsData, type NavbarSettingsData } from "@/types/navbar";

export const NAVBAR_SETTINGS_QUERY_KEY = ["navbar-settings"] as const;
export const NAVBAR_SETTINGS_UPDATED_EVENT = "peralagae:navbar-settings-updated";

/**
 * Fetches the currently published navbar configuration from the public endpoint.
 * Returns null if the request fails or backend is unreachable, allowing components
 * to render appropriate loading/fallback states without throwing unhandled console errors.
 */
export async function fetchPublicNavbarSettings(): Promise<NavbarSettingsData | null> {
  const isServer = typeof window === "undefined";
  const baseUrl = isServer
    ? getBackendOrigin()
    : (typeof window !== "undefined" && window.location?.origin ? "" : getBackendOrigin());
  const url = `${baseUrl}/api/v1/navbar`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[fetchPublicNavbarSettings] Non-200 response: ${res.status}`);
      return null;
    }

    const json = await res.json();
    if (json?.success && json?.data) {
      return json.data as NavbarSettingsData;
    }

    return null;
  } catch (err) {
    console.warn("[fetchPublicNavbarSettings] Failed to retrieve navbar settings:", err);
    return null;
  }
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
            setIsError(false);
          } else if (!data) {
            setIsError(true);
          }
        }
      } catch (err) {
        if (isMounted) {
          setIsError(true);
          console.warn("Could not retrieve authoritative navbar settings from database:", err);
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
