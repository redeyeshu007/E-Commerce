import { type Request, type Response, type NextFunction } from "express";
import { verifyAdminToken, type AdminTokenPayload } from "../utils/auth.js";
import type { EnvConfig } from "../config/env.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminTokenPayload;
    }
  }
}

/**
 * Middleware factory to protect admin routes.
 *
 * Verifies JWT session token from:
 * 1. HTTP-Only Cookie (`peralagae_admin_token`)
 * 2. Authorization Header (`Bearer <token>`)
 *
 * Returns HTTP 401 if token is missing, invalid, or expired.
 */
export function createAdminAuthMiddleware(env: EnvConfig) {
  return function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
    let token: string | undefined;

    // 1. Check HTTP-only cookie
    if (req.cookies && req.cookies["peralagae_admin_token"]) {
      token = req.cookies["peralagae_admin_token"];
    }

    // 2. Check Authorization header (Bearer token fallback for cross-domain / API clients)
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0]?.toLowerCase() === "bearer") {
        token = parts[1];
      }
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Admin authentication required",
        },
      });
      return;
    }

    const decoded = verifyAdminToken(token, env.ADMIN_JWT_SECRET);
    if (!decoded) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid or expired admin session",
        },
      });
      return;
    }

    req.admin = decoded;
    next();
  };
}
