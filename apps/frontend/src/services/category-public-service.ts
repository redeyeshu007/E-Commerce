import { API_BASE_URL } from "@/lib/api-client";
import type { CategoryItem } from "@/types/category";

export const CATEGORIES_QUERY_KEY = ["categories"] as const;
export const CATEGORIES_UPDATED_EVENT = "peralagae:categories-updated";

/**
 * Fetches public active categories for the storefront.
 */
export async function fetchPublicCategories(): Promise<CategoryItem[]> {
  const url = `${API_BASE_URL}/categories`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
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
