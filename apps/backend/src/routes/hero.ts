import { Router, type Request, type Response } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { z } from "zod";
import type { EnvConfig } from "../config/env.js";
import { createAdminAuthMiddleware } from "../middleware/admin-auth.js";
import { HeroService } from "../services/hero-service.js";
import { HeroMediaService } from "../services/hero-media-service.js";
import { logger } from "../utils/logger.js";

// Upload destinations
const BACKEND_UPLOADS_DIR = path.resolve(process.cwd(), "uploads", "hero");
const FRONTEND_UPLOADS_DIR = path.resolve(process.cwd(), "..", "frontend", "public", "uploads", "hero");

// Ensure upload directories exist
for (const dir of [BACKEND_UPLOADS_DIR, FRONTEND_UPLOADS_DIR]) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {
    // Directory might be external or relative path differs in test
  }
}

// Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(BACKEND_UPLOADS_DIR)) {
      fs.mkdirSync(BACKEND_UPLOADS_DIR, { recursive: true });
    }
    cb(null, BACKEND_UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const uniqueId = crypto.randomBytes(12).toString("hex");
    cb(null, `hero-${Date.now()}-${uniqueId}${ext}`);
  },
});

// Multer instance with 5MB file size limit
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedMimes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and WebP images are allowed."));
    }
  },
});

/**
 * Validates image magic bytes to verify file authenticity and prevent renamed binaries.
 */
