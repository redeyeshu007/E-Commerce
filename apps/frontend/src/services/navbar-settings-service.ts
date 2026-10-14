import React from "react";
import { QueryClientContext, useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/api-client";
import { defaultNavbarSettingsData, type NavbarSettingsData } from "@/types/navbar";

export const NAVBAR_SETTINGS_QUERY_KEY = ["navbar-settings"] as const;

/**
 * Fetches the currently published navbar configuration from the public endpoint.
 * Returns default fallback values if the request fails or backend is unreachable.
 */
export async function fetchPublicNavbarSettings(): Promise<NavbarSettingsData> {
  const url = `${API_BASE_URL}/navbar`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return defaultNavbarSettingsData;
    }

    const json = await res.json();
    if (json?.success && json?.data) {
      return json.data as NavbarSettingsData;
    }
  } catch {
    // Graceful fallback to baseline navigation configuration
  }

  return defaultNavbarSettingsData;
}

/**
 * TanStack Query hook for storefront navbar settings.
 * Refetches on window focus and reconnect, with initialData from default configuration.
 * Safely defaults to baseline navigation data if QueryClientContext is not present.
 */
export function useNavbarSettings(initialData?: NavbarSettingsData) {
  const client = React.useContext(QueryClientContext);

  if (!client) {
    return {
      data: initialData ?? defaultNavbarSettingsData,
      isLoading: false,
      isError: false,
    };
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useQuery({
    queryKey: NAVBAR_SETTINGS_QUERY_KEY,
    queryFn: fetchPublicNavbarSettings,
    initialData: initialData ?? defaultNavbarSettingsData,
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
  });
}
