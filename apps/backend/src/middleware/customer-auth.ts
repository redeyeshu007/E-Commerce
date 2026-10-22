import { type Request, type Response, type NextFunction } from "express";
import { CustomerService, type CustomerProfile } from "../services/customer-service.js";
import type { EnvConfig } from "../config/env.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      customer?: CustomerProfile;
    }
  }
}

export const CUSTOMER_COOKIE_NAME = "peralagae_customer_token";

/**
 * Middleware factory to protect customer-only routes (orders, profile, checkout).
 *
 * Verifies customer session token from:
 * 1. HTTP-Only Cookie (`peralagae_customer_token`)
 * 2. Authorization Header (`Bearer <token>`)
 *
 * Returns HTTP 401 if token is missing, invalid, or expired.
 */
export function createCustomerAuthMiddleware(env: EnvConfig) {
  return async function requireCustomerAuth(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    let token: string | undefined;

    // 1. Check HTTP-only cookie
    if (req.cookies && req.cookies[CUSTOMER_COOKIE_NAME]) {
      token = req.cookies[CUSTOMER_COOKIE_NAME];
    }

    // 2. Check Authorization header (Bearer token fallback for API clients / tests)
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
          message: "Customer authentication required. Please sign in to continue.",
        },
      });
      return;
    }

    try {
      const customer = await CustomerService.validateSession(token, env);

      if (!customer) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or expired customer session. Please sign in again.",
          },
        });
        return;
      }

      req.customer = customer;
      next();
    } catch {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Failed to validate customer session. Please sign in again.",
        },
      });
    }
  };
}
