import nodemailer, { type Transporter, type SendMailOptions } from "nodemailer";
import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";
import { validateEnv, type EnvConfig } from "../../config/env.js";
import { StoreDetailsService } from "../store-details-service.js";
import {
  renderWelcomeEmail,
  renderPasswordResetOtpEmail,
  renderDailyCartReminderEmail,
  renderOrderConfirmedEmail,
  renderOrderProcessingEmail,
  renderOrderShippedEmail,
  renderOrderDeliveredEmail,
  type WelcomeEmailData,
  type PasswordResetOtpData,
  type CartReminderData,
  type OrderEmailData,
  type OrderStatusProcessingData,
  type OrderShippedData,
  type OrderDeliveredData,
  type StoreContactInfo,
} from "./email-templates.js";

export type EmailType =
  | "WELCOME"
  | "PASSWORD_RESET_OTP"
  | "DAILY_CART_REMINDER"
  | "ORDER_CONFIRMED"
  | "ORDER_PROCESSING"
  | "ORDER_SHIPPED"
  | "ORDER_COMPLETED";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  emailType: EmailType;
  customerId?: string | undefined;
  orderId?: string | undefined;
  idempotencyKey?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface EmailLogResult {
  id: string;
  recipientEmail: string;
  emailType: string;
  status: string;
  providerMessageId?: string | null;
  errorMessage?: string | null;
  sentAt?: Date | null;
  createdAt: Date;
}

export class EmailService {
  private static transporterInstance: Transporter | null = null;
  private static cachedEnv: EnvConfig | null = null;

  /**
   * Lazily loads and validates environment configuration
   */
  private static getEnv(): EnvConfig {
    if (!this.cachedEnv) {
      this.cachedEnv = validateEnv();
    }
    return this.cachedEnv;
  }

  /**
   * Returns initialized Nodemailer SMTP transporter singleton or null if unconfigured
   */
  private static getTransporter(): Transporter | null {
    if (this.transporterInstance) {
      return this.transporterInstance;
    }

    const env = this.getEnv();
    if (
      env.NODE_ENV === "test" ||
      !env.SMTP_HOST ||
      env.SMTP_HOST.includes("mock") ||
      env.SMTP_HOST.includes("test")
    ) {
      return null;
    }

    const auth =
      env.SMTP_USER && env.SMTP_PASS
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          }
        : undefined;

