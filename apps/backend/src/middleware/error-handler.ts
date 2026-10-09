import { type Request, type Response, type NextFunction } from "express";
import type { AppError } from "../types/errors.js";

/**
 * Global error handler middleware.
 * Must be registered LAST in app.ts (after all routes).
 *
 * Converts any thrown error into the standard API error response envelope.
 */
export function errorHandler(
  err: AppError | Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const isAppError = "statusCode" in err && "code" in err;

  const statusCode = isAppError ? (err as AppError).statusCode : 500;
  const code = isAppError ? (err as AppError).code : "INTERNAL_SERVER_ERROR";
  const message =
    process.env["NODE_ENV"] === "production" && !isAppError
      ? "An unexpected error occurred"
      : err.message;

  if (statusCode >= 500) {
    console.error("[error]", err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}
