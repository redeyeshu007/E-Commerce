import { Router, type Request, type Response } from "express";
import { z } from "zod";
import type { EnvConfig } from "../config/env.js";
import { EmailService } from "../services/email/email-service.js";
import { CartReminderService } from "../services/email/cart-reminder-service.js";
import { createAdminAuthMiddleware } from "../middleware/admin-auth.js";
import { createCustomerAuthMiddleware, CUSTOMER_COOKIE_NAME } from "../middleware/customer-auth.js";
import { CustomerService } from "../services/customer-service.js";
import { prisma } from "../database/prisma.js";
import { logger } from "../utils/logger.js";

const emailPreferencesSchema = z.object({
  emailCartRemindersEnabled: z.boolean().optional(),
  emailOrderUpdatesEnabled: z.boolean().optional(),
});

export function createEmailRouter(env: EnvConfig): Router {
  const router = Router();
  const requireAdminAuth = createAdminAuthMiddleware(env);
  const requireCustomerAuth = createCustomerAuthMiddleware(env);

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN EMAIL MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/emails/admin/logs
   * Retrieves paginated email notification logs with search and filtering
   */
  router.get("/admin/logs", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const page = req.query["page"] ? Number(req.query["page"]) : 1;
      const limit = req.query["limit"] ? Number(req.query["limit"]) : 20;
      const search = typeof req.query["search"] === "string" ? req.query["search"] : undefined;
      const status = typeof req.query["status"] === "string" ? req.query["status"] : undefined;
      const emailType = typeof req.query["emailType"] === "string" ? req.query["emailType"] : undefined;

      const queryOptions: {
        page: number;
        limit: number;
        search?: string | undefined;
        status?: string | undefined;
        emailType?: string | undefined;
      } = { page, limit };
      if (search) queryOptions.search = search;
      if (status) queryOptions.status = status;
      if (emailType) queryOptions.emailType = emailType;

      const result = await EmailService.getEmailLogs(queryOptions);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to fetch email notification logs");
      res.status(500).json({
        success: false,
        error: { code: "FETCH_EMAIL_LOGS_FAILED", message: "Failed to fetch email logs" },
      });
    }
  });

  /**
   * GET /api/emails/admin/stats
   * Retrieves system email statistics and provider configuration
   */
  router.get("/admin/stats", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const stats = await EmailService.getEmailStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to fetch email stats");
      res.status(500).json({
        success: false,
        error: { code: "FETCH_STATS_FAILED", message: "Failed to fetch email stats" },
      });
    }
  });

  /**
   * POST /api/emails/admin/logs/:id/retry
   * Retries an eligible failed email
   */
  router.post("/admin/logs/:id/retry", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const rawId = req.params["id"];
      const emailLogId = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] || "" : "";
      if (!emailLogId) {
        res.status(400).json({ success: false, error: { message: "Email Log ID is required" } });
        return;
      }

      const result = await EmailService.retryFailedEmail(emailLogId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      res.status(error.status || 500).json({
        success: false,
        error: { code: "RETRY_EMAIL_FAILED", message: error.message || "Failed to retry email" },
      });
    }
  });

  /**
   * POST /api/emails/admin/cart-reminder/trigger
   * Manually triggers the Daily Abandoned Cart Reminder job (for testing or ad-hoc runs)
   */
  router.post("/admin/cart-reminder/trigger", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const jobResult = await CartReminderService.runDailyCartReminderJob();
      res.status(200).json({
        success: true,
        data: jobResult,
      });
    } catch (err: unknown) {
      logger.error({ err }, "Manual trigger of cart reminder job failed");
      res.status(500).json({
        success: false,
        error: { code: "CART_REMINDER_TRIGGER_FAILED", message: (err as Error).message },
      });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // WEBHOOKS & CUSTOMER PREFERENCES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * POST /api/emails/admin/smtp/verify
   * Verifies SMTP connectivity and transport health
   */
  router.post("/admin/smtp/verify", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const result = await EmailService.verifyConnection();
      res.status(200).json({
        success: result.success,
        data: result,
      });
    } catch (err: unknown) {
      logger.error({ err }, "SMTP verification request failed");
      res.status(500).json({
        success: false,
        error: { code: "SMTP_VERIFICATION_FAILED", message: (err as Error).message },
      });
    }
  });

  /**
   * POST /api/emails/webhook
   * Compatibility endpoint (Nodemailer uses standard direct SMTP transport)
   */
  router.post("/webhook", async (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", message: "Direct SMTP transport in use" });
  });

  /**
   * GET /api/emails/unsubscribe
   * Public unsubscribe handler using secure customer unsubscribe token
   */
  router.get("/unsubscribe", async (req: Request, res: Response) => {
    const token = typeof req.query["token"] === "string" ? req.query["token"].trim() : "";
    if (!token) {
      res.status(400).send("Invalid or missing unsubscribe token.");
      return;
    }

    try {
      const customer = await prisma.customer.findUnique({
        where: { unsubscribeToken: token },
      });

      if (!customer) {
        res.status(404).send("Customer record not found or already unsubscribed.");
        return;
      }

      await prisma.customer.update({
        where: { id: customer.id },
        data: { emailCartRemindersEnabled: false },
      });

      // Redirect to frontend unsubscribe confirmation or render luxury branded message
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Unsubscribed — PERALAGAE</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Georgia, serif; background: #FAF9F6; color: #111; display: flex; align-items: center; justify-content: center; min-height: 90vh; margin: 0; padding: 20px; }
            .card { background: #FFF; border: 1px solid #EAE6DF; max-width: 480px; padding: 40px; text-align: center; border-radius: 4px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
            h1 { font-size: 24px; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 12px; }
            p { font-family: -apple-system, sans-serif; font-size: 14px; line-height: 1.6; color: #666; margin-bottom: 24px; }
            a { display: inline-block; background: #111; color: #FFF; padding: 12px 28px; text-decoration: none; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; font-family: -apple-system, sans-serif; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>PERALAGAE</h1>
            <p>You have successfully unsubscribed from daily cart reminder emails for <strong>${customer.email}</strong>. You will still receive critical order confirmations and shipment tracking updates.</p>
            <a href="${env.FRONTEND_URL}">Return to Boutique</a>
          </div>
        </body>
        </html>
      `);
    } catch (err) {
      logger.error({ err }, "Error processing unsubscribe request");
      res.status(500).send("Unable to process request at this time.");
    }
  });

  /**
   * GET /api/emails/preferences
   * Retrieves email preferences for customer (via token or authenticated session)
   */
  router.get("/preferences", async (req: Request, res: Response) => {
    try {
      const token = typeof req.query["token"] === "string" ? req.query["token"].trim() : "";
      let customerId: string | undefined;

      if (token) {
        const c = await prisma.customer.findUnique({
          where: { unsubscribeToken: token },
          select: { id: true },
        });
        if (c) customerId = c.id;
      }

      if (!customerId) {
        const sessionToken =
          req.cookies?.[CUSTOMER_COOKIE_NAME] ||
          req.headers.authorization?.replace(/^Bearer /i, "");
        if (sessionToken) {
          const session = await CustomerService.validateSession(sessionToken, env);
          if (session) customerId = session.id;
        }
      }

      if (!customerId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Valid preference token or session required" },
        });
        return;
      }

      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: {
          id: true,
          email: true,
          emailCartRemindersEnabled: true,
          emailOrderUpdatesEnabled: true,
        },
      });

      res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to fetch email preferences");
      res.status(500).json({
        success: false,
        error: { code: "FETCH_PREFERENCES_FAILED", message: "Failed to fetch preferences" },
      });
    }
  });

  /**
   * POST /api/emails/preferences
   * Updates email preferences for customer (via token or authenticated session)
   */
  router.post("/preferences", async (req: Request, res: Response) => {
    const parseResult = emailPreferencesSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid preferences format" },
      });
      return;
    }

    try {
      const bodyToken = typeof req.body["token"] === "string" ? req.body["token"].trim() : "";
      let customerId: string | undefined;

      if (bodyToken) {
        const c = await prisma.customer.findUnique({
          where: { unsubscribeToken: bodyToken },
          select: { id: true },
        });
        if (c) customerId = c.id;
      }

      if (!customerId) {
        const sessionToken =
          req.cookies?.[CUSTOMER_COOKIE_NAME] ||
          req.headers.authorization?.replace(/^Bearer /i, "");
        if (sessionToken) {
          const session = await CustomerService.validateSession(sessionToken, env);
          if (session) customerId = session.id;
        }
      }

      if (!customerId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Valid preference token or session required" },
        });
        return;
      }

      const updateData: {
        emailCartRemindersEnabled?: boolean;
        emailOrderUpdatesEnabled?: boolean;
      } = {};
      if (typeof parseResult.data.emailCartRemindersEnabled === "boolean") {
        updateData.emailCartRemindersEnabled = parseResult.data.emailCartRemindersEnabled;
      }
      if (typeof parseResult.data.emailOrderUpdatesEnabled === "boolean") {
        updateData.emailOrderUpdatesEnabled = parseResult.data.emailOrderUpdatesEnabled;
      }

      const updated = await prisma.customer.update({
        where: { id: customerId },
        data: updateData,
        select: {
          emailCartRemindersEnabled: true,
          emailOrderUpdatesEnabled: true,
        },
      });

      res.status(200).json({
        success: true,
        data: updated,
        message: "Email preferences updated successfully",
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to update email preferences");
      res.status(500).json({
        success: false,
        error: { code: "UPDATE_PREFERENCES_FAILED", message: "Failed to update preferences" },
      });
    }
  });

  return router;
}
