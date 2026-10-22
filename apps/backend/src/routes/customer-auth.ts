import { Router, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import type { EnvConfig } from "../config/env.js";
import { CustomerService } from "../services/customer-service.js";
import {
  createCustomerAuthMiddleware,
  CUSTOMER_COOKIE_NAME,
} from "../middleware/customer-auth.js";
import { logger } from "../utils/logger.js";

const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(80),
  email: z.string().trim().email("A valid email address is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email("A valid email address is required"),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("A valid email address is required"),
});

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-zA-Z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-zA-Z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => Boolean(data.newPassword || data.password), {
    message: "New password is required",
    path: ["newPassword"],
  });

const googleAuthSchema = z.object({
  credential: z.string().optional(),
  code: z.string().optional(),
  redirectUri: z.string().optional(),
});

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(80).optional(),
  recipientName: z.string().trim().min(2, "Recipient full name must be at least 2 characters").max(80),
  phone: z
    .string()
    .trim()
    .refine(
      (val) => {
        const cleaned = val.replace(/[\s\-\(\)]/g, "").replace(/^(\+91|0)/, "");
        return /^[6-9]\d{9}$/.test(cleaned);
      },
      { message: "Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9" }
    ),
  streetAddress: z.string().trim().min(5, "Street address / House number must be at least 5 characters").max(200),
  city: z.string().trim().min(2, "City must be at least 2 characters").max(80),
  state: z.string().trim().min(2, "State is required").max(80),
  pinCode: z
    .string()
    .trim()
    .refine(
      (val) => {
        const cleaned = val.replace(/\s+/g, "");
        return /^[1-9][0-9]{5}$/.test(cleaned);
      },
      { message: "Please enter a valid 6-digit Indian PIN code" }
    ),
  country: z.string().trim().optional().default("India"),
});

