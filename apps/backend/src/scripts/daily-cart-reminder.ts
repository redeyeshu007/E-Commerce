import "dotenv/config";
import { CartReminderService } from "../services/email/cart-reminder-service.js";
import { disconnectPrisma } from "../database/prisma.js";
import { logger } from "../utils/logger.js";

async function main() {
  logger.info("[Cron] Starting PERALAGAE Daily Cart Reminder script");

  try {
    const result = await CartReminderService.runDailyCartReminderJob();
    logger.info(
      {
        scheduledDate: result.scheduledDate,
        eligible: result.eligibleCount,
        sent: result.sentCount,
        skipped: result.skippedCount,
        failed: result.failedCount,
      },
      "[Cron] Daily cart reminder script completed successfully"
    );
  } catch (err) {
    logger.error({ err }, "[Cron] Daily cart reminder script encountered an error");
    process.exitCode = 1;
  } finally {
    await disconnectPrisma();
    logger.info("[Cron] Prisma disconnected. Process exiting.");
    process.exit(process.exitCode || 0);
  }
}

void main();

