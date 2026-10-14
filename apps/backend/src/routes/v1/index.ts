import { Router } from "express";
import { healthRouter } from "../health.js";

/**
 * API v1 router — mounts v1 sub-routers.
 * Foundation endpoint:
 *   GET /api/v1/health
 *
 * Feature routers will be mounted incrementally in future tasks
 * after architectural review and finalization.
 */

export const v1Router = Router();

// Infrastructure health check
v1Router.use("/health", healthRouter);