export function createCustomerAuthRouter(env: EnvConfig): Router {
  const router = Router();
  const requireCustomerAuth = createCustomerAuthMiddleware(env);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: env.NODE_ENV === "test" || env.NODE_ENV === "development" ? 300 : 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Too many authentication requests. Please wait a few minutes before trying again.",
      },
    },
  });

  const cookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: (env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: "/",
  };

  /**
   * POST /register
   * Creates a new customer account and establishes an authenticated session
   */
  router.post("/register", authLimiter, async (req: Request, res: Response) => {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parseResult.error.issues[0]?.message || "Invalid registration data",
        },
      });
      return;
    }

    const { fullName, email, password, confirmPassword } = parseResult.data;

    if (confirmPassword && confirmPassword !== password) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Passwords do not match",
        },
      });
      return;
    }

    try {
      const userAgent = req.headers["user-agent"];
      const ipAddress = req.ip;
      const result = await CustomerService.registerCustomer(
        { fullName, email, password },
        env,
        {
          ...(userAgent ? { userAgent } : {}),
          ...(ipAddress ? { ipAddress } : {}),
        }
      );

      res.cookie(CUSTOMER_COOKIE_NAME, result.token, cookieOptions);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      const status = error.status || 500;
      res.status(status).json({
        success: false,
        error: {
          code: error.code || "REGISTRATION_FAILED",
          message: error.message || "Failed to create customer account. Please try again.",
        },
      });
    }
  });

  /**
   * POST /login
   * Authenticates customer with email & password and sets HTTP-only session cookie
   */
  router.post("/login", authLimiter, async (req: Request, res: Response) => {
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

    try {
      const userAgent = req.headers["user-agent"];
      const ipAddress = req.ip;
      const result = await CustomerService.authenticateCustomer(
        parseResult.data,
        env,
        {
          ...(userAgent ? { userAgent } : {}),
          ...(ipAddress ? { ipAddress } : {}),
        }
      );

      res.cookie(CUSTOMER_COOKIE_NAME, result.token, cookieOptions);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      const status = error.status || 401;
      res.status(status).json({
        success: false,
        error: {
          code: error.code || "INVALID_CREDENTIALS",
          message: error.message || "Invalid email or password",
        },
      });
    }
  });

  /**
   * GET /me
   * Returns authenticated customer session info with latest profile completion status
   */
  router.get("/me", requireCustomerAuth, async (req: Request, res: Response) => {
    try {
      const fullProfile = await CustomerService.getFullProfile(req.customer!.id);
      const profileData = fullProfile?.profile || req.customer?.profile || null;
      const isProfileComplete = fullProfile?.isProfileComplete ?? Boolean(req.customer?.isProfileComplete);
      const baseCustomer = fullProfile?.customer || req.customer!;

      const customerWithProfile = {
        ...baseCustomer,
        profile: profileData,
        isProfileComplete,
      };

      res.status(200).json({
        success: true,
        data: {
          customer: customerWithProfile,
          profile: profileData,
          isProfileComplete,
        },
      });
    } catch (err: unknown) {
      logger.error({ err }, "Error in /me endpoint");
      res.status(200).json({
        success: true,
        data: {
          customer: req.customer,
          profile: req.customer?.profile || null,
          isProfileComplete: Boolean(req.customer?.isProfileComplete),
        },
      });
    }
  });

  /**
   * GET /profile
   * Returns authenticated customer profile and shipping address
   */
  router.get("/profile", requireCustomerAuth, async (req: Request, res: Response) => {
    try {
      const details = await CustomerService.getFullProfile(req.customer!.id);
      if (!details) {
        res.status(404).json({
          success: false,
          error: {
            code: "CUSTOMER_NOT_FOUND",
            message: "Customer profile not found",
          },
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: details,
      });
    } catch (err: unknown) {
      logger.error({ err }, "Error fetching customer profile");
      res.status(500).json({
        success: false,
        error: {
          code: "PROFILE_FETCH_FAILED",
          message: "Failed to fetch customer profile",
        },
      });
    }
  });

  /**
   * PUT /profile
   * Saves or updates authenticated customer profile and default shipping address in MongoDB
   */
  router.put("/profile", requireCustomerAuth, async (req: Request, res: Response) => {
    const parseResult = profileSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parseResult.error.issues[0]?.message || "Invalid profile data",
        },
      });
      return;
    }

    try {
      const updated = await CustomerService.saveProfile(req.customer!.id, parseResult.data);
      res.status(200).json({
        success: true,
        message: "Profile saved successfully",
        data: updated,
      });
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      logger.error({ err }, "Error saving customer profile");
      res.status(error.status || 500).json({
        success: false,
        error: {
          code: error.code || "PROFILE_SAVE_FAILED",
          message: error.message || "Failed to save profile",
        },
      });
    }
  });

  /**
   * POST /logout
   * Clears session cookie and invalidates customer session in DB
   */
  router.post("/logout", async (req: Request, res: Response) => {
    const token =
      req.cookies?.[CUSTOMER_COOKIE_NAME] ||
      req.headers.authorization?.replace(/^Bearer /i, "");

    if (token) {
      await CustomerService.revokeSession(token);
    }

    res.clearCookie(CUSTOMER_COOKIE_NAME, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Customer signed out successfully",
    });
  });

  /**
   * POST /forgot-password
   * Sends password reset instructions
   */
  router.post("/forgot-password", authLimiter, async (req: Request, res: Response) => {
    const parseResult = forgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parseResult.error.issues[0]?.message || "A valid email address is required",
        },
      });
      return;
    }

    try {
      const result = await CustomerService.requestPasswordReset(parseResult.data.email);
      res.status(200).json(result);
    } catch (err: unknown) {
      logger.error({ err }, "Error in forgot-password endpoint");
      res.status(200).json({
        success: true,
        message: "If an account exists with this email, password reset instructions have been sent.",
      });
    }
  });

  /**
   * POST /reset-password
   * Resets password using single-use token
   */
  router.post("/reset-password", authLimiter, async (req: Request, res: Response) => {
    const parseResult = resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parseResult.error.issues[0]?.message || "Invalid password reset data",
        },
      });
      return;
    }

    const { token, newPassword, password, confirmPassword } = parseResult.data;
    const finalPassword = (newPassword || password)!;

    if (confirmPassword && confirmPassword !== finalPassword) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Passwords do not match",
        },
      });
      return;
    }

    try {
      const result = await CustomerService.resetPassword(token, finalPassword);
      res.status(200).json(result);
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      res.status(error.status || 400).json({
        success: false,
        error: {
          code: error.code || "RESET_FAILED",
          message: error.message || "Failed to reset password. Please try again.",
        },
      });
    }
  });

  /**
   * POST /google
   * Authenticates customer via Google OAuth credential or authorization code
   */
  router.post("/google", authLimiter, async (req: Request, res: Response) => {
    const parseResult = googleAuthSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parseResult.error.issues[0]?.message || "Invalid Google authentication payload",
        },
      });
      return;
    }

    try {
      const { credential, code, redirectUri } = parseResult.data;
      const userAgent = req.headers["user-agent"];
      const ipAddress = req.ip;

      const result = await CustomerService.authenticateGoogle(
        {
          ...(credential ? { credential } : {}),
          ...(code ? { code } : {}),
          ...(redirectUri ? { redirectUri } : {}),
        },
        env,
        {
          ...(userAgent ? { userAgent } : {}),
          ...(ipAddress ? { ipAddress } : {}),
        }
      );

      res.cookie(CUSTOMER_COOKIE_NAME, result.token, cookieOptions);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      res.status(error.status || 400).json({
        success: false,
        error: {
          code: error.code || "GOOGLE_AUTH_FAILED",
          message: error.message || "Google authentication failed",
        },
      });
    }
  });

  /**
   * GET /google/url
   * Generates official Google OAuth authorization URL
   */
  router.get("/google/url", (req: Request, res: Response) => {
    try {
      const redirectUri =
        (req.query["redirectUri"] as string) ||
        `${req.protocol}://${req.get("host")}/api/auth/callback/google`;

      const result = CustomerService.getGoogleAuthUrl(env, redirectUri);
      res.status(200).json({
        success: true,
        data: {
          configured: true,
          authUrl: result.url,
          state: result.state,
        },
      });
    } catch (err: unknown) {
      const error = err as { code?: string; status?: number; message?: string };
      res.status(error.status || 500).json({
        success: false,
        error: {
          code: error.code || "GOOGLE_URL_FAILED",
          message: error.message || "Failed to generate Google OAuth URL",
        },
        data: {
          configured: false,
        },
      });
    }
  });

  /**
   * GET /callback/google
   * Browser redirect handler for Google OAuth code flow
   */
  router.get("/callback/google", async (req: Request, res: Response) => {
    const code = req.query["code"] as string;
    const errorParam = req.query["error"] as string;

    if (errorParam) {
      logger.warn({ errorParam }, "Google OAuth callback returned error");
      const redirectTarget = `${env.CORS_ORIGINS[0] || "http://localhost:3000"}?authError=${encodeURIComponent(
        errorParam
      )}`;
      res.redirect(redirectTarget);
      return;
    }

    if (!code) {
      res.status(400).send("Missing Google OAuth authorization code");
      return;
    }

    try {
      const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/callback/google`;
      const userAgent = req.headers["user-agent"];
      const ipAddress = req.ip;

      const result = await CustomerService.authenticateGoogle(
        { code, redirectUri },
        env,
        {
          ...(userAgent ? { userAgent } : {}),
          ...(ipAddress ? { ipAddress } : {}),
        }
      );

      res.cookie(CUSTOMER_COOKIE_NAME, result.token, cookieOptions);

      // Redirect back to storefront destination
      const storefrontUrl = env.CORS_ORIGINS[0] || "http://localhost:3000";
      res.redirect(`${storefrontUrl}?authSuccess=google`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      const redirectTarget = `${env.CORS_ORIGINS[0] || "http://localhost:3000"}?authError=${encodeURIComponent(
        message
      )}`;
      res.redirect(redirectTarget);
    }
  });

  return router;
}
