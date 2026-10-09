import { Router, type Request, type Response } from "express";

/**
 * Health check router.
 *
 * GET /api/v1/health
 * Returns a simple status response to confirm the server is running.
 * This is the ONLY functional endpoint in the scaffold.
 * No database connectivity check is performed here to avoid a hard
 * dependency on PostgreSQL during initial development.
 */

export const healthRouter = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     description: Returns the current health status of the API server.
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: ok
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 */
healthRouter.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    },
  });
});
