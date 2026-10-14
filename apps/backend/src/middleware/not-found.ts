import { type Request, type Response } from "express";

/**
 * Centralized 404 Not Found handler.
 * Registered after all functional routes in app.ts.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
}
