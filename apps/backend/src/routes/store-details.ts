import { Router, type Request, type Response } from "express";
import { z } from "zod";
import type { EnvConfig } from "../config/env.js";
import { createAdminAuthMiddleware } from "../middleware/admin-auth.js";
import { StoreDetailsService } from "../services/store-details-service.js";
import { logger } from "../utils/logger.js";

/**
 * Validation schema for Store Details.
 * Strictly enforces EXACTLY three editable fields: Phone Number, Address, and Email Address.
 */
export const updateStoreDetailsSchema = z.object({
  phone: z
    .string({ required_error: "Phone number is required" })
    .trim()
    .min(7, "Phone number must be at least 7 characters")
    .max(30, "Phone number cannot exceed 30 characters")
    .regex(/^[+0-9\s\-().]+$/, "Phone number contains invalid characters"),
  address: z
    .string({ required_error: "Address is required" })
    .trim()
    .min(3, "Address must be at least 3 characters")
    .max(500, "Address cannot exceed 500 characters"),
  email: z
    .string({ required_error: "Email address is required" })
    .trim()
    .email("Please provide a valid email address")
    .max(100, "Email cannot exceed 100 characters"),
});

export function createStoreDetailsRouter(env: EnvConfig): Router {
  const router = Router();
  const requireAdminAuth = createAdminAuthMiddleware(env);

  // ── Public Storefront Endpoints ───────────────────────────────────────────

  /**
   * GET /api/v1/store-details
   * Public endpoint to retrieve current store details for the storefront footer.
   */
  router.get("/", async (_req: Request, res: Response) => {
    try {
      const details = await StoreDetailsService.getStoreDetails();
      return res.status(200).json({
        success: true,
        data: details,
      });
    } catch (err) {
      logger.error({ err }, "[StoreDetailsRoute] Failed to fetch store details");
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch store details",
        },
      });
    }
  });

  // ── Admin Protected Endpoints ─────────────────────────────────────────────

  /**
   * GET /api/v1/store-details/admin
   * Retrieves current store details for the admin management form.
   */
  router.get("/admin", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const details = await StoreDetailsService.getStoreDetails();
      return res.status(200).json({
        success: true,
        data: details,
      });
    } catch (err) {
      logger.error({ err }, "[StoreDetailsRoute] Admin failed to fetch store details");
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch store details",
        },
      });
    }
  });

  /**
   * PUT /api/v1/store-details/admin
   * Updates phone, address, and email in the database singleton.
   */
  router.put("/admin", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const parsed = updateStoreDetailsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid store details payload",
            details: parsed.error.issues,
          },
        });
      }

      const updatedBy = req.admin?.email || "admin";
      const updated = await StoreDetailsService.updateStoreDetails(parsed.data, updatedBy);

      return res.status(200).json({
        success: true,
        data: updated,
        message: "Store details updated successfully",
      });
    } catch (err) {
      logger.error({ err }, "[StoreDetailsRoute] Admin failed to update store details");
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update store details",
        },
      });
    }
  });

  return router;
}
