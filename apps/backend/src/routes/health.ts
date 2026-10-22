import { Router, type Request, type Response } from "express";
import { checkDatabaseConnection } from "../database/prisma.js";

/**
 * Infrastructure health check router.
 *
 * Exposes:
 * - GET /api/health       -> Liveness probe (HTTP server running)
 * - GET /api/health/ready -> Readiness probe (Database connectivity check)
 *
 * Strict Rules:
 * - Liveness is separated from database readiness.
 * - Connection status is reported honestly without unhandled exceptions.
 * - Zero credentials, connection strings, or internal infrastructure details exposed.
 */

export const healthRouter = Router();

/**
 * Liveness endpoint.
 * Returns 200 indicating the Express HTTP server process is running.
 */
healthRouter.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      service: "peralagae-backend",
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime() * 100) / 100,
    },
  });
});

/**
 * Readiness endpoint.
 * Performs a real check against MongoDB via Prisma.
 * Returns 200 if connected, or 503 if disconnected/unconfigured.
 */
healthRouter.get("/ready", async (_req: Request, res: Response) => {
  const dbStatus = await checkDatabaseConnection();

  if (dbStatus.connected) {
    res.status(200).json({
      success: true,
      data: {
        status: "ok",
        database: {
          connected: true,
          latencyMs: dbStatus.latencyMs,
        },
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  res.status(503).json({
    success: false,
    data: {
      status: "degraded",
      database: {
        connected: false,
        error: dbStatus.error,
      },
      timestamp: new Date().toISOString(),
    },
    error: {
      code: "DATABASE_UNAVAILABLE",
      message: "Database connection is not available",
    },
  });
});
