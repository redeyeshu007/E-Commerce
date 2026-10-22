import { Router, type Request, type Response } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { z } from "zod";
import type { EnvConfig } from "../config/env.js";
import { OrderService } from "../services/order-service.js";
import { CustomerService } from "../services/customer-service.js";
import { createCustomerAuthMiddleware } from "../middleware/customer-auth.js";
import { createAdminAuthMiddleware } from "../middleware/admin-auth.js";
import { ShippingMediaService } from "../services/shipping-media-service.js";
import { logger } from "../utils/logger.js";

// Upload destinations for shipping evidence images
const BACKEND_SHIPPING_UPLOADS_DIR = path.resolve(process.cwd(), "uploads", "shipping");
const FRONTEND_SHIPPING_UPLOADS_DIR = path.resolve(
  process.cwd(),
  "..",
  "frontend",
  "public",
  "uploads",
  "shipping"
);

// Ensure directories exist
for (const dir of [BACKEND_SHIPPING_UPLOADS_DIR, FRONTEND_SHIPPING_UPLOADS_DIR]) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {
    // Directory might exist or differ in test environment
  }
}

// Multer storage for shipping evidence images
const shippingStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(BACKEND_SHIPPING_UPLOADS_DIR)) {
      fs.mkdirSync(BACKEND_SHIPPING_UPLOADS_DIR, { recursive: true });
    }
    cb(null, BACKEND_SHIPPING_UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const uniqueId = crypto.randomBytes(12).toString("hex");
    cb(null, `ship-${Date.now()}-${uniqueId}${ext}`);
  },
});

const shippingUpload = multer({
  storage: shippingStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 25, // No practical small limitation on image batch
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
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return true;
    }

    // WebP: 52 49 46 46 ... 57 45 42 50
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

const orderItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

const shippingAddressSchema = z
  .object({
    fullName: z.string().trim().min(2, "Recipient name is required"),
    addressLine: z.string().trim().optional(),
    addressLine1: z.string().trim().optional(),
    city: z.string().trim().min(2, "City is required"),
    state: z.string().trim().min(2, "State is required"),
    postalCode: z.string().trim().min(3, "Postal/PIN code is required"),
    country: z.string().trim().optional(),
    phone: z.string().trim().min(8, "Valid phone number is required"),
  })
  .transform((data) => ({
    fullName: data.fullName,
    addressLine: (data.addressLine || data.addressLine1 || "").trim(),
    city: data.city,
    state: data.state,
    postalCode: data.postalCode,
    country: (data.country || "India").trim(),
    phone: data.phone,
  }))
  .refine((data) => data.addressLine.length >= 3, {
    message: "Street address is required",
    path: ["addressLine"],
  });

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Order must contain at least one item"),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.string().optional().default("UPI"),
  idempotencyKey: z.string().optional(),
});

