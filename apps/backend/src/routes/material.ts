import { Router, type Request, type Response } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { z } from "zod";
import type { EnvConfig } from "../config/env.js";
import { createAdminAuthMiddleware } from "../middleware/admin-auth.js";
import { MaterialService } from "../services/material-service.js";
import { MaterialMediaService } from "../services/material-media-service.js";
import { logger } from "../utils/logger.js";

// Upload destinations for material images
const BACKEND_UPLOADS_DIR = path.resolve(process.cwd(), "uploads", "materials");
const FRONTEND_UPLOADS_DIR = path.resolve(process.cwd(), "..", "frontend", "public", "uploads", "materials");

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

// Multer storage for material images
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
    cb(null, `mat-${Date.now()}-${uniqueId}${ext}`);
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
const createMaterialSchema = z.object({
  name: z.string().trim().min(1, "Material name is required").max(100, "Material name must not exceed 100 characters"),
  slug: z.string().trim().max(100).optional(),
  description: z.string().trim().max(500).optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const updateMaterialSchema = z.object({
  name: z.string().trim().min(1, "Material name cannot be empty").max(100).optional(),
  slug: z.string().trim().min(1, "Material slug cannot be empty").max(100).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const materialCardSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(1, "Description is required"),
  ctaText: z.string().trim().min(1, "CTA label is required").optional(),
  imageUrl: z.string().trim().min(1, "Image URL is required"),
  imageAlt: z.string().trim().max(150).optional().nullable(),
  materialId: z.string().trim().nullable().optional(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

const updateSectionSchema = z.object({
  heading: z.string().trim().min(1, "Section heading cannot be empty").optional(),
  cards: z.array(materialCardSchema).optional(),
});

export function createMaterialRouter(env: EnvConfig): Router {
  const router = Router();
  const adminAuth = createAdminAuthMiddleware(env);

  // ── Public Storefront Endpoints ───────────────────────────────────────────

  /**
   * GET /api/v1/materials
   * Returns list of published active materials.
   */
  router.get("/", async (_req: Request, res: Response) => {
    try {
      const materials = await MaterialService.getAllMaterials({ includeInactive: false });
      return res.status(200).json({
        success: true,
        data: materials,
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to fetch public materials");
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve materials",
        },
      });
    }
  });

  /**
   * GET /api/v1/materials/section
   * Returns active homepage materials section configuration and active cards.
   */
  router.get("/section", async (_req: Request, res: Response) => {
    try {
      const section = await MaterialService.getHomepageSection({ publicOnly: true });
      return res.status(200).json({
        success: true,
        data: section,
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to fetch homepage materials section");
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve homepage materials section",
        },
      });
    }
  });

  /**
   * GET /api/v1/materials/slug/:slug
   */
  router.get("/slug/:slug", async (req: Request, res: Response) => {
    try {
      const slug = (Array.isArray(req.params["slug"]) ? req.params["slug"][0] : req.params["slug"]) || "";
      const material = await MaterialService.getMaterialBySlug(slug);
      if (!material) {
        return res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `Material with slug "${slug}" not found`,
          },
        });
      }
      return res.status(200).json({
        success: true,
        data: material,
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to fetch material by slug");
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve material",
        },
      });
    }
  });

  // ── Admin Protected Endpoints ─────────────────────────────────────────────

  /**
   * GET /api/v1/materials/admin
   */
  router.get("/admin", adminAuth, async (req: Request, res: Response) => {
    try {
      const search = typeof req.query["search"] === "string" ? req.query["search"] : undefined;
      const materials = await MaterialService.getAllMaterials({ includeInactive: true, search });
      return res.status(200).json({
        success: true,
        data: materials,
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to fetch admin materials");
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve materials",
        },
      });
    }
  });

  /**
   * GET /api/v1/materials/admin/section
   */
  router.get("/admin/section", adminAuth, async (_req: Request, res: Response) => {
    try {
      const section = await MaterialService.getHomepageSection({ publicOnly: false });
      return res.status(200).json({
        success: true,
        data: section,
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to fetch admin materials section");
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve materials section",
        },
      });
    }
  });

  /**
   * PUT /api/v1/materials/admin/section
   * Publishes new section configuration and snapshots current state into history.
   */
  router.put("/admin/section", adminAuth, async (req: Request, res: Response) => {
    try {
      const parsed = updateSectionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid materials section update payload",
            details: parsed.error.issues,
          },
        });
      }

      const updated = await MaterialService.updateHomepageSection(
        parsed.data,
        (req as any).adminUser?.email || "admin"
      );

      return res.status(200).json({
        success: true,
        data: updated,
        message: "Materials section published successfully",
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to update materials section");
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: err instanceof Error ? err.message : "Failed to update materials section",
        },
      });
    }
  });

  /**
   * GET /api/v1/materials/admin/section/history
   */
  router.get("/admin/section/history", adminAuth, async (_req: Request, res: Response) => {
    try {
      const history = await MaterialService.getSectionHistory();
      return res.status(200).json({
        success: true,
        data: history,
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to fetch materials section history");
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
   * POST /api/v1/materials/admin/section/restore/:historyId
   */
  router.post("/admin/section/restore/:historyId", adminAuth, async (req: Request, res: Response) => {
    try {
      const historyId = (Array.isArray(req.params["historyId"]) ? req.params["historyId"][0] : req.params["historyId"]) || "";
      const restored = await MaterialService.restoreSectionVersion(
        historyId,
        (req as any).adminUser?.email || "admin"
      );

      return res.status(200).json({
        success: true,
        data: restored,
        message: "Materials section restored successfully",
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to restore materials section version");
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
   * POST /api/v1/materials/admin
   */
  router.post("/admin", adminAuth, async (req: Request, res: Response) => {
    try {
      const parsed = createMaterialSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid material creation payload",
            details: parsed.error.issues,
          },
        });
      }

      const created = await MaterialService.createMaterial(parsed.data);
      return res.status(201).json({
        success: true,
        data: created,
        message: "Material created successfully",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create material";
      if (msg.includes("already exists")) {
        return res.status(409).json({
          success: false,
          error: {
            code: "CONFLICT",
            message: msg,
          },
        });
      }
      logger.error({ err }, "Failed to create material");
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: msg,
        },
      });
    }
  });

  /**
   * GET /api/v1/materials/admin/:id
   */
  router.get("/admin/:id", adminAuth, async (req: Request, res: Response) => {
    try {
      const id = (Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"]) || "";
      const material = await MaterialService.getMaterialById(id);
      if (!material) {
        return res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `Material with ID "${id}" was not found`,
          },
        });
      }
      return res.status(200).json({
        success: true,
        data: material,
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to fetch material by id");
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve material",
        },
      });
    }
  });

  /**
   * PATCH /api/v1/materials/admin/:id
   * PUT /api/v1/materials/admin/:id
   */
  const handleUpdateMaterial = async (req: Request, res: Response) => {
    try {
      const id = (Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"]) || "";
      const parsed = updateMaterialSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid material update payload",
            details: parsed.error.issues,
          },
        });
      }

      const updated = await MaterialService.updateMaterial(id, parsed.data);
      return res.status(200).json({
        success: true,
        data: updated,
        message: "Material updated successfully",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update material";
      if (msg.includes("already exists")) {
        return res.status(409).json({
          success: false,
          error: {
            code: "CONFLICT",
            message: msg,
          },
        });
      }
      if (msg.includes("not found")) {
        return res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: msg,
          },
        });
      }
      logger.error({ err }, "Failed to update material");
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: msg,
        },
      });
    }
  };

  router.patch("/admin/:id", adminAuth, handleUpdateMaterial);
  router.put("/admin/:id", adminAuth, handleUpdateMaterial);

  /**
   * DELETE /api/v1/materials/admin/:id
   * Safe delete: blocks deletion if products reference it; safely unlinks homepage cards.
   */
  router.delete("/admin/:id", adminAuth, async (req: Request, res: Response) => {
    try {
      const id = (Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"]) || "";
      await MaterialService.deleteMaterial(id);
      return res.status(200).json({
        success: true,
        data: { deletedId: id },
        message: "Material deleted successfully",
      });
    } catch (err: any) {
      if (err.code === "MATERIAL_IN_USE") {
        return res.status(409).json({
          success: false,
          error: {
            code: "MATERIAL_IN_USE",
            message: err.message,
            productCount: err.productCount,
          },
        });
      }
      const msg = err instanceof Error ? err.message : "Failed to delete material";
      if (msg.includes("not found")) {
        return res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: msg,
          },
        });
      }
      logger.error({ err }, "Failed to delete material");
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: msg,
        },
      });
    }
  });

  /**
   * POST /api/v1/materials/admin/reorder
   */
  router.post("/admin/reorder", adminAuth, async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        orderedIds: z.array(z.string().trim().min(1)),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid reorder payload",
          },
        });
      }
      await MaterialService.reorderMaterials(parsed.data.orderedIds);
      return res.status(200).json({
        success: true,
        message: "Materials reordered successfully",
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to reorder materials");
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reorder materials",
        },
      });
    }
  });

  /**
   * POST /api/v1/materials/admin/upload-image
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
        await MaterialMediaService.saveAsset(filename, req.file.mimetype, imageBuffer);

        const relativeUrl = `/uploads/materials/${filename}`;
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
        logger.error({ err }, "Failed to upload material image");
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
