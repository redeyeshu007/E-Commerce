import { API_BASE_URL } from "@/lib/api-client";
import { getStoredAdminToken } from "./admin-auth-service";
import type {
  CategoryItem,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "@/types/category";

function getAuthHeaders(includeContentType = true): HeadersInit {
  const token = getStoredAdminToken();
  const headers: Record<string, string> = {};
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Fetches all categories for admin management (including inactive) with authoritative product counts.
 */
export async function fetchAdminCategories(): Promise<CategoryItem[]> {
  const url = `${API_BASE_URL}/categories/admin/list`;
  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || `Failed to fetch categories (HTTP ${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * Creates a new category.
 */
export async function createAdminCategory(data: CreateCategoryPayload): Promise<CategoryItem> {
  const url = `${API_BASE_URL}/categories/admin`;
  const res = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error?.message || `Failed to create category (HTTP ${res.status})`);
  }

  return json.data;
}

/**
 * Updates an existing category. Preserves stable category ID and product associations.
 */
export async function updateAdminCategory(
  id: string,
  data: UpdateCategoryPayload
): Promise<CategoryItem> {
  const url = `${API_BASE_URL}/categories/admin/${id}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error?.message || `Failed to update category (HTTP ${res.status})`);
  }

  return json.data;
}

/**
 * Reorders categories sequentially based on ordered category IDs array.
 */
export async function reorderAdminCategories(orderedIds: string[]): Promise<CategoryItem[]> {
  const url = `${API_BASE_URL}/categories/admin/reorder`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify({ orderedIds }),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error?.message || `Failed to reorder categories (HTTP ${res.status})`);
  }

  return json.data;
}

/**
 * Permanently deletes a category and cascades deletion to all associated products.
 */
export async function deleteAdminCategory(
  id: string
): Promise<{ deletedCategory: CategoryItem; deletedProductCount: number }> {
  const url = `${API_BASE_URL}/categories/admin/${id}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error?.message || `Failed to delete category (HTTP ${res.status})`);
  }

  return json.data;
}

/**
 * Uploads a category image file to persistent storage with 5MB validation.
 */
export async function uploadAdminCategoryImage(
  file: File
): Promise<{ url: string; filename: string; mimetype: string; size: number }> {
  const url = `${API_BASE_URL}/categories/admin/upload-image`;
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(false),
    credentials: "include",
    body: formData,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error?.message || `Failed to upload category image (HTTP ${res.status})`);
  }

  return json.data;
}
