import { API_BASE_URL, getBackendOrigin } from "@/lib/api-client";
import { getStoredAdminToken } from "./admin-auth-service";
import type {
  InstagramSectionConfig,
  InstagramHistoryItem,
  UpdateInstagramSectionPayload,
} from "@/types/instagram";

export const INSTAGRAM_SECTION_QUERY_KEY = ["instagram-section"] as const;
export const INSTAGRAM_SECTION_UPDATED_EVENT = "peralagae:instagram-section-updated";

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
 * Fetches active Instagram section heading, handle, profileUrl, and active images for homepage.
 */
export async function fetchPublicInstagramSection(): Promise<InstagramSectionConfig | null> {
  const baseUrl =
    typeof window !== "undefined" && window.location?.origin && !process.env["VITEST"]
      ? ""
      : getBackendOrigin();
  const url = `${baseUrl}/api/v1/instagram/section`;

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
    console.warn("[InstagramService] Failed to fetch public Instagram section:", err);
    return null;
  }
}

// ── Protected Admin Services ────────────────────────────────────────────────

/**
 * Fetches complete Instagram section configuration including inactive images and version counter.
 */
export async function fetchAdminInstagramSection(): Promise<InstagramSectionConfig> {
  const url = `${API_BASE_URL}/instagram/admin/settings`;

  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || "Failed to fetch Instagram section settings.");
  }

  const json = await res.json();
  return json.data;
}

/**
 * Updates Instagram section settings, images, and creates an independent version snapshot.
 */
export async function updateAdminInstagramSection(
  payload: UpdateInstagramSectionPayload
): Promise<InstagramSectionConfig> {
  const url = `${API_BASE_URL}/instagram/admin/settings`;

  const res = await fetch(url, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || "Failed to update Instagram section.");
  }

  const json = await res.json();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(INSTAGRAM_SECTION_UPDATED_EVENT));
  }

  return json.data;
}

/**
 * Retrieves version history snapshots for the Instagram section.
 */
export async function fetchAdminInstagramHistory(): Promise<InstagramHistoryItem[]> {
  const url = `${API_BASE_URL}/instagram/admin/history`;

  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || "Failed to fetch Instagram section history.");
  }

  const json = await res.json();
  return json.data || [];
}

/**
 * Restores an older version snapshot from Instagram section history.
 */
export async function restoreAdminInstagramVersion(
  historyId: string
): Promise<InstagramSectionConfig> {
  const url = `${API_BASE_URL}/instagram/admin/restore/${historyId}`;

  const res = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || "Failed to restore Instagram version.");
  }

  const json = await res.json();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(INSTAGRAM_SECTION_UPDATED_EVENT));
  }

  return json.data;
}

/**
 * Uploads an image file from the administrator's device.
 */
export async function uploadAdminInstagramImage(
  file: File
): Promise<{ imageUrl: string; filename: string }> {
  const url = `${API_BASE_URL}/instagram/admin/upload-image`;
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
    body: formData,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson?.error?.message || "Failed to upload image file.");
  }

  const json = await res.json();
  return json.data;
}
