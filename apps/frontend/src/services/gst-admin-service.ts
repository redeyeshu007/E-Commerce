import { type GstSetting } from "@/types/gst";

export class GstAdminService {
  /**
   * Retrieves active global GST setting
   */
  static async getGstSetting(): Promise<GstSetting> {
    const res = await fetch("/api/v1/gst/settings", {
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
    const res = await fetch("/api/v1/gst/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
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
