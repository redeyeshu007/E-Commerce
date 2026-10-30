import { type GstSetting } from "@/types/gst";
import { API_BASE_URL } from "@/lib/api-client";
import { getStoredAdminToken } from "./admin-auth-service";

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

export class GstAdminService {
  /**
   * Retrieves active global GST setting
   */
  static async getGstSetting(): Promise<GstSetting> {
    const res = await fetch(`${API_BASE_URL}/gst/settings`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to retrieve GST settings");
    }

    return body.data.setting;
  }

  /**
   * Updates global GST percentage in MongoDB
   */
  static async updateGstSetting(payload: {
    percentage: number;
    isInclusive?: boolean;
  }): Promise<GstSetting> {
    const res = await fetch(`${API_BASE_URL}/gst/admin/settings`, {
      method: "PUT",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body?.error?.message || "Failed to update GST settings");
    }

    return body.data.setting;
  }
}