    this.transporterInstance = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT || 587),
      secure: env.SMTP_SECURE, // true for 465 (implicit TLS), false for 587 (STARTTLS)
      auth,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    return this.transporterInstance;
  }

  /**
   * Verifies SMTP connectivity and credentials without crashing application
   */
  static async verifyConnection(): Promise<{ success: boolean; message: string }> {
    const env = this.getEnv();
    if (
      env.NODE_ENV === "test" ||
      !env.SMTP_HOST ||
      env.SMTP_HOST.includes("mock") ||
      env.SMTP_HOST.includes("test")
    ) {
      logger.info("SMTP verification skipped (dev/test mock environment)");
      return { success: true, message: "SMTP simulated verification (dev/test environment)" };
    }

    const transporter = this.getTransporter();
    if (!transporter) {
      const msg = "SMTP host or configuration is missing";
      logger.warn(msg);
      return { success: false, message: msg };
    }

    try {
      await transporter.verify();
      const successMsg = `SMTP connection to ${env.SMTP_HOST}:${env.SMTP_PORT} verified successfully`;
      logger.info({ host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_SECURE }, successMsg);
      return { success: true, message: successMsg };
    } catch (err: unknown) {
      const errMsg = (err as Error).message || "SMTP connection verification failed";
      logger.warn({ host: env.SMTP_HOST, port: env.SMTP_PORT, error: errMsg }, "SMTP verification failed");
      return { success: false, message: errMsg };
    }
  }

  /**
   * Central sending dispatcher with database-backed idempotency, logging, and error handling.
   * Uses Nodemailer SMTP exclusively. NEVER throws unhandled errors that break core commerce transactions.
   */
  static async sendEmail(options: SendEmailOptions): Promise<{
    success: boolean;
    providerMessageId?: string | undefined;
    logId?: string | undefined;
    error?: string | undefined;
  }> {
    const env = this.getEnv();
    const { to, subject, html, text, emailType, customerId, orderId, idempotencyKey, metadata } = options;

    const normalizedRecipient = to.trim().toLowerCase();

    // 1. Check idempotency key: if email already SENT or DELIVERED, prevent duplicate send
    if (idempotencyKey) {
      try {
        const existingLog = await prisma.emailLog.findUnique({
          where: { idempotencyKey },
        });

        if (existingLog && (existingLog.status === "SENT" || existingLog.status === "DELIVERED")) {
          logger.info(
            { idempotencyKey, emailType, recipient: normalizedRecipient },
            "Email already sent with this idempotency key. Skipping duplicate send."
          );
          return {
            success: true,
            providerMessageId: existingLog.providerMessageId || undefined,
            logId: existingLog.id,
          };
        }
      } catch (err) {
        logger.warn({ err, idempotencyKey }, "Failed to query existing email log for idempotency");
      }
    }

    // 2. Check if customer has opted out of this email type
    if (customerId) {
      try {
        const customer = await prisma.customer.findUnique({
          where: { id: customerId },
          select: {
            emailCartRemindersEnabled: true,
            emailOrderUpdatesEnabled: true,
          },
        });

        if (customer) {
          if (emailType === "DAILY_CART_REMINDER" && !customer.emailCartRemindersEnabled) {
            logger.info({ customerId, emailType }, "Customer has opted out of cart reminders. Suppressing email.");
            return { success: false, error: "Customer opted out of cart reminders" };
          }
          if (
            (emailType === "ORDER_CONFIRMED" ||
              emailType === "ORDER_PROCESSING" ||
              emailType === "ORDER_SHIPPED" ||
              emailType === "ORDER_COMPLETED") &&
            !customer.emailOrderUpdatesEnabled
          ) {
            logger.info({ customerId, emailType }, "Customer opted out of transactional order updates.");
          }
        }
      } catch (err) {
        logger.warn({ err, customerId }, "Failed to verify customer email preference");
      }
    }

    // 3. Prepare initial pending EmailLog entry in MongoDB
    let emailLogId: string | undefined;
    try {
      const logRecord = await prisma.emailLog.create({
        data: {
          customerId: customerId || null,
          orderId: orderId || null,
          recipientEmail: normalizedRecipient,
          emailType,
          subject,
          provider: "SMTP",
          status: "PENDING",
          idempotencyKey: idempotencyKey || null,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        },
      });
      emailLogId = logRecord.id;
    } catch (err) {
      logger.warn({ err, emailType, recipient: normalizedRecipient }, "Failed to create preliminary EmailLog");
    }

    // 4. Verify sending enablement
    if (!env.EMAIL_ENABLED) {
      logger.info({ emailType, recipient: normalizedRecipient }, "Email delivery is disabled via EMAIL_ENABLED=false");
      if (emailLogId) {
        await prisma.emailLog.update({
          where: { id: emailLogId },
          data: { status: "SENT", providerMessageId: "disabled-simulated" },
        }).catch(() => {});
      }
      return { success: true, providerMessageId: "disabled-simulated", logId: emailLogId };
    }

    const transporter = this.getTransporter();

    // 5. Handle environment without live SMTP transporter (e.g. offline tests or local development)
    if (!transporter) {
      if (env.NODE_ENV === "production" && !env.SMTP_HOST) {
        const errorMsg = "SMTP_HOST is not configured on production server";
        logger.error({ emailType, recipient: normalizedRecipient }, errorMsg);
        if (emailLogId) {
          await prisma.emailLog.update({
            where: { id: emailLogId },
            data: { status: "FAILED", errorMessage: errorMsg },
          }).catch(() => {});
        }
        return { success: false, error: errorMsg, logId: emailLogId };
      }

      // In development / test: simulate successful email dispatch
      const simulatedId = `<sim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}@peralagae.com>`;
      logger.info(
        { emailType, recipient: normalizedRecipient, simulatedId },
        `[DEV/TEST] SMTP mock mode or unconfigured. Simulated email dispatch.`
      );

      if (emailLogId) {
        await prisma.emailLog.update({
          where: { id: emailLogId },
          data: {
            status: "SENT",
            providerMessageId: simulatedId,
            sentAt: new Date(),
          },
        }).catch(() => {});
      }

      return { success: true, providerMessageId: simulatedId, logId: emailLogId };
    }

    // 6. Perform live dispatch via Nodemailer SMTP Transporter
    const fromAddress = env.EMAIL_FROM_NAME
      ? `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`
      : env.EMAIL_FROM;

    try {
      const mailOptions: SendMailOptions = {
        from: fromAddress,
        to: normalizedRecipient,
        subject,
        html,
        text,
        headers: {
          "X-Entity-Ref-ID": idempotencyKey || emailLogId || String(Date.now()),
          "X-Mailer": "PERALAGAE-SMTP",
        },
      };

      if (env.EMAIL_REPLY_TO) {
        mailOptions.replyTo = env.EMAIL_REPLY_TO;
      }

      const info = await transporter.sendMail(mailOptions);
      const providerMessageId = info.messageId || `<smtp_${Date.now()}@peralagae.com>`;

      logger.info(
        { providerMessageId, emailType, recipient: normalizedRecipient },
        "Email successfully dispatched via Nodemailer SMTP"
      );

      if (emailLogId) {
        await prisma.emailLog.update({
          where: { id: emailLogId },
          data: {
            status: "SENT",
            providerMessageId,
            sentAt: new Date(),
          },
        }).catch(() => {});
      }

      return { success: true, providerMessageId, logId: emailLogId };
    } catch (err: unknown) {
      // Safe sanitization: NEVER log or expose SMTP credentials/passwords
      const rawError = err as Error & { code?: string; command?: string };
      const safeErrorMsg = rawError.code
        ? `SMTP Error [${rawError.code}]: ${rawError.message.replace(/auth.*$/i, "").trim()}`
        : rawError.message || "Unknown SMTP delivery failure";

      logger.error(
        { code: rawError.code, emailType, recipient: normalizedRecipient },
        "SMTP dispatch failed"
      );

      if (emailLogId) {
        await prisma.emailLog.update({
          where: { id: emailLogId },
          data: {
            status: "FAILED",
            errorMessage: safeErrorMsg,
          },
        }).catch(() => {});
      }

      return { success: false, error: safeErrorMsg, logId: emailLogId };
    }
  }

  private static async getStoreContact(): Promise<StoreContactInfo | undefined> {
    try {
      const details = await StoreDetailsService.getStoreDetails();
      if (!details) return undefined;
      return {
        phone: details.phone || undefined,
        email: details.email || undefined,
        address: details.address || undefined,
      };
    } catch {
      return undefined;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Dedicated Domain Triggers
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * 1. Send Welcome Email upon new customer account creation
   */
  static async sendWelcomeEmail(data: {
    customerId: string;
    email: string;
    fullName: string;
  }): Promise<void> {
    const env = this.getEnv();
    const storeContact = await this.getStoreContact();
    const shopUrl = `${env.FRONTEND_URL}/shop`;

    const { html, text } = renderWelcomeEmail({
      customerName: data.fullName,
      shopUrl,
      storeContact,
    });

    await this.sendEmail({
      to: data.email,
      subject: "Welcome to PERALAGAE — Discover Timeless Elegance",
      html,
      text,
      emailType: "WELCOME",
      customerId: data.customerId,
      idempotencyKey: `welcome_${data.customerId}`,
      metadata: { fullName: data.fullName },
    });
  }

  /**
   * 2. Send Password Reset OTP Email
   */
  static async sendPasswordResetOtpEmail(data: {
    email: string;
    fullName?: string | undefined;
    otp: string;
    expiryMinutes?: number | undefined;
    customerId?: string | undefined;
  }): Promise<void> {
    const storeContact = await this.getStoreContact();

    const { html, text } = renderPasswordResetOtpEmail({
      customerName: data.fullName || "Client",
      otp: data.otp,
      expiryMinutes: data.expiryMinutes ?? 10,
      storeContact,
    });

    await this.sendEmail({
      to: data.email,
      subject: "PERALAGAE — Your Password Reset OTP",
      html,
      text,
      emailType: "PASSWORD_RESET_OTP",
      customerId: data.customerId,
      // Fresh OTP timestamped idempotency key to permit intentional resends while avoiding immediate duplicate fires
      idempotencyKey: `otp_${data.email}_${Math.floor(Date.now() / 60000)}`,
      metadata: { expiryMinutes: data.expiryMinutes ?? 10 },
    });
  }

  /**
   * 3. Send Daily Abandoned Cart Reminder Email
   */
  static async sendCartReminderEmail(data: CartReminderData & {
    customerId: string;
    email: string;
    scheduledDate: string; // YYYY-MM-DD
  }): Promise<{ success: boolean; error?: string | undefined; providerMessageId?: string | undefined; logId?: string | undefined }> {
    const storeContact = await this.getStoreContact();

    const { html, text } = renderDailyCartReminderEmail({
      ...data,
      storeContact,
    });

    return await this.sendEmail({
      to: data.email,
      subject: "PERALAGAE — Your Favourite Pieces Are Waiting!",
      html,
      text,
      emailType: "DAILY_CART_REMINDER",
      customerId: data.customerId,
      idempotencyKey: `cart_reminder_${data.customerId}_${data.scheduledDate}`,
      metadata: { itemCount: data.items.length, totalInr: data.totalInr },
    });
  }

  /**
   * 4. Send Order Confirmed Email upon verified server-side Razorpay payment
   */
  static async sendOrderConfirmedEmail(data: OrderEmailData & {
    orderId: string;
    customerId: string;
    recipientEmail: string;
  }): Promise<void> {
    const env = this.getEnv();
    const storeContact = await this.getStoreContact();
    const orderUrl = `${env.FRONTEND_URL}/orders/${data.orderId}`;

    const { html, text } = renderOrderConfirmedEmail({
      ...data,
      orderUrl,
      storeContact,
    });

    await this.sendEmail({
      to: data.recipientEmail,
      subject: `PERALAGAE — Your Order Has Been Confirmed! (#${data.orderNumber})`,
      html,
      text,
      emailType: "ORDER_CONFIRMED",
      customerId: data.customerId,
      orderId: data.orderId,
      idempotencyKey: `order_confirmed_${data.orderId}`,
      metadata: { orderNumber: data.orderNumber, totalInr: data.totalInr },
    });
  }

  /**
   * 5. Send Order Processing Email when status transitions to PROCESSING
   */
  static async sendOrderProcessingEmail(data: OrderStatusProcessingData & {
    orderId: string;
    customerId: string;
    recipientEmail: string;
  }): Promise<void> {
    const env = this.getEnv();
    const storeContact = await this.getStoreContact();
    const orderUrl = `${env.FRONTEND_URL}/orders/${data.orderId}`;

    const { html, text } = renderOrderProcessingEmail({
      ...data,
      orderUrl,
      storeContact,
    });

    await this.sendEmail({
      to: data.recipientEmail,
      subject: `PERALAGAE — Your Order Is Now Being Processed! (#${data.orderNumber})`,
      html,
      text,
      emailType: "ORDER_PROCESSING",
      customerId: data.customerId,
      orderId: data.orderId,
      idempotencyKey: `order_processing_${data.orderId}`,
      metadata: { orderNumber: data.orderNumber },
    });
  }

  /**
   * 6. Send Order Shipped Email with Admin Uploaded Proof Images
   */
  static async sendOrderShippedEmail(data: OrderShippedData & {
    orderId: string;
    customerId: string;
    recipientEmail: string;
    updateId?: string | undefined;
  }): Promise<void> {
    const env = this.getEnv();
    const storeContact = await this.getStoreContact();
    const orderUrl = `${env.FRONTEND_URL}/orders/${data.orderId}`;

    const { html, text } = renderOrderShippedEmail({
      ...data,
      orderUrl,
      storeContact,
    });

    const keySuffix = data.updateId || `${Date.now()}`;
    await this.sendEmail({
      to: data.recipientEmail,
      subject: `PERALAGAE — Your Order Has Been Shipped! (#${data.orderNumber})`,
      html,
      text,
      emailType: "ORDER_SHIPPED",
      customerId: data.customerId,
      orderId: data.orderId,
      idempotencyKey: `order_shipped_${data.orderId}_${keySuffix}`,
      metadata: {
        orderNumber: data.orderNumber,
        carrierName: data.carrierName,
        trackingNumber: data.trackingNumber,
        imageCount: data.shippingImages?.length || 0,
      },
    });
  }

  /**
   * 7. Send Order Completed / Delivered Email
   */
  static async sendOrderDeliveredEmail(data: OrderDeliveredData & {
    orderId: string;
    customerId: string;
    recipientEmail: string;
  }): Promise<void> {
    const env = this.getEnv();
    const storeContact = await this.getStoreContact();
    const shopUrl = `${env.FRONTEND_URL}/shop`;

    const { html, text } = renderOrderDeliveredEmail({
      ...data,
      shopUrl,
      storeContact,
    });

    await this.sendEmail({
      to: data.recipientEmail,
      subject: `PERALAGAE — Your Order Is Complete. Thank You! (#${data.orderNumber})`,
      html,
      text,
      emailType: "ORDER_COMPLETED",
      customerId: data.customerId,
      orderId: data.orderId,
      idempotencyKey: `order_completed_${data.orderId}`,
      metadata: { orderNumber: data.orderNumber },
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Admin Operations & Metrics
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Fetches paginated email notification history for Admin Portal
   */
  static async getEmailLogs(options: {
    page?: number | undefined;
    limit?: number | undefined;
    search?: string | undefined;
    status?: string | undefined;
    emailType?: string | undefined;
  }) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.status && options.status !== "ALL") {
      where.status = options.status.toUpperCase();
    }
    if (options.emailType && options.emailType !== "ALL") {
      where.emailType = options.emailType.toUpperCase();
    }
    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { recipientEmail: { contains: q, mode: "insensitive" } },
        { subject: { contains: q, mode: "insensitive" } },
        { orderId: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.emailLog.count({ where }),
      prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          customer: { select: { id: true, fullName: true, email: true } },
        },
      }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin retry for failed email via SMTP
   */
  static async retryFailedEmail(emailLogId: string): Promise<{ success: boolean; message: string }> {
    const log = await prisma.emailLog.findUnique({
      where: { id: emailLogId },
    });

    if (!log) {
      throw Object.assign(new Error("Email record not found"), { status: 404 });
    }

    if (log.status === "SENT" || log.status === "DELIVERED") {
      return { success: true, message: "Email has already been sent successfully" };
    }

    const env = this.getEnv();
    const fromAddress = env.EMAIL_FROM_NAME
      ? `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`
      : env.EMAIL_FROM;

    const transporter = this.getTransporter();
    if (!transporter) {
      if (env.NODE_ENV !== "production") {
        await prisma.emailLog.update({
          where: { id: emailLogId },
          data: {
            status: "SENT",
            providerMessageId: `<sim_retry_${Date.now()}@peralagae.com>`,
            sentAt: new Date(),
            attempts: { increment: 1 },
            errorMessage: null,
          },
        });
        return { success: true, message: "Simulated SMTP retry completed (dev mode)" };
      }
      throw new Error("SMTP server is not configured");
    }

    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: log.recipientEmail,
        subject: `[Resent] ${log.subject}`,
        html: `<p>This is a retry of notification: ${log.subject}</p>`,
        text: `Notification: ${log.subject}`,
        headers: {
          "X-Retry-For": emailLogId,
        },
      });

      await prisma.emailLog.update({
        where: { id: emailLogId },
        data: {
          status: "SENT",
          providerMessageId: info.messageId,
          sentAt: new Date(),
          attempts: { increment: 1 },
          errorMessage: null,
        },
      });

      return { success: true, message: "Email resent successfully via SMTP" };
    } catch (err: unknown) {
      const errorMsg = (err as Error).message || "SMTP retry delivery failure";
      await prisma.emailLog.update({
        where: { id: emailLogId },
        data: {
          attempts: { increment: 1 },
          errorMessage: errorMsg,
        },
      });
      return { success: false, message: errorMsg };
    }
  }

  /**
   * Retrieves overall email system status and metrics for Admin Overview
   */
  static async getEmailStats() {
    const env = this.getEnv();
    const [total, sent, delivered, failed, pending] = await Promise.all([
      prisma.emailLog.count(),
      prisma.emailLog.count({ where: { status: "SENT" } }),
      prisma.emailLog.count({ where: { status: "DELIVERED" } }),
      prisma.emailLog.count({ where: { status: "FAILED" } }),
      prisma.emailLog.count({ where: { status: "PENDING" } }),
    ]);

    const totalCount = total;
    const deliveredCount = delivered + sent;
    const deliveryRate = totalCount > 0 ? Math.round((deliveredCount / totalCount) * 100) : 100;

    return {
      provider: "SMTP",
      smtpHost: env.SMTP_HOST || "unconfigured",
      smtpPort: env.SMTP_PORT,
      smtpSecure: env.SMTP_SECURE,
      emailEnabled: env.EMAIL_ENABLED,
      fromAddress: env.EMAIL_FROM,
      fromName: env.EMAIL_FROM_NAME,
      replyTo: env.EMAIL_REPLY_TO,
      timezone: env.BUSINESS_TIMEZONE,
      total,
      sent,
      delivered,
      failed,
      pending,
      bounced: 0,
      deliveryRate,
      counts: { total, sent, delivered, failed, pending, bounced: 0, deliveryRate },
    };
  }
}
