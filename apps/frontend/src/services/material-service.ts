import { API_BASE_URL, getBackendOrigin } from "@/lib/api-client";
import { getStoredAdminToken } from "./admin-auth-service";
import type {
  MaterialItem,
  MaterialSectionConfig,
  MaterialCardConfig,
  MaterialSectionHistoryItem,
} from "@/types/material";

export const MATERIALS_QUERY_KEY = ["materials"] as const;
export const MATERIAL_SECTION_QUERY_KEY = ["material-section"] as const;
export const MATERIALS_UPDATED_EVENT = "peralagae:materials-updated";
export const MATERIAL_SECTION_UPDATED_EVENT = "peralagae:material-section-updated";

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

// ── Public Storefront Services ──────────────────────────────────────────────

/**
 * Fetches published active materials for public storefront navbar & filters.
 */
export async function fetchPublicMaterials(): Promise<MaterialItem[]> {
  const baseUrl =
    typeof window !== "undefined" && window.location?.origin && !process.env["VITEST"]
      ? ""
      : getBackendOrigin();
  const url = `${baseUrl}/api/v1/materials`;

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
  } catch (err) {
    console.warn("[MaterialService] Failed to fetch public materials:", err);
    return [];
  }
}

/**
 * Fetches active materials section heading and cards for public homepage.
 */
export async function fetchPublicMaterialsSection(): Promise<MaterialSectionConfig | null> {
  const baseUrl =
    typeof window !== "undefined" && window.location?.origin && !process.env["VITEST"]
      ? ""
      : getBackendOrigin();
  const url = `${baseUrl}/api/v1/materials/section`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn("[MaterialService] Failed to fetch public materials section:", err);
    return null;
  }
}

// ── Protected Admin Services ────────────────────────────────────────────────

/**
 * Fetches all materials (including inactive) with product count.
 */
export async function fetchAdminMaterials(search?: string): Promise<MaterialItem[]> {
  const params = new URLSearchParams();
  if (search && search.trim()) {
    params.set("search", search.trim());
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  const url = `${API_BASE_URL}/materials/admin${query}`;

  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || `Failed to fetch materials (HTTP ${res.status})`);
  }

  const json = await res.json();
  return json.data || [];
}

/**
 * Creates a new material.
 */
export async function createAdminMaterial(data: {
  name: string;
  slug?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}): Promise<MaterialItem> {
  const url = `${API_BASE_URL}/materials/admin`;
  const res = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error?.message || `Failed to create material (HTTP ${res.status})`);
  }

  return json.data;
}

/**
 * Updates an existing material.
 */
export async function updateAdminMaterial(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    description: string | null;
    order: number;
    isActive: boolean;
  }>
): Promise<MaterialItem> {
  const url = `${API_BASE_URL}/materials/admin/${id}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error?.message || `Failed to update material (HTTP ${res.status})`);
  }

  return json.data;
}

/**
 * Deletes a material safely.
 */
export async function deleteAdminMaterial(id: string): Promise<void> {
  const url = `${API_BASE_URL}/materials/admin/${id}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 409 && json?.error?.code === "MATERIAL_IN_USE") {
      const err: any = new Error(json.error.message);
      err.code = "MATERIAL_IN_USE";
      err.productCount = json.error.productCount;
      throw err;
    }
    throw new Error(json?.error?.message || `Failed to delete material (HTTP ${res.status})`);
  }
}

/**
 * Reorders materials.
 */
export async function reorderAdminMaterials(orderedIds: string[]): Promise<void> {
  const url = `${API_BASE_URL}/materials/admin/reorder`;
  const res = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify({ orderedIds }),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error?.message || `Failed to reorder materials (HTTP ${res.status})`);
  }
}

/**
 * Fetches full admin materials section setting with cards.
 */
export async function fetchAdminMaterialSection(): Promise<MaterialSectionConfig> {
  const url = `${API_BASE_URL}/materials/admin/section`;
  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || `Failed to fetch materials section (HTTP ${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * Publishes materials section configuration (heading and cards).
 */
export async function updateAdminMaterialSection(data: {
  heading?: string;
  cards?: MaterialCardConfig[];
}): Promise<MaterialSectionConfig> {
  const url = `${API_BASE_URL}/materials/admin/section`;
  const res = await fetch(url, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error?.message || `Failed to publish materials section (HTTP ${res.status})`);
  }

  return json.data;
}

/**
 * Fetches materials section version history snapshots.
 */
export async function fetchAdminMaterialSectionHistory(): Promise<MaterialSectionHistoryItem[]> {
  const url = `${API_BASE_URL}/materials/admin/section/history`;
  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || `Failed to fetch section history (HTTP ${res.status})`);
  }

  const json = await res.json();
  return json.data || [];
}

/**
 * Restores an older version of the materials section.
 */
export async function restoreAdminMaterialSectionVersion(historyId: string): Promise<MaterialSectionConfig> {
  const url = `${API_BASE_URL}/materials/admin/section/restore/${historyId}`;
  const res = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error?.message || `Failed to restore materials section version (HTTP ${res.status})`);
  }

  return json.data;
}

/**
 * Uploads an image from user's device for a material card.
 */
export async function uploadAdminMaterialImage(
  file: File
): Promise<{ imageUrl: string; filename: string; size: number }> {
  const url = `${API_BASE_URL}/materials/admin/upload-image`;
  const formData = new FormData();
  formData.append("image", file);

  const token = getStoredAdminToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    credentials: "include",
    body: formData,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error?.message || `Failed to upload image (HTTP ${res.status})`);
  }

  return json.data;
}
