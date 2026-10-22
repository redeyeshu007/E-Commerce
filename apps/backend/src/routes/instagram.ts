import { Router, type Request, type Response } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { z } from "zod";
import type { EnvConfig } from "../config/env.js";
import { createAdminAuthMiddleware } from "../middleware/admin-auth.js";
import { InstagramService } from "../services/instagram-service.js";
import { InstagramMediaService } from "../services/instagram-media-service.js";
import { logger } from "../utils/logger.js";

// Upload destinations for Instagram images
const BACKEND_UPLOADS_DIR = path.resolve(process.cwd(), "uploads", "instagram");
const FRONTEND_UPLOADS_DIR = path.resolve(process.cwd(), "..", "frontend", "public", "uploads", "instagram");

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

// Multer storage for Instagram images
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
    cb(null, `insta-${Date.now()}-${uniqueId}${ext}`);
  },
});

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

// Validation schemas
const instagramImageSchema = z.object({
  id: z.string().optional(),
  imageUrl: z.string().trim().min(1, "Image URL is required"),
  altText: z.string().trim().max(300).nullable().optional(),
  postUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (val) => {
        if (!val) return true;
        try {
          const parsed = new URL(val);
          return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Destination URL must be a valid HTTP or HTTPS web link" }
    )
    .nullable()
    .optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const updateSectionSchema = z.object({
  heading: z.string().trim().min(1, "Section heading cannot be empty").max(120).optional(),
  handle: z.string().trim().min(1, "Instagram handle cannot be empty").max(60).optional(),
  profileUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (val) => {
        if (!val) return true;
        try {
          const parsed = new URL(val);
          return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Profile URL must be a valid HTTP or HTTPS web link" }
    )
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
  images: z.array(instagramImageSchema).optional(),
});

export function createInstagramRouter(env: EnvConfig): Router {
  const router = Router();
  const adminAuth = createAdminAuthMiddleware(env);

  // ── Public Storefront Endpoints ───────────────────────────────────────────

  /**
   * GET /api/v1/instagram
   * GET /api/v1/instagram/section
   * Returns active homepage Instagram section configuration and active images.
   */
  const handleGetPublicSection = async (_req: Request, res: Response) => {
    try {
      const section = await InstagramService.getInstagramSection({ publicOnly: true });
      return res.status(200).json({
        success: true,
        data: section,
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to fetch homepage Instagram section");
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve homepage Instagram section",
        },
      });
    }
  };

  router.get("/", handleGetPublicSection);
  router.get("/section", handleGetPublicSection);

  /**
   * GET /api/v1/instagram/media/:filename
   * Streams binary image asset directly from MongoDB.
   */
  router.get("/media/:filename", async (req: Request, res: Response) => {
    try {
      const filename = (Array.isArray(req.params["filename"]) ? req.params["filename"][0] : req.params["filename"]) || "";
      const asset = await InstagramMediaService.getAsset(filename);
      if (!asset) {
        return res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `Instagram media asset "${filename}" not found`,
          },
        });
      }

      res.setHeader("Content-Type", asset.mimeType);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      return res.status(200).send(asset.data);
    } catch (err: unknown) {
      logger.error({ err }, "Failed to serve Instagram media asset");
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to serve media asset",
        },
      });
    }
  });

  // ── Admin Protected Endpoints ─────────────────────────────────────────────

  /**
   * GET /api/v1/instagram/admin/settings
   * Retrieves full admin Instagram section configuration, including inactive images and version counter.
   */
  router.get("/admin/settings", adminAuth, async (_req: Request, res: Response) => {
    try {
      const section = await InstagramService.getInstagramSection({ publicOnly: false });
      return res.status(200).json({
        success: true,
        data: section,
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to fetch admin Instagram section settings");
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve Instagram section settings",
        },
      });
    }
  });

  /**
   * PUT /api/v1/instagram/admin/settings
   * Updates heading, handle, profileUrl, isActive status, and full image set.
   * Creates an independent snapshot in InstagramSectionHistory and increments version.
   */
  router.put("/admin/settings", adminAuth, async (req: Request, res: Response) => {
    try {
      const parsed = updateSectionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid Instagram section update payload",
            details: parsed.error.issues,
          },
        });
      }

      const updated = await InstagramService.updateInstagramSection(
        parsed.data,
        (req as any).adminUser?.email || "admin"
      );

      return res.status(200).json({
        success: true,
        data: updated,
        message: "Instagram section published successfully",
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to update Instagram section");
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: err instanceof Error ? err.message : "Failed to update Instagram section",
        },
      });
    }
  });

  /**
   * GET /api/v1/instagram/admin/history
   * Retrieves version history snapshots for the Instagram section.
   */
  router.get("/admin/history", adminAuth, async (_req: Request, res: Response) => {
    try {
      const history = await InstagramService.getSectionHistory();
      return res.status(200).json({
        success: true,
        data: history,
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to fetch Instagram section history");
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve section history",
        },
      });
    }
  });

  /**
   * POST /api/v1/instagram/admin/restore/:historyId
   * Restores an older version snapshot from InstagramSectionHistory.
   */
  router.post("/admin/restore/:historyId", adminAuth, async (req: Request, res: Response) => {
    try {
      const historyId = (Array.isArray(req.params["historyId"]) ? req.params["historyId"][0] : req.params["historyId"]) || "";
      const restored = await InstagramService.restoreSectionVersion(
        historyId,
        (req as any).adminUser?.email || "admin"
      );

      return res.status(200).json({
        success: true,
        data: restored,
        message: "Instagram section restored successfully",
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to restore Instagram section version");
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: err instanceof Error ? err.message : "Failed to restore version",
        },
      });
    }
  });

  /**
   * POST /api/v1/instagram/admin/upload-image
   * Accepts image file upload, validates magic bytes, and saves in MongoDB.
   */
  router.post(
    "/admin/upload-image",
    adminAuth,
    upload.single("image"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            error: {
              code: "BAD_REQUEST",
              message: "No image file provided in 'image' field",
            },
          });
        }

        const uploadedFilePath = req.file.path;
        if (!validateImageMagicBytes(uploadedFilePath)) {
          fs.unlinkSync(uploadedFilePath);
          return res.status(400).json({
            success: false,
            error: {
              code: "INVALID_FILE",
              message: "File signature does not match an authentic image (JPEG, PNG, or WebP).",
            },
          });
        }

        const filename = path.basename(uploadedFilePath);

        // Copy file to frontend public directory as well if available
        try {
          if (!fs.existsSync(FRONTEND_UPLOADS_DIR)) {
            fs.mkdirSync(FRONTEND_UPLOADS_DIR, { recursive: true });
          }
          const frontendDest = path.join(FRONTEND_UPLOADS_DIR, filename);
          fs.copyFileSync(uploadedFilePath, frontendDest);
        } catch {
          // Frontend might be hosted separately in container
        }

        // Save into MongoDB native binary storage for full durability
        const imageBuffer = fs.readFileSync(uploadedFilePath);
        await InstagramMediaService.saveAsset(filename, req.file.mimetype, imageBuffer);

        const relativeUrl = `/uploads/instagram/${filename}`;
        return res.status(200).json({
          success: true,
          data: {
            imageUrl: relativeUrl,
            filename,
            size: req.file.size,
            mimetype: req.file.mimetype,
          },
        });
      } catch (err: unknown) {
        logger.error({ err }, "Failed to upload Instagram image");
        return res.status(500).json({
          success: false,
          error: {
            code: "UPLOAD_ERROR",
            message: err instanceof Error ? err.message : "Failed to process image upload",
          },
        });
      }
    }
  );

  return router;
}
