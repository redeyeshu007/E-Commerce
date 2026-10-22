import { API_BASE_URL, getBackendOrigin } from "@/lib/api-client";
import { defaultNavbarSettingsData, type NavbarSettingsData } from "@/types/navbar";

export const NAVBAR_SETTINGS_QUERY_KEY = ["navbar-settings"] as const;
export const NAVBAR_SETTINGS_UPDATED_EVENT = "peralagae:navbar-settings-updated";

/**
 * Fetches the currently published navbar configuration from the public endpoint.
 * Returns null if the request fails or backend is unreachable, allowing components
 * to render appropriate loading/fallback states without throwing unhandled console errors.
 *
 * Safe to call from Server Components, Route Handlers, and client services.
 */
export async function fetchPublicNavbarSettings(
  retries: number = 3,
  delayMs: number = 2000,
): Promise<NavbarSettingsData | null> {
  const isBrowser =
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    typeof process !== "undefined" &&
    !process.env?.VITEST;
  const baseUrl = isBrowser ? "" : getBackendOrigin();
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
      if ([502, 503, 504].includes(res.status) && retries > 0 && isBrowser) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return fetchPublicNavbarSettings(retries - 1, delayMs * 1.5);
      }
      console.warn(`[fetchPublicNavbarSettings] Non-200 response: ${res.status}`);
      return null;
    }

    const json = await res.json();
    if (json?.success && json?.data) {
      return json.data as NavbarSettingsData;
    }

    return null;
  } catch (err) {
    if (retries > 0 && isBrowser) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return fetchPublicNavbarSettings(retries - 1, delayMs * 1.5);
    }
    console.warn("[fetchPublicNavbarSettings] Failed to retrieve navbar settings:", err);
    return null;
  }
}
