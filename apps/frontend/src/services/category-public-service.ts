import { API_BASE_URL, getBackendOrigin } from "@/lib/api-client";
import type { CategoryItem } from "@/types/category";

export const CATEGORIES_QUERY_KEY = ["categories"] as const;
export const CATEGORIES_UPDATED_EVENT = "peralagae:categories-updated";

/**
 * Fetches public active categories for the storefront.
 */
export async function fetchPublicCategories(): Promise<CategoryItem[]> {
  const isServer = typeof window === "undefined";
  const hasWindowOrigin =
    typeof window !== "undefined" &&
    Boolean(window.location?.origin && window.location.origin !== "null");
  const baseUrl = isServer || !hasWindowOrigin ? getBackendOrigin() : "";
  const url = `${baseUrl}/api/v1/categories`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return [];
    }

    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}
