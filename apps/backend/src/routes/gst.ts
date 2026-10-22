import { Router, type Request, type Response } from "express";
import { z } from "zod";
import type { EnvConfig } from "../config/env.js";
import { createAdminAuthMiddleware } from "../middleware/admin-auth.js";
import { GstService } from "../services/gst-service.js";

const updateGstSchema = z.object({
  percentage: z
    .number({ invalid_type_error: "GST percentage must be a valid number" })
    .min(0, "GST percentage cannot be negative")
    .max(40, "GST percentage cannot exceed 40%"),
  isInclusive: z.boolean().optional().default(true),
});

export function createGstRouter(env: EnvConfig): Router {
  const router = Router();
  const requireAdminAuth = createAdminAuthMiddleware(env);

  /**
   * GET /
   * GET /settings
   * Returns current active GST configuration
   */
  const handleGetGst = async (_req: Request, res: Response) => {
    try {
      const setting = await GstService.getSetting();
      res.status(200).json({
        success: true,
        data: { setting },
      });
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      res.status(error.status || 500).json({
        success: false,
        error: {
          code: error.code || "FETCH_GST_FAILED",
          message: error.message || "Failed to retrieve GST settings",
        },
      });
    }
  };

  router.get("/", handleGetGst);
  router.get("/settings", handleGetGst);

  /**
   * PUT /admin/settings
   * PUT /admin
   * Updates global GST configuration in MongoDB (Admin Only)
   */
  const handleUpdateGst = async (req: Request, res: Response) => {
    const parseResult = updateGstSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parseResult.error.issues[0]?.message || "Invalid GST settings",
        },
      });
      return;
    }

    try {
      const adminIdentifier = req.admin?.email || "admin";
      const updated = await GstService.updateSetting(
        parseResult.data.percentage,
        parseResult.data.isInclusive,
        adminIdentifier
      );

      res.status(200).json({
        success: true,
        data: {
          setting: updated,
          message: `GST rate updated to ${updated.percentage}% successfully.`,
        },
      });
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      res.status(error.status || 500).json({
        success: false,
        error: {
          code: error.code || "UPDATE_GST_FAILED",
          message: error.message || "Failed to update GST settings",
        },
      });
    }
  };

  router.put("/admin/settings", requireAdminAuth, handleUpdateGst);
  router.put("/admin", requireAdminAuth, handleUpdateGst);
  router.put("/", requireAdminAuth, handleUpdateGst);

  return router;
}
