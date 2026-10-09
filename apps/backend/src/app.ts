import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import type { EnvConfig } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { v1Router } from "./routes/v1/index.js";
import { setupSwagger } from "./lib/swagger.js";

/**
 * Creates and configures the Express application.
 * Exported separately from the server entry point so it can be imported
 * by integration tests without starting a real HTTP listener.
 */
export function createApp(env: EnvConfig): Application {
  const app = express();

  // ── Security ─────────────────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );

  // ── Compression ───────────────────────────────────────────────────────────
  app.use(compression());

  // ── Request logging ───────────────────────────────────────────────────────
  if (env.NODE_ENV !== "test") {
    app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  }

  // ── Body parsing ─────────────────────────────────────────────────────────
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // ── Global rate limiting ──────────────────────────────────────────────────
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: "RATE_LIMITED", message: "Too many requests" } },
  });
  app.use(limiter);

  // ── API documentation ─────────────────────────────────────────────────────
  setupSwagger(app);

  // ── API routes ────────────────────────────────────────────────────────────
  app.use("/api/v1", v1Router);

  // ── 404 handler ───────────────────────────────────────────────────────────
  app.use(notFoundHandler);

  // ── Global error handler (must be last) ──────────────────────────────────
  app.use(errorHandler);

  return app;
}
