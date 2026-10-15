import { Router, type Request, type Response } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { z } from "zod";
import type { EnvConfig } from "../config/env.js";
import { createAdminAuthMiddleware } from "../middleware/admin-auth.js";
import { CategoryService, slugify } from "../services/category-service.js";
import { CategoryMediaService } from "../services/category-media-service.js";
import { logger } from "../utils/logger.js";

// Upload destinations for categories
const BACKEND_UPLOADS_DIR = path.resolve(process.cwd(), "uploads", "categories");
const FRONTEND_UPLOADS_DIR = path.resolve(process.cwd(), "..", "frontend", "public", "uploads", "categories");

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

// Multer storage for category images
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
    cb(null, `cat-${Date.now()}-${uniqueId}${ext}`);
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

const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(100, "Category name must not exceed 100 characters"),
  slug: z.string().trim().max(100).optional(),
  imageUrl: z.string().trim().min(1, "Category image is required"),
  imageAlt: z.string().trim().max(150).optional(),
  description: z.string().trim().max(500).optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name cannot be empty").max(100).optional(),
  slug: z.string().trim().min(1, "Category slug cannot be empty").max(100).optional(),
  imageUrl: z.string().trim().min(1, "Category image cannot be empty").optional(),
  imageAlt: z.string().trim().max(150).optional(),
  description: z.string().trim().max(500).optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export function createCategoryRouter(env: EnvConfig): Router {
  const router = Router();
  const adminAuth = createAdminAuthMiddleware(env);

  // ── Public Storefront Endpoints ───────────────────────────────────────────

  /**
   * GET /api/v1/categories
   * Returns list of published active categories.
   */
  router.get("/", async (_req: Request, res: Response) => {
    try {
      const categories = await CategoryService.getAllCategories({ includeInactive: false });
      return res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to fetch public categories");
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve categories",
        },
      });
    }
  });

  /**
   * GET /api/v1/categories/:slug
   * Returns single category by slug.
   */
  router.get("/:slug", async (req: Request, res: Response) => {
    const slug = req.params["slug"];
    if (typeof slug !== "string" || !slug) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: "Slug is required" },
      });
    }

    try {
      const category = await CategoryService.getCategoryBySlug(slug);
      if (!category) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: `Category "${slug}" not found` },
        });
      }

      return res.status(200).json({
        success: true,
        data: category,
      });
    } catch (err: unknown) {
      logger.error({ err, slug }, "Failed to fetch category by slug");
      return res.status(500).json({
        success: false,
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to retrieve category" },
      });
    }
  });

  // ── Protected Admin Endpoints ─────────────────────────────────────────────

  /**
   * GET /api/v1/categories/admin/list
   * Returns all categories (including inactive) with authoritative product counts.
   */
  router.get("/admin/list", adminAuth, async (_req: Request, res: Response) => {
    try {
      const categories = await CategoryService.getAllCategories({ includeInactive: true });
      return res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to fetch admin categories list");
      return res.status(500).json({
        success: false,
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to retrieve category list" },
      });
    }
  });

  /**
   * POST /api/v1/categories/admin/upload-image
   * Handles durable category image upload with validation.
   */
  router.post(
    "/admin/upload-image",
    adminAuth,
    (req: Request, res: Response) => {
      upload.single("image")(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              success: false,
              error: { code: "FILE_TOO_LARGE", message: "Image exceeds 5MB size limit" },
            });
          }
          return res.status(400).json({
            success: false,
            error: { code: "UPLOAD_ERROR", message: err.message },
          });
        } else if (err) {
          return res.status(400).json({
            success: false,
            error: { code: "INVALID_FILE_TYPE", message: err.message },
          });
        }

        if (!req.file) {
          return res.status(400).json({
            success: false,
            error: { code: "NO_FILE", message: "No image file provided" },
          });
        }

        // Validate image magic bytes
        const isAuthentic = validateImageMagicBytes(req.file.path);
        if (!isAuthentic) {
          try {
            fs.unlinkSync(req.file.path);
          } catch {}
          return res.status(400).json({
            success: false,
            error: {
              code: "INVALID_IMAGE_CONTENT",
              message: "Uploaded file content does not match genuine image magic bytes",
            },
          });
        }

        // Copy to frontend public directory if available
        try {
          if (fs.existsSync(FRONTEND_UPLOADS_DIR)) {
            const destPath = path.join(FRONTEND_UPLOADS_DIR, req.file.filename);
            fs.copyFileSync(req.file.path, destPath);
          }
        } catch {}

        // Persist raw binary to PostgreSQL for durable cross-container availability
        try {
          const fileBuffer = fs.readFileSync(req.file.path);
          await CategoryMediaService.saveAsset(req.file.filename, req.file.mimetype, fileBuffer);
        } catch (dbErr) {
          logger.warn({ dbErr }, "Failed to persist category image to PostgreSQL bytea");
        }

        const relativeUrl = `/uploads/categories/${req.file.filename}`;
        return res.status(200).json({
          success: true,
          data: {
            url: relativeUrl,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
          },
        });
      });
    }
  );

  /**
   * POST /api/v1/categories/admin
   * Creates a new category.
   */
  router.post("/admin", adminAuth, async (req: Request, res: Response) => {
    const parseResult = createCategorySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parseResult.error.errors[0]?.message || "Invalid category data",
        },
      });
    }

    try {
      const created = await CategoryService.createCategory(parseResult.data);
      return res.status(201).json({
        success: true,
        data: created,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create category";
      if (msg.includes("already exists")) {
        return res.status(409).json({
          success: false,
          error: { code: "CONFLICT", message: msg },
        });
      }
      logger.error({ err }, "Error creating category");
      return res.status(500).json({
        success: false,
        error: { code: "INTERNAL_SERVER_ERROR", message: msg },
      });
    }
  });

  /**
   * PUT /api/v1/categories/admin/:id
   * Updates an existing category.
   */
  router.put("/admin/:id", adminAuth, async (req: Request, res: Response) => {
    const id = req.params["id"];
    if (typeof id !== "string" || !id) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: "Category ID is required" },
      });
    }

    const parseResult = updateCategorySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parseResult.error.errors[0]?.message || "Invalid update data",
        },
      });
    }

    try {
      const updated = await CategoryService.updateCategory(id, parseResult.data);
      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update category";
      if (msg.includes("not found")) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: msg },
        });
      }
      if (msg.includes("already exists")) {
        return res.status(409).json({
          success: false,
          error: { code: "CONFLICT", message: msg },
        });
      }
      logger.error({ err, id }, "Error updating category");
      return res.status(500).json({
        success: false,
        error: { code: "INTERNAL_SERVER_ERROR", message: msg },
      });
    }
  });

  /**
   * PATCH /api/v1/categories/admin/reorder
   * Reorders categories sequentially.
   */
  router.patch("/admin/reorder", adminAuth, async (req: Request, res: Response) => {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: "orderedIds array is required" },
      });
    }

    try {
      const reordered = await CategoryService.reorderCategories(orderedIds);
      return res.status(200).json({
        success: true,
        data: reordered,
      });
    } catch (err: unknown) {
      logger.error({ err }, "Error reordering categories");
      return res.status(500).json({
        success: false,
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to reorder categories" },
      });
    }
  });

  /**
   * DELETE /api/v1/categories/admin/:id
   * Permanently deletes category and cascades deletion to all associated products.
   */
  router.delete("/admin/:id", adminAuth, async (req: Request, res: Response) => {
    const id = req.params["id"];
    if (typeof id !== "string" || !id) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: "Category ID is required" },
      });
    }

    try {
      const result = await CategoryService.deleteCategory(id);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete category";
      if (msg.includes("not found")) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: msg },
        });
      }
      logger.error({ err, id }, "Error deleting category");
      return res.status(500).json({
        success: false,
        error: { code: "INTERNAL_SERVER_ERROR", message: msg },
      });
    }
  });

  return router;
}
