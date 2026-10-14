import { API_BASE_URL } from "@/lib/api-client";
import { getStoredAdminToken } from "./admin-auth-service";
import type {
  NavbarSettingsData,
  NavbarHistoryItem,
  TopBarConfig,
  SecondNavbarConfig,
} from "@/types/navbar";

function getAuthHeaders(): HeadersInit {
  const token = getStoredAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Fetches current navbar settings for admin management.
 */
export async function fetchAdminNavbarSettings(): Promise<NavbarSettingsData> {
  const url = `${API_BASE_URL}/navbar/admin/settings`;
  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || `Failed to fetch navbar settings (HTTP ${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * Updates Top Bar announcement settings.
 */
export async function updateAdminTopBar(
  data: Partial<TopBarConfig> & { description?: string }
): Promise<NavbarSettingsData> {
  const url = `${API_BASE_URL}/navbar/admin/top-bar`;
  const res = await fetch(url, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error?.message || `Failed to update Top Bar (HTTP ${res.status})`);
  }

  return json.data;
}

/**
 * Updates Second Navbar settings.
 */
export async function updateAdminSecondNavbar(
  data: Partial<SecondNavbarConfig> & { description?: string }
): Promise<NavbarSettingsData> {
  const url = `${API_BASE_URL}/navbar/admin/second-navbar`;
  const res = await fetch(url, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error?.message || `Failed to update Second Navbar (HTTP ${res.status})`);
  }

  return json.data;
}

/**
 * Fetches content version history for navbar.
 */
export async function fetchAdminNavbarHistory(): Promise<NavbarHistoryItem[]> {
  const url = `${API_BASE_URL}/navbar/admin/history`;
  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || `Failed to fetch history (HTTP ${res.status})`);
  }

  const json = await res.json();
  return json.data;
}

/**
 * Restores a historical version snapshot.
 */
export async function restoreAdminNavbarVersion(
  historyId: string,
  section?: "top_bar" | "second_navbar"
): Promise<NavbarSettingsData> {
  const url = `${API_BASE_URL}/navbar/admin/history/${historyId}/restore`;
  const res = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: section ? JSON.stringify({ section }) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error?.message || `Failed to restore version snapshot (HTTP ${res.status})`);
  }

  return json.data;
}
