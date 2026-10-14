import { Router, type Request, type Response } from "express";
import { z } from "zod";
import type { EnvConfig } from "../config/env.js";
import { createAdminAuthMiddleware } from "../middleware/admin-auth.js";
import { NavbarService } from "../services/navbar-service.js";

const topBarUpdateSchema = z.object({
  text: z.string().trim().min(1, "Announcement text is required").max(250, "Announcement text must not exceed 250 characters"),
  backgroundColor: z.string().trim().optional(),
  textColor: z.string().trim().optional(),
  visible: z.boolean().optional(),
  dismissible: z.boolean().optional(),
  description: z.string().trim().max(200).optional(),
});

const secondNavbarLinkSchema = z.object({
  id: z.string().trim().min(1, "Link ID is required"),
  label: z.string().trim().min(1, "Link label is required").max(50, "Link label must not exceed 50 characters"),
  href: z.string().trim().min(1, "Link URL is required"),
  isImplemented: z.boolean().default(true),
});

const secondNavbarUpdateSchema = z.object({
  phone: z.string().trim().max(30, "Phone number must not exceed 30 characters"),
  phoneHref: z.string().trim().optional(),
  promoText: z.string().trim().min(1, "Promotional message is required").max(120, "Promotional message must not exceed 120 characters"),
  ctaText: z.string().trim().max(40, "CTA label must not exceed 40 characters"),
  ctaHref: z.string().trim().min(1, "CTA destination URL is required"),
  links: z.array(secondNavbarLinkSchema).min(1, "At least one navigation link is required"),
  showPhone: z.boolean().optional(),
  showPromotion: z.boolean().optional(),
  showLinks: z.boolean().optional(),
  description: z.string().trim().max(200).optional(),
});

/**
 * Creates the Navbar Router for storefront and admin endpoints.
 */
export function createNavbarRouter(env: EnvConfig): Router {
  const router = Router();
  const requireAdminAuth = createAdminAuthMiddleware(env);

  // ── Public Storefront Route ────────────────────────────────────────────────
  /**
   * GET /api/v1/navbar
   * Returns currently published navbar settings for the storefront.
   */
  router.get("/", async (_req: Request, res: Response) => {
    try {
      const settings = await NavbarService.getSettings();
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch {
      res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to retrieve navbar settings",
        },
      });
    }
  });

  // ── Admin Protected Routes ─────────────────────────────────────────────────

  /**
   * GET /api/v1/navbar/admin/settings
   * Admin inspection of current settings.
   */
  router.get("/admin/settings", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const settings = await NavbarService.getSettings();
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch {
      res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to retrieve admin navbar settings",
        },
      });
    }
  });

  /**
   * PUT /api/v1/navbar/admin/top-bar
   * Updates Top Bar announcement settings, snapshotting previous state.
   */
  router.put("/admin/top-bar", requireAdminAuth, async (req: Request, res: Response) => {
    const parseResult = topBarUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parseResult.error.issues[0]?.message || "Invalid Top Bar data format",
        },
      });
      return;
    }

    try {
      const adminEmail = req.admin?.email || env.ADMIN_EMAIL;
      const updated = await NavbarService.updateTopBar(
        parseResult.data,
        adminEmail,
        parseResult.data.description
      );

      res.status(200).json({
        success: true,
        message: "Top Bar updated and published successfully",
        data: updated,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: {
          code: "UPDATE_FAILED",
          message: err instanceof Error ? err.message : "Failed to update Top Bar",
        },
      });
    }
  });

  /**
   * PUT /api/v1/navbar/admin/second-navbar
   * Updates Second Navbar settings, snapshotting previous state.
   */
  router.put("/admin/second-navbar", requireAdminAuth, async (req: Request, res: Response) => {
    const parseResult = secondNavbarUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parseResult.error.issues[0]?.message || "Invalid Second Navbar data format",
        },
      });
      return;
    }

    try {
      const adminEmail = req.admin?.email || env.ADMIN_EMAIL;
      const updated = await NavbarService.updateSecondNavbar(
        parseResult.data,
        adminEmail,
        parseResult.data.description
      );

      res.status(200).json({
        success: true,
        message: "Second Navbar updated and published successfully",
        data: updated,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: {
          code: "UPDATE_FAILED",
          message: err instanceof Error ? err.message : "Failed to update Second Navbar",
        },
      });
    }
  });

  /**
   * GET /api/v1/navbar/admin/history
   * Lists historical snapshots.
   */
  router.get("/admin/history", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const history = await NavbarService.getHistory();
      res.status(200).json({
        success: true,
        data: history,
      });
    } catch {
      res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to retrieve navbar version history",
        },
      });
    }
  });

  /**
   * POST /api/v1/navbar/admin/history/:id/restore
   * Restores a previously saved snapshot and publishes it.
   */
  router.post("/admin/history/:id/restore", requireAdminAuth, async (req: Request, res: Response) => {
    const rawId = req.params["id"];
    const historyId = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : "";
    if (!historyId) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_ID",
          message: "Version history ID is required",
        },
      });
      return;
    }

    try {
      const adminEmail = req.admin?.email || env.ADMIN_EMAIL;
      const explicitSection = req.body?.section as "top_bar" | "second_navbar" | "full" | undefined;
      const restored = await NavbarService.restoreHistory(historyId, adminEmail, explicitSection);

      res.status(200).json({
        success: true,
        message: `Version successfully restored and published as v${restored.version}`,
        data: restored,
      });
    } catch (err) {
      res.status(404).json({
        success: false,
        error: {
          code: "RESTORE_FAILED",
          message: err instanceof Error ? err.message : "Failed to restore version snapshot",
        },
      });
    }
  });

  return router;
}