export function createOrderRouter(env: EnvConfig): Router {
  const router = Router();
  const requireCustomerAuth = createCustomerAuthMiddleware(env);
  const requireAdminAuth = createAdminAuthMiddleware(env);

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN ORDER MANAGEMENT ROUTES (Strict Admin Authentication)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * GET /admin
   * GET /admin/orders
   * Returns paginated orders list with search and filters
   */
  const handleGetAdminOrders = async (req: Request, res: Response) => {
    try {
      const page = req.query["page"] ? Number(req.query["page"]) : 1;
      const limit = req.query["limit"] ? Number(req.query["limit"]) : 20;
      const search = typeof req.query["search"] === "string" ? req.query["search"] : undefined;
      const status = typeof req.query["status"] === "string" ? req.query["status"] : undefined;
      const paymentStatus =
        typeof req.query["paymentStatus"] === "string" ? req.query["paymentStatus"] : undefined;
      const startDate =
        typeof req.query["startDate"] === "string" ? req.query["startDate"] : undefined;
      const endDate = typeof req.query["endDate"] === "string" ? req.query["endDate"] : undefined;

      const result = await OrderService.getAdminOrders({
        page,
        limit,
        search,
        status,
        paymentStatus,
        startDate,
        endDate,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      res.status(error.status || 500).json({
        success: false,
        error: {
          code: error.code || "FETCH_ADMIN_ORDERS_FAILED",
          message: error.message || "Failed to retrieve orders",
        },
      });
    }
  };

  router.get("/admin", requireAdminAuth, handleGetAdminOrders);
  router.get("/admin/orders", requireAdminAuth, handleGetAdminOrders);

  /**
   * GET /admin/:id
   * Returns complete order details with history and shipping updates
   */
  router.get("/admin/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const rawId = req.params["id"];
      const orderId = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : "";
      if (!orderId) {
        res.status(400).json({ success: false, error: { message: "Order ID is required" } });
        return;
      }

      const order = await OrderService.getAdminOrderById(orderId);
      res.status(200).json({
        success: true,
        data: { order },
      });
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      res.status(error.status || 500).json({
        success: false,
        error: {
          code: error.code || "FETCH_ADMIN_ORDER_FAILED",
          message: error.message || "Failed to retrieve order details",
        },
      });
    }
  });

  /**
   * PATCH /admin/:id/status
   * Updates fulfilment status with lifecycle validation
   */
  router.patch("/admin/:id/status", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const rawId = req.params["id"];
      const orderId = String(Array.isArray(rawId) ? rawId[0] || "" : rawId || "");
      const { status, note } = (req.body as { status?: string; note?: string }) || {};

      if (!status || typeof status !== "string") {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Target status is required" },
        });
        return;
      }

      const adminId = req.admin?.email || "admin";
      const updatedOrder = await OrderService.updateOrderStatus(orderId, status, adminId, note);

      res.status(200).json({
        success: true,
        data: { order: updatedOrder },
      });
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      res.status(error.status || 500).json({
        success: false,
        error: {
          code: error.code || "UPDATE_ORDER_STATUS_FAILED",
          message: error.message || "Failed to update order status",
        },
      });
    }
  });

  /**
   * POST /admin/:id/shipping
   * Upload shipping evidence images and description, marks order as SHIPPED
   */
  router.post(
    "/admin/:id/shipping",
    requireAdminAuth,
    shippingUpload.array("images", 20),
    async (req: Request, res: Response) => {
      const uploadedFiles = (req.files as Express.Multer.File[]) || [];

      try {
        const rawId = req.params["id"];
        const orderId = String(Array.isArray(rawId) ? rawId[0] || "" : rawId || "");
        const carrierName = typeof req.body.carrierName === "string" ? req.body.carrierName : undefined;
        const trackingNumber =
          typeof req.body.trackingNumber === "string" ? req.body.trackingNumber : undefined;
        const description =
          typeof req.body.description === "string" && req.body.description.trim()
            ? req.body.description.trim()
            : "Order dispatched with tracked courier delivery.";

        // Process uploaded images
        const processedImages: Array<{ url: string; filename: string }> = [];

        for (const file of uploadedFiles) {
          // Verify magic bytes
          if (!validateImageMagicBytes(file.path)) {
            try {
              fs.unlinkSync(file.path);
            } catch {
              // ignore
            }
            res.status(400).json({
              success: false,
              error: {
                code: "INVALID_IMAGE_CONTENT",
                message: `File ${file.originalname} contains invalid image content`,
              },
            });
            return;
          }

          // Duplicate copy to frontend public directory for instantaneous static serving
          try {
            if (!fs.existsSync(FRONTEND_SHIPPING_UPLOADS_DIR)) {
              fs.mkdirSync(FRONTEND_SHIPPING_UPLOADS_DIR, { recursive: true });
            }
            const frontendDest = path.join(FRONTEND_SHIPPING_UPLOADS_DIR, file.filename);
            fs.copyFileSync(file.path, frontendDest);
          } catch {
            // Non-critical if frontend directory not available during test
          }

          // Save binary asset in MongoDB for durable persistence
          const fileBuffer = fs.readFileSync(file.path);
          await ShippingMediaService.saveAsset(file.filename, file.mimetype, fileBuffer);

          processedImages.push({
            url: `/uploads/shipping/${file.filename}`,
            filename: file.filename,
          });
        }

        // Support previously uploaded / existing image URLs passed in body
        if (req.body.existingImages) {
          try {
            const parsedExisting =
              typeof req.body.existingImages === "string"
                ? JSON.parse(req.body.existingImages)
                : req.body.existingImages;
            if (Array.isArray(parsedExisting)) {
              for (const img of parsedExisting) {
                if (img && typeof img.url === "string") {
                  processedImages.push({
                    url: img.url,
                    filename: img.filename || path.basename(img.url),
                  });
                }
              }
            }
          } catch {
            // ignore parse failure
          }
        }

        const adminId = req.admin?.email || "admin";
        const updatedOrder = await OrderService.addShippingUpdate(
          orderId,
          {
            carrierName,
            trackingNumber,
            description,
            images: processedImages,
          },
          adminId
        );

        res.status(200).json({
          success: true,
          data: {
            order: updatedOrder,
            message: "Shipping update saved and order marked as SHIPPED",
          },
        });
      } catch (err: unknown) {
        // Cleanup uploaded files on error
        for (const file of uploadedFiles) {
          try {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          } catch {
            // ignore
          }
        }

        const error = err as { code?: string; status?: number; message?: string };
        res.status(error.status || 500).json({
          success: false,
          error: {
            code: error.code || "SHIPPING_UPDATE_FAILED",
            message: error.message || "Failed to save shipping update",
          },
        });
      }
    }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // CUSTOMER CHECKOUT & ORDER TRACKING ROUTES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * POST /
   * POST /create-order
   * Protected endpoint: Creates an order for the authenticated customer.
   * Disallows COD, enforces UPI simulation payment.
   */
  const handleCreateOrder = async (req: Request, res: Response): Promise<void> => {
    // 1. Enforce verified customer identity
    const customerId = req.customer?.id;
    if (!customerId) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Customer authentication required to place an order.",
        },
      });
      return;
    }

    // 2. Validate request payload
    const parseResult = createOrderSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parseResult.error.issues[0]?.message || "Invalid order details",
        },
      });
      return;
    }

    // 3. Enforce mandatory profile completion
    const fullProfile = await CustomerService.getFullProfile(customerId);
    if (!fullProfile || !fullProfile.isProfileComplete || !fullProfile.profile?.isComplete) {
      res.status(403).json({
        success: false,
        error: {
          code: "PROFILE_INCOMPLETE",
          message:
            "Please complete your user profile and default shipping address before placing an order.",
        },
      });
      return;
    }

    try {
      const order = await OrderService.createOrder({
        customerId, // Strictly from verified server-side session
        items: parseResult.data.items,
        shippingAddress: parseResult.data.shippingAddress,
        paymentMethod: parseResult.data.paymentMethod,
        idempotencyKey: parseResult.data.idempotencyKey,
      });

      res.status(201).json({
        success: true,
        data: {
          order,
          message: "Test order placed successfully via UPI payment simulation.",
        },
      });
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      res.status(error.status || 500).json({
        success: false,
        error: {
          code: error.code || "ORDER_CREATION_FAILED",
          message: error.message || "Failed to create order. Please try again.",
        },
      });
    }
  };

  router.post("/", requireCustomerAuth, handleCreateOrder);
  router.post("/create-order", requireCustomerAuth, handleCreateOrder);

  /**
   * GET /
   * Returns list of orders for authenticated customer
   */
  router.get("/", requireCustomerAuth, async (req: Request, res: Response) => {
    try {
      const customerId = req.customer!.id;
      const orders = await OrderService.getCustomerOrders(customerId);
      res.status(200).json({
        success: true,
        data: { orders },
      });
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      res.status(error.status || 500).json({
        success: false,
        error: {
          code: error.code || "FETCH_ORDERS_FAILED",
          message: error.message || "Failed to retrieve orders",
        },
      });
    }
  });

  /**
   * GET /:id
   * Returns order details strictly owned by authenticated customer
   */
  router.get("/:id", requireCustomerAuth, async (req: Request, res: Response) => {
    try {
      const customerId = req.customer!.id;
      const rawId = req.params["id"];
      const orderId = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : "";
      if (!orderId) {
        res.status(400).json({ success: false, error: { message: "Order ID is required" } });
        return;
      }
      const order = await OrderService.getOrderById(orderId, customerId);
      res.status(200).json({
        success: true,
        data: { order },
      });
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      res.status(error.status || 500).json({
        success: false,
        error: {
          code: error.code || "FETCH_ORDER_FAILED",
          message: error.message || "Failed to retrieve order",
        },
      });
    }
  });

  /**
   * POST /:id/confirm-delivery
   * Customer confirms delivery receipt of their shipped order
   */
  router.post("/:id/confirm-delivery", requireCustomerAuth, async (req: Request, res: Response) => {
    try {
      const customerId = req.customer!.id;
      const rawId = req.params["id"];
      const orderId = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : "";
      if (!orderId) {
        res.status(400).json({ success: false, error: { message: "Order ID is required" } });
        return;
      }

      const updatedOrder = await OrderService.confirmOrderDelivered(orderId, customerId);
      res.status(200).json({
        success: true,
        data: {
          order: updatedOrder,
          message: "Order receipt confirmed successfully. Order is now DELIVERED.",
        },
      });
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      res.status(error.status || 500).json({
        success: false,
        error: {
          code: error.code || "DELIVERY_CONFIRMATION_FAILED",
          message: error.message || "Failed to confirm order delivery",
        },
      });
    }
  });

  return router;
}
