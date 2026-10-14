import { type Request, type Response, type NextFunction } from "express";
import type { AppError } from "../types/errors.js";
import { logger } from "../utils/logger.js";

/**
 * Global error handler middleware.
 * Must be registered LAST in app.ts (after all routes).
 *
 * Requirements:
 * - Appropriate HTTP status codes
 * - Consistent JSON error envelope
 * - Graceful handling of malformed JSON requests
 * - No leaking of stack traces or sensitive internals in production
 * - Request-ID correlation for unexpected errors
 */

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
  type?: string;
}

export function errorHandler(
  err: AppError | HttpError | Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const requestId =
    (req as Request & { id?: string }).id || (req.headers["x-request-id"] as string) || "unknown";

  // 1. Handle Malformed JSON parsing errors from express.json()
  if (err instanceof SyntaxError && "status" in err && err.status === 400 && "body" in err) {
    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_JSON",
        message: "Malformed JSON payload in request body",
      },
    });
    return;
  }

  // 2. Handle structured AppError instances
  const isAppError = "statusCode" in err && "code" in err;
  const statusCode = isAppError
    ? (err as AppError).statusCode
    : (err as HttpError).statusCode || (err as HttpError).status || 500;
  const code = isAppError
    ? (err as AppError).code
    : statusCode === 400
      ? "BAD_REQUEST"
      : "INTERNAL_SERVER_ERROR";

  const isProduction = process.env["NODE_ENV"] === "production";

  // In production, mask non-AppError messages to prevent leaking stack details or paths
  const message =
    isProduction && !isAppError && statusCode >= 500
      ? "An unexpected internal server error occurred"
      : err.message || "An unexpected error occurred";

  // Log unexpected server errors (5xx) with request context
  if (statusCode >= 500) {
    logger.error(
      {
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode,
        err: {
          name: err.name,
          message: err.message,
          stack: isProduction ? undefined : err.stack,
        },
      },
      "Unhandled server error encountered",
    );
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(isProduction ? {} : { stack: err.stack }),
    },
  });
}
