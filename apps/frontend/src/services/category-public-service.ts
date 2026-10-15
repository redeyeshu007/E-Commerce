import { API_BASE_URL } from "@/lib/api-client";
import type { CategoryItem } from "@/types/category";

export const CATEGORIES_QUERY_KEY = ["categories"] as const;
export const CATEGORIES_UPDATED_EVENT = "peralagae:categories-updated";

/**
 * Fetches public active categories for the storefront.
 */
export async function fetchPublicCategories(): Promise<CategoryItem[]> {
  const isServer = typeof window === "undefined";
  const baseUrl = isServer
    ? (process.env["INTERNAL_API_URL"] ||
       process.env["NEXT_PUBLIC_BACKEND_URL"] ||
       "http://localhost:4000")
    : "";
  const url = `${baseUrl}/api/v1/categories`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[fetchPublicCategories] Non-200 response: ${res.status}`);
      return [];
    }

    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn("[fetchPublicCategories] Failed to retrieve categories:", err);
    return [];
  }
}
