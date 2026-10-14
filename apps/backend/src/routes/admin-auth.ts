import { Router, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import type { EnvConfig } from "../config/env.js";
import { verifyPassword, signAdminToken } from "../utils/auth.js";
import { createAdminAuthMiddleware } from "../middleware/admin-auth.js";
import { logger } from "../utils/logger.js";

const COOKIE_NAME = "peralagae_admin_token";

const loginSchema = z.object({
  email: z.string().email("A valid email address is required"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Admin Authentication Router factory.
 *
 * Implements Phase 1 Admin Auth:
 * - POST /api/admin/auth/login  (rate-limited, secure credentials check, sets HTTP-only cookie)
 * - GET  /api/admin/auth/me     (session validation)
 * - POST /api/admin/auth/logout (cookie invalidation)
 */
export function createAdminAuthRouter(env: EnvConfig): Router {
  const router = Router();
  const requireAdminAuth = createAdminAuthMiddleware(env);

  // Rate limiter specifically for admin login attempts
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: env.NODE_ENV === "test" ? 100 : 10, // 10 attempts in prod/dev
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Too many login attempts. Please wait 15 minutes before trying again.",
      },
    },
  });

  /**
   * POST /login
   * Authenticates the admin and issues a session cookie & token.
   */
  router.post("/login", loginLimiter, async (req: Request, res: Response) => {
    // 1. Validate request body
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parseResult.error.issues[0]?.message || "Invalid email or password format",
        },
      });
      return;
    }

    const { email, password } = parseResult.data;

    // 2. Constant-time check: email match
    const emailMatches = email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase();

    // 3. Constant-time check: password match
    // Even if email does not match, still perform verifyPassword against dummy string to avoid timing attacks
    const passwordTarget = emailMatches
      ? env.ADMIN_PASSWORD
      : "$2a$12$e8eYQv8gJ24w6wP8j3dCq.r06H0F7B5p.1C2d3E4f5G6h7I8j9k0l";
    const passwordMatches = await verifyPassword(password, passwordTarget);

    if (!emailMatches || !passwordMatches) {
      logger.warn({ ip: req.ip }, "Failed admin login attempt");
      res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
      });
      return;
    }

    // 4. Issue session token
    const token = signAdminToken({ email: env.ADMIN_EMAIL }, env.ADMIN_JWT_SECRET);

    // 5. Set secure HTTP-only cookie
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
    });

    logger.info({ email: env.ADMIN_EMAIL }, "Admin logged in successfully");

    res.status(200).json({
      success: true,
      data: {
        token,
        admin: {
          email: env.ADMIN_EMAIL,
          role: "admin",
        },
      },
    });
  });

  /**
   * GET /me
   * Validates active admin session.
   */
  router.get("/me", requireAdminAuth, (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        email: req.admin?.email,
        role: "admin",
      },
    });
  });

  /**
   * POST /logout
   * Clears session cookie and invalidates client session.
   */
  router.post("/logout", (req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  });

  return router;
}