function validateImageMagicBytes(filePath: string): boolean {
  try {
    const buffer = Buffer.alloc(16);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return true;
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return true;
    }

    // WebP: RIFF ... WEBP
    const riff = buffer.subarray(0, 4).toString("ascii");
    const webp = buffer.subarray(8, 12).toString("ascii");
    if (riff === "RIFF" && webp === "WEBP") {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

// Validation schemas for editable fields
const heroSlot1Schema = z.object({
  imageUrl: z.string().trim().min(1, "Image URL is required").optional(),
  imageAlt: z.string().trim().max(150).optional(),
  normalHeadline: z.string().trim().min(1, "Normal headline is required").max(100, "Normal headline must not exceed 100 characters").optional(),
  boldHeadline: z.string().trim().min(1, "Bold headline is required").max(100, "Bold headline must not exceed 100 characters").optional(),
  description: z.string().trim().max(300, "Description must not exceed 300 characters").optional(),
});

const heroSlotSecondarySchema = z.object({
  imageUrl: z.string().trim().min(1, "Image URL is required").optional(),
  imageAlt: z.string().trim().max(150).optional(),
  normalHeadline: z.string().trim().min(1, "Normal headline is required").max(100, "Normal headline must not exceed 100 characters").optional(),
  boldHeadline: z.string().trim().min(1, "Bold headline is required").max(100, "Bold headline must not exceed 100 characters").optional(),
});

const heroSettingsUpdateSchema = z.object({
  heroImage1: heroSlot1Schema.optional(),
  heroImage2: heroSlotSecondarySchema.optional(),
  heroImage3: heroSlotSecondarySchema.optional(),
});

export function createHeroRouter(env: EnvConfig): Router {
  const router = Router();
  const requireAdminAuth = createAdminAuthMiddleware(env);

  // ── Public Storefront Route ───────────────────────────────────────────────
  /**
   * GET /api/v1/hero
   * Returns current published hero settings for the homepage.
   */
  router.get("/", async (_req: Request, res: Response) => {
    try {
      const settings = await HeroService.getSettings();
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch {
      res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to retrieve hero banner settings",
        },
      });
    }
  });

  // ── Admin Protected Routes ────────────────────────────────────────────────
  /**
   * GET /api/v1/hero/admin/settings
   * Admin inspection of current hero settings.
   */
  router.get("/admin/settings", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const settings = await HeroService.getSettings();
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch {
      res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to retrieve hero banner settings",
        },
      });
    }
  });

  /**
   * POST /api/v1/hero/admin/upload
   * Handles persistent image upload with MIME & magic-byte validation.
   */
  router.post(
    "/admin/upload",
    requireAdminAuth,
    (req: Request, res: Response) => {
      upload.single("image")(req, res, async (err: unknown) => {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              success: false,
              error: {
                code: "FILE_TOO_LARGE",
                message: "Image file exceeds the 5MB size limit",
              },
            });
          }
          return res.status(400).json({
            success: false,
            error: {
              code: "UPLOAD_ERROR",
              message: err.message,
            },
          });
        } else if (err instanceof Error) {
          return res.status(400).json({
            success: false,
            error: {
              code: "INVALID_FILE_TYPE",
              message: err.message,
            },
          });
        }

        if (!req.file) {
          return res.status(400).json({
            success: false,
            error: {
              code: "NO_FILE",
              message: "No image file provided in the request",
            },
          });
        }

        const uploadedFilePath = req.file.path;
        const isValidMagic = validateImageMagicBytes(uploadedFilePath);

        if (!isValidMagic) {
          // Clean up corrupt/fake image
          try {
            fs.unlinkSync(uploadedFilePath);
          } catch {
            // Ignore cleanup error
          }
          return res.status(400).json({
            success: false,
            error: {
              code: "INVALID_IMAGE_DATA",
              message: "Uploaded file does not contain valid image data (JPEG, PNG, or WebP expected)",
            },
          });
        }

        const filename = req.file.filename;
        const relativeUrl = `/uploads/hero/${filename}`;

        // Save image binary to PostgreSQL durable object storage
        try {
          const buffer = fs.readFileSync(uploadedFilePath);
          await HeroMediaService.saveAsset(filename, req.file.mimetype, buffer);
        } catch (dbErr) {
          logger.error({ dbErr, filename }, "Failed to persist uploaded image to PostgreSQL");
          try {
            fs.unlinkSync(uploadedFilePath);
          } catch {}
          return res.status(500).json({
            success: false,
            error: {
              code: "STORAGE_ERROR",
              message: "Failed to persist image to durable storage",
            },
          });
        }

        // Also copy to frontend public directory if reachable for immediate dev access
        try {
          if (fs.existsSync(FRONTEND_UPLOADS_DIR)) {
            const frontendDest = path.join(FRONTEND_UPLOADS_DIR, filename);
            fs.copyFileSync(uploadedFilePath, frontendDest);
          }
        } catch (copyErr) {
          logger.warn({ copyErr }, "Could not sync image to frontend public uploads directory");
        }

        return res.status(200).json({
          success: true,
          data: {
            url: relativeUrl,
            filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
          },
        });
      });
    }
  );

  /**
   * PUT /api/v1/hero/admin/slot/:slotId
   * Updates an individual slot independently.
   */
  router.put("/admin/slot/:slotId", requireAdminAuth, async (req: Request, res: Response) => {
    const { slotId } = req.params;

    if (slotId !== "heroImage1" && slotId !== "heroImage2" && slotId !== "heroImage3") {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_SLOT",
          message: "Slot identifier must be 'heroImage1', 'heroImage2', or 'heroImage3'",
        },
      });
    }

    try {
      let validatedInput;
      if (slotId === "heroImage1") {
        const parsed = heroSlot1Schema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: parsed.error.issues[0]?.message || "Validation failed",
              issues: parsed.error.issues,
            },
          });
        }
        validatedInput = parsed.data;
      } else {
        const parsed = heroSlotSecondarySchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: parsed.error.issues[0]?.message || "Validation failed",
              issues: parsed.error.issues,
            },
          });
        }
        validatedInput = parsed.data;
      }

      const adminEmail = req.admin?.email || "admin";
      const updated = await HeroService.updateSlot(slotId, validatedInput, adminEmail);

      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to update hero slot");
      return res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to update hero slot",
        },
      });
    }
  });

  /**
   * PUT /api/v1/hero/admin/settings
   * Updates all or selected slots together in a single publish action.
   */
  router.put("/admin/settings", requireAdminAuth, async (req: Request, res: Response) => {
    const parsed = heroSettingsUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message || "Validation failed",
          issues: parsed.error.issues,
        },
      });
    }

    try {
      const adminEmail = req.admin?.email || "admin";
      const updated = await HeroService.updateSettings(parsed.data, adminEmail);

      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to update hero settings");
      return res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to update hero settings",
        },
      });
    }
  });
  /**
   * GET /api/v1/hero/admin/history
   * Retrieves independent history for a specific slot (?slotId=heroImage1).
   */
  router.get("/admin/history", requireAdminAuth, async (req: Request, res: Response) => {
    const slotId = req.query["slotId"] as string;

    if (slotId !== "heroImage1" && slotId !== "heroImage2" && slotId !== "heroImage3") {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_SLOT",
          message: "slotId query parameter must be 'heroImage1', 'heroImage2', or 'heroImage3'",
        },
      });
    }

    try {
      const history = await HeroService.getHistory(slotId);
      return res.status(200).json({
        success: true,
        data: history,
      });
    } catch {
      return res.status(500).json({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to retrieve hero history",
        },
      });
    }
  });

  /**
   * POST /api/v1/hero/admin/restore
   * Restores a historic version of a specific hero slot independently.
   */
  router.post("/admin/restore", requireAdminAuth, async (req: Request, res: Response) => {
    const { slotId, version } = req.body;

    if (slotId !== "heroImage1" && slotId !== "heroImage2" && slotId !== "heroImage3") {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_SLOT",
          message: "slotId must be 'heroImage1', 'heroImage2', or 'heroImage3'",
        },
      });
    }

    const versionNum = typeof version === "number" ? version : parseInt(version, 10);
    if (!Number.isInteger(versionNum) || versionNum < 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_VERSION",
          message: "A valid positive integer version number is required",
        },
      });
    }

    try {
      const adminEmail = req.admin?.email || "admin";
      const updated = await HeroService.restoreSlot(slotId, versionNum, adminEmail);

      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to restore hero slot";
      return res.status(400).json({
        success: false,
        error: {
          code: "RESTORE_FAILED",
          message: msg,
        },
      });
    }
  });

  return router;
}
