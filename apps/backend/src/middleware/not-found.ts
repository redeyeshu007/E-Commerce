import { type Request, type Response } from "express";

/**
 * 404 Not Found handler.
 * Registered after all routes in app.ts.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
}
