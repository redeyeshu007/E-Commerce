import crypto from "node:crypto";
import { prisma } from "../../database/prisma.js";
import { logger } from "../../utils/logger.js";
import { validateEnv } from "../../config/env.js";
import { EmailService } from "./email-service.js";

export interface CartReminderJobResult {
  scheduledDate: string; // YYYY-MM-DD (IST)
  totalEvaluated: number;
  eligibleCount: number;
  sentCount: number;
  skippedCount: number;
  failedCount: number;
  details: Array<{
    customerId: string;
    email: string;
    status: "SENT" | "SKIPPED" | "FAILED";
    reason?: string;
  }>;
}

/**
 * Returns current date string formatted in IST (Asia/Kolkata) as YYYY-MM-DD
 */
export function getTodayDateStringIST(): string {
  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return istFormatter.format(now); // en-CA produces YYYY-MM-DD
}

export class CartReminderService {
  /**
   * Main execution engine for Daily Abandoned Cart Reminder emails.
   * Can be invoked directly from Render Cron Job or admin trigger.
   */
  static async runDailyCartReminderJob(options?: {
    scheduledDate?: string;
    forceRun?: boolean;
  }): Promise<CartReminderJobResult> {
    const env = validateEnv();
    const scheduledDate = options?.scheduledDate || getTodayDateStringIST();

    logger.info(
      { scheduledDate, timezone: env.BUSINESS_TIMEZONE },
      "Commencing PERALAGAE daily cart reminder scheduled job"
    );

    const result: CartReminderJobResult = {
      scheduledDate,
      totalEvaluated: 0,
      eligibleCount: 0,
      sentCount: 0,
      skippedCount: 0,
      failedCount: 0,
      details: [],
    };

    // 1. Fetch all customer carts from MongoDB
    const carts = await prisma.customerCart.findMany({
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            fullName: true,
            isEmailVerified: true,
            emailCartRemindersEnabled: true,
            unsubscribeToken: true,
            orders: {
              select: {
                id: true,
                createdAt: true,
                items: { select: { productId: true } },
              },
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
        },
      },
    });

    result.totalEvaluated = carts.length;

    // 2. Filter eligible carts
    for (const cart of carts) {
      const customer = cart.customer;
      if (!customer) continue;

      const customerId = customer.id;
      const email = customer.email;

      // Rule: Customer must have opted in
      if (!customer.emailCartRemindersEnabled) {
        result.skippedCount++;
        result.details.push({
          customerId,
          email,
          status: "SKIPPED",
          reason: "Customer opted out of cart reminders",
        });
        continue;
      }

      // Rule: Cart items must be a non-empty array
      const rawItems = Array.isArray(cart.items)
        ? (cart.items as Array<{ productId: string; quantity: number; addedAt?: string }>)
        : [];

      if (rawItems.length === 0) {
        result.skippedCount++;
        continue;
      }

      // Rule: Prevent sending if customer cart was updated less than 30 minutes ago (actively shopping)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      if (!options?.forceRun && cart.updatedAt > thirtyMinutesAgo) {
        result.skippedCount++;
        result.details.push({
          customerId,
          email,
          status: "SKIPPED",
          reason: "Cart was updated very recently (customer actively shopping)",
        });
        continue;
      }

      // Rule: Exclude customers who already purchased these cart items in recent orders
      const purchasedProductIds = new Set(
        customer.orders.flatMap((o) =>
          o.items
            .map((item) => item.productId)
            .filter((id): id is string => typeof id === "string")
        )
      );
      const unpurchasedItems = rawItems.filter((i) => !purchasedProductIds.has(i.productId));

      if (unpurchasedItems.length === 0) {
        result.skippedCount++;
        result.details.push({
          customerId,
          email,
          status: "SKIPPED",
          reason: "Customer has already completed purchase of all items in cart",
        });
        continue;
      }

      // Rule: Check database-backed idempotency for today
      const todayIdempotencyKey = `cart_reminder_${customerId}_${scheduledDate}`;
      const existingTodayLog = await prisma.emailLog.findUnique({
        where: { idempotencyKey: todayIdempotencyKey },
      });

      if (existingTodayLog && (existingTodayLog.status === "SENT" || existingTodayLog.status === "DELIVERED")) {
        result.skippedCount++;
        result.details.push({
          customerId,
          email,
          status: "SKIPPED",
          reason: "Daily cart reminder already sent to this customer today",
        });
        continue;
      }

      // Rule: Fetch live product models from MongoDB to ensure availability and current prices
      const productIds = unpurchasedItems.map((i) => i.productId);
      const liveProducts = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          isAvailable: true,
          inStock: true,
        },
      });

      if (liveProducts.length === 0) {
        result.skippedCount++;
        result.details.push({
          customerId,
          email,
          status: "SKIPPED",
          reason: "No items in cart are currently in stock or available",
        });
        continue;
      }

      const productMap = new Map(liveProducts.map((p) => [p.id, p]));
      const reminderItems: Array<{
        id: string;
        name: string;
        imageUrl?: string | null;
        priceInr: number;
        quantity: number;
      }> = [];

      let subtotalInr = 0;
      for (const raw of unpurchasedItems) {
        const p = productMap.get(raw.productId);
        if (p) {
          const qty = Math.max(1, Number(raw.quantity) || 1);
          const price = p.priceInr;
          subtotalInr += price * qty;
          reminderItems.push({
            id: p.id,
            name: p.name,
            imageUrl: p.imageUrl,
            priceInr: price,
            quantity: qty,
          });
        }
      }

      if (reminderItems.length === 0) {
        result.skippedCount++;
        continue;
      }

      result.eligibleCount++;

      // Ensure persistent unsubscribe token exists
      let unsubscribeToken = customer.unsubscribeToken;
      if (!unsubscribeToken) {
        unsubscribeToken = crypto.randomBytes(24).toString("hex");
        await prisma.customer.update({
          where: { id: customerId },
          data: { unsubscribeToken },
        }).catch(() => {});
      }

      const cartUrl = `${env.FRONTEND_URL}/cart`;
      const unsubscribeUrl = `${env.FRONTEND_URL}/unsubscribe?token=${unsubscribeToken}`;

      // Controlled Dispatch
      try {
        const sendResult = await EmailService.sendCartReminderEmail({
          customerId,
          email,
          customerName: customer.fullName || "Valued Client",
          items: reminderItems,
          subtotalInr,
          totalInr: subtotalInr, // 3% inclusive
          cartUrl,
          unsubscribeUrl,
          scheduledDate,
        });

        if (sendResult.success) {
          result.sentCount++;
          result.details.push({ customerId, email, status: "SENT" });
        } else {
          result.failedCount++;
          result.details.push({
            customerId,
            email,
            status: "FAILED",
            reason: sendResult.error || "Provider send failed",
          });
        }

        // Rate limiting throttle: pause 250ms between sends to stay well within API rate limits
        await new Promise((r) => setTimeout(r, 250));
      } catch (err: unknown) {
        result.failedCount++;
        result.details.push({
          customerId,
          email,
          status: "FAILED",
          reason: (err as Error).message,
        });
      }
    }

    logger.info(
      {
        scheduledDate,
        totalEvaluated: result.totalEvaluated,
        eligible: result.eligibleCount,
        sent: result.sentCount,
        skipped: result.skippedCount,
        failed: result.failedCount,
      },
      "PERALAGAE daily cart reminder scheduled job completed"
    );

    return result;
  }
}
