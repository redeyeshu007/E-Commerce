import express, { type Application, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import crypto from "node:crypto";
import type { EnvConfig } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { healthRouter } from "./routes/health.js";
import { v1Router } from "./routes/v1/index.js";
import { createAdminAuthRouter } from "./routes/admin-auth.js";
import { createNavbarRouter } from "./routes/navbar.js";
import path from "node:path";
import { setupSwagger } from "./lib/swagger.js";
import { logger } from "./utils/logger.js";
import { createHeroRouter } from "./routes/hero.js";
import { HeroMediaService } from "./services/hero-media-service.js";
import { createCategoryRouter } from "./routes/category.js";
import { CategoryMediaService } from "./services/category-media-service.js";
import { createProductRouter } from "./routes/product.js";
import fs from "node:fs";

/**
 * Creates and configures the Express application.
 *
 * Separated from server startup so that integration tests can import the app
 * and run isolated requests via supertest without binding to a physical network port.
 */
export function createApp(env: EnvConfig): Application {
  const app = express();

  // ── Request correlation ID ───────────────────────────────────────────────
  app.use((req: Request, res: Response, next: NextFunction) => {
    const headerId = req.headers["x-request-id"];
    const requestId = typeof headerId === "string" ? headerId : crypto.randomUUID();
    (req as Request & { id: string }).id = requestId;
    res.setHeader("X-Request-Id", requestId);
    next();
  });

  // ── Security Headers ──────────────────────────────────────────────────────
  app.use(helmet());

  // ── Controlled CORS ───────────────────────────────────────────────────────
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) {
          return callback(null, true);
        }

        const isAllowed =
          env.CORS_ORIGINS.includes(origin) ||
          (env.NODE_ENV !== "production" && env.CORS_ORIGINS.includes("*"));

        if (isAllowed) {
          return callback(null, true);
        }

        return callback(new Error(`Origin '${origin}' not allowed by CORS policy`));
      },
      credentials: true,
    }),
  );

  // ── Compression ───────────────────────────────────────────────────────────
  app.use(compression());

  // ── Cookie Parsing for Server-Managed Admin Sessions ──────────────────────
  app.use(cookieParser());

  // ── Structured Request Logging ───────────────────────────────────────────
  if (env.NODE_ENV !== "test") {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      const requestId = (req as Request & { id: string }).id;

      res.on("finish", () => {
        const durationMs = Date.now() - start;
        logger.info(
          {
            requestId,
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            durationMs,
            ip: req.ip,
          },
          "HTTP Request completed",
        );
      });

      next();
    });
  }

  // ── Body Parsing with Safe Limits ─────────────────────────────────────────
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // ── API Documentation (Future Integration Point) ──────────────────────────
  setupSwagger(app);

  // ── Infrastructure Health & API Routes ──────────────────────────────────
  // Primary infrastructure health check (liveness & database readiness)
  app.use("/api/health", healthRouter);

  // Phase 1: Authentication endpoints (supports /api/admin/auth, /api/v1/admin/auth, /api/auth, /api/v1/auth)
  const adminAuthRouter = createAdminAuthRouter(env);
  app.use("/api/admin/auth", adminAuthRouter);
  app.use("/api/v1/admin/auth", adminAuthRouter);
  app.use("/api/auth", adminAuthRouter);
  app.use("/api/v1/auth", adminAuthRouter);

  // Navbar Management endpoints (storefront public & admin protected)
  const navbarRouter = createNavbarRouter(env);
  app.use("/api/navbar", navbarRouter);
  app.use("/api/v1/navbar", navbarRouter);

  // Static uploads directory with cross-origin headers for images
  const uploadsDir = path.resolve(process.cwd(), "uploads");
  const heroUploadsDir = path.join(uploadsDir, "hero");
  const categoryUploadsDir = path.join(uploadsDir, "categories");

  // Durable media serving: fallback to PostgreSQL if local disk cache is missing (e.g. after Render restart)
  app.get("/uploads/hero/:filename", async (req: Request, res: Response, next: NextFunction) => {
    const filename = req.params["filename"];
    if (typeof filename !== "string" || !filename) {
      return next();
    }
    const localPath = path.join(heroUploadsDir, filename);
    if (fs.existsSync(localPath)) {
      return next();
    }
    try {
      const asset = await HeroMediaService.getAsset(filename);
      if (asset) {
        try {
          if (!fs.existsSync(heroUploadsDir)) {
            fs.mkdirSync(heroUploadsDir, { recursive: true });
          }
          fs.writeFileSync(localPath, asset.data);
        } catch {
          // Ignore local disk cache write error
        }
        res.setHeader("Content-Type", asset.mimeType);
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        return res.send(asset.data);
      }
    } catch (err) {
      logger.warn({ err, filename }, "Failed to fetch media asset from PostgreSQL");
    }
    next();
  });

  app.get("/uploads/categories/:filename", async (req: Request, res: Response, next: NextFunction) => {
    const filename = req.params["filename"];
    if (typeof filename !== "string" || !filename) {
      return next();
    }
    const localPath = path.join(categoryUploadsDir, filename);
    if (fs.existsSync(localPath)) {
      return next();
    }
    try {
      const asset = await CategoryMediaService.getAsset(filename);
      if (asset) {
        try {
          if (!fs.existsSync(categoryUploadsDir)) {
            fs.mkdirSync(categoryUploadsDir, { recursive: true });
          }
          fs.writeFileSync(localPath, asset.data);
        } catch {
          // Ignore local disk cache write error
        }
        res.setHeader("Content-Type", asset.mimeType);
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        return res.send(asset.data);
      }
    } catch (err) {
      logger.warn({ err, filename }, "Failed to fetch category media asset from PostgreSQL");
    }
    next();
  });

  app.use(
    "/uploads",
    express.static(uploadsDir, {
      setHeaders: (res) => {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      },
    })
  );

  // Hero Images Management endpoints (storefront public & admin protected)
  const heroRouter = createHeroRouter(env);
  app.use("/api/hero", heroRouter);
  app.use("/api/v1/hero", heroRouter);

  // Category Management endpoints (storefront public & admin protected)
  const categoryRouter = createCategoryRouter(env);
  app.use("/api/categories", categoryRouter);
  app.use("/api/v1/categories", categoryRouter);

  // Product Catalogue endpoints (storefront public & admin)
  const productRouter = createProductRouter(env);
  app.use("/api/products", productRouter);
  app.use("/api/v1/products", productRouter);

  // API v1 namespace
  app.use("/api/v1", v1Router);

  // ── 404 Handler ───────────────────────────────────────────────────────────
  app.use(notFoundHandler);

  // ── Centralized Error Handler (must be registered last) ────────────────────
  app.use(errorHandler);

  return app;
}
