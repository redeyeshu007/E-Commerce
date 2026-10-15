import { API_BASE_URL } from "@/lib/api-client";
import { getStoredAdminToken } from "./admin-auth-service";
import type {
  HeroSettingsData,
  HeroSettingsUpdateInput,
  HeroSlot1UpdateInput,
  HeroSlot2UpdateInput,
  HeroSlot3UpdateInput,
  HeroHistoryItem,
} from "@/types/hero";

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
 * Fetches current hero settings for admin management.
 */
export async function fetchAdminHeroSettings(): Promise<HeroSettingsData> {
  const url = `${API_BASE_URL}/hero/admin/settings`;
  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || `Failed to fetch hero settings (HTTP ${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * Updates all or multiple hero slots in a single batch publish operation.
 */
export async function updateAdminHeroSettings(
  data: HeroSettingsUpdateInput
): Promise<HeroSettingsData> {
  const url = `${API_BASE_URL}/hero/admin/settings`;
  const res = await fetch(url, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error?.message || `Failed to update hero settings (HTTP ${res.status})`);
  }

  return json.data;
}

/**
 * Updates a specific hero slot independently.
 */
export async function updateAdminHeroSlot(
  slotId: "heroImage1" | "heroImage2" | "heroImage3",
  data: HeroSlot1UpdateInput | HeroSlot2UpdateInput | HeroSlot3UpdateInput
): Promise<HeroSettingsData> {
  const url = `${API_BASE_URL}/hero/admin/slot/${slotId}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error?.message || `Failed to update ${slotId} (HTTP ${res.status})`);
  }

  return json.data;
}

export interface UploadImageResult {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
}

/**
 * Uploads an image file to the persistent backend storage.
 * Performs client-side MIME checks before sending and catches server-side validation errors.
 */
export async function uploadAdminHeroImage(file: File): Promise<UploadImageResult> {
  const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedMimes.includes(file.type.toLowerCase())) {
    throw new Error("Invalid file format. Please upload a JPEG, PNG, or WebP image.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File size exceeds 5MB limit. Please upload a smaller image.");
  }

  const formData = new FormData();
  formData.append("image", file);

  const url = `${API_BASE_URL}/hero/admin/upload`;
  const res = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(false), // Omit Content-Type to let browser set boundary
    credentials: "include",
    body: formData,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error?.message || `Image upload failed (HTTP ${res.status})`);
  }

  return json.data;
}

/**
 * Fetches independent history records for a specific hero slot.
 */
export async function fetchAdminHeroHistory(
  slotId: "heroImage1" | "heroImage2" | "heroImage3"
): Promise<HeroHistoryItem[]> {
  const url = `${API_BASE_URL}/hero/admin/history?slotId=${slotId}`;
  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody?.error?.message || `Failed to fetch history for ${slotId} (HTTP ${res.status})`
    );
  }

  const json = await res.json();
  return json.data;
}

/**
 * Restores a specific version of a hero slot independently.
 */
export async function restoreAdminHeroSlot(
  slotId: "heroImage1" | "heroImage2" | "heroImage3",
  version: number
): Promise<HeroSettingsData> {
  const url = `${API_BASE_URL}/hero/admin/restore`;
  const res = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify({ slotId, version }),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      json?.error?.message || `Failed to restore ${slotId} v${version} (HTTP ${res.status})`
    );
  }

  return json.data;
}
